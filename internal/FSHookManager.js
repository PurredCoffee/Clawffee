const chokidar = require('chokidar');

/**
 * @typedef {"all" | "ready" | "add" | "change" | "addDir" | "unlink" | "unlinkDir" | "raw" | "error"} EventName
 */
/**
 * Run a callback whenever a file is updated in a folder (or subfolder)
 * @param {string[]} folder 
 * @param {(event: EventName, path: string, stats?: Stats | undefined)} fileUpdateCallback 
 */
function hookToFolder(folder, fileUpdateCallback) {
    chokidar.watch(folder).on('all', (event, path, stat) => {
        if(event == 'unlink') {
            fileUpdateCallback(event, path, null);
        } else if(stat.isFile() && path.endsWith('.js')) {
            fileUpdateCallback(event, path, stat);
        } 
    });
}
module.exports = {
    hookToFolder
}