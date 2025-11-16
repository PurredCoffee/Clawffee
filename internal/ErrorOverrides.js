
const { functionNames, functionFileNames, functionOverrides, fileInfo } = require('./JSRunnerGlobals');
const util = require('util');
const fs = require('fs');
const acorn = require("acorn");
const acorn_walk = require("acorn-walk");

globalThis.clawffeeInternals.getPrefixStack = () => {
    const oldPrepareStack = Error.prepareStackTrace;
    Error.prepareStackTrace = (err, stack) => {
        return stack;
    }
    const st = {};
    Error.captureStackTrace(st, globalThis.clawffeeInternals.getPrefixStack);
    const stack = st.stack;
    Error.prepareStackTrace = oldPrepareStack;
    return stack;
}
let prefixStack = [];
globalThis.clawffeeInternals.setPrefixStack = (stack = []) => {
    prefixStack = stack;
}

function overrideStack(v) {
    if(v.Overriden) return true;
    let f = v.getFunctionName();
    const fileName = functionFileNames.get(f);
    if(!fileName) return false;
    v.getFunctionName = () => functionNames.get(f);
    v.getScriptNameOrSourceURL = () => functionNames.get(f);
    v.getFileName = () => fileName;
    const origColumn = v.getColumnNumber();
    let column = undefined;
    v.getColumnNumber = () => {
        if(column) return column;
        column = origColumn;
        const insertions = fileInfo.get(fileName).insertions;
        const line = v.getLineNumber();
        (insertions[line] ?? []).forEach(ins => {
            if(ins.p > column) return;
            column = Math.max(column - ins.l, ins.p);
        });
        return column;
    }
    v.Overriden = true;
    for(let key in functionOverrides.get(fileName)) {
        var val = v[key]();
        v[key] = functionOverrides.get(fileName)[key].bind(v, val, f);
    }
    return true;
}

util.getCallSites = () => {
    const oldPrepareStack = Error.prepareStackTrace;
    Error.prepareStackTrace = (err, stack) => {
        stack = stack.concat(prefixStack);
        return stack.map((v) => { 
            let override = overrideStack(v);
            return {
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
                Toplevel: v.isToplevel(), // always true??
                Overriden: override
                // console.log(v.getEnclosingColumnNumber()); NOT SUPPORTED
                // console.log(v.getEnclosingLineNumber()); NOT SUPPORTED
                // console.log(v.getScriptHash()); NOT SUPPORTED
                // console.log(v.getPosition()); NOT SUPPORTED
            }
        });
    }
    const err = {};
    let stack = "";
    Error.captureStackTrace(err, util.getCallSites);
    stack = err.stack;
    Error.prepareStackTrace = oldPrepareStack;
    if(typeof stack != 'object') return [];
    return stack;
}

globalThis.clawffeeInternals.getRunningScriptName = (fn) => {
    const oldPrepareStack = Error.prepareStackTrace;
    Error.prepareStackTrace = (err, stack) => {
        stack = stack.concat(prefixStack);
        for(let x of stack) {
            if(overrideStack(x)) {
                return x.getFileName();
            }
        }
        return null;
    }
    const st = {};
    Error.captureStackTrace(st, fn ?? globalThis.clawffeeInternals.getRunningScriptName);
    const stack = st.stack;
    Error.prepareStackTrace = oldPrepareStack;
    return stack;
}

const keyWordRegex = new RegExp("\\b(?:" + [
    "abstract", "arguments", "async", "await", 
    "boolean", "break", "byte", "case",
    "catch", "char", "class", "const",
    "continue", "debugger", "default", "delete",
    "do", "double", "else", "enum",
    "eval", "export", "extends", "false",
    "final", "finally", "float", "for",
    "function", "goto", "if", "implements",
    "function", "import", "in", "instanceof",
    "int", "interface", "let", "long",
    "native", "new", "null", "package",
    "private", "protected", "public", "return",
    "short", "static", "super", "switch",
    "synchronized", "this", "throw", "throws",
    "transient", "true", "try", "typeof",
    "using", "var", "void", "volatile",
    "while", "with", "yield"
].reduce((p, v) => p + "|" + v) + ")\\b", 'gi');
function beautifyCode(s, content, linePos, notations) {
    const line = s.getLineNumber();
    const lines = [];
    const column = s.getColumnNumber();
    let offset = 0xFFFFFFFFFF;
    let errStr = "";
    for(let i = Math.max(1,line-4); i <= Math.min(linePos.length - 1, line+2); i++) {
        /**
         * @type {string}
         */
        const line = content.substring(linePos[i-1] ?? 0, linePos[i]-1);
        lines.push(line);
        if(line.trim().length) {
            offset = Math.min(offset,line.length - line.trimStart().length);
        }
    }
    if(column - offset > 32) {
        offset = column - 32;
    }

    function getPrettyLine(i) {
        /**
         * @type {string}
         */
        let codeLine = lines.shift().substring(offset, offset + 64);
        if(codeLine.length == 64) {
            codeLine = codeLine.substring(0,61) + "...";
        }
        (notations[""+(i-1)] ?? []).sort((a,b) => b.s-a.s).forEach(v => {
            codeLine = codeLine.substring(0, v.s-offset) + v.v + codeLine.substring(v.s-offset,v.e-offset) + "\u001b[0m" + codeLine.substring(v.e-offset);
        });

        const positions = [...codeLine.matchAll(keyWordRegex)].map(a => {return {index: a.index, length: a[0].length}});
        positions.reverse().forEach(p => {
            const lastIndex = codeLine.lastIndexOf("\u001b[", p.index);
            if(lastIndex != -1 && codeLine[lastIndex + 2] != '0') return;
            codeLine = codeLine.substring(0,p.index) + "\u001b[95m" + codeLine.substring(p.index,p.index + p.length) + "\u001b[0m" + codeLine.substring(p.index + p.length);
        });
        return `\u001b[${i.toString().length + 3}D\u001b[0m` + i.toString() + " │ " + codeLine + "\n";
    }

    for(let i = Math.max(1,line-4); i <= Math.max(1,line); i++) {
        errStr += getPrettyLine(i);
    }
    errStr += `\u001b[4D\u001b[90m» \u001b[0m│ ` + " ".repeat(Math.max(0,column-offset)) + "\u001b[91m▲\u001b[0m\n";

    for(let i = Math.max(1,line)+1; lines.length; i++) {
        errStr += getPrettyLine(i);
    }
    return errStr;
}

Error.prepareStackTrace = (err, stack) => {
    stack.forEach(v => {
        overrideStack(v)
    });
    return err.constructor.name + ": " + err.message + "\n    at " + stack.map(v => {
        return `${v.getFunctionName() || "<anonymous>"} (${v.getFileName()}:${v.getLineNumber()}:${v.getColumnNumber()})`;
    }).join("\n    at ");
};

function prettyPrepareStack(err, stack) {
    /**
     * @type {NodeJSint.CallSite}
     */ 
    
    // stack = origPrepareStack(err, stack); // TEMPORARY, fake preprocessed stack
    
    let s = undefined;
    let name = undefined;
    if(!stack) {
        return null;
    }
    if(typeof stack == 'string') {
        if(stack.startsWith('\u001b[')) {
            return stack;
        }
        // get the file name from the string
        const lines = stack.split("\n");
        stack = [];
        for(let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const match = line.match(/^\s*at (.*) \(((.*):(\d+):(\d+)|(.*))\)/);
            if(match) {
                stack.push({
                    getFunctionName: () => match[1],
                    getFileName: () => match[3],
                    getLineNumber: () => parseInt(match[4] ?? "0"),
                    getColumnNumber: () => parseInt(match[5] ?? "0"),
                    isToplevel: () => false
                });
            }
        }
    }

    stack = stack.concat(prefixStack);
    stack.forEach(v => {
        if(overrideStack(v))
            s = s ?? v;
    });
    s = s ?? stack[0];
    if(!s) {
        return null;
    }
    name = s.getFileName();
    err.line = s.getLineNumber();
    err.fileName = name;
    err.column = s.getColumnNumber();
    let errStr = `\u001b[91;1m${err.constructor.name}\u001b[0m: ${err.message}\n\u001b[2D\u001b[0m│\n`;
    if(fs.existsSync(name) && fs.statSync(name).isFile()) {
        const content = fs.readFileSync(name).toString();
        const linePos = [{index: -1}, ...content.matchAll(new RegExp('\n', 'gi')), {index: content.length}, {index: content.length}].map(a => a.index + 1);
        const notations = [];
        try {
            const parsedCode = acorn.parse(content, {
                ecmaVersion: 'latest',
                sourceType: "module",
                onComment: (a,b,c,d) => {
                    notations.push({
                        s: c, e: d, v: "\u001b[90m"
                    });
                }
            });
            acorn_walk.simple(parsedCode, {
                Literal: (node, state) => {
                    const obj = {
                        s: node.start, e: node.end
                    }
                    switch (typeof node.value) {
                        case 'string': obj.v = "\u001b[92m"; break;
                        case 'boolean': obj.v = "\u001b[93m"; break;
                        case 'number': obj.v = "\u001b[93m"; break;
                        case 'bigint': obj.v = "\u001b[93m"; break;
                        case 'undefined': obj.v = "\u001b[90m"; break;
                        case 'object': obj.v = "\u001b[94m"; break;
                    }
                    notations.push(obj);
                },
                CallExpression: (node, state) => {
                    if(node.callee.property) {
                        notations.push({
                            s: node.callee.property.start, e: node.callee.property.end, v: "\u001b[96m"
                        });
                        return;
                    }
                    notations.push({
                        s: node.callee.start, e: node.callee.end, v: "\u001b[96m"
                    });
                },
                NewExpression: (node, state) => {
                    notations.push({
                        s: node.callee.start, e: node.callee.end, v: "\u001b[96m"
                    });
                }
            });
        } catch(e) {
        }
        const cn = {};
        let previousLine = linePos.length-1;
        notations.sort((a,b) => b.s-a.s).forEach((v) => {
            while(v.s <= linePos[previousLine]) previousLine--;
            cn[previousLine] = cn[previousLine] ?? [];
            cn[previousLine].push({
                v: v.v, l: previousLine,
                s: v.s - linePos[previousLine],
                e: Math.min(v.e, linePos[previousLine+1]) - linePos[previousLine]
            });
            let nextLine = previousLine+1;
            while(v.e > linePos[nextLine]) {
                cn[nextLine] = cn[nextLine] ?? [];
                cn[nextLine].push({
                    v: v.v, l: nextLine,
                    s: 0,
                    e: Math.min(v.e, linePos[nextLine+1]) - linePos[nextLine]
                });
                nextLine++;
            }
        });
        errStr += beautifyCode(s, content, linePos, cn);
    }
    let start = stack.findIndex(i => i == s);
    if(start == -1) start = 0;
    let totalSlices = 5 + stack.indexOf(x => x == start);
    for(let x = 0; x < totalSlices; x++) {
        if(!stack[x]) break;
        if(stack[x+1]?.isToplevel() && stack[x+1]?.getFileName().startsWith('[')) {
            stack.splice(x+1, 1);
            stack[x].isToplevel = () => true;
        }
        errStr += `\n    \u001b[90mat ${
            stack[x].isToplevel()?"\u001b[0;94;1;3mtop level":stack[x].getFunctionName()?.length?`\u001b[0;1;3m${stack[x].getFunctionName()}`:"\u001b[90m<anonymous>"
            } \u001b[0;90m(${stack[x].getFileName()?.length?`\u001b[96m${stack[x].getFileName()}`:"\u001b[0minternal"}\u001b[90m:\u001b[93m${stack[x].getLineNumber()}\u001b[90m:\u001b[93m${stack[x].getColumnNumber()}\u001b[90m)\u001b[0m`;
        if(stack[x].getFileName()?.includes('node_modules')) {
            totalSlices++;
        }
    }
    return errStr;
}

module.exports = {
    prettyPrepareStack
};