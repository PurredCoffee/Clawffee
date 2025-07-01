/**
 * @typedef Listener
 * 
 * @property {Map<string, WeakRef<Function>[]>} ownListeners
 * @property {Map<string, Listener>} childListeners
 */
/**
 * @typedef ProxyObj
 * 
 * @property {ProxyObj} parent
 * @property {string} name
 * @property {object} original
 * @property {Listener} listener
 * @property {boolean} disabled
 */

const { associateObjectWithFile } = require("./internal/codeBinder");

/**
 * @type {WeakMap<Proxy, ProxyObj>}
 */
const ProxyObjDict = new WeakMap();

/**
 * Creates a proxy for the given object that listens for property changes and invokes a callback.
 *
 * @template T
 * @param {T} obj - The target object to observe for property changes.
 * @param {Array} path - The current path (and subpaths) for the property.
 * @param {(property: keyof T, newValue: T[keyof T], oldValue: T[keyof T]) => void} func - 
 *        Callback function invoked when a property value changes. 
 *        Receives the property name, new value, and old value as arguments.
 * @returns {T} A proxy object that behaves like the original but triggers the callback on property changes.
 */
function makeProxy(obj, parent, name, callback) {
    if (ProxyObjDict.has(obj)) {
        obj = ProxyObjDict.get(obj).original;
    }
    const proxy = new Proxy(obj, {
        set(target, property, value, receiver) {
            const oldValue = target[property];
            let newValue = value;
            if (typeof value === "object" && value !== null) {
                value = makeProxy(value, proxy, property, callback);
            }
            const result = Reflect.set(target, property, value, receiver);
            if (result) {
                callback(proxy, property, [property], oldValue, newValue);
            }
            return result;
        },
        deleteProperty(target, property) {
            const oldValue = target[property];
            const result = Reflect.deleteProperty(target, property);
            if (result) {
                callback(proxy, property, [property], oldValue, undefined);
            }
            return result;
        }
    });
    let listenerObj = {
        ownListeners: {},
        childListeners: {}
    };
    if (ProxyObjDict.has(parent)) {
        let parentProxy = ProxyObjDict.get(parent);
        listenerObj = parentProxy.listener.childListeners[name] ?? listenerObj;
    }
    ProxyObjDict.set(proxy, {
        parent: parent,
        name: name,
        original: obj,
        listener: listenerObj,
        disabled: true
    });
    for (const property in proxy) {
        if (Object.prototype.hasOwnProperty.call(proxy, property)) {
            const value = proxy[property];
            if (typeof value === "object" && value !== null) {
                proxy[property] = makeProxy(value, proxy, property, callback);
            }
        }
    }
    ProxyObjDict.get(proxy).disabled = false;
    return proxy;
}

/**
 * 
 * @param {object} obj 
 * @param {string} property 
 * @param {string[]} fullPath 
 * @param {object} oldValue 
 * @param {object} newValue 
 * @returns 
 */
function onChange(obj, property, fullPath, oldValue, newValue) {
    const ProxyObj = ProxyObjDict.get(obj);
    if (ProxyObj.disabled) {
        return;
    }
    const trimPath = fullPath.slice(1);

    // call all eventlisteners
    const eaten = ProxyObj.listener.ownListeners[property]?.reduce((eaten, listener) => listener.deref()?.(trimPath, newValue, oldValue, obj[property]) || eaten, false);
    
    // clear GC functions
    if (ProxyObj.listener.ownListeners[property])
        ProxyObj.listener.ownListeners[property] = ProxyObj.listener.ownListeners[property].filter((val) => val.deref());

    // call parents onChange if output is not eaten yet
    if (ProxyObj.parent && !eaten)
        onChange(ProxyObj.parent, ProxyObj.name, [ProxyObj.name, ...fullPath], oldValue, newValue);
}


/**
 * Creates a server proxy object with the provided data.
 *
 * @param {Object} [data={}] - The initial data to be used for the server proxy.
 * @returns {Object} The proxy object representing the server.
 */
function createServer(data = {}) {
    return makeProxy({root: data}, null, null, onChange).root;
}

/**
 * @callback ServableListener
 * @param {string[]} path the relative path that was changed from the object that is being listened to
 * @param {object} newValue the new value of the object at the relative path
 * @param {object} oldValue the old value of the object at the relative path
 * @param {object} self the value at the path
 */
/**
 * @typedef ServerListener
 * @property {ServableListener} Callback - the callback that will be called when this object is run
 * @property {Function} removeSelf - function to stop the listener from listening
 * @private 
 * @property {WeakRef<Function>} _WeakRef - a reference to the weak reference used internally
 * @property {Listener} _AttachedListener - the child listener that is used internally
 */
/**
 * add a listener to a Servable object
 * @param {object} server - Server to attach to
 * @param {string} path - Path to listen to
 * @param {ServableListener} callback - 
 *        Callback function invoked when a property value changes. 
 *        Receives the property name, new value, and old value as arguments.
 * @param {boolean} [ifChanged=false] - should the callback only be called if the argument changed
 * @returns {ServerListener} - Listener object that can be garbage collected
 */
function addListener(server, path, callback, ifChanged = false) {
    if (!ProxyObjDict.has(server)) {
        throw new TypeError("`server` is not a registered Server Object");
    }
    const ProxyObj = ProxyObjDict.get(server);

    if (typeof path == 'string') {
        path = path.split('.').filter((val) => val.trim());
    }
    if (!Array.isArray(path)) {
        throw new TypeError("`path` must be an array or a dot-separated string");
    }

    if (typeof callback != 'function') {
        throw new TypeError("`callback` is not a function");
    }

    // adjust callback if ifChanged is defined
    if (ifChanged) {
        const originalCallback = callback;
        callback = (a, b, c, d) => {
            if (b !== c) {
                originalCallback(a, b, c, d);
            }
        }
    }


    /**
     * 
     * @param {Listener} childListener 
     * @param {Array} rpath 
     */
    function getChild(childListener, obj, rpath) {
        let name = rpath.shift();
        if (!rpath[0]) {
            return childListener;
        }
        if (!childListener.childListeners[name]) {
            childListener.childListeners[name] = {
                ownListeners: {},
                childListeners: {}
            };
            if (obj && ProxyObjDict.has(obj[name])) {
                ProxyObjDict.get(obj[name]).listener = childListener.childListeners[name];
            }
        }
        return getChild(childListener.childListeners[name], obj?.[name], rpath);
    }

    //get the listener object under `path`
    let name = ProxyObj.name;
    let childListener = ProxyObjDict.get(ProxyObj.parent).listener;
    if(path.length > 0) {
        name = path[path.length - 1];
        childListener = getChild(ProxyObj.listener, server, path);
    }
    const weakRef = new WeakRef(callback);
    childListener.ownListeners[name] = childListener.ownListeners[name] ?? [];
    childListener.ownListeners[name].push(weakRef);

    //create Listener Object
    return associateObjectWithFile({
        callback: callback,
        _WeakRef: weakRef,
        _AttachedListener: childListener,
        removeSelf() {
            if (!this._AttachedListener) {
                return;
            }
            this._AttachedListener.ownListeners[name] = this._AttachedListener.ownListeners[name].filter((val) => val != this._WeakRef);
            this._AttachedListener = null;
        }
    }, "removeSelf");
}

/**
 * Apply a value to a server object at a given path
 * @param {object} server - server object to be set
 * @param {value} value - server 
 * @param {string[]|string} path
 * @param {number} depth 
 */
function apply(server, value, path = [], depth=0) {
    if(!ProxyObjDict.has(server)) {
        throw new TypeError("`server` is not a registered Server Object");
    }
    const ProxyObj = ProxyObjDict.get(server);
    if(typeof path == 'string') {
        path = path.split('.').filter((val) => val.trim());
    }
    if(typeof depth != 'number') {
        throw new TypeError("`depth` must be a number");
    }

    path.unshift(ProxyObj.name);
    let obj = ProxyObj.parent;

    while(path.length > 1) {
        const key = path.shift();
        ProxyObjDict.get(obj).disabled = true;
        if (!(key in obj)) obj[key] = {};
        ProxyObjDict.get(obj).disabled = false;
        obj = obj[key];
    }
    value = {[path[0]]:value};


    function innerApply(obj, copy, depth, dont_delete = false) {
        if(!dont_delete)
            for (const key in obj) {
                if (Object.prototype.hasOwnProperty.call(obj, key) && !Object.prototype.hasOwnProperty.call(copy, key)) {
                    delete obj[key];
                }
            }
        for (const key in copy) {
            if (Object.prototype.hasOwnProperty.call(copy, key)) {
                if(depth <= 1 || typeof copy[key] != 'object') {
                    obj[key] = copy;
                } else { 
                    if(obj[key] === copy[key]) {
                        //prevent a crash
                        obj[key] = copy[key];
                    } else {
                        if(!Object.prototype.hasOwnProperty.call(obj, key) || typeof obj[key] != 'object') {
                            ProxyObjDict.get(obj).disabled = true;
                            obj[key] = Object.getPrototypeOf(copy[key]);
                            ProxyObjDict.get(obj).disabled = false;
                        }
                        innerApply(obj[key], copy[key], depth-1);
                    }
                }
            }
        }
    }
    innerApply(obj, value, depth + 1, true);
}

if(typeof module != 'undefined') {
    module.exports = {
        createServer,
        addListener,
        apply
    };
}