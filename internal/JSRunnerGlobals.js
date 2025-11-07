

/**
 * @typedef fileInfo
 * @prop {Set<string>} variables
 * @prop {Set<string>} functions
 * @prop {Set<any>} insertions
 * @prop {number[]} newLines
 */
module.exports = {
    /**
     * @type {Map<string, fileInfo>}
     */
    fileInfo: new Map(),
    functionNames: new Map(),
    functionFileNames: new Map(),
    functionOverrides: new Map(),
    /**
     * @type {Map<string, Set<string>>}
     */
    requiredFiles: new Map(),
    commandFolders: []
};