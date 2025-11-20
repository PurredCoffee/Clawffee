const files = require('./files');
const server = require('./server');
const subscribable = require('./subscribable');
const twitch = require('./twitch');
const twitch_data = require('./twitch_data');
const obs = require('./obs');
const persistent = require('./persistent');

clawffeeInternals.defaultFile = "const { files, server, twitch, twitch_data, obs, persistent } = require('#helpers');\n" + clawffeeInternals.defaultFile;

module.exports = {
    files,
    server,
    subscribable,
    twitch,
    obs,
    twitch_data,
    persistent
}