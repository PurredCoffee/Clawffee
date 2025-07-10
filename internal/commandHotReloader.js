const fs = require("node:fs");
const path = require('path');
const { deletePath, addPath } = require("../plugins/builtin/internal/codeBinder");
const { moduleByPath } = require("./commandFSHooks");


// load plugins first
const { unavailablePlugins } = require("./pluginLoader");


/**
 * @type {Dictionary<string, loadedmodule[]>}
 */
const moduleDependers = {}

/**
 * Load selected Module and attached modules
 * @param {loadedmodule} curMod
 */
function loadFile(curMod) {
    if (curMod.module.errored) return false;

    deletePath(curMod.module.filePath);
    addPath(curMod.module.filePath);
    try {
        curMod.module.module = require(curMod.module.parsedModulePath);
        console.log(`+ ${curMod.module.name}`);
        curMod.module.errored = false;
    } catch (e) {
        console.error(e);
        curMod.module.errored = true;
        deletePath(curMod.module.filePath);
        return false;
    }
    return true;
}

/**
 * Unload selected Module and attached modules
 * @param {loadedmodule} curMod
 */
function unloadFile(curMod) {
    if (curMod.module.module == null) return;

    // unload self
    try {
        curMod.module.module?.unloadModule?.();
    } catch (e) { console.error(e); }
    curMod.module.module = null;
    deletePath(curMod.module.filePath);
    delete require.cache[curMod.module.parsedModulePath];
    console.log(`- ${curMod.module.name}`);

    // clear cache
    if (global.gc) {
        setTimeout(() => global.gc({
            execution: "sync",
            flavor: "last-resort",
            type: "major"
        }), 200);
    } else {
        console.warn('Garbage collection unavailable.  Pass --expose_gc '
            + 'when launching node to enable forced garbage collection.');
    }
}

/**
 * parses a path and returns all dependencies of the file relative to the current project
 * @param {string} absPath 
 * @param {Set} requiredFiles
 * @returns {Array[string]} all dependencies
 */
function parseRequirements(absPath, requiredFiles = new Set()) {
    if (!fs.statSync(absPath).isFile())
        return [];
    var contents = fs.readFileSync(absPath).toString();
    var re = /(?<=require\((?:'|"))(?:\.|#).*?(?=(?:'|")\))/g;

    let matches = contents.matchAll(re);
    for (const match of matches) {
        let reqPath = match[0];
        let resolvedPath;
        try {
            if (reqPath.startsWith(".")) {
                resolvedPath = require.resolve("./" + path.relative(__dirname, path.join(path.dirname(absPath), reqPath)));
            } else if (reqPath.startsWith("#")) {
                resolvedPath = require.resolve(reqPath);
            } else {
                continue;
            }
            if (!requiredFiles.has(resolvedPath)) {
                requiredFiles.add(resolvedPath);
                parseRequirements(resolvedPath, requiredFiles);
            }
        } catch (e) {
            // ignore resolution errors
        }
    }
    return Array.from(requiredFiles.keys());
}

/**
 * Load selected Module and attached modules
 * @param {loadedmodule} n
 */
function isActivateable(n, visited = new Set()) {
    if (n.active) return true;
    if (visited.has(n)) return true;
    if (!n.conf.enabled) return false;
    visited.add(n);
    for (const dep of n.dependencies || []) {
        if (unavailablePlugins[dep] || moduleByPath[dep] && !isActivateable(moduleByPath[dep], visited)) return false;
    }
    if (n.parent && !isActivateable(n.parent, visited)) return false;
    return true;
}

/**
 * Reload selected Module and attached modules
 * @param {loadedmodule} curMod 
 */
function reloadModule(curMod) {
    unloadModule(curMod);
    loadModule(curMod);
}

function reloadDependency(filename) {
    moduleDependers[filename]?.forEach(element => {
        unloadModule(element);
        element.module.errored = false;
    });
    moduleDependers[filename]?.forEach(element => {
        loadModule(element);
    });
}

/**
 * Load selected Module and attached modules
 * @param {loadedmodule} curMod
 */
function loadModule(curMod) {
    if (!fs.existsSync(curMod.module.filePath) || !curMod) {
        return false;
    }
    if (curMod.active) {
        return true;
    }

    // update dependencies
    curMod.dependencies?.forEach(dep => moduleDependers[dep] = moduleDependers[dep]?.filter(mod => mod !== curMod));
    curMod.dependencies = parseRequirements(curMod.module.filePath);
    curMod.dependencies.forEach((dep) => {
        if (!moduleDependers[dep]) {
            moduleDependers[dep] = [];
        }
        moduleDependers[dep].push(curMod);
    });

    // check if the file is loadable
    if (!isActivateable(curMod)) {
        return false;
    }
    curMod.active = true;

    // load dependencies
    curMod.dependencies.forEach((dep) => {
        if (moduleByPath[dep])
            curMod.active &&= loadModule(moduleByPath[dep]);
    });

    // load self
    if (curMod.module.parsedModulePath) {
        curMod.active &&= loadFile(curMod);
    }

    // load children
    if (curMod.active)
        for (const subModPath in curMod.children) {
            if (Object.prototype.hasOwnProperty.call(curMod.children, subModPath)) {
                const subMod = curMod.children[subModPath];
                loadModule(subMod);
            }
        }

    // load dependers
    if (curMod.active)
        moduleDependers[curMod.module.filePath]?.forEach((mod) => loadModule(mod));

    curMod.serverData.active = curMod.active;
    return curMod.active;
}

/**
 * Unload selected Module and attached modules
 * @param {loadedmodule} curMod
 */
function unloadModule(curMod) {
    if (!curMod || !curMod.active) {
        return;
    }
    curMod.active = false;
    curMod.serverData.active = curMod.active;

    // unload dependers
    moduleDependers[curMod.module.filePath]?.forEach((mod) => unloadModule(mod));

    // unload children
    for (const subModPath in curMod.children) {
        if (Object.prototype.hasOwnProperty.call(curMod.children, subModPath)) {
            const subMod = curMod.children[subModPath];
            unloadModule(subMod);
        }
    }

    // unload self
    unloadFile(curMod);

    // dont unload dependencies because they are loaded independently
}

module.exports = {
    unloadModule,
    loadModule,
    reloadModule,
    reloadDependency
}