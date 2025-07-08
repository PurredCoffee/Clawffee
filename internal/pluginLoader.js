const fs = require('node:fs');
const path = require('path');

const pluginsDir = path.resolve(__dirname, '../plugins');

const unavailablePlugins = {};

function requirePluginsRecursively(dir) {
    fs.readdirSync(dir).forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            requirePluginsRecursively(filePath);
        } else if (stat.isFile() && file.endsWith('.js')) {
            require(filePath);
        }
    });
}

requirePluginsRecursively(pluginsDir + '/builtin');
requirePluginsRecursively(pluginsDir);

module.exports = {
    unavailablePlugins
}