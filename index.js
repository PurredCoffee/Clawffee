const path = require('path');
require('./internal/server');

/* ----------------------------- ERROR HANDLING ----------------------------- */

let longestName = 28;
console.deepError = function(err) {
    let stack = err.stack?.match(/[^\/\\]*.js:\d*(?=:)/g) ?? [];
    if (stack?.[0]) {
        longestName = Math.max(longestName, stack[0].length + 4);
        olderr(stack[0].padEnd(longestName, " ") + " |", err);
    } else {
        olderr("@internal".padEnd(longestName, " ") + " |", err);
    }
    sharedServerData.internal.error = err.stack;
}
process.on('uncaughtException', console.deepError);

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