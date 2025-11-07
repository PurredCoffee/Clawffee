const { functionNames, functionFileNames, functionOverrides, fileInfo } = require('./JSRunnerGlobals');

const acorn = require("acorn");
const acorn_walk = require("acorn-walk");
const { type } = require('os');
const { prettyPrepareStack } = require('./ErrorOverrides');

/**
 * @type {Map<string, string>} original File contents for a file path
 */
const fileContent = new Map(); // TODO make map
function parseJS(codeStr) {
    const parsedCode = acorn.parse(codeStr, {
        ecmaVersion: "latest",
        sourceType: "module"
    });
    const newLinePositions = [{index: -1}, ...codeStr.matchAll(new RegExp('\n', 'gi'))].map(a => a.index + 1);
    return {
        parsedCode: parsedCode,
        newLinePositions: newLinePositions
    }
}

/**
 * @returns {string} random character
 */
function randomChar() {
  const arr = "123456789qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM";
  return arr[Math.trunc(Math.random() * arr.length)];
}

const allVariables = new Set();

/**
 * 
 * @param {string} filename 
 * @param {string} prefix 
 * @param {string | undefined} codeStr 
 */
function addVariable(filename, prefix, codeStr) {
    let iterstr = `___clawffee_katz_${prefix}_`;
    do {
        iterstr += randomChar();
    } while(codeStr?.includes(iterstr) || allVariables.has(iterstr));
    allVariables.add(iterstr);
    return iterstr;
}

function applyOverrides(filename, codeStr, parsedCode, newLinePositions) {
    const inverseCommands = [];
    function whileWrapper(node) {
        const iterstr = addVariable(filename, "while_protection", codeStr);
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
            const funcstr = addVariable(filename, "function_name", codeStr);
            inverseCommands.push([node.start, () => `let ${node.id.name} = globalThis.clawffee.addFunction("${filename}",`]);
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
            const funcstr = addVariable(filename, "function_name", codeStr);
            inverseCommands.push([node.start, () => `globalThis.clawffee.addFunction("${filename}",{${funcstr}:`]);
            inverseCommands.push([node.end, () => `}.${funcstr})`]);
        },
        ArrowFunctionExpression: (node, state) => {
            const funcstr = addVariable(filename, "function_name", codeStr);
            inverseCommands.push([node.start, () => `globalThis.clawffee.addFunction("${filename}",{${funcstr}:`]);
            inverseCommands.push([node.end, () => `}.${funcstr})`]);
        },
    });
    const insertions = {};

    let previousLine = newLinePositions.length-1;
    inverseCommands.sort((a,b) => b[0] - a[0]).forEach(v => {
        const insertTxt = (v[1]() ?? "").replace("\n",";");

        // find line and column of insertion
        while(v[0] < newLinePositions[previousLine]) previousLine--;
        insertions[previousLine+1] = insertions[previousLine+1] ?? [];
        insertions[previousLine+1].forEach(v => v.p += insertTxt.length);
        insertions[previousLine+1].push({p: v[0] - newLinePositions[previousLine], l: insertTxt.length});
        for(let i = previousLine+1; i < newLinePositions.length; i++) {
            newLinePositions[i] += insertTxt.length;
        }

        codeStr = codeStr.substring(0,v[0]) + insertTxt + codeStr.substring(v[0]);
    });
    return {
        editedCode: codeStr,
        insertions: insertions
    };
}

globalThis.clawffee.addFunction = (name, fn, fakename) => {
    /**
     * @type {string}
     */
    functionNames.set(fn.name, fakename);
    functionFileNames.set(fn.name, name);
    fileInfo.get(name).functions.add(fn.name);
    return fn;
}

function wrapCode(filename, codeStr) {
    // syntax check
    try {
        const fn = new Function(codeStr);
    } catch(e) {
        if(e instanceof SyntaxError) {
            e.stack = [{
                getFileName: () => filename,
                getLineNumber: () => e.line-1,
                getColumnNumber: () => e.column,
                getFunctionName: () => "top_level",
                isToplevel: () => true
            }]
            if(e.message.includes("(")) {
                e.message = e.message.substring(0, e.message.lastIndexOf("("));
            }
            throw e;
        }
        throw e;
    }
    try {
        const { parsedCode, newLinePositions } = parseJS(codeStr);
        // temporary error if import statements are used
        acorn_walk.simple(parsedCode, {
            ImportDeclaration: () => {
                throw new SyntaxError("Import statements are not yet supported in Clawffee scripts.");
            },
            ExportNamedDeclaration: () => {
                throw new SyntaxError("Export statements are not yet supported in Clawffee scripts.");
            },
            ExportDefaultDeclaration: () => {
                throw new SyntaxError("Export statements are not yet supported in Clawffee scripts.");
            },
            ExportAllDeclaration: () => {
                throw new SyntaxError("Export statements are not yet supported in Clawffee scripts.");
            }
        });
        const { editedCode, insertions } = applyOverrides(filename, codeStr, parsedCode, newLinePositions);
        const rootfuncstr = addVariable(filename, "function_name", codeStr);
        functionNames.set(rootfuncstr, "top_level");
        functionFileNames.set(rootfuncstr, filename);
        functionOverrides.set(filename, {
            getLineNumber(original, _) { return original-3 },
            isToplevel(_, fnname) { return fnname === rootfuncstr }
        });
        fileInfo.set(filename, {
            variables: allVariables,
            functions: new Set([rootfuncstr]),
            insertions: insertions,
            newLines: newLinePositions
        });
        acorn.parse(editedCode, {
            ecmaVersion: 'latest',
            sourceType: "module",
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
        const fn = Function("", `function ${rootfuncstr}(exports, require, module, __fileName, __dirname){\n${editedCode}\n} return ${rootfuncstr}`)();
        return fn;
    } catch(e) {
        if(e instanceof SyntaxError) {
            e.stack = [{
                getFileName: () => filename,
                getLineNumber: () => e.loc.line - 5,
                getColumnNumber: () => e.loc.column,
                getFunctionName: () => "top_level",
                isToplevel: () => true
            }]
            if(e.message.includes("(")) {
                e.message = e.message.substring(0, e.message.lastIndexOf("("));
            }
            console.error(prettyPrepareStack(e, e.stack));
        } else {
            console.error(e);
        }
        return null;
    }
    console.error("Encountered internal error!");
    return null;
}


module.exports = {
    parseJS,
    applyOverrides,
    wrapCode,
    functionNames,
    functionFileNames,
    functionOverrides,
    fileInfo
};