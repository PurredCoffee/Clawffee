/*
server: {                                               
┌►"a": {                                        
│   "a": 2                                      
│ },                                            
│ "b": {                                        
│                                               
│ },                                            
└─"c": ["Reference to a"]                       
}                                               
        │                                       
        ▼                                       
parentListeners: {                              
  "Reference to self": [],                      
  "Reference to a": [                           
    [["Reference to self"], "a"],               
    [["Reference to self"], "c"]                
  ],                                            
  "Reference to b": [["Reference to self"], "b"]
}                                               
        │                                       
        ▼                                       
listenerTree: {                                 
  "ownListeners": {                             
    "b": []                                     
  },                                            
  "childListeners": {                           
    "c": {                                      
      "ownListeners": {"a": []},                
      "childListeners": {}                      
    }                                           
  }                                             
}                                               
                                                
 ────────────                                   
                                                
server.a.a = 5                                  
  => server.a changed a from 2 to 5             
    => server changed a.a from 2 to 5           
  => server.c changed a from 2 to 5             
    => server changed c.a from 2 to 5           
  Repeat upwards too!!                          
*/

/**
 * @callback ServableListener
 * @param {string[]} path the relative path that was changed from the object that is being listened to
 * @param {object} newValue the new value of the object at the relative path
 * @param {object} oldValue the old value of the object at the relative path
 * @param {object} self the value at the path
 */
/**
 * @typedef Listener
 * @property {ServableListener} callback
 * @property {Boolean} activateFromParent
 * @property {Boolean} activateIfUnchanged
 * @property {Boolean} suppressInitialSet
 */
/**
 * @typedef ListenerData
 * 
 * @property {Map<string, Listener[]>} ownListeners
 * @property {Map<string, ListenerData>} childListeners
 * @property {boolean?} initialSet
 */

/**
 * Link between objects and their corresponding Proxy, used to get the Proxy when setting values on the original object
 * @type {WeakMap<any, Proxy>}
 */
const ProxyObjDict = new WeakMap();
/**
 * References from objects to their parent Servers
 * @type {WeakMap<Proxy, [Proxy, string][]>}
 */
const ParentDict = new WeakMap();
/**
 * References from server objects to their Listener trees
 * @type {WeakMap<Proxy, ListenerData>}
 */
const ListenerDict = new WeakMap();

/**
 * Splits a string into a path
 * @param {string[]|string} path 
 * @returns {string[]}
 */
function splitString(path) {
    if(typeof path != "string") {
        return path;
    }
    return path.split(/\.|\[|\]/).filter(Boolean);
}

/* ------------------------------- PARENTDICT ------------------------------- */

/**
 * Remove the link to a parent from a value in ProxyObjDict
 * @param {Proxy} value 
 * @param {Proxy} parent 
 * @param {string} property 
 */
function removeParent(value, parent, property) {
    if(ParentDict.has(value)) {
        ParentDict.set(value, ParentDict.get(value).filter(v => v[0] != parent || v[1] != property));
    }
}
/**
 * Add a link to a parent for a value in ProxyObjDict
 * @param {Proxy} value 
 * @param {Proxy} parent 
 * @param {string} property 
 */
function addParent(value, parent, property) {
    ParentDict.get(value)?.push([parent, property]);
}

/**
 * Get all the shortest path (if recursive) from an object to a server object
 * @param {Proxy} value 
 * @param {WeakSet} traveled
 * @returns {[any, string[]][]}
 */
function getAllParentPaths(value, traveled=new WeakSet()) {
    // anti infinite recursion
    if(traveled.has(value)) {
        return [];
    }
    // reached endpoint
    if(!ParentDict.has(value)) {
        return [[
            value,
            []
        ]];
    }
    traveled.add(value);

    //recurse through parents and append their paths
    const parents = ParentDict.get(value) ?? [];
    let result = [];
    parents.forEach(element => {
        const obj = element[0];
        const key = element[1];
        result = result.concat(
            getAllParentPaths(obj, traveled).map(
                v => [v[0], v[1].concat([key])] // [object, "path of parent + relativepath"]
            ));
    });

    traveled.delete(value);
    return result;
}

/* ------------------------------ LISTENERDICT ------------------------------ */

/**
 * 
 * @param {ListenerData} listener 
 * @param {any} value 
 */
function callChildren(listener, value, oldValue, initiallyset) {
    listener.ownListeners.forEach((v, key) => {
        const nV = typeof value == 'object'?value[key]:undefined;
        const oV = typeof oldValue == 'object'?oldValue[key]:undefined;
        v.forEach(v => {
            if(
                !v.activateFromParent 
                || (!v.activateIfUnchanged && oV === nV)
                || (v.suppressInitialSet && initiallyset)
            ) return;
            v.callback([], nV, oV, nV);
        });
    });
    listener.childListeners.forEach((v, key) => {
        callChildren(
            v,
            typeof value == 'object'?value[key]:undefined,
            typeof oldValue == 'object'?oldValue[key]:undefined
        );
    });
}

let suppressAffected = false;
/**
 * 
 * @param {any} obj 
 */
function callAllAffected(obj, property=null, originalValue) {
    if(suppressAffected) {
        return;
    }
    const newValue = property == null?obj:obj[property];
    const parentPaths = getAllParentPaths(obj);
    parentPaths.forEach((value) => {
        let server = value[0];
        let listener = ListenerDict.get(server);
        const initiallyset = listener.initialSet;
        listener.initialSet = false;
        let path = value[1];
        if(property)
            path.push(property);
        while(listener && path.length) {
            const curpath = path.shift();
            // call parents that a child at path has changed
            (listener.ownListeners.get(curpath) ?? []).forEach(v => {
                if(
                    !v.activateIfUnchanged && originalValue === newValue
                    || v.suppressInitialSet && initiallyset
                ) return;
                v.callback(path, newValue, originalValue, server[curpath]);
            });
            listener = listener.childListeners.get(curpath)
            server = server[curpath];
        }
        if(listener) {
            callChildren(listener, server, originalValue, initiallyset);
        }
    });
}

/**
 * 
 * @returns {ListenerData}
 */
function createEmptyListener() {
    return {
        ownListeners: new Map(),
        childListeners: new Map()
    }
}

/* ---------------------------------- PROXY --------------------------------- */

function setter(target, property, value, receiver) {
    const proxy = ProxyObjDict.get(target);
    const oldValue = target[property];
    value = createProxy(value);
    const result = Reflect.set(target, property, value, receiver);
    if(result) {
        removeParent(oldValue, proxy, property);
        addParent(value, proxy, property);
        callAllAffected(proxy, property, oldValue);
    }
    return result;
}
function deleteProperty(target, property) {
    const proxy = ProxyObjDict.get(target);
    const oldValue = target[property];
    const result = Reflect.deleteProperty(target, property);
    if(result) {
        removeParent(oldValue, proxy, property);
        callAllAffected(proxy, property, oldValue);
    }
    return result;
}

/**
 * 
 * @template T
 * @param {T} obj c
 * @returns {T}
 */
function createProxy(obj) {
    if (typeof obj !== "object" || obj === null) {
        return obj
    }
    if (ProxyObjDict.has(obj)) {
        return ProxyObjDict.get(obj);
    }
    const proxy = new Proxy(obj, {
        set: setter,
        deleteProperty: deleteProperty,
    });

    ProxyObjDict.set(obj, proxy).set(proxy, proxy);
    ParentDict.set(proxy, []);

    for (const property in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, property)) {
            const value = obj[property];
            if (typeof value === "object" && value !== null) {
                const child = createProxy(value);
                obj[property] = child; 
                ParentDict.get(child)?.push([proxy, property]);
            }
        }
    }

    return proxy;
}

/* ---------------------------- EXPOSED FUNCTIONS --------------------------- */

/**
 * Creates a server proxy object with the provided data.
 * @template T
 * @param {T} obj - The initial data to be used for the server proxy.
 * @returns {T} The proxy object representing the server.
 */
function createServer(obj={}) {
    const proxy = createProxy(obj);
    const root = {root: proxy};
    ParentDict.get(proxy).push([root, "root"])
    ListenerDict.set(root, createEmptyListener())
    ListenerDict.get(root).initialSet = true;
    return proxy;
}

/**
 * @typedef ServerListener
 * @property {ServableListener} Callback - the callback that will be called when this object is run
 * @property {Function} removeSelf - function to stop the listener from listening
 * @private 
 * @property {WeakRef<Function>} _WeakRef - a reference to the weak reference used internally
 * @property {ListenerData} _AttachedListener - the child listener that is used internally
 */
/**
 * add a listener to a Servable object
 * @param {object} server - Server to attach to
 * @param {string} path - Path to listen to
 * @param {ServableListener} callback - Callback to be called when the value changes
 * @param {boolean} activateIfUnchanged - Should the callback be run when the value was set to itself?
 * @param {boolean} activateFromParent - Should the callback be run when the value is changed through its parent?
 * @returns {ServerListener} - Listener Object
 */
function addListener(server, path, callback, config={ activateIfUnchanged: true, activateFromParent: true, suppressInitialSet: false, multiple: false }) {
    const activateIfUnchanged = config.activateIfUnchanged ?? true;
    const activateFromParent = config.activateFromParent ?? true;
    const suppressInitialSet = config.suppressInitialSet ?? false;
    const multiple = config.multiple ?? false;
    const parentPaths = getAllParentPaths(server);
    path = splitString(path);
    if(!(path instanceof Array)) throw TypeError(`path is of type ${typeof path} and not an array or string`);
    if(!(callback instanceof Function)) throw TypeError(`callback is of type ${typeof callback} and not a function`);

    if(!multiple && parentPaths.length > 1) {
        console.warn("Creating multiple callbacks with one call, set `multiple` to true to suppress warning " +
            "and expect an array instead of a single callback object");
    }
    
    const callbackarr = [];
    parentPaths.forEach((value) => {
        let server = value[0];
        let listener = ListenerDict.get(server);
        if(listener == undefined) {
            throw TypeError("Object is not listenable");
        }
        // abspath will always at least contain "root"
        let abspath = value[1].concat(path);
        // create all the paths up to the path we need
        while(abspath.length > 1) {
            const curpath = abspath.shift();
            if(!listener.childListeners.has(curpath)) {
                listener.childListeners.set(curpath, createEmptyListener())
            }
            listener = listener.childListeners.get(curpath)
        }
        if(listener == undefined) {
            throw EvalError("Could not correctly create listener");
        }
        // add the callback to the list
        if(!listener.ownListeners.has(abspath[0])) {
            listener.ownListeners.set(abspath[0], [])
        };
        const callbackObj = {
            callback: callback,
            activateIfUnchanged: activateIfUnchanged,
            activateFromParent: activateFromParent,
            suppressInitialSet: suppressInitialSet
        }
        listener.ownListeners.get(abspath[0]).push(callbackObj);
        const callbackRetObj = {
            callback: callbackObj,
            _AttachedListener: listener,
            _Property: abspath[0],
            removeSelf: () => {
                if (!this._AttachedListener) {
                    return;
                }
                this._AttachedListener.ownListeners.set(
                    this._Property, 
                    this._AttachedListener.ownListeners.get(this._Property).filter((val) => val != this.callback)
                );
                this._AttachedListener = null;
            }
        };
        if(!multiple) {
            return callbackRetObj
        }
        callbackarr.push(callbackRetObj);
    });
    return callbackarr;
}

/**
 * Apply a value to a server object at a given path
 * @param {object} server - server object to be set 
 * @param {value} value - value to apply on the server
 * @param {string[]|string} path - path at which to apply the value
 */
function apply(server, value, path) {
    path = splitString(path);
    if(!(path instanceof Array)) throw TypeError(`path is of type ${typeof path} and not an array or string`);
    if(path.length > 0) {
        // find the object we need to edit
        while(path.length > 1) {
            const currentPath = path.shift();
            // if the object doesnt exist create it (this can definitely cause jank)
            if(typeof server[currentPath] != "object" || server[currentPath] === null) {
                if(/^[0-9]$/.test(currentPath)) {
                    server[currentPath] = [];
                } else {
                    server[currentPath] = {};
                }
            }
            server = server[currentPath];
        }
        // edit the object
        // edit the object
        if(value == undefined) {
            delete server[path[0]];
        } else {
            server[path[0]] = value;
        }
        server[path[0]] = value;
        return;
    }
    if(typeof value != "object" || value === null) {
        throw TypeError("value cannot be non object if path is empty")
    }
    const originalValue = {};
    { // block where no changes will be made public
        suppressAffected = true;
        for (const key in server) {
            if (Object.prototype.hasOwnProperty.call(server, key)) {
                originalValue[key] = server[key];
                delete server[key];
            }
        }
        for (const key in value) {
            if (Object.prototype.hasOwnProperty.call(value, key)) {
                server[key] = value[key];
            }
        }
        suppressAffected = false;
    }
    callAllAffected(server, null, originalValue);
}

globalThis.clawffeeInternals.subscribables = {
    createServer,
    addListener,
    apply
}

module.exports = {
    createServer,
    addListener,
    apply
};