const fs = require("node:fs");
const path = require('path');
const { sharedServerData, } = require("../plugins/builtin/server");
const { autoSavedJSON } = require("../plugins/builtin/files");
const { addPath } = require("../plugins/builtin/internal/codeBinder");

/**
 * @typedef moduledata
 * 
 * @property {object} module
 * @property {string} filePath
 * @property {string} modulePath
 * @property {string} parsedModulePath
 * @property {string} name
 * @property {object} watcher
 * @property {errored} errored
 */
/**
 * @typedef loadedmodule
 * 
 * @property {Map<string, loadedmodule>} children
 * @property {loadedmodule} parent
 * @property {string[]} dependencies
 * @property {{enabled: boolean}} conf
 * @property {boolean} active
 * @property {moduledata} module
 */

if(!sharedServerData.internal) sharedServerData.internal = {};
sharedServerData.internal.loadedmodules = {
    children: {},
    path: path.join(__dirname, "../commands"),
    name: "commands",
    active: false,
    conf: {}
};

/**
 * @type {loadedmodule}
 */
const loadedmodules = {
    children: {},
    parent: null,
    dependencies: [],
    conf: {enabled: true},
    active: false,
    module: {
        module: null,
        filePath: path.join(__dirname, "../commands"),
        modulePath: "../commands",
        parsedModulePath: null,
        name: "commands",
        watcher: null
    },
    serverData: sharedServerData.internal.loadedmodules
}

/**
 * @type {Dictionary<string, loadedmodule>}
 */
const moduleByPath = {}

/**
 * Consider which listener to use (File/Folder) and set up generics
 * @param {loadedmodule} curMod 
 * @param {string} file
 */
function setupInner(curMod, file) {
    if(file.endsWith("._conf")) {
        return;
    }
    const newfilePath = path.join(curMod.module.filePath, file);
    const isdir = fs.statSync(newfilePath).isDirectory();
    if(!isdir && !file.endsWith(".js")) {
        return;
    }
    const conf = autoSavedJSON(newfilePath + "._conf", {
        enabled: true,
    });

    curMod.serverData.children[file] = {
        children: {},
        path: newfilePath,
        name: curMod.module.name + "/" + file,
        active: false,
        conf: conf
    };

    /**
     * @type {loadedmodule}
     */
    const newModule = {
        children: {},
        parent: curMod,
        dependencies: [],
        conf: curMod.serverData.children[file].conf,
        active: false,
        module: {
            module: null,
            filePath: newfilePath,
            modulePath: curMod.module.modulePath + "/" + file,
            parsedModulePath: null,
            name: curMod.module.name + "/" + file,
            watcher: null
        },
        serverData: curMod.serverData.children[file]
    }
    curMod.children[file] = newModule;
    moduleByPath[newModule.module.filePath] = newModule;
    if(isdir) {
        setupFolder(newModule);
    } else {
        setupFile(newModule);
    }
}

/**
 * Setup Hooks for File listening
 * @param {loadedmodule} curMod
 */
function setupFile(curMod) {
    curMod.module.parsedModulePath = require.resolve(curMod.module.modulePath);
    addPath(curMod.module.filePath);
    let timeout = null;
    curMod.module.watcher = fs.watch(curMod.module.filePath, {}, (event) => {
        if(timeout) {
            return;
        }
        timeout = setTimeout(() => {
            timeout = null;
        }, 400);
        curMod.module.errored = false;
        require("./commandHotReloader").reloadModule(curMod);
    })
}

/**
 * Setup Hooks for Folder listening
 * @param {loadedmodule} curMod
 */
function setupFolder(curMod) {
    const files = fs.readdirSync(curMod.module.filePath);
    files.forEach(file => {
        setupInner(curMod, file);
    });
    let timeout = {};
    curMod.module.watcher = fs.watch(curMod.module.filePath, {}, (event, file) => {
        if(timeout[file]) {
            return;
        }
        timeout[file] = setTimeout(() => {
            timeout[file] = null;
        }, 400);
        if(!fs.existsSync(path.join(curMod.module.filePath, file))) {
            if(curMod.children[file]) {
                removeInner(curMod.children[file]);
                delete curMod.children[file];
                delete curMod.serverData.children[file];
            }
            return;
        }
        if(event == 'rename')
            setupInner(curMod, file);
    });
}

function removeInner(curMod) {
    if(!curMod) return;

    curMod.module.watcher?.stop?.();
    require("./commandHotReloader").unloadModule(curMod);
    fs.rmSync(curMod.module.filePath + '._conf');
    for (const file in curMod.children) {
        if (Object.prototype.hasOwnProperty.call(curMod, file)) {
            removeInner(curMod.children[file]);
            delete curMod.children[file];
            delete curMod.serverData.children[file];
        }
    }
}

setupFolder(loadedmodules);

module.exports = {
    moduleByPath,
    loadedmodules
}