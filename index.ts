import { requirePluginsRecursively } from "./internal/pluginLoader";
import { loadedmodules } from "./internal/commandFSHooks";
import { loadModule } from "./internal/commandHotReloader";
import { resolve } from "path";
const pluginsDir = resolve(__dirname, './plugins');

requirePluginsRecursively(pluginsDir + '/builtin');
requirePluginsRecursively(pluginsDir);
// TODO: clean this up
loadModule(loadedmodules);