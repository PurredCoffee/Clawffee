const { requirePluginsRecursively } = require("./internal/pluginLoader")
const { loadedmodules } = require("./internal/commandFSHooks");
const { loadModule } = require("./internal/commandHotReloader");
const path = require('path');
const fs = require('fs');

const pluginsDir = fs.realpathSync('./plugins');

requirePluginsRecursively(pluginsDir + '/builtin');
requirePluginsRecursively(pluginsDir);
// TODO: clean this up
loadModule(loadedmodules);