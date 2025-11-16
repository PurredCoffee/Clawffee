const path = require('path');
const fs = require('fs');
const { codeBinder: { associateFunctionWithFile }} = require('../internal/internal');

/* ------------------------------- FILE SAFETY ------------------------------ */

function isRelative(dir, parent) {
    const relative = path.relative(parent, dir);
    return relative && !relative.startsWith('..') && !path.isAbsolute(relative);
}

function wrapFsMethod(methodName) {
    const orig = fs[methodName];
    fs[methodName] = function (...args) {
        let filePath = args[0];
        if (typeof filePath === 'string' || Buffer.isBuffer(filePath)) {
            if (!isRelative(path.resolve(filePath), process.cwd())) {
                throw new Error(`Access to path "${filePath}" is not allowed.`);
            }
        }
        return orig(...args);
    };
}

[
    'writeFile', 'writeFileSync',
    'appendFile', 'appendFileSync',
    'unlink', 'unlinkSync',
    'rmdir', 'rmdirSync',
    'mkdir', 'mkdirSync',
    'rename', 'renameSync',
    'rm', 'rmSync',
    'truncate', 'truncateSync',
    'copyFile', 'copyFileSync',
    'createWriteStream'
].forEach(method => {
    if (typeof fs[method] === 'function') {
        wrapFsMethod(method);
    }
});

/* -------------------------------- Intervals ------------------------------- */

const oldSetInterval = setInterval;
setInterval = (...params) => {
    let callback = oldSetInterval(...params); 
    associateFunctionWithFile(() => {
        clearInterval(callback);
    });
    return callback;
}

const oldSetTimeout = setTimeout;
setTimeout = (...params) => {
    let callback = oldSetTimeout(...params); 
    associateFunctionWithFile(() => {
        clearTimeout(callback);
    });
    return callback;
}

/* ------------------------------- JSON SAFETY ------------------------------ */

const oldJSONstringify = JSON.stringify;
JSON.stringify = (value, replacer, space) => {
    const set = new Set();
    function replace(value) {
        if (value && typeof value === 'object') {
            if (set.has(value)) {
                return "[circular]";
            }
            set.add(value);
            let result = {};
            if (value.toJSON) {
                result = value.toJSON();
            } else if (Array.isArray(value)) {
                result = value.map(replace);
            } else if (value instanceof Map) {
                result = Object.fromEntries(value);
            } else {
                for (const key in value) {
                    if (Object.prototype.hasOwnProperty.call(value, key)) {
                        result[key] = replace(value[key]);
                    }
                }
            }
            set.delete(value);
            return result;
        }
        return value;
    }
    return oldJSONstringify(replace(value), replacer, space);
}