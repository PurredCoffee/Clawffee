function reloadPlugin(filename) {
    setTimeout(() => require('../../../internal/commandHotReloader').reloadDependency(filename), 1);
}

module.exports = {
    reloadPlugin
}