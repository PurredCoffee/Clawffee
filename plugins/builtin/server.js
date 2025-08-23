function openURL(url) {
    if(process.platform == 'win32') {
        try {
                require('child_process').execFileSync('start', ["",url]);
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