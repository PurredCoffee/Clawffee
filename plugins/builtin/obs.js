const obs = require('obs-websocket-js');
const { autoSavedJSON } = require('./files');
const { associateObjectWithFile } = require('./internal/codeBinder');
const { createUnfailable } = require('./unfailable');
const { reloadPlugin } = require('./internal/pluginReg');

const confPath = 'config/internal/';
const conf = autoSavedJSON(confPath + 'obs.json', {
    "url": "ws://127.0.0.1:4455",
    "password": ""
});

/**
 * @type { obs.OBSWebSocket }
 */
let connected = true;
let client = createUnfailable();
async function create() {
    let nclient;
    try {
        nclient = new obs.OBSWebSocket();
        await nclient.connect(conf.url, conf.password);
    } catch (e) {
        return;
    }
    console.log("Connected to OBS!");
    connected = true;

    let originalListener = nclient.addListener;
    nclient.addListener = (type, callback, context) => {
        associateObjectWithFile({
            callback: callback,
            type: type,
            disconnect: () => {
                nclient.removeListener(this.type, this.callback, context, false)
            }
        }, "disconnect");
        return originalListener(type, callback, context);
    }
    let originalOn = nclient.on;
    nclient.on = (type, callback, context) => {
        associateObjectWithFile({
            callback: callback,
            type: type,
            disconnect: () => {
                nclient.off(this.type, this.callback, context, false)
            }
        }, "disconnect");
        return originalOn(type, callback, context);
    }
    let originalOnce = nclient.once;
    nclient.once = (type, callback, context) => {
        associateObjectWithFile({
            callback: callback,
            type: type,
            disconnect: () => {
                nclient.off(this.type, this.callback, context, true)
            }
        }, "disconnect");
        return originalOnce(type, callback, context);
    }
    client = nclient;
    reloadPlugin(__filename);
}
create();

setInterval(async () => {
    if (client.__katz__unfailable || (client?.socket?.readyState ?? 0) !== 1) {
        if(connected) {
            console.warn("Disconnected from OBS!");
        }
        connected = false;
        await create();
    }
}, 5000);

module.exports = {
    client
}