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
const olddebug = console.debug;
console.debug = (...data) => {
    let stack = {};
    Error.captureStackTrace(stack, console.debug);
    stack = stack.stack.match(/(?<=at |\((\/|\\\\).*(\/|\\\\))[^\/]*.js:\d*(?=:)/g);
    if (stack?.[0]) {
        longestName = Math.max(longestName, stack[0].length + 4);
        olddebug(stack[0].padEnd(longestName, " "), "|", ...data);
    } else {
        olddebug(...data);
    }
    sharedServerData.internal.debug = data.map(arg => typeof (arg) === 'object' || typeof (arg) === 'function' ? util.inspect(arg, {
        maxStringLength: 80,
        maxArrayLength: 5
    }) : String(arg)).join(' ');
}

const oldlog = console.log;
console.log = (...data) => {
    let stack = {};
    Error.captureStackTrace(stack, console.log);
    stack = stack.stack.match(/(?<=at |\((\/|\\\\).*(\/|\\\\))[^\/]*.js:\d*(?=:)/g);
    if (stack?.[0]) {
        longestName = Math.max(longestName, stack[0].length + 4);
        oldlog(stack[0].padEnd(longestName, " "), "|", ...data);
    } else {
        oldlog("".padEnd(longestName, " "), "|", ...data);
    }
    sharedServerData.internal.log = data.map(arg => typeof (arg) === 'object' || typeof (arg) === 'function' ? util.inspect(arg, {
        maxStringLength: 80,
        maxArrayLength: 5,
    }) : String(arg).substring(0, 80)).join(' ');
}


const oldinfo = console.info;
console.info = (...data) => {
    let stack = {};
    Error.captureStackTrace(stack, console.info);
    stack = stack.stack.match(/(?<=at |\((\/|\\\\).*(\/|\\\\))[^\/]*.js:\d*(?=:)/g);
    if (stack?.[0]) {
        longestName = Math.max(longestName, stack[0].length + 4);
        oldinfo(stack[0].padEnd(longestName, " "), "|", ...data);
    } else {
        oldinfo("".padEnd(longestName, " "), "|", ...data);
    }
    sharedServerData.internal.info = data.map(arg => typeof (arg) === 'object' || typeof (arg) === 'function' ? util.inspect(arg, {
        maxStringLength: 80,
        maxArrayLength: 5
    }) : String(arg)).join(' ');
}

const oldwarn = console.warn;
console.warn = (...data) => {
    let stack = {};
    Error.captureStackTrace(stack, console.warn);
    stack = stack.stack.match(/(?<=at |\((\/|\\\\).*(\/|\\\\))[^\/]*.js:\d*(?=:)/g);
    if (stack?.[0]) {
        longestName = Math.max(longestName, stack[0].length + 4);
        oldwarn(stack[0].padEnd(longestName, " "), "|", ...data);
    } else {
        oldwarn("".padEnd(longestName, " "), "|", ...data);
    }
    sharedServerData.internal.warn = data.map(arg => typeof (arg) === 'object' || typeof (arg) === 'function' ? util.inspect(arg, {
        maxStringLength: 80,
        maxArrayLength: 5
    }) : String(arg)).join(' ');
}

const olderr = console.error;
console.error = (...data) => {
    let stack = {};
    Error.captureStackTrace(stack, console.error);
    stack = stack.stack.match(/(?<=at |\((\/|\\\\).*(\/|\\\\))[^\/]*.js:\d*(?=:)/g);
    if (stack?.[0]) {
        longestName = Math.max(longestName, stack[0].length + 4);
        olderr(stack[0].padEnd(longestName, " "), "|", ...data);
    } else {
        olderr("".padEnd(longestName, " "), "|", ...data);
    }
    sharedServerData.internal.error = data.map(arg => typeof (arg) === 'object' || typeof (arg) === 'function' ? util.inspect(arg, {
        maxStringLength: 80,
        maxArrayLength: 5
    }) : String(arg)).join(' ');
}

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
    let x = associateObjectWithFile({
        callback: oldSetInterval(...params),
        disconnect: () => {
            clearTimeout(this.callback);
        }
    }, "disconnect");
    return x.callback;
}

const oldSetTimeout = setTimeout;
setTimeout = (...params) => {
    let x = associateObjectWithFile({
        callback: oldSetTimeout(...params),
        disconnect: () => {
            clearTimeout(this.callback);
        }
    }, "disconnect");
    return x.callback;
}