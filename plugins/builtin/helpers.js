const files = require('./files');
const server = require('./server');
const subscribable = require('./subscribable');
const twitch = require('./twitch');
const twitch_data = require('./twitch_data');
const obs = require('./obs');
const unfailable = require('./unfailable');

clawffeeInternals.defaultFile = "const { files, server, twitch, twitch_data, obs, unfailable } = require('#helpers');\n" + clawffeeInternals.defaultFile;

module.exports = {
    files,
    server,
    subscribable,
    twitch,
    obs,
    unfailable
}