const fs = require('fs');
const crypto = require('crypto');
const path = require('path');
const ini = require('ini');

const machineHash = crypto.createHash('md5').update(require("os").hostname()).digest('binary');

/**
 * Encrypts data and saves it to a file.
 * @param {string} filePath - The file path to save the encrypted data.
 * @param {string} filePath - The data to encrypt.
 * @returns {void}
 */
function encryptData(filePath, data) {
    const iv = Buffer.alloc(16, 0); // 16 bytes of zeros
    const key = crypto.scryptSync(machineHash, 'salt', 32);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Save the encrypted code and IV
    let encryptedData = "DO NOT SHARE THIS FILE EVER!" + "\n".repeat(400) + encrypted;

    if(!fs.existsSync(path.dirname(filePath)))
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, encryptedData);
}

/**
 * Decrypts data from a file.
 * @param {string} path - The file path to read and decrypt data from.
 * @returns {string|null} The decrypted data, or null if decryption fails.
 */
function decryptData(filePath) {
    if (!fs.existsSync(filePath)) {
        return null;
    }

    try {
        const encryptedData = fs.readFileSync(filePath).toString().split("\n");
        const encrypted = encryptedData[encryptedData.length - 1].trim();

        const iv = Buffer.alloc(16, 0); // 16 bytes of zeros
        const key = crypto.scryptSync(machineHash, 'salt', 32);
        const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
        let decrypted = decipher.update(encrypted.toString(), 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    } catch (e) {
        console.error(e);
        return null;
    }
}

/**
 * 
 * @param {string} filePath 
 * @param {string} fallback 
 * @param {{encoding: string|undefined, flag: string|undefined}} options 
 * @returns {string}
 */
function readFileSyncDefault(filePath, fallback = "", options = {}) {
    if(!fallback) {
        fallback = "";
    }
    if (fs.existsSync(filePath)) {
        return fs.readFileSync(filePath, options).toString();
    }
    fs.mkdir(path.dirname(filePath), { recursive: true }, (err) => {
        if (err) {
            console.error(err);
            return;
        }
        fs.writeFileSync(filePath, fallback);
    });
    return fallback;
}

/**
 * Asynchronously read a file or create it with the given fallback if it doesnt exist
 * @param {string} filePath 
 * @param {string} fallback 
 * @param {{encoding: string|undefined, flag: string|undefined}} options 
 * @param {(err: NodeJS.ErrnoException | null, data: NonSharedBuffer) => void} callback
 * @returns {void}
 */
function readFileDefault(filePath, fallback, options, callback) {
    if (fs.existsSync(filePath)) {
        return fs.readFile(filePath, options, callback);
    }
    fs.mkdir(path.dirname(filePath), { recursive: true }, (err) => {
        if (err) {
            console.error(err);
            return;
        }
        fs.writeFileSync(filePath, fallback);
    });
    callback(null, fallback);
}

function stringifyJSON(obj) {
    // if the object has getters, we need to convert them to regular properties
    return JSON.stringify(obj, (key, value) => {
        if (Array.isArray(value)) return value;
        if (typeof value === 'object' && value !== null) {
            const newObj = {};
            for (const k in value) {
                newObj[k] = value[k];
            }
            return newObj;
        }
        return value;
    }, 4);
}

/**
 * @type {Map<string, WeakRef<object>>}
 */
const openJSONFiles = new Map();

const cachedProxies = new WeakMap();


/**
 * @template {string} T
 * @param {T} filePath 
 * @param {*} fallback 
 * @param {*} options 
 * @returns {require(T)}
 */
function autoSavedJSON(filePath, fallback, options) {
    if(openJSONFiles.has(filePath)) {
        const ref = openJSONFiles.get(filePath);
        const obj = ref.deref();
        if(obj) {
            return obj;
        }
    }
    console.debug('reading', filePath);
    let data = fallback ?? {};
    try {
        data = JSON.parse(readFileSyncDefault(filePath, stringifyJSON(data), options));
    } catch (e) {
        fs.writeFile(filePath, stringifyJSON(data), options, (err) => {
            if (err) console.error(err);
        });
    }
    let timeout = null;
    function createAutoSaveProxy(obj) {
        if(cachedProxies.has(obj)) {
            return cachedProxies.get(obj);
        }
        const proxy = new Proxy(obj, {
            set(target, prop, value) {
                target[prop] = value;
                clearTimeout(timeout);
                timeout = setTimeout(() => {
                    fs.writeFileSync(filePath, stringifyJSON(data, null, 4), options);
                }, 500);
                return true;
            },
            deleteProperty(target, prop) {
                delete target[prop];
                clearTimeout(timeout);
                timeout = setTimeout(() => {
                    fs.writeFileSync(filePath, stringifyJSON(data, null, 4), options);
                }, 500);
                return true;
            },
            get(target, prop, receiver) {
                const val = Reflect.get(target, prop, receiver);
                if (val && typeof val === 'object') {
                    return createAutoSaveProxy(val);
                }
                return val;
            }
        });
        cachedProxies.set(obj, proxy);
        cachedProxies.set(proxy, proxy);
        return proxy;
    }
    const proxied = createAutoSaveProxy(data);
    openJSONFiles.set(filePath, new WeakRef(proxied));
    return proxied;
}

globalThis.clawffeeInternals.fileManagers['.json'] = {
    onRequire(fullpath, data) {
        return autoSavedJSON(fullpath, {}, null);
    }
}

/**
 * @type {Map<string, WeakRef<object>>}
 */
const openINIFiles = new Map();

function autoSavedINI(filePath, fallback, options) {
    if(openINIFiles.has(filePath)) {
        const ref = openINIFiles.get(filePath);
        const obj = ref.deref();
        if(obj) {
            return obj;
        }
    }
    let data = fallback;
    try {
        data = ini.parse(readFileSyncDefault(filePath, ini.stringify(data), options).toString());
    } catch (e) {
        fs.writeFile(filePath, ini.stringify(data), options, (err) => {
            if (err) console.error(err);
        });
    }
    let timeout = null;
    function createAutoSaveProxy(obj) {
        if(cachedProxies.has(obj)) {
            return cachedProxies.get(obj);
        }
        const proxy = new Proxy(obj, {
            set(target, prop, value) {
                target[prop] = value;
                clearTimeout(timeout);
                timeout = setTimeout(() => {
                    fs.writeFileSync(filePath, ini.stringify(data), options);
                }, 500);
                return true;
            },
            deleteProperty(target, prop) {
                delete target[prop];
                clearTimeout(timeout);
                timeout = setTimeout(() => {
                    fs.writeFileSync(filePath, ini.stringify(data), options);
                }, 500);
                return true;
            },
            get(target, prop, receiver) {
                const val = Reflect.get(target, prop, receiver);
                if (val && typeof val === 'object') {
                    return createAutoSaveProxy(val);
                }
                return val;
            }
        });
        cachedProxies.set(obj, proxy);
        cachedProxies.set(proxy, proxy);
        return proxy;
    }
    const proxied = createAutoSaveProxy(data);
    openINIFiles.set(filePath, new WeakRef(proxied));
    return proxied;
}

module.exports = {
    autoSavedJSON,
    autoSavedINI,
    readFileSyncDefault,
    readFileDefault,
    encryptData,
    decryptData,
}