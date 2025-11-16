function openURL(url) {
    url = encodeURI(url)
    if(process.platform == 'win32') {
        try {
            // windows does not want to be safe so we run unsafe commands here
            proc = require('child_process').exec(`start "" "${url}"`)
        } catch(e) {
            // ignore the error since explorer always returns 1
        }
    } else if(process.platform == 'darwin') {
        require('child_process').execFileSync('open', [url]);
    } else {
        require('child_process').execFileSync('xdg-open', [url]);
    }
}

const { server: { setFunction, sharedServerData } } = require('../internal/internal');

module.exports = {
    setFunction,
    sharedServerData,
    openURL
}