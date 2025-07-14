const dependencyInstaller = require('./internal/dependencyInstaller');

const worker = new Worker('./test.js');

worker.onmessage = (ev) => {
    if(ev.data === 'exit') {
        process.exit();
    }
}

dependencyInstaller.downloadDependencies('./plugins').then(() => {
    console.log("\n Clawffee Version 0.2.1");
    console.log("-".repeat(48));
    const { requirePluginsRecursively } = require("./internal/pluginLoader")
    const { loadedmodules } = require("./internal/commandFSHooks");
    const { loadModule } = require("./internal/commandHotReloader");
    const path = require('path');
    const fs = require('fs');

    const pluginsDir = fs.realpathSync('./plugins');


    // Higher priority
    requirePluginsRecursively(path.join(pluginsDir + '/internal'));
    requirePluginsRecursively(path.join(pluginsDir + '/builtin'));

    requirePluginsRecursively(pluginsDir);

    loadModule(loadedmodules);
}).catch(() => {});