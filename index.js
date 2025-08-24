const path = require('path');
require('./internal/server');

if(process.platform == 'win32') { // windows lacks support for bundled worker files
    const worker = new Worker("./plugins/internal/_dashboard/dashboard.js", {
        smol: true,
    });
    worker.addEventListener("close", event => {
        console.log("exiting...")
        process.exit();
    });
} else {
    const worker = new Worker(new URL("./dashboard.js", import.meta.url).href, {
        smol: true,
    });
    worker.addEventListener("close", event => {
        console.log("exiting...")
        process.exit();
    });
}

console.log("\n Clawffee Version 0.2.1");
console.log("-".repeat(48));
const { requirePluginsRecursively } = require("./internal/pluginLoader")
const { loadedmodules } = require("./internal/commandFSHooks");
const { loadModule } = require("./internal/commandHotReloader");
const fs = require('fs');

const pluginsDir = fs.realpathSync('./plugins');


// Higher priority
requirePluginsRecursively(path.join(pluginsDir + '/internal'));
requirePluginsRecursively(path.join(pluginsDir + '/builtin'));

requirePluginsRecursively(pluginsDir);

loadModule(loadedmodules);