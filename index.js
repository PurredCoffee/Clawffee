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