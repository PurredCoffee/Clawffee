/*
 ┌───────────────────┐
 │                   │
 │     chokidar      │
 │                   │
 └─────────┬─────────┘
           │
           │ File updates
           │
 ┌─────────▼─────────┐
 │                   │
 │      FS.read      │
 │                   │
 └─────────┬─────────┘
           │
           │ Raw JS String
           │
 ┌─────────▼─────────┐        JS Sourcemap
 │                   │         & Metadata
 │   JS Prettifier   ├───────────────┐
 │                   │               │
 └─────────┬─────────┘     ┌─────────▼─────────┐
           │               │                   │
           │ Overriden JS  │ Original JS Cache │
           │               │                   │
 ┌─────────▼─────────┐     └─────▲─────┬───────┘
 │                   │           │     │
 │  Function() call  ├───────────┘     │
 │                   │       Metadata  │
 └─────────┬─────────┘                 │Function
           │                           │Metadata
           │ Potential Error           │
           │                           │
 ┌─────────▼─────────┐                 │
 │                   │                 │
 │ prepareStackTrace ◄─────────────────┘
 │                   │
 └───────────────────┘
*/

const fs = require('fs');
const { hookToFolder } = require('./FSHookManager');
const { join, sep, basename } = require('path')
const { commandFolders } = require('./JSRunnerGlobals');
const { runAsFile } = require('./ModuleHelpers');
const { sharedServerData } = require('./SharedServerData');

/**
 * @type {{[x: string]: Array<Function>}}
 */
globalThis.clawffeeInternals.fileCleanupFuncs = {}
/**
 * Unloads a commands at a given path
 * @param {string} path 
 */
function unloadCommand(path) {
    const fullPath = join(workingDirectory, path);
    if(!globalThis.clawffeeInternals.fileCleanupFuncs[fullPath]) return;
    globalThis.clawffeeInternals.fileCleanupFuncs[fullPath].forEach((v) => v());
    for (const ending in globalThis.clawffeeInternals.fileManagers) {
        if (!Object.hasOwn(globalThis.clawffeeInternals.fileManagers, ending) || !path.endsWith(ending)) continue;
        const mgr = globalThis.clawffeeInternals.fileManagers[ending];
        try {
            mgr.onUnload?.(path);
        } catch(e) {
            console.error(e);
        }
    }
    console.log(`- ${path}`);
}

let workingDirectory = process.cwd();

globalThis.clawffeeInternals.defaultFile = "console.log('Awoof!')\n";
console.info("To start, create a .js file in the commands folder!");
globalThis.clawffeeInternals.fileManagers = {
   '.js': {
        onLoad(fullpath, data, initial) {
            if(!data.trim()) {
                data = globalThis.clawffeeInternals.defaultFile + data;
                setTimeout(() => fs.writeFile(fullpath, data, (err) => {
                    if(err) {
                        console.error(err);
                    }
                }), 10);
            }
            runAsFile(fullpath, data, initial);
        },
        onRequire(fullpath, data) {
            return runAsFile(fullpath, data).exports;
        }
    }
}
/**
 * Loads the commands at a given path
 * @param {string} path 
 * @param {string} str 
 */
function loadCommand(path, str, initial) {
    console.log(`+ ${path}`);
    const fullPath = join(workingDirectory, path);
    try {
        for (const ending in globalThis.clawffeeInternals.fileManagers) {
            if (!Object.hasOwn(globalThis.clawffeeInternals.fileManagers, ending) || !path.endsWith(ending)) continue;
            const mgr = globalThis.clawffeeInternals.fileManagers[ending];
            try {
                (mgr.onLoad ?? mgr.onRequire)?.(fullPath, str, initial);
                break;
            } catch(e) {
                console.error(e);
            }
        }
    } catch(err) {
        console.error(err);
        unloadCommand(path);
    }
}

sharedServerData.internal.commands = JSON.parse(fs.readFileSync('config/internal/commands.json'));
const config = sharedServerData.internal.commands;
clawffeeInternals.commandConfig = config;

/**
 * 
 * @param {string} path 
 * @returns 
 */
function getCMDObject(path) {
    const folders = path.split(sep);
    let mgr = config;
    folders.shift();
    while(folders.length > 1) {
        const fname = folders.shift();
        if(!mgr.childfolders[fname]) mgr.childfolders[fname] = {
            name: 'fname',
            sortname: null,
            img: null,
            hidden: false,
            disabled: false,
            childfolders: {},
            childscripts: {}
        };
        mgr = mgr.childfolders[fname];
    }
    return mgr;
}
/**
 * Recursively loads and reloads commands in the given folder
 * @param {string} folder folder to load commands from
 */
function runCommands(folder) {
    if(!fs.existsSync(folder)) {
        fs.mkdirSync(folder);
    }
    if(!fs.statSync(folder).isDirectory()) {
        fs.rmSync(folder);
        fs.mkdirSync(folder);
    }
    commandFolders.push(folder);
    hookToFolder(folder, (type, path, stats) => {
        const cmdobj = getCMDObject(path);
        if(type == 'unlink') {
            if(stats.isDirectory()) {
                delete cmdobj.childfolders[basename(path)];
            } else {
                delete cmdobj.childscripts[basename(path)];
            }
        } else {
            if(stats.isDirectory()) {
                if(!cmdobj.childfolders[basename(path)]) {
                    cmdobj.childfolders[basename(path)] = {
                        "name": basename(path),
                        "sortname": null,
                        "img": null,
                        "hidden": false,
                        "disabled": false,
                        childfolders: {},
                        childscripts: {}
                    }
                }
            } else {
                if(!cmdobj.childscripts[basename(path)]) {
                    cmdobj.childscripts[basename(path)] = {
                        "name": basename(path),
                        "sortname": null,
                        "img": null,
                        "hidden": false,
                        "disabled": false,
                    }
                }
            }
        }
        if(!Object.keys(clawffeeInternals.fileManagers).find(v => path.endsWith(v))) {
            return;
        }
        if(type == 'unlink') {
            unloadCommand(path);
            return;
        }
        fs.readFile(path, (err, data) => {
            if(type != 'initial')
                unloadCommand(path);
            if(err) {
                console.warn(err);
                return;
            }
            loadCommand(path, data.toString(), type == 'initial');
        });
    });
}

module.exports = {
    runCommands
}