const associatedObjects = {};
/**
 * make a function automatically unbind itself when it goes out of scope (and is GC'd)
 * @template T
 * @param {T} object
 * @param {string} unbindfuncname
 * @returns {T}
 */
function associateObjectWithFile(output, unbindfuncname, fn) {
    if(output?.[unbindfuncname]) {
        let stack = {stack: ""};
        if(fn) {
            Error.captureStackTrace(stack, fn);
        } else {
            fn = () => {
                Error.captureStackTrace(stack, fn);
            }
            fn();
        }
        stack = stack.stack.match(/(?<=at |\()\/.*\/[^/]*.js(?=:)/g);
        for(let x = 0; x < stack.length; x++) {
            let path = stack[x];
            if(associatedObjects[path]) {
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
 * make an functions automatically unbind its outputs when it goes out of scope (and is GC'd)
 * @template T
 * @param {T} fun
 * @param {string} unbindfuncname
 * @returns {T}
 */
function associateFunctionWithFile(fun, unbindfuncname) {
    function fn(...args) {
        return associateObjectWithFile(fun.apply(this, args), unbindfuncname, fn);
    };
    return fn;
}


/**
 * make an object's functions automatically unbind its outputs when it goes out of scope (and is GC'd)
 * @template T
 * @param {T} value 
 * @param {string} unbindfuncname
 * @returns {T}
 */
function associateClassWithFile(value, unbindfuncname) {
    return new Proxy(value, {
        get(target, property, receiver) {
            const value = Reflect.get(target, property, receiver);
            if (typeof value === 'function' && property.startsWith('on')) {
                return associateFunctionWithFile(value, unbindfuncname);
            }
            return value;
        }
    });
}


function addPath(path) {
    if(!associatedObjects[path])
        associatedObjects[path] = [];
}

function deletePath(path) {
    associatedObjects[path]?.forEach(fun => fun());
    delete associatedObjects[path];
}

module.exports = {
    associateObjectWithFile,
    associateClassWithFile,
    addPath,
    deletePath
}