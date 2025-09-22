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

/**
 * Unloads a commands at a given path
 * @param {string} path 
 */
function unloadCommand(path) {
    console.log(`- ${path}`);
}

/**
 * Loads the commands at a given path
 * @param {string} path 
 * @param {string} str 
 */
function loadCommand(path, str) {
    console.log(`+ ${path}`);
    console.log(str);
}

/**
 * Recursively loads and reloads commands in the given folder
 * @param {string} folder folder to load commands from
 */
function runCommands(folder) {
    hookToFolder(folder, (type, path, stats) => {
        if(type == 'unlink') {2
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