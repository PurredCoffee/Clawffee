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
const { basename, join } = require('path')
const { commandFolders } = require('./JSRunnerGlobals');
const { runAsFile } = require('./ModuleHelpers');

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
    globalThis.clawffeeInternals.fileCleanupFuncs[fullPath].forEach((v) => v());
    console.log(`- ${path}`);
}

let workingDirectory = process.cwd();

globalThis.clawffeeInternals.defaultFile = "console.log('Awoof!')\n";
/**
 * Loads the commands at a given path
 * @param {string} path 
 * @param {string} str 
 */
function loadCommand(path, str, initial) {
    if(!str.trim()) {
        str = globalThis.clawffeeInternals.defaultFile + str;
        setTimeout(() => fs.writeFile(path, str, (err) => {
            if(err) {
                console.error(err);
            }
        }), 10);
    }
    const fullPath = join(workingDirectory, path);
    console.log(`+ ${path}`);
    try {
        runAsFile(fullPath, str, initial);
    } catch(err) {
        console.error(err);
        unloadCommand(path);
    }
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
        if(!path.endsWith('.js')) {
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