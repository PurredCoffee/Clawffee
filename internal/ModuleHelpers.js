const path = require('path');
const fs = require('fs');
const { commandFolders } = require('./JSRunnerGlobals');
const { wrapCode } = require('./JSParseManager');

class CircularRequireError extends Error {
    constructor(modulePath) {
        super(`Circular require detected for module at path: ${modulePath}`);
        this.name = 'CircularRequireError';
    }
}

class ModuleNotFoundError extends Error {
    constructor(modulePath) {
        super(`Module not found at path: ${modulePath}`);
        this.name = 'ModuleNotFoundError';
    }
}

class ModuleLockedError extends Error {
    constructor(modulePath) {
        super(`Module is locked and cannot be required at path: ${modulePath}`);
        this.name = 'ModuleLockedError';
    }
}

/**
 * @typedef {string} FullPath
 */

/**
 * Used to detect circular requires
 * @type {Set<FullPath>}
 */
const requireDepth = new Set();
/**
 * Cache of loaded modules
 * @type {Map<FullPath, any>}
 */
const requireCache = new Map();

function isRelative(dir, parent) {
    const relative = path.relative(parent, dir);
    return relative && !relative.startsWith('..') && !path.isAbsolute(relative);
}

function createRequire(basePath, module) {
    return function(modulePath) {
        let fullpath = "";
        try {
            fullpath = require.resolve(path.join(path.dirname(basePath), modulePath));
        } catch(e1) {
            try {
                fullpath = require.resolve(modulePath);
            } catch(e) {
                throw new ModuleNotFoundError(modulePath);
            }
        }
        let relative = commandFolders.reduce((prev, cur) => prev || isRelative(fullpath, cur), false);
        if(relative) {
            console.log(fullpath, ' relative');
            try {
                if(cache.has(fullpath)) {
                    if(!cache.get(fullpath).loaded) {
                        throw new CircularRequireError(fullpath);
                    }
                    return cache.get(fullpath);
                }
                let data = fs.readFileSync(fullpath).toString();
                runAsFile(fullpath, data);
            } catch(e) {
                throw e;
            }
            return;
        }
        return require(fullpath);
    }
}

function createModule(path) {
    const mod = {};
    mod.exports = {};
    mod.path = path;
    mod.id = path;
    mod.filename = path;
    mod.loaded = false;
    mod.children = [];
    mod.isPreloading = false;
    mod.require = createRequire(path, mod);
    return mod;
}

const cache = new Map();
/**
 * 
 * @param {*} path 
 * @param {string} funcStr
 * @returns 
 */
function runAsFile(fullpath, funcStr) {
    const func = wrapCode(fullpath, funcStr);
    const mod = createModule(fullpath);
    mod.isPreloading = mod.isPreloading;
    func.bind(globalThis)(mod.exports, mod.require, mod, fullpath, path.dirname(fullpath));
    mod.loaded = true;
    cache.set(fullpath, mod);
    return mod;
}

module.exports = {
    runAsFile
};