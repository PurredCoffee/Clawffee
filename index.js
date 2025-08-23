const path = require('path');
require('./internal/server');

try {
const worker = new Worker(new URL("./dashboard.js", import.meta.url), {
    smol: true,
});
worker.addEventListener("close", event => {
    process.exit();
});

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
} catch(e) {
    console.error(e);
}