const { onModuleLoad, onModuleUnload } = require("./ClawCallbacks");

const associatedObjects = {};

/**
 * call a function automatically unbind itself when its parent file is deleted
 */
function associateObjectWithFile(output: any, unbindfuncname: string, fn?: Function): typeof output {
    if (output?.[unbindfuncname]) {
        let stack = { stack: "" };
        if (fn) {
            Error.captureStackTrace(stack, fn);
        } else {
            fn = () => {
                Error.captureStackTrace(stack, fn);
            }
            fn();
        }
        let regstack = stack.stack.match(/(?<=at |\()(?:\/|\w+:).*(?:\/|\\)[^\/\\]*\.js(?=:)/g) ?? [];
        for (let x = 0; x < regstack.length; x++) {
            let path = stack[x];
            if (associatedObjects[path]) {
                associatedObjects[path].push(() => {
                    output?.[unbindfuncname]?.();
                });
                break;
            }
        };
    }
    return output;
}

/**
 * make an functions output automatically run a function on themselves when their parent file is deleted
 */
function associateFunctionWithFile(fun: (...parameters) => any, unbindfuncname: string): ReturnType<typeof fun> {
    function fn(...args) {
        return associateObjectWithFile(fun.apply(this, args), unbindfuncname, fn);
    };
    return fn;
}


/**
 * make an object's functions automatically unbind its outputs when it goes out of scope (and is GC'd)
 */
function associateClassWithFile(value: any, unbindfuncname: string): typeof value {
    return new Proxy(value, {
        get(target, property, receiver) {
            const value = Reflect.get(target, property, receiver);
            if(typeof value === 'function' && typeof property === 'string' && property.startsWith('on')) {
                    return associateFunctionWithFile(value, unbindfuncname);
                }
            return value;
        }
    });
}

function addPath(path) {
    if (!associatedObjects[path])
        associatedObjects[path] = [];
}

function deletePath(path) {
    associatedObjects[path]?.forEach(fun => fun());
    delete associatedObjects[path];
}

onModuleLoad((filePath) =>  {
    deletePath(filePath);
    addPath(filePath);
});

onModuleUnload((filePath) => {
    deletePath(filePath);
})

export {
    associateObjectWithFile,
    associateClassWithFile
}