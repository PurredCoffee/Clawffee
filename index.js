const path = require('path');
const fs = require('fs');

console.log("\n Clawffee Version 0.2.1");
console.log("-".repeat(33) + "\\");
const pluginsDir = fs.realpathSync('./plugins');

require(path.join(pluginsDir, 'builtin', 'defaultOverrides.js'));
require('./internal/server');

/* -------------------------------- UI THREAD ------------------------------- */

const worker = new Worker(
    require.resolve("./dashboard.js"), 
    {
        smol: true,
    }
);
worker.addEventListener("close", event => {
    console.log("exiting...")
    process.exit();
});

const { requirePluginsRecursively } = require("./internal/pluginLoader")
const { loadedmodules } = require("./internal/commandFSHooks");
const { loadModule } = require("./internal/commandHotReloader");


// Higher priority
requirePluginsRecursively(path.join(pluginsDir, 'internal'));
requirePluginsRecursively(path.join(pluginsDir, 'builtin'));

requirePluginsRecursively(pluginsDir);

loadModule(loadedmodules);