const fs = require('fs');
const path = require('path');
/**
 * parses a path and returns all dependencies of the file relative to the current project
 * @param {string} absPath 
 * @param {Set} requiredFiles
 * @returns {Array[string]} all dependencies
 */
function parseRequirements(absPath, requiredFiles = new Set()) {
    if (!fs.statSync(absPath).isFile())
        return [];
    var contents = fs.readFileSync(absPath).toString();
    var re = /(?<=require\((?:'|"))(?:\.|#).*?(?=(?:'|")\))/g;

    let matches = contents.matchAll(re);
    for (const match of matches) {
        let reqPath = match[0];
        let resolvedPath;
        try {
            if (reqPath.startsWith(".")) {
                resolvedPath = require.resolve(path.join(path.dirname(absPath), reqPath));
            } else if (reqPath.startsWith("#")) {
                resolvedPath = require.resolve(reqPath);
            } else {
                continue;
            }
            if (!requiredFiles.has(resolvedPath)) {
                requiredFiles.add(resolvedPath);
                parseRequirements(resolvedPath, requiredFiles);
            }
        } catch (e) {
            // ignore resolution errors
        }
    }
    return Array.from(requiredFiles.keys());
}

module.exports = {
    parseRequirements
}