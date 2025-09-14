const path = require('path');
const fs = require('fs');
const { codeBinder: { associateObjectWithFile }, clawCallbacks: { moduleByPath } } = require('../internal/internal');

/* ------------------------------- FILE SAFETY ------------------------------ */

const MAIN_FOLDER = path.resolve(__dirname, '../../');

function isPathAllowed(targetPath) {
    const resolved = path.resolve(MAIN_FOLDER, targetPath);
    return resolved.startsWith(MAIN_FOLDER);
}

function wrapFsMethod(methodName) {
    const orig = fs[methodName];
    fs[methodName] = function (...args) {
        let filePath = args[0];
        if (typeof filePath === 'string' || Buffer.isBuffer(filePath)) {
            if (!isPathAllowed(filePath)) {
                throw new Error(`Access to path "${filePath}" is not allowed.`);
            }
        }
        return orig(...args);
    };
}

[
    'writeFile', 'writeFileSync',
    'appendFile', 'appendFileSync',
    'unlink', 'unlinkSync',
    'rmdir', 'rmdirSync',
    'mkdir', 'mkdirSync',
    'rename', 'renameSync',
    'rm', 'rmSync',
    'truncate', 'truncateSync',
    'copyFile', 'copyFileSync',
    'createWriteStream'
].forEach(method => {
    if (typeof fs[method] === 'function') {
        wrapFsMethod(method);
    }
});

/* -------------------------------- Intervals ------------------------------- */

const oldSetInterval = setInterval;
setInterval = (...params) => {
    let callback = oldSetInterval(...params); 
    associateObjectWithFile({
        callback: callback,
        disconnect: () => {
            clearInterval(callback);
        }
    }, "disconnect");
    return callback;
}

const oldSetTimeout = setTimeout;
setTimeout = (...params) => {
    let callback = oldSetTimeout(...params); 
    associateObjectWithFile({
        callback: callback,
        disconnect: () => {
            clearTimeout(callback);
        }
    }, "disconnect");
    return callback;
}