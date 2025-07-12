const fs = require('node:fs');
const path = require('path');
const { onBlockPlugin } = require(fs.realpathSync("./plugins/builtin/internal/ClawCallbacks.ts"));

const unavailablePlugins = {};

function requirePluginsRecursively(dir) {
    fs.readdirSync(dir).forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            requirePluginsRecursively(filePath);
        } else if (stat.isFile() && (file.endsWith('.js') || file.endsWith('.ts'))) {
            require(filePath);
        }
    });
}
onBlockPlugin((filename) => {
    unavailablePlugins[filename] = true;
});

export {
    unavailablePlugins,
    requirePluginsRecursively
}