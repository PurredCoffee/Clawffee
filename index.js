const path = require('path');
const fs = require('fs');

console.log("\n Clawffee Version 0.2.5 🐾");
console.log("╴".repeat(32) + "╮");
const pluginsDir = fs.realpathSync('./plugins');

require('./internal/defaultOverrides');
require('./internal/server');


const { requirePluginsRecursively } = require("./internal/pluginLoader")
const { loadedmodules } = require("./internal/commandFSHooks");
const { loadModule } = require("./internal/commandHotReloader");

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

// Higher priority
requirePluginsRecursively(path.join(pluginsDir, 'internal'));
requirePluginsRecursively(path.join(pluginsDir, 'builtin'));

requirePluginsRecursively(pluginsDir);

loadModule(loadedmodules);