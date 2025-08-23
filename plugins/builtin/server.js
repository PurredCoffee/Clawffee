function openURL(url) {
    url = encodeURI(url)
    console.log(url)
    console.log(process.platform)
    if(process.platform == 'win32') {
        try {
            // windows does not want to be safe so we run unsafe commands here
            proc = require('child_process').exec(`start "" "${url}"`)
        } catch(e) {
            // ignore the error since explorer always returns 1
        }
    } else if([process.platform == 'darwin']) {
        require('child_process').execFileSync('open', [url]);
    }
}

const { server: { setFunction, sharedServerData } } = require('../internal/internal');

module.exports = {
    setFunction,
    sharedServerData,
    openURL
}