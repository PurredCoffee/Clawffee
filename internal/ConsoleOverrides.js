const { prettyPrepareStack } = require('./ErrorOverrides');
const util = require('util');
const { sharedServerData } = require('./SharedServerData');
sharedServerData.internal.log = {};

const {basename } = require('path');

function cleanData(data, prefix) {
    let str = "";
    data.forEach(v => {
        str += " " + prefix;
        switch(typeof v) {
            case 'string':
                str += v;
                break;
            case 'object':
                if(v instanceof Error) {
                    try {
                        const oldPrepareStack = Error.prepareStackTrace;
                        let preparedStack = false;
                        Error.prepareStackTrace = (err, stack) => {
                            preparedStack = true;
                            return prettyPrepareStack(err, stack);
                        }
                        let stack = v.stack;
                        if(!preparedStack) {
                            stack = prettyPrepareStack(v, stack);
                        }
                        if(!stack) {
                            Error.captureStackTrace(v, cleanData.caller);
                            stack = v.stack;
                        }
                        Error.prepareStackTrace = oldPrepareStack;
                        str += stack;
                    } catch(e) {
                        str += `${v.constructor.name}: ${v.message}\n    at <unable to get stack trace> reason:` + e.stack;
                    }
                    break;
                }
            default:
                str += Bun.inspect(v, { colors: true, depth: 2 }).replaceAll('\u001b[0m', '\u001b[0m' + prefix);
                break;
        }
    });
    str = str.substring(1);
    return str;
}

let ownPrefix = process.cwd().trim().length + 1;
let longestName = 30;
function wrapConsoleFunction(name, copy, prefix = "", skipcalls = false) {
    return (...data) => {
        const callSites = util.getCallSites(10, {
            sourceMap: true
        }).filter(v => v.FileName);
        // if skiplines is true, first element is number of function calls to skip
        if(skipcalls) {
            callSites.splice(0, data[0]);
            data = data.slice(1);
        }
        callSites.splice(0, 1);
        let renderedText = "@system";
        if(callSites[0]) {
            let firstOverride = callSites.findIndex(v => v.Overriden);
            if(firstOverride != -1) {
                renderedText = `${callSites[firstOverride].FileName.substring(ownPrefix + 9)}:${callSites[firstOverride].LineNumber}:${callSites[firstOverride].ColumnNumber}`;
            } else if(callSites[0].FileName[0] == "[") {
                renderedText = `${callSites[0].FileName}`;
            } else {
                renderedText = "@internal";
                if(callSites[0].FileName.includes("node_modules")) {
                    let startIndex = Math.max(
                        callSites[0].FileName.lastIndexOf("node_modules/"),
                    ) + 15;
                    let endIndex = callSites[0].FileName.indexOf("/", startIndex);
                    renderedText = `@${callSites[0].FileName.substring(startIndex, endIndex)} ${basename(callSites[0].FileName)}`;
                } else if(callSites[0].FileName != Bun.main) {
                    let startIndex = callSites[0].FileName.indexOf("/", ownPrefix);
                    let endIndex = callSites[0].FileName.indexOf("/", startIndex);
                    renderedText = `@${callSites[0].FileName.substring(startIndex, endIndex)} ${basename(callSites[0].FileName)}`;
                }
                renderedText += `:${callSites[0].LineNumber}:${callSites[0].ColumnNumber}`;
            }
        }
        longestName = Math.max(longestName, renderedText.length + 2);
        const cleaneddata = cleanData(data, prefix);
        if(name != 'debug')
            sharedServerData.internal.log[name] = Bun.stripANSI(cleaneddata);
        copy(
            prefix 
            + renderedText.padEnd(longestName, " ") 
            + "╶╶\u001b[0m┝╸" 
            + prefix 
            + cleaneddata
                .split("\n")
                .reduce((p, v) => p + "\n".padEnd(longestName, " ") + "   ╎ " + v)
        );
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

// Expose a version of console that skips internal calls
module.exports = {
    log: wrapConsoleFunction("log", oldlog, "\u001b[0m", true),
    info: wrapConsoleFunction("info", oldinfo, "\u001b[96m", true),
    warn: wrapConsoleFunction("warn", oldwarn, "\u001b[93m", true),
    error: wrapConsoleFunction("error", olderr, "\u001b[91m", true),
    debug: wrapConsoleFunction("debug", olddebug, "\u001b[90m", true),
};
