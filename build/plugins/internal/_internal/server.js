const { associateObjectWithFile } = require("./codeBinder");


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
    globalThis.clawffee.serverFunctions[path] = callback;
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
    sharedServerData: clawffee.sharedServerData, setFunction
}