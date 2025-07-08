const { sharedServerData } = require("./server");
var util = require('util');
const path = require('path');
const fs = require('fs');
const { associateObjectWithFile } = require("./internal/codeBinder");

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
            if (Array.isArray(value)) {
                result = value.map(replace);
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

/* ---------------------------- CONSOLE FORWARDS ---------------------------- */

let longestName = 28;
function wrapConsoleFunction(name, copy) {
    return (...data) => {
        let stack = {};
        Error.captureStackTrace(stack, console[name]);
        stack = stack.stack.match(/[^\/\\]*.js:\d*(?=:)/g);
        if (stack?.[0]) {
            longestName = Math.max(longestName, stack[0].length + 4);
            copy(stack[0].padEnd(longestName, " "), "|", ...data);
        } else {
            copy(...data);
        }
        sharedServerData.internal[name] = data.map(arg => typeof (arg) === 'object' || typeof (arg) === 'function' ? util.inspect(arg, {
            maxStringLength: 80,
            maxArrayLength: 5
        }) : String(arg)).join(' ');
    }
}

const olddebug = console.debug;
console.debug = wrapConsoleFunction("debug", olddebug);

const oldlog = console.log;
console.log = wrapConsoleFunction("log", oldlog);

const oldinfo = console.info;
console.info = wrapConsoleFunction("info", oldinfo);

const oldwarn = console.warn;
console.warn = wrapConsoleFunction("warn", oldwarn);

const olderr = console.error;
console.error = wrapConsoleFunction("error", olderr);

/* ------------------------------- FILE SAFETY ------------------------------ */

const MAIN_FOLDER = path.resolve(__dirname, '../../'); // Adjust as needed

function isPathAllowed(targetPath) {
    const resolved = path.resolve(MAIN_FOLDER, targetPath);
    return resolved.startsWith(MAIN_FOLDER);
}

function wrapFsMethod(methodName) {
    const orig = fs[methodName];
    fs[methodName] = function (...args) {
        let filePath = args[0];
        if (typeof filePath === 'string' || Buffer.isBuffer(filePath)) {
            if (!isPathAllowed(filePath)) {
                throw new Error(`Access to path "${filePath}" is not allowed.`);
            }
        }
        return orig.apply(fs, args);
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
    console.log("set Timeout");
    let callback = oldSetInterval(...params); 
    associateObjectWithFile({
        callback: callback,
        disconnect: () => {
            clearTimeout(callback);
        }
    }, "disconnect");
    return callback;
}

const oldSetTimeout = setTimeout;
setTimeout = (...params) => {
    let callback = oldSetTimeout(...params); 
    associateObjectWithFile({
        callback: callback,
        disconnect: () => {
            clearTimeout(callback);
        }
    }, "disconnect");
    return callback;
}

/* ----------------------------- ERROR HANDLING ----------------------------- */

process.on('uncaughtException', function(err) {
    let stack = err.stack.match(/[^\/\\]*.js:\d*(?=:)/g);
    if (stack?.[0]) {
        longestName = Math.max(longestName, stack[0].length + 4);
        olderr(stack[0].padEnd(longestName, " "), "|", err);
    } else {
        olderr(...data);
    }
    sharedServerData.internal.error = err.stack;
});