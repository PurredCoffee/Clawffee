const util = require('util');
const fs = require('fs');

const functionFileNames = new Map();
const functionOverrides = new Map();
const functionNames = new Map();

function overrideStack(v) {
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
        const insertions = fileInsertions[fileName];
        const line = v.getLineNumber()-1;
        (insertions[line] ?? []).forEach(ins => {
            if(ins.p > column) return;
            column = Math.max(column - ins.l, ins.p);
        });
        return column;
    }
    for(let key in functionOverrides.get(fileName)) {
        var val = v[key]();
        v[key] = functionOverrides.get(fileName)[key].bind(v, val, f);
    }
    return true;
}

util.getCallSites = () => {
    const oldPrepareStack = Error.prepareStackTrace;
    Error.prepareStackTrace = (err, stack) => {
        return stack.map((v) => { 
            overrideStack(v);
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
                Toplevel: v.isToplevel() // always true??
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

function cleanData(data) {
    let str = "";
    data.forEach(v => {
        str += " ";
        switch(typeof v) {
            case 'string':
                str += v;
                break;
            case 'object':
                if(v instanceof Error) {
                    str += v.stack;
                    break;
                }
            default:
                str += Bun.inspect(v, { colors: true, depth: 2 });
                break;
        }
    });
    str = str.substring(1);
    return str
        .split("\n")
        .reduce((p, v) => p + "\n".padEnd(longestName, " ") + "   ╎ " + v);
}

let ownPrefix = __dirname.substring(0, __dirname.length - 14).length;
let longestName = 30;
function wrapConsoleFunction(name, copy, prefix = "") {
    return (...data) => {
        const callSites = util.getCallSites(10, {
            sourceMap: true
        }).filter(v => v.FileName);
        let renderedText = "@system";
        if(callSites[1]) {
            renderedText = "@internal";
            if(callSites[1].FileName.includes("node_modules")) {
                renderedText = `#${
                    callSites[1].FileName.substring(
                        Math.max(
                            callSites[1].FileName.lastIndexOf("/"),
                            callSites[1].FileName.lastIndexOf("\\")
                        ) + 1
                    )}`;
            } else if(callSites[1].FileName != Bun.main) {
                const name = callSites[1].FileName.substring(ownPrefix);
                renderedText = `#${name.substring(Math.max(name.indexOf("/"), name.indexOf("\\")) + 1)}`;
            }
            renderedText += `:${callSites[1].LineNumber}:${callSites[1].ColumnNumber}`;
        }
        longestName = Math.max(longestName, renderedText.length + 2);
        copy(prefix + renderedText.padEnd(longestName, " ") + "╶╶\u001b[0m┝╸" + prefix + cleanData(data));
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


const acorn = require("acorn");
const acorn_walk = require("acorn-walk");
const { type } = require('os');

/**
 * @returns {string} random character
 */
function randomChar() {
  const arr = "123456789qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM";
  return arr[Math.trunc(Math.random() * arr.length)];
}


const origCodeStr = `


function a() {}
console.log("meow");
// test
let x = 454;
for(let x = 0; x < 50; x++) {
    throw Error("mew");
}
let b = function() {}
let c = () => {}
let d = {
    a() {},
    b: function() {}
}
`;
let codeStr = origCodeStr;

globalThis.clawffee = {
    addFunction(name, fakename, fn) {
        /**
         * @type {string}
         */
        functionNames.set(fakename.name, fn);
        functionFileNames.set(fakename.name, name);
        return fn;
    }
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
    for(let i = Math.max(1,line-4); i <= Math.min(linePos.length, line+2); i++) {
        /**
         * @type {string}
         */
        const line = content.substring(linePos[i-1] ?? 0, linePos[i]-1);
        lines.push(line);
        if(line.trim().length) {
            offset = Math.min(offset,line.length - line.trimStart().length);
        }
    }
    if(column - offset > 18) {
        offset = column - 18;
    }

    function getPrettyLine(i) {
        /**
         * @type {string}
         */
        let codeLine = lines.shift().substring(offset, offset + 80);
        if(codeLine.length == 80) {
            codeLine = codeLine.substring(0,77) + "...";
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
        return `\u001b[${i.toString().length + 3}D` + i.toString() + " │ " + codeLine + "\n";
    }

    for(let i = Math.max(1,line-4); i <= line; i++) {
        errStr += getPrettyLine(i);
    }
    errStr += `\u001b[${4}D\u001b[90m- \u001b[0m│ ` + " ".repeat(Math.max(0,column-offset)) + "\u001b[91m▲\u001b[0m\n";

    for(let i = line+1; lines.length; i++) {
        errStr += getPrettyLine(i);
    }
    return errStr;
}

Error.prepareStackTrace = (err, stack) => {
    /**
     * @type {NodeJS.CallSite}
     */
    let s = undefined;
    stack.forEach(v => {
        if(overrideStack(v))
            s = s ?? v;
    });
    let errStr = `\n`;
    if(s) {
        const name = s.getFileName();
        err.line = s.getLineNumber();
        err.fileName = s.getFileName();
        err.column = s.getColumnNumber();
        const content = fileContent[name];
        const linePos = fileLinePositions[name];
        const notations = fileNotations[name];
        errStr += beautifyCode(s, content, linePos, notations);
    } else if(stack[0]) {
        err.line = stack[0].getLineNumber();
        err.fileName = stack[0].getFileName();
        err.column = stack[0].getColumnNumber();
        const name = stack[0].getFileName();
        const content = fs.readFileSync(name).toString();
        const linePos = [{index: -1}, ...content.matchAll(new RegExp('\n', 'gi'))].map(a => a.index + 1);
        const notations = [];
        const parsedCode = acorn.parse(codeStr, {
            ecmaVersion: 2023,
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
            Pattern: (node, state) => {
                notations.push({
                    s: node.start, e: node.end, v: "\u001b[1m"
                });
            },
            CallExpression: (node, state) => {
                notations.push({
                    s: node.callee.start, e: node.callee.end, v: "\u001b[96m"
                });
            }
        });
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
        errStr += beautifyCode(stack[0], content, linePos, cn);
    }
    errStr += `\n\u001b[91;1m${err.constructor.name}\u001b[0m: ${err.message}`;
    for(let x = 0; x < 5; x++) {
        if(!stack[x]) break;
        errStr += `\n    \u001b[90mat ${
            stack[x].getFunctionName()?.length?`${stack[x].isToplevel()?"\u001b[0;94;1;3m":"\u001b[0;1;3m"}${stack[x].getFunctionName()}`:"\u001b[90m<anonymous>"
            } \u001b[0;90m(${stack[x].getFileName()?.length?`\u001b[96m${stack[x].getFileName()}`:"\u001b[0minternal"}\u001b[90m:\u001b[93m${stack[x].getLineNumber()}\u001b[90m:\u001b[93m${stack[x].getColumnNumber()}\u001b[90m)\u001b[0m`;
    }
    return errStr;
}

const fileNotations = {};
const fileLinePositions = {};
const fileInsertions = {};
const fileContent = {};

function overrideFile(filename, codeStr) {
    fileContent[filename] = "\n" + codeStr;
    const notations = [];
    let parsedCode = acorn.parse(codeStr, {
        ecmaVersion: "latest",
        onComment: (a,b,c,d) => {
            notations.push({
                s: c, e: d, v: "\u001b[90m"
            });
        }
    });

    const inverseCommands = [];
    const ownVariables = [];

    function whileWrapper(node) {
        let iterstr = "katz_while_protection_";
        do {
            iterstr += randomChar();
        } while(codeStr.includes(iterstr) || ownVariables.includes(iterstr))
        ownVariables.push(iterstr);
        inverseCommands.push([node.start, () => `let ${iterstr}=0;`]);
        inverseCommands.push([node.body.start, () => `{if(${iterstr}++>0xFFFFFFF){throw Error("Discovered infinite loop!")}`]);
        inverseCommands.push([node.body.end, () => `}`]);
    }

    acorn_walk.simple(parsedCode, {
        WhileStatement: whileWrapper,
        DoWhileStatement: whileWrapper,
        ForStatement: whileWrapper,
        ForInStatement: whileWrapper,
        ForOfStatement: whileWrapper,
        FunctionDeclaration: (node, state) => {
            let funcstr = "katz_function_name_";
            do {
                funcstr += randomChar();
            } while(codeStr.includes(funcstr) || ownVariables.includes(funcstr))
            ownVariables.push(funcstr);
            inverseCommands.push([node.start, () => `let ${node.id.name} = globalThis.clawffee.addFunction(__fileName,`]);
            inverseCommands.push([node.id.start, () => `${funcstr}_`]);
            inverseCommands.push([node.end, () => `,"${node.id.name}")`]);
        },
        Property: (node, state) => {
            if(node.value.type != 'FunctionExpression') return;
            if(node.method) {
                inverseCommands.push([node.key.end, () => `:`]);
                inverseCommands.push([node.value.body.start, () => `=>`]);
            }
        },
        FunctionExpression: (node, state) => {
            let funcstr = "katz_function_name_";
            do {
                funcstr += randomChar();
            } while(codeStr.includes(funcstr) || ownVariables.includes(funcstr))
            ownVariables.push(funcstr);
            inverseCommands.push([node.start, () => `globalThis.clawffee.addFunction(__fileName,{${funcstr}:`]);
            inverseCommands.push([node.end, () => `}.${funcstr})`]);
        },
        ArrowFunctionExpression: (node, state) => {
            let funcstr = "katz_function_name_";
            do {
                funcstr += randomChar();
            } while(codeStr.includes(funcstr) || ownVariables.includes(funcstr))
            ownVariables.push(funcstr);
            inverseCommands.push([node.start, () => `globalThis.clawffee.addFunction(__fileName,{${funcstr}:`]);
            inverseCommands.push([node.end, () => `}.${funcstr})`]);
        },
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
        Pattern: (node, state) => {
            notations.push({
                s: node.start, e: node.end, v: "\u001b[1m"
            });
        },
        CallExpression: (node, state) => {
            notations.push({
                s: node.callee.start, e: node.callee.end, v: "\u001b[96m"
            });
        }
    }, null, {});

    const newLinePositions = [{index: -1}, ...codeStr.matchAll(new RegExp('\n', 'gi'))].map(a => a.index + 1);
    fileLinePositions[filename] = [1, ...newLinePositions.slice(1).map(v=>v+1)];

    fileNotations[filename] = {};
    let previousLine = newLinePositions.length-1;
    notations.sort((a,b) => b.s-a.s).forEach((v) => {
        while(v.s <= newLinePositions[previousLine]) previousLine--;
        fileNotations[filename][previousLine] = fileNotations[filename][previousLine] ?? [];
        fileNotations[filename][previousLine].push({
            v: v.v, l: previousLine,
            s: v.s - newLinePositions[previousLine],
            e: Math.min(v.e, newLinePositions[previousLine+1]) - newLinePositions[previousLine]
        });
        let nextLine = previousLine+1;
        while(v.e > newLinePositions[nextLine]) {
            fileNotations[filename][nextLine] = fileNotations[filename][nextLine] ?? [];
            fileNotations[filename][nextLine].push({
                v: v.v, l: nextLine,
                s: 0,
                e: Math.min(v.e, newLinePositions[nextLine+1]) - newLinePositions[nextLine]
            });
            nextLine++;
        }
    });

    const insertions = {};
    fileInsertions[filename] = insertions;

    previousLine = newLinePositions.length-1;
    inverseCommands.sort((a,b) => b[0] - a[0]).forEach(v => {
        const insertTxt = (v[1]() ?? "").replace("\n",";");

        // find line and column of insertion
        while(v[0] <= newLinePositions[previousLine]) previousLine--;
        insertions[previousLine] = insertions[previousLine] ?? [];
        insertions[previousLine].forEach(v => v.p += insertTxt.length);
        insertions[previousLine].push({p: v[0] - newLinePositions[previousLine], l: insertTxt.length});
        for(let i = previousLine+1; i<newLinePositions.length; i++) {
            newLinePositions[i] += insertTxt.length;
        }

        codeStr = codeStr.substring(0,v[0]) + insertTxt + codeStr.substring(v[0]);
    });
    let fn = () => {console.error("Encountered internal error!")};
    let rootfuncstr = "katz_function_name_";
    do {
        rootfuncstr += randomChar();
    } while(codeStr.includes(rootfuncstr) || ownVariables.includes(rootfuncstr))
    ownVariables.push(rootfuncstr);
    functionNames.set(rootfuncstr, "top_level");
    functionFileNames.set(rootfuncstr, filename);
    functionOverrides.set(filename, {
        getLineNumber(original, fnname) {return original-3},
        isToplevel(original, fnname) {return fnname === rootfuncstr}
    });
    try {
        acorn.parse(codeStr, {
            ecmaVersion: "latest"
        });
        /*
            require wrapper
            function (exports, require, module, __filename, __dirname) {}
            exports	A shorthand or alias for module.exports. Used to export values from a module.
            require	A function to import other modules (CommonJS-style).
            module	An object representing the current module, with properties like exports.
            __filename	The absolute path to the current module file.
            __dirname	The absolute path to the directory containing the current module file.
        */
        fn = Function("", `function ${rootfuncstr}(__fileName){\n${codeStr}\n} return ${rootfuncstr}`)();
    } catch(e) {
        if(e instanceof SyntaxError) {
            e.stack = [{
                getFileName: () => filename,
                getLineNumber: () => e.line+3,
                getColumnNumber: () => e.column,
                getFunctionName: () => rootfuncstr
            }]
            e.message = e.message.substring(0, e.message.lastIndexOf("("));
            console.log(Error.prepareStackTrace(e, e.stack));
            return null;
        } else {
            console.error(e);
        }
    }
    return fn;
}
try {
    //throw new Error()
    overrideFile(__dirname + "/bark.js", codeStr)?.(__dirname + "/bark.js");
} catch(e) {
    console.log(e);
}



/**
 * DEBUG
 */
{
prompt("Enter debug mode?");
const data = parsedCode;

let current = data;
let path = [];

function showCurrent() {
  console.clear();
  console.log("Current path: /" + path.join("/"));
  console.log("Current object:", current);
}

function navigate() {
  showCurrent();
  const input = prompt("Enter a key to navigate, or '..' to go up:");

  if (input === null) {
    console.log("Navigation cancelled.");
    return;
  }

  if (input === "..") {
    if (path.length === 0) {
      alert("Already at the top level.");
    } else {
      path.pop();
      current = path.reduce((obj, key) => obj[key], data);
    }
  } else if (current.hasOwnProperty(input)) {
    if (typeof current[input] === "object" && current[input] !== null) {
      path.push(input);
      current = current[input];
    } else {
      alert(`'${input}' is not an object. Cannot navigate into non-objects.`);
    }
  } else {
    alert(`Key '${input}' does not exist.`);
  }

  navigate(); // Continue navigation
}

navigate();
}