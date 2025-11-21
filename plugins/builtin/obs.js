const { autoSavedJSON } = require('./files');

const { codeBinder: { associateFunctionWithFile } } = require("../internal/internal");

const confPath = 'config/internal/';
const conf = autoSavedJSON(confPath + 'obs.json', {
    "url": "ws://127.0.0.1:4455",
    "password": ""
});

const { OBSWebSocket } = require('obs-kiss');

/**
 * @type { OBSWebSocket }
 */
let client = new OBSWebSocket();
async function create() {
    try {
        await client.connect(conf.url, conf.password);
    } catch (e) {
        return;
    }
    console.log("Connected to OBS!");
    connected = true;
}
client.onClose(() => {
    console.warn("Disconnected from OBS!");
});
let originalListener = client.onEvent;
client.onEvent = (type, callback) => {
    const listener = originalListener(type, callback);
    associateFunctionWithFile(listener.off.bind(listener));
    return listener;
}
create();

setInterval(async () => {
    if (!client.connected) {
        try {
            client.disconnect();
        } catch(e) {}
        await create();
    }
}, 5000);
console.info("TEMPORARILY: Edit config/internal/obs.json to connect to OBS!!");

module.exports = client;