const { associateObjectWithFile } = require("./codeBinder");

let functions = {}
function setFunctionsObj(functions_obj) {
    functions = functions_obj;
}

let sharedServerData = {}
function setSharedServerData(ssd_obj) {
    sharedServerData = ssd_obj;
}

/**
 * @callback URLCallback
 * 
 * @param {import("bun").BunRequest} request
 * @param {URL} url
 */

/**
 * 
 * @param {string} path 
 * @param {URLCallback} callback 
 * @returns 
 */
function setFunction(path, callback) {
    functions[path] = callback;
    return associateObjectWithFile({
        path: path,
        callback: callback,
        unbind() {
            if (callback == functions[path])
                functions[path] = null;
        }
    }, "unbind");
}

module.exports = {
    sharedServerData: new Proxy({}, {
        get(target, property, receiver) {
            return sharedServerData[property];
        },
        set(target, property, newValue, receiver) {
            Reflect.set(sharedServerData, property, newValue, sharedServerData);
        },
        ownKeys(target) {
            return Object.keys(sharedServerData);
        },
        has(target, property) {
            return property in sharedServerData;
        },
        deleteProperty(target, property) {
            delete sharedServerData[property];
        }
    }), setFunction,
    "#setFunctionsObj": setFunctionsObj, "#setSharedServerData": setSharedServerData
}