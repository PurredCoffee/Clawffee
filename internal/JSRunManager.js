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
 * Unloads a commands at a given path
 * @param {string} path 
 */
function unloadCommand(path) {
    console.log(`- ${path}`);
}

let workingDirectory = process.cwd();
/**
 * Loads the commands at a given path
 * @param {string} path 
 * @param {string} str 
 */
function loadCommand(path, str) {
    const fullPath = join(workingDirectory, path);
    console.log(`+ ${path}`);
    try {
        runAsFile(fullPath, str, true);
    } catch(err) {
        console.error(err);
        console.log(`- ${path}`);
    }
}

/**
 * Recursively loads and reloads commands in the given folder
 * @param {string} folder folder to load commands from
 */
function runCommands(folder) {
    commandFolders.push(folder);
    hookToFolder(folder, (type, path, stats) => {
        if(type == 'unlink') {
            unloadCommand(path);
            return;
        }
        fs.readFile(path, (err, data) => {
            unloadCommand(path);
            if(err) {
                console.warn(err);
                return;
            }
            loadCommand(path, data.toString());
        });
    });
}

module.exports = {
    runCommands
}