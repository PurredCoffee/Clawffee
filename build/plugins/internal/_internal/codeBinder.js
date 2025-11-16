const associatedObjects = {};


/**
 * make an functions automatically unbind its outputs when it goes out of scope (and is GC'd)
 * @template T
 * @param {T} fun
 * @param {string} unbindfuncname
 * @returns {T}
 */
function associateFunctionWithFile(fn) {
    const fileName = globalThis.clawffeeInternals.getRunningScriptName();
    globalThis.clawffeeInternals.fileCleanupFuncs[fileName]?.push(fn);
    return fn;
}


/**
 * make an object's functions automatically unbind its outputs when it goes out of scope (and is GC'd)
 * @template T
 * @param {T} value 
 * @param {Array<Function<boolean>>} functionIdentifiers
 * @returns {T}
 */
function associateClassWithFile(value, functionIdentifiers, wrapper) {
    return new Proxy(value, {
        get(target, property, receiver) {
            const func = Reflect.get(target, property, receiver);
            if (functionIdentifiers.reduce((prev, curr) => prev || curr(property), false) && typeof func === 'function') {
                return (...args) => {
                    const ret = func.apply(value, args);
                    associateFunctionWithFile(wrapper(ret));
                    return ret;
                }
            }
            if(typeof func == 'object' && func)
                return associateClassWithFile(func, functionIdentifiers, wrapper, value);
            if(typeof func == 'function') {
                return func.bind(value);
            }
            return func;
        }
    });
}

module.exports = {
    associateFunctionWithFile,
    associateClassWithFile
}