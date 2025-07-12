import fs from 'node:fs';
import path from 'path';
import { autoSavedJSON } from '../plugins/builtin/files';

const { registerModuleByPath  } = require(fs.realpathSync("./plugins/builtin/internal/ClawCallbacks.ts"));
const { sharedServerData, } = require(fs.realpathSync("./plugins/builtin/server.js"));

type moduledata = {
    module: any,
    filePath: string,
    confPath: string,
    modulePath: string,
    parsedModulePath: string | null,
    name: string,
    watcher: any,
    errored: boolean,
}
type loadedmodule = {
    children: {[file: string]: loadedmodule}
    parent: loadedmodule | null
    dependencies: string[]
    conf: {enabled: boolean}
    active: boolean
    module: moduledata,
    serverData: any
}

sharedServerData.internal.loadedmodules = {
    children: {},
    path: fs.realpathSync("./commands"),
    name: "commands",
    active: false,
    conf: {}
};

const loadedmodules: loadedmodule = {
    children: {},
    parent: null,
    dependencies: [],
    conf: { enabled: true },
    active: false,
    module: {
        module: null,
        filePath: fs.realpathSync("./commands"),
        confPath: fs.realpathSync("./config/internal/commands_conf"),
        modulePath: fs.realpathSync("./commands"),
        parsedModulePath: null,
        name: "commands",
        watcher: null,
        errored: false
    },
    serverData: sharedServerData.internal.loadedmodules
}

const moduleByPath: {[file: string]: loadedmodule} = {}
registerModuleByPath(moduleByPath);

/**
 * Consider which listener to use (File/Folder) and set up generics
 */
function setupInner(curMod: loadedmodule, file: string) {
    if (file.endsWith("._conf")) {
        return;
    }
    const newfilePath = path.join(curMod.module.filePath, file);
    const isdir = fs.statSync(newfilePath).isDirectory();
    if (!isdir && !file.endsWith(".js")) {
        return;
    }
    const conf = autoSavedJSON(curMod.module.confPath + "/" + file + "._conf", {
        enabled: true,
    });

    curMod.serverData.children[file] = {
        children: {},
        path: newfilePath,
        name: curMod.module.name + "/" + file,
        active: false,
        conf: conf
    };

    const newModule: loadedmodule = {
        children: {},
        parent: curMod,
        dependencies: [],
        conf: curMod.serverData.children[file].conf,
        active: false,
        module: {
            module: null,
            filePath: newfilePath,
            confPath: curMod.module.confPath + "/" + file,
            modulePath: curMod.module.modulePath + "/" + file,
            parsedModulePath: null,
            name: curMod.module.name + "/" + file,
            watcher: null,
            errored: false
        },
        serverData: curMod.serverData.children[file]
    }
    curMod.children[file] = newModule;
    moduleByPath[newModule.module.filePath] = newModule;
    if (isdir) {
        setupFolder(newModule);
    } else {
        setupFile(newModule);
    }
}

/**
 * Setup Hooks for File listening
 */
function setupFile(curMod: loadedmodule) {
    curMod.module.parsedModulePath = require.resolve(curMod.module.modulePath);
    let timeout: NodeJS.Timeout | null = null;
    curMod.module.watcher = fs.watch(curMod.module.filePath, {}, (event) => {
        if (timeout) {
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
 */
function setupFolder(curMod: loadedmodule) {
    const files = fs.readdirSync(curMod.module.filePath);
    files.forEach(file => {
        setupInner(curMod, file);
    });
    let timeout = {};
    curMod.module.watcher = fs.watch(curMod.module.filePath, {}, (event, file) => {
        if(!file || timeout[file]) return;
        timeout[file] = setTimeout(() => {
            timeout[file] = null;
        }, 400);
        if (!fs.existsSync(path.join(curMod.module.filePath, file))) {
            if (curMod.children[file]) {
                removeInner(curMod.children[file]);
                delete curMod.children[file];
                delete curMod.serverData.children[file];
            }
            return;
        }
        if (event == 'rename') {
            setupInner(curMod, file);
            if(file.endsWith('.js')) {
                require('./commandHotReloader').reloadModule(curMod.children[file]);
            }
        }
    });
}

function removeInner(curMod: loadedmodule) {
    if (!curMod) return;

    curMod.module.watcher?.stop?.();
    require("./commandHotReloader").unloadModule(curMod);
    fs.rmSync(curMod.module.confPath + "._conf");
    for (const file in curMod.children) {
        if (Object.prototype.hasOwnProperty.call(curMod, file)) {
            removeInner(curMod.children[file]);
            delete curMod.children[file];
            delete curMod.serverData.children[file];
        }
    }
}

setupFolder(loadedmodules);

export {
    moduleByPath,
    loadedmodules,
    loadedmodule
}