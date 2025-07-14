function openURL(url) {
    var start = (process.platform == 'darwin'? 'open': process.platform == 'win32'? 'start': 'xdg-open');
    require('child_process').execFileSync(start, [url]);
}

const { server: { setFunction, sharedServerData } } = require('../internal/internal');

module.exports = {
    setFunction,
    sharedServerData,
    openURL
}