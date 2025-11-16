const { associateFunctionWithFile } = require("./codeBinder");


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
    globalThis.clawffeeInternals.serverFunctions[path] = callback;
    return associateFunctionWithFile(() => {
        if (callback == functions[path])
            functions[path] = null;
    });
}

module.exports = {
    sharedServerData: clawffeeInternals.sharedServerData, setFunction
}