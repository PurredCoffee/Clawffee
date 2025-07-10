const { requirePluginsRecursively } = require("./internal/pluginLoader")
const { loadedmodules } = require("./internal/commandFSHooks");
const { loadModule } = require("./internal/commandHotReloader");
const path = require('path');
const pluginsDir = path.resolve(__dirname, './plugins');

requirePluginsRecursively(pluginsDir + '/builtin');
requirePluginsRecursively(pluginsDir);
// TODO: clean this up
loadModule(loadedmodules);