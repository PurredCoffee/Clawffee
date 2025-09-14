const fs = require('node:fs');
const path = require('path');
const { clawCallbacks: { onBlockPlugin } } = require("../plugins_bak/internal/internal");

const unavailablePlugins = {};

function requirePluginsRecursively(dir) {
    fs.readdirSync(dir).forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory() && !file.startsWith("_") && file != "node_modules") {
            requirePluginsRecursively(filePath);
        } else if (stat.isFile() && file.endsWith('.js') && !file.startsWith("_")) {
            try {
                require(filePath);
            } catch(e) {
                console.deepError(e);
            }
        }
    });
}
onBlockPlugin((filename) => {
    unavailablePlugins[filename] = true;
});

module.exports = {
    unavailablePlugins,
    requirePluginsRecursively
}