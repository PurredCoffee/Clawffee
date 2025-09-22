/**
 * @type {Map<string, string>} original File contents for a file path
 */
const fileContent = new Map(); // TODO make map
function parseJS(codeStr) {
    const notations = [];
    const parsedCode = acorn.parse(codeStr, {
        ecmaVersion: "latest",
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
    }, null, {});
    const newLinePositions = [{index: -1}, ...codeStr.matchAll(new RegExp('\n', 'gi'))].map(a => a.index + 1);
    const fileNotations = {};
    let previousLine = newLinePositions.length-1;
    notations.sort((a,b) => b.s-a.s).forEach((v) => {
        while(v.s <= newLinePositions[previousLine]) previousLine--;
        fileNotations[previousLine] = fileNotations[previousLine] ?? [];
        fileNotations[previousLine].push({
            v: v.v, l: previousLine,
            s: v.s - newLinePositions[previousLine],
            e: Math.min(v.e, newLinePositions[previousLine+1]) - newLinePositions[previousLine]
        });
        let nextLine = previousLine+1;
        while(v.e > newLinePositions[nextLine]) {
            fileNotations[nextLine] = fileNotations[nextLine] ?? [];
            fileNotations[nextLine].push({
                v: v.v, l: nextLine,
                s: 0,
                e: Math.min(v.e, newLinePositions[nextLine+1]) - newLinePositions[nextLine]
            });
            nextLine++;
        }
    });
    return {
        notations: fileNotations,
        parsedCode: parsedCode,
        newLinePositions: newLinePositions
    }
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
    } while(codeStr?.includes(iterstr) || allVariables.includes(iterstr));
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
            const funcstr = addVariable(filename, "function_name", codeStr);
            inverseCommands.push([node.start, () => `globalThis.clawffee.addFunction(__fileName,{${funcstr}:`]);
            inverseCommands.push([node.end, () => `}.${funcstr})`]);
        },
        ArrowFunctionExpression: (node, state) => {
            const funcstr = addVariable(filename, "function_name", codeStr);
            inverseCommands.push([node.start, () => `globalThis.clawffee.addFunction(__fileName,{${funcstr}:`]);
            inverseCommands.push([node.end, () => `}.${funcstr})`]);
        },
    });
    const insertions = {};

    let previousLine = newLinePositions.length-1;
    inverseCommands.sort((a,b) => b[0] - a[0]).forEach(v => {
        const insertTxt = (v[1]() ?? "").replace("\n",";");

        // find line and column of insertion
        while(v[0] <= newLinePositions[previousLine]) previousLine--;
        insertions[previousLine] = insertions[previousLine] ?? [];
        insertions[previousLine].forEach(v => v.p += insertTxt.length);
        insertions[previousLine].push({p: v[0] - newLinePositions[previousLine], l: insertTxt.length});
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

/**
 * @typedef fileInfo
 * @param {Set<string>} variables
 * @param {Set<string>} functions
 * @param {Set<any>} insertions
 * @param {Set<any>} notations
 * @param {number[]} newLines
 */

/**
 * @type {Map<string, fileInfo>}
 */
const fileInfo = new Map(); // todo implement setting these
const functionNames = new Map();
const functionFileNames = new Map();
const functionOverrides = new Map();

globalThis.clawffee.addFunction = (name, fakename, fn) => {
    /**
     * @type {string}
     */
    functionNames.set(fakename.name, fn);
    functionFileNames.set(fakename.name, name);
    return fn;
}

function wrapCode(filename, codeStr) {
    const { notations, parsedCode, newLinePositions } = parseJS(codeStr);
    const { editedCode, insertions } = applyOverrides(filename, codeStr, parsedCode, newLinePositions);
    let fn = () => {console.error("Encountered internal error!")};
    const rootfuncstr = addVariable(filename, "function_name", codeStr);
    functionNames.set(rootfuncstr, "top_level");
    functionFileNames.set(rootfuncstr, filename);
    functionOverrides.set(filename, {
        getLineNumber(original, _) { return original-3 },
        isToplevel(_, fnname) { return fnname === rootfuncstr }
    });
    fileNotations.set(filename, notations);
    fileInsertions.set(filename, insertions);
    try {
        acorn.parse(editedCode, {
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
        fn = Function("", `function ${rootfuncstr}(exports, require, module, __fileName, __dirname){\n${editedCode}\n} return ${rootfuncstr}`)();
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