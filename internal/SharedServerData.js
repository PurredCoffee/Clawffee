const { createServer } = require('./Subscribable.js');
clawffeeInternals.sharedServerData = createServer({internal: {}});

module.exports = {
    sharedServerData: clawffeeInternals.sharedServerData
}