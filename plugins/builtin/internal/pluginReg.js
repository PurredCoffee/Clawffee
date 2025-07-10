const { unavailablePlugins } = require('../../../internal/pluginLoader');
const { reloadDependency } = require('../../../internal/commandHotReloader');

function reloadPlugin(filename) {
    unavailablePlugins[filename] = false;
    reloadDependency(filename);
}
function blockPlugin(filename) {
    unavailablePlugins[filename] = true;
}

module.exports = {
    reloadPlugin,
    blockPlugin
}