const { autoSavedJSON } = require('./files');
const { enums, createRequestObj, eventParams, requestParams, requestResponse } = require('./obs-codegen');

const { codeBinder: { associateObjectWithFile }, clawCallbacks: { reloadPlugin } } = require("../internal/internal");

const { createUnfailable } = require('./unfailable');

const confPath = 'config/internal/';
const conf = autoSavedJSON(confPath + 'obs.json', {
    "url": "ws://127.0.0.1:4455",
    "password": ""
});


/**
 * @import codegen from './obs-codegen'
 */

const supportedVersions = [1];

class OBSCommandPromise extends Promise {
    constructor(executor) {
        const id = Bun.randomUUIDv7();
        super((resolve, reject) => {
            return executor(id, resolve, reject);
        });
        this.obs_command_id = id;
    }
}

class OBSWebSocket {
    /**
     * 
     * @param {string} url 
     * @param {{eventSubscriptions?: number}} config 
     */
    constructor(config) {
        this.config = {...{ eventSubscriptions: undefined }, ...config};
        this.ws = null;
        this.connected = false;
        this.obsWebSocketVersion = null;
        this.obsStudioVersion = null;
        this.negotiatedRpcVersion = null;
        this.negotiatedRpcVersion = null;
        this.preferedVersion = null;
        this.internal = {
            p: this,
            eventListeners: {},
            closeListeners: [],
            openRequests: {},
            unsentCommands: null,
            setup() {
                this.p.ws.onmessage = (ev) => {
                    const data = JSON.parse(ev.data);
                    switch(data.op) {
                        case 5:
                            if(this.eventListeners[data.d.eventType]) {
                                let args = [];
                                eventParams[data.d.eventType].forEach((v) => {
                                    args.push(data.d.eventData[v]);
                                });
                                this.eventListeners[data.d.eventType].forEach((e) => {
                                    e.cb(...args);
                                });
                            }
                            break;
                        case 7:
                            if(this.openRequests[data.d.requestId]) {
                                let cb = this.openRequests[data.d.requestId];
                                delete this.openRequests[data.d.requestId];
                                cb(data.d.requestStatus, data.d.responseData);
                            }
                            break;
                        case 9:
                            if(this.openRequests[data.d.requestId]) {
                                let cb = this.openRequests[data.d.requestId];
                                delete this.openRequests[data.d.requestId];
                                cb(data.d.results);
                            }
                            break;
                    }
                }
                this.p.ws.onclose = (ev) => {
                    this.closeListeners.forEach((cb) => {
                        cb.cb(enums.webSocketCloseCodeDocs[ev.code], ev.code);
                    })
                }
            },
            sendRequest: function (type, data) {
                const prom = new OBSCommandPromise((id, resolve) => {
                    this.openRequests[id] = (response, data) => {
                        if(!response.result)
                            throw new Error(`OBS Error received during ${type} request: ${enums.requestStatusDocs[response.code.toString()]}${response.comment?' comment: ' + response.comment:''}`);
                        resolve(data)
                    }
                });

                if(!this.unsentCommands) {
                    process.nextTick(() => {
                        for (const id in this.unsentCommands) {
                            if (!Object.hasOwn(this.unsentCommands, id)) continue;
                            const command = this.unsentCommands[id];
                            this.p.ws.send(JSON.stringify(command));
                        }
                        this.unsentCommands = null;
                    });
                }

                this.unsentCommands = this.unsentCommands ?? {};
                this.unsentCommands[prom.obs_command_id] = {
                    d: {requestType: type, requestId: prom.obs_command_id, requestData: data}, op: 6
                };
                return prom;
            }
        }
        /**
         * @type {codegen.RequestsObject}
         */
        this.requests = createRequestObj((type) => {
            return (...args) => {
                const params = {};
                requestParams[type].forEach((p) => {
                    if(typeof p == 'string' && p.endsWith('Identifier')) {
                        let arg = args.shift();
                        if(arg.test(/^[0-9a-f]{8}(?:\-[0-9a-f]{4}){3}-[0-9a-f]{12}$/)) {
                            params[''.substring(0,p.length - 10) + 'Uuid'] = arg;
                        } else {
                            params[''.substring(0,p.length - 10) + 'Name'] = arg;
                        }
                        return;
                    }
                    params[p] = args.shift();
                });
                return this.internal.sendRequest(type, params);
            }
        });
    };

    /**
     * 
     * @param {string} password 
     * @returns {Promise<this>} returns self
     */
    connect(url, password = undefined) {
        return new Promise((resolve, reject) => {
            if(this.ws) {
                try {
                    this.ws.close();
                } catch(e) {};
            }
            this.ws = new WebSocket(url);
            this.ws.onmessage = (ev) => {
                const data = JSON.parse(ev.data);
                switch(data.op) {
                    case enums.webSocketOpCode.hello:
                        this.obsWebSocketVersion = data.d.obsWebSocketVersion;
                        this.obsStudioVersion = data.d.obsStudioVersion;
                        this.preferedVersion = supportedVersions.find((a) => a = data.d.rpcVersion);
                        if(!this.preferedVersion) {
                            obs_ws.close();
                            throw new Error(`Could not agree to Rpc Version ${data.d.rpcVersion} (supported ${supportedVersions})`);
                        }
                        const response = {
                            "rpcVersion": this.preferedVersion
                        };
                        if(this.config.eventSubscriptions)
                            response.eventSubscriptions = this.config.eventSubscriptions;
                        if(data.d.authentication) {
                            if(!password) {
                                this.ws.close();
                                throw new Error("no password provided but required by the OBS Server.");
                            }
                            const concat = password + data.d.authentication.salt;
                            const base64secret = new Bun.SHA256().update(concat).digest('base64');
                            const challenge = base64secret + data.d.authentication.challenge;
                            response.authentication = new Bun.SHA256().update(challenge).digest('base64');
                        }
                        this.ws.send(JSON.stringify({
                            d: response, op: enums.webSocketOpCode.identify
                        }));
                        break;
                    case enums.webSocketOpCode.identified:
                        this.negotiatedRpcVersion = data.d.negotiatedRpcVersion;
                        this.connected = true;
                        this.internal.setup();
                        resolve(this);
                        break;
                }
            }
        });
    };

    disconnect() {
        this.connected = false;
        this.ws.close();
    }

    /**
     * 
     * @template T
     * @param {Array<Promise<T>>} commandArray 
     * @param {keyof typeof codegen.enums.requestBatchExecutionType} executionType 
     * @param {boolean} haltOnFailure 
     * @returns {Promise<Array<T>>} 
     */
    runBatch(commandArray, executionType='serialRealtime', haltOnFailure=false) {
        if(!this.internal.unsentCommands) {
            throw Error('No commands have been registered yet!');
        }
        if(!Array.isArray(commandArray)) {
            throw TypeError('Value commandArray is not of type Array');
        }
        commandArray.forEach((com, i) => {
            if(!com.obs_command_id) {
                throw TypeError(`Array commandArray includes non command at pos ${i}`);
            }
            if(!this.internal.unsentCommands[com.obs_command_id]) {
                throw TypeError(`Array commandArray has a command that has already been sent at pos ${i}`);
            }
        });
        if(enums.requestBatchExecutionType[executionType] === undefined) {
            throw TypeError(`executionType ${executionType} doesnt exist`);
        }
        const commands = [];
        const callbacks = [];
        commandArray.forEach(com => {
            let command = this.internal.unsentCommands[com.obs_command_id].d;
            delete command.requestId;
            commands.push(command);
            callbacks.push(this.internal.openRequests[com.obs_command_id]);
            delete this.internal.unsentCommands[com.obs_command_id];
            delete this.internal.openRequests[com.obs_command_id];
        });
        const new_id = Bun.randomUUIDv7();
        this.internal.unsentCommands[new_id] = {
            d: { 
                requestId: new_id,
                requests: commands,
                executionType: parseInt(enums.requestBatchExecutionType[executionType]),
                haltOnFailure: haltOnFailure
            }, op: 8
        };
        const prom = new Promise(resolve => {
            this.internal.openRequests[new_id] = (data) => {
                data.forEach((d, i) => {
                    callbacks[i](d.requestStatus, d.responseData);
                });
                resolve(data)
            }
        });
        return prom;
    }

    /**
     * 
     * @template {keyof codegen.AllEvents} T
     * @param {T} type
     * @param {codegen.AllEvents[T]} callback
     */
    onEvent(type, callback) {
        if(!eventParams[type]) {
            throw TypeError(`Event type '${type}' does not exist`)
        }
        this.internal.eventListeners[type] = this.internal.eventListeners[type] ?? [];
        const handler = {
            cb: callback,
            parent: this,
            is_enabled: false,
            uuid: Bun.randomUUIDv7(),
            type: type,
            off() {
                this.parent.offEvent(handler);
                this.is_enabled = false;
            },
            on() {
                if(this.is_enabled) return;
                this.is_enabled = true;
                this.parent.internal.eventListeners[type].push(handler);
            }
        }
        handler.disconnect = handler.off;
        handler.disable = handler.off;
        handler.connect = handler.on;
        handler.enable = handler.on;
        handler.on();
        return handler;
    }
    
    offEvent(handler) {
        if(this.internaldisconnect.eventListeners[handler.type]) {
            this.internal.disconnecteventListeners[handler.type] = this.internal.eventListeners[handler.type].filter(a => a.uuid != handler.uuid)
            handler.is_enabled = false;
        }
    }

    onClose(callback) {
        const handler = {
            cb: callback,
            parent: this,
            is_enabled: false,
            uuid: Bun.randomUUIDv7(),
            off() {
                this.parent.offClose(handler);
                this.is_enabled = false;
            },
            on() {
                if(this.is_enabled) return;
                this.is_enabled = true;
                this.parent.internal.closeListeners.push(handler);
            }
        }
        handler.disconnect = handler.off;
        handler.disable = handler.off;
        handler.connect = handler.on;
        handler.enable = handler.on;
        handler.on();
        return handler;
    }

    offClose(handler) {
        this.internal.closeListeners = this.internal.closeListeners.filter(a => a.uuid != handler.uuid)
        handler.is_enabled = false;
    }
}


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

    reloadPlugin(__filename);
}
client.onClose(() => {
    console.warn("Disconnected from OBS!");
});
let originalListener = client.onEvent;
client.onEvent = (type, callback) => {
    return associateObjectWithFile(originalListener(type, callback), "disconnect");
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

module.exports = client;