function openURL(url) {
    try {
        var start = (process.platform == 'darwin'? 'open': process.platform == 'win32'? 'explorer': 'xdg-open');
        require('child_process').execFileSync(start, [url]);
    } catch(e) {
        // ignore the error since explorer always returns 1
    }
}

const { server: { setFunction, sharedServerData } } = require('../internal/internal');

module.exports = {
    setFunction,
    sharedServerData,
    openURL
}