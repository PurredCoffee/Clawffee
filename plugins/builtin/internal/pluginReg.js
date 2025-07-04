function reloadPlugin(filename) {
    setTimeout(() => {
        require('../../../internal/pluginLoader').unavailablePlugins[filename] = false;
        require('../../../internal/commandHotReloader').reloadDependency(filename)
    }, 1);
}
function blockPlugin(filename) {
    setTimeout(() => require('../../../internal/pluginLoader').unavailablePlugins[filename] = true, 1);
}

module.exports = {
    reloadPlugin,
    blockPlugin
}