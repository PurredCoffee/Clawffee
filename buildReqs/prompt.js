const readline = require('readline');
const Writable = require('stream').Writable;

var mutableStdout = new Writable({
    write: function (chunk, encoding, callback) {
        if (!this.muted)
            process.stdout.write(chunk, encoding);
        callback();
    }
});
var rl = readline.createInterface({
    input: process.stdin,
    output: mutableStdout,
    terminal: true
});
function promptClear(message) {
    mutableStdout.muted = false;
    return new Promise(resolve => {
        rl.question(message + ": ", resolve);
    });
}

function promptPassword(message) {
    mutableStdout.muted = false;
    return new Promise(resolve => {
        rl.question(message + ": ", resolve);
        mutableStdout.muted = true;
    });
}

module.exports = {
    promptClear,
    promptPassword
}