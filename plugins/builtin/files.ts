import fs from 'fs';
import crypto from 'crypto';
import path from 'path';
import ini from 'ini';

const machineHash = crypto.createHash('md5').update(require("os").hostname()).digest('binary');

/**
 * Encrypts data and saves it to a file.
 */
function encryptData(filePath: string, data: string) {
    const iv = Buffer.alloc(16, 0); // 16 bytes of zeros
    const key = crypto.scryptSync(machineHash, 'salt', 32);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Save the encrypted code and IV
    let encryptedData = "DO NOT SHARE THIS FILE EVER!" + "\n".repeat(400) + encrypted;

    if(fs.existsSync(path.dirname(filePath)))
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, encryptedData);
}

/**
 * Decrypts data from a file.
 */
function decryptData(filePath: string) {
    if (!fs.existsSync(filePath)) {
        console.error("file does not exist", filePath)
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
 * Read a file synchronously or create it with a default text
 */
function readFileSyncDefault(
    filePath: string, 
    fallback: string = "", 
    options: {encoding?: null, flag?: string} = {}
): string {
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
 */
function readFileDefault(
    filePath: string, 
    fallback: string, 
    options: {encoding: null|undefined, flag: string|undefined}, 
    callback: (err: NodeJS.ErrnoException | null, data: string) => void
) {
    if (fs.existsSync(filePath)) {
        return fs.readFile(filePath, options, (err, data) => {callback(err, data.toString())});
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

function autoSavedJSON(filePath: string, fallback: object, options: {encoding?: null|undefined, flag?: string|undefined} = {}) {
    let data = fallback;
    try {
        data = JSON.parse(readFileSyncDefault(filePath, JSON.stringify(data), options));
    } catch (e) {
        fs.writeFile(filePath, JSON.stringify(data), options, (err) => {
            if (err) console.error(err);
        });
    }
    let timeout: NodeJS.Timeout | null = null;
    function createAutoSaveProxy(obj) {
        return new Proxy(obj, {
            set(target, prop, value) {
                target[prop] = value;
                timeout?.close();
                timeout = setTimeout(() => {
                    fs.writeFileSync(filePath, JSON.stringify(data, null, 4), options);
                }, 500);
                return true;
            },
            deleteProperty(target, prop) {
                delete target[prop];
                timeout?.close();
                timeout = setTimeout(() => {
                    fs.writeFileSync(filePath, JSON.stringify(data, null, 4), options);
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
    }
    return createAutoSaveProxy(data);
}

function autoSavedINI(filePath: string, fallback: object, options: {encoding?: null|undefined, flag?: string|undefined} = {}) {
    let data = fallback;
    try {
        data = ini.parse(readFileSyncDefault(filePath, ini.stringify(data), options).toString());
    } catch (e) {
        fs.writeFile(filePath, ini.stringify(data), options, (err) => {
            if (err) console.error(err);
        });
    }
    let timeout: NodeJS.Timeout | null = null;
    function createAutoSaveProxy(obj) {
        return new Proxy(obj, {
            set(target, prop, value) {
                target[prop] = value;
                timeout?.close();
                timeout = setTimeout(() => {
                    fs.writeFileSync(filePath, ini.stringify(data), options);
                }, 500);
                return true;
            },
            deleteProperty(target, prop) {
                delete target[prop];
                timeout?.close();
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
    }
    return createAutoSaveProxy(data);
}

export {
    autoSavedJSON,
    autoSavedINI,
    readFileSyncDefault,
    readFileDefault,
    encryptData,
    decryptData,
}