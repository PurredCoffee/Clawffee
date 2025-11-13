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

function isRelative(dir, parent) {
    const relative = path.relative(parent, dir);
    return relative && !relative.startsWith('..') && !path.isAbsolute(relative);
}

function createRequire(basePath, module) {
    return function(modulePath) {
        let fullpath = "";
        fullpath = require.resolve(modulePath, {paths: [path.dirname(basePath)]});
        let relative = commandFolders.reduce((prev, cur) => prev || isRelative(fullpath, cur), false);
        if(relative) {
            try {
                if(require.cache[fullpath]) {
                    if(!require.cache[fullpath].loaded) {
                        throw new CircularRequireError(fullpath);
                    }
                    return require.cache[fullpath];
                }
                let data = fs.readFileSync(fullpath).toString();
                for (const ending in clawffee.fileManagers) {
                    if (!Object.hasOwn(clawffee.fileManagers, ending) || !fullpath.endsWith(ending)) continue;
                    const element = clawffee.fileManagers[ending];
                    return clawffee.fileManagers[ending](fullpath, data);
                }
                return data;
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

/**
 * 
 * @param {*} path 
 * @param {string} funcStr
 * @returns 
 */
function runAsFile(fullpath, funcStr, keepCache) {
    if(keepCache && require.cache[fullpath]) {
        return require.cache[fullpath];
    }
    const func = wrapCode(fullpath, funcStr);
    const mod = createModule(fullpath);
    mod.isPreloading = mod.isPreloading;
    func.bind(globalThis)(mod.exports, mod.require, mod, fullpath, path.dirname(fullpath));
    mod.loaded = true;
    require.cache[fullpath] = mod;
    return mod;
}

clawffee.fileManagers['.js'] = (fullpath, data) => {
    return runAsFile(fullpath, data).exports;
}

module.exports = {
    runAsFile
};