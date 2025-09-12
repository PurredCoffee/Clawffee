const { sharedServerData } = require("./server");
const path = require('path');
const fs = require('fs');
const { codeBinder: { associateObjectWithFile }, clawCallbacks: { moduleByPath } } = require('../internal/internal');
const util = require('util');

util.getCallSites = () => {
    const oldPrepareStack = Error.prepareStackTrace;
    Error.prepareStackTrace = (err, stack) => {
        return stack.map((v) => { return {
            this: v.getThis(), // always undefined
            function: v.getFunction(), // always undefined
            functionName: v.getFunctionName(), // "" instead of null
            LineNumber: v.getLineNumber(),
            ColumnNumber: v.getColumnNumber(),
            EvalOrigin: v.getEvalOrigin(), // undefined
            FileName: v.getFileName(),
            MethodName: v.getMethodName(), // "" instead of null
            PromiseIndex: v.getPromiseIndex(),
            ScriptNameOrSourceURL: v.getScriptNameOrSourceURL(),
            TypeName: v.getTypeName(), // "undefined" instead of null
            Async: v.isAsync(), // always false
            Constructor: v.isConstructor(),
            Eval: v.isEval(),
            PromiseAll: v.isPromiseAll(),
            Native: v.isNative(),
            Toplevel: v.isToplevel() // always true??
            // console.log(v.getEnclosingColumnNumber()); NOT SUPPORTED
            // console.log(v.getEnclosingLineNumber()); NOT SUPPORTED
            // console.log(v.getScriptHash()); NOT SUPPORTED
            // console.log(v.getPosition()); NOT SUPPORTED
        }});
    }
    const err = {};
    Error.captureStackTrace(err, util.getCallSites);
    const stack = err.stack;
    Error.prepareStackTrace = oldPrepareStack;
    return stack;
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

/* ---------------------------- CONSOLE FORWARDS ---------------------------- */

function cleanData(data) {
    let str = "";
    data.forEach(v => {
        str += " ";
        switch(typeof v) {
            case 'string':
                str += v;
                break;
            default:
                str += Bun.inspect(v, { colors: true, depth: 2 });
                break;
        }
    });
    str = str.substring(1);
    return str
        .split("\n")
        .reduce((p, v) => p + "\n".padEnd(longestName, " ") + "  | " + v);
}

let ownPrefix = __dirname.substring(0, __dirname.length - 7).length;
let longestName = 32;


function wrapConsoleFunction(name, copy, prefix = "") {
    return (...data) => {
        const callSites = util.getCallSites(10, {
            sourceMap: true
        }).filter(v => v.FileName);
        const firstOwn = callSites.find(v => moduleByPath[v.FileName]);
        let renderedText = "@internal";
        if (firstOwn) {
            renderedText = `${firstOwn.FileName.substring(ownPrefix + 1)}:${firstOwn.LineNumber}:${firstOwn.ColumnNumber}`;
            longestName = Math.max(longestName, renderedText.length + 4);
        } else if(callSites[1].FileName.includes("node_modules")) {
            renderedText = `#${
                callSites[1].FileName.substring(
                    Math.max(
                        callSites[1].FileName.lastIndexOf("/"),
                        callSites[1].FileName.lastIndexOf("\\")
                    ) + 1
                )}:${callSites[1].LineNumber}:${callSites[1].ColumnNumber}`;
            longestName = Math.max(longestName, renderedText.length + 4);
        } else if(callSites[1].FileName != Bun.main) {
            renderedText = `#${callSites[1].FileName.substring(ownPrefix)}:${callSites[1].LineNumber}:${callSites[1].ColumnNumber}`;
            longestName = Math.max(longestName, renderedText.length + 4);
        }
        copy(prefix + renderedText.padEnd(longestName, " ") + " \u001b[0m| " + prefix + cleanData(data));
        sharedServerData.internal[name] = data.map(arg => String(arg)).join(' ');
    }
}

const olddebug = console.debug;
console.debug = wrapConsoleFunction("debug", olddebug, "\u001b[90m");

const oldlog = console.log;
console.log = wrapConsoleFunction("log", oldlog, "\u001b[0m");

const oldinfo = console.info;
console.info = wrapConsoleFunction("info", oldinfo, "\u001b[96m");

const oldwarn = console.warn;
console.warn = wrapConsoleFunction("warn", oldwarn, "\u001b[93m");

const olderr = console.error;
console.error = wrapConsoleFunction("error", olderr, "\u001b[91m");

/* ------------------------------- FILE SAFETY ------------------------------ */

const MAIN_FOLDER = path.resolve(__dirname, '../../');

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
    associateObjectWithFile({
        callback: callback,
        disconnect: () => {
            clearInterval(callback);
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

console.deepError = function(err) {
    const prefix = "\u001b[91m";
    let stack = err.stack?.match(/[^\/\\]*.js:\d*(?=:)/g) ?? [];
    if (stack?.[0]) {
        longestName = Math.max(longestName, stack[0].length + 4);
        olderr(prefix + stack[0].padEnd(longestName, " ") + " \u001b[0m| " + prefix + cleanData([err]));
    } else {
        olderr(prefix + "@internal".padEnd(longestName, " ") + " \u001b[0m| " + prefix + cleanData([err]));
    }
    sharedServerData.internal.error = err.stack;
}
process.on('uncaughtException', console.deepError);