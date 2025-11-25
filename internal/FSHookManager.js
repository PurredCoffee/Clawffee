const chokidar = require('chokidar');
const fs = require('fs');
const path = require('path')

/**
 * @typedef {"all" | "ready" | "add" | "change" | "addDir" | "unlink" | "unlinkDir" | "raw" | "error"} EventName
 */
/**
 * Run a callback whenever a file is updated in a folder (or subfolder)
 * @param {string[]} folder 
 * @param {(event: EventName | 'initial', path: string, stats?: fs.Stats | undefined)} fileUpdateCallback 
 */
function hookToFolder(folder, fileUpdateCallback) {
    function readDir(f) {
        fs.readdir(f, (err, files) => {
            if(err) {
                console.warn(err);
                return;
            }
            files.forEach((v) => {
                const p = path.join(f,v);
                const stat = fs.statSync(p);
                if(stat.isFile()) {
                    fileUpdateCallback('initial', p, stat);
                } else if(stat.isDirectory()) {
                    readDir(p);
                }
            });
        })
    }
    readDir(folder);
    chokidar.watch(folder, {ignoreInitial: true}).on('all', (event, path, stat) => {
        if(event == 'unlink') {
            fileUpdateCallback(event, path, null, false);
        } else if(stat.isFile()) {
            fileUpdateCallback(event, path, stat, false);
        } 
    });

}
module.exports = {
    hookToFolder
}