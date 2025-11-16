/*   Cache                 
    ┌──@──┐                
    │     │                
 ┌──▼─────┴─┐              
 │Do Nothing◄────Req───┐   
 └─┬───────▲┘          │   
   │       │           │   
   │     Ready      ┌──┴─┐ 
   │       │        │User│ 
  Req      │        └──▲─┘ 
   │       │           │   
 ┌─▼───────┴─┐         │   
 │Application┼─Response┘   
 └───────────┘         */
const binds = new WeakMap();
/**
 * @type {WeakMap<Proxy, Map<string, Array<{path: Array<string>, args: Array, resolve: Function, reject: Function}>>>}
 */
const cache = new WeakMap();

function createDoNothing(path = [], base = null) {
    const proxy = new Proxy(() => {}, {
        get(target, prop, receiver) {
            if(binds.has(base)) {
                let obj = binds.get(base);
                path.forEach(element => {
                    obj = obj?.[element];
                });
                return obj?.[prop];
            }
            return createDoNothing([...path, prop], base);
        },
        apply(target, thisarg, args) {
            if(binds.has(base)) {
                let obj = base;
                let prevObj = null;
                entry.path.forEach(element => {
                    prevObj = obj;
                    obj = obj?.[element];
                });
                try {
                    const retobj = obj?.apply(prevObj, entry.args);
                    if(retobj instanceof Promise) {
                        retobj.then(entry.resolve).catch(entry.reject);
                    } else {
                        entry.resolve(retobj);
                    }
                } catch(e) {
                    entry.reject(e);
                }
            }
            const file = globalThis.clawffeeInternals.getRunningScriptName();
            const icache = cache.get(base);
            if(!icache.has(file)) {
                clawffeeInternals.fileCleanupFuncs[file]?.push(() => {
                    cache.get(base).delete(file);
                });
                icache.set(file, []);
            }
            return new Promise((resolve, reject) => {
                icache.get(file).push({path, args, resolve, reject, stack: globalThis.clawffeeInternals.getPrefixStack()});
            });
        }
    });
    base = base ?? proxy;
    if(!cache.has(base)) {
        cache.set(base, new Map());
    }
    return proxy;
}

function bindDoNothing(proxy, base = null) {
    if(!(base ?? true)) {
        binds.delete(proxy);
    }
    binds.set(proxy, base);
    const icache = cache.get(proxy);
    for (const [key, value] of icache) {
        value.forEach(entry => {
            globalThis.clawffeeInternals.setPrefixStack(entry.stack);
            let obj = base;
            let prevObj = null;
            entry.path.forEach(element => {
                prevObj = obj;
                obj = obj?.[element];
            });
            try {
                const retobj = obj?.apply(prevObj, entry.args);
                if(retobj instanceof Promise) {
                    retobj.then(entry.resolve).catch(entry.reject);
                } else {
                    entry.resolve(retobj);
                }
            } catch(e) {
                entry.reject(e);
            }
            globalThis.clawffeeInternals.setPrefixStack();
        });
    }
    icache.clear();
}

module.exports = {
    createDoNothing,
    bindDoNothing
}