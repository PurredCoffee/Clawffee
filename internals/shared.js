//@ts-check
/**
 * @import {  InternalData, ModuleV1, PluginV1 } from '../plugins/internal/_clawffee/internal/Globals/launcher'
 */
const path = require('path');
const crypto = require('crypto');
const { IncomingMessage } = require('http');
const fs = require('fs');
const { logLevels, parseOptions } = require('./options.mjs')

const { args, options, environment } = parseOptions();
const { resolvePath, helpfulError } = environment;

/**
 * @param {...string} pathInPlugin
 * @returns {string}
 */
const resolveInternalPluginPath = (...pathInPlugin) => {
    return path.join(fs.realpathSync(resolvePath()), 'plugins', 'internal', ...pathInPlugin);
}

const getVerInfoSafe = () => {
    try {
        const verInfo = JSON.parse(fs.readFileSync(resolveInternalPluginPath('version.json'), { encoding: "utf-8" }));
        if(!verInfo.hash || !verInfo.version) throw helpfulError("The verInfo JSON does not contain a valid 'hash' nor a valid 'version'.");
        return verInfo;
    } catch(e) {
        if (options.verbose >= logLevels["trace"]) {
            console.log(e);
        }
        return null;
    };
}

const meta = require('./meta.json');
/**
 * 
 * @param {Buffer<ArrayBuffer>} encHash 
 * @param {string} pubKey 
 * @returns 
 */
function getPubHash(encHash, pubKey) {
    try {
        return crypto.publicDecrypt(crypto.createPublicKey({key: pubKey, format: 'pem'}), encHash).toString('base64');
    } catch (e) {
        return null;
    }
}
/**
 * 
 * @param {string} folder
 * @param {string} pubKey 
 * @returns 
 */
function verifyHash(folder, pubKey) {
    const encHash = Buffer.from(JSON.parse(fs.readFileSync(path.join(folder,'version.json')).toString()).hash, 'base64');
    return getPubHash(encHash, pubKey) === require('./hash_folder.js')(folder, []).hash.toString('base64');
}
/**
 * 
 * @param {string} version
 * @param {string} folder
 * @returns 
 */
function verifyVersion(version, folder) {
    const reqVer = JSON.parse(fs.readFileSync(path.join(folder,'version.json')).toString()).clawffee_version;
    return version != reqVer;
}

//@ts-ignore
const pubKey = require('../internal.pub.txt')?.default || require('../internal.pub.txt');

/**
 * 
 * @returns {Promise<{info: any, update_data: any} | Error | string>}
 */
async function getUpdate() {
    const dns = require('dns/promises');
    let update_data;
    try {
        const data = await dns.resolveTxt('update.clawffee.com');
        if(!data) return helpfulError('failed to retrieve update information, potential clawffee downage?');
        try {
            update_data = JSON.parse(new Buffer(data.map(v => v[0]).join(''), 'base64').toString('ascii'));
            if(!update_data.url || !update_data.headers || !update_data.filename) throw helpfulError(`!update_data.url || !update_data.headers || !update_data.filename`);
        } catch(e) {
            return helpfulError("failed to update clawffee, potential clawffee server misconfiguration?", e);
        }
    } catch(e) {
        return helpfulError('failed to retrieve update information, potential clawffee downage?', e);
    }
    try {
        const update_info = await (await fetch(update_data.url)).json();
        if(update_info.status && update_info.status != 200) {
            return helpfulError(`failed to fetch clawffee version information! Error code: ${update_info.status}`);
        }
        return {info: update_info, update_data};
    } catch(e) {
        return helpfulError('failed to fetch clawffee version information!', e);
    }
}
const error_update_info = getUpdate();

function runUpdate() { return new Promise((resolve, reject) => {error_update_info.then((info) => {
    if (info instanceof Error) {
        return reject(helpfulError(`failed to download files!`, info));
    } else if (typeof info === "string" || info.info.message) {
        return reject(helpfulError(`failed to download files: ${typeof info === "string" ? info: info.info.message}!`));
    } else if(!info.info) {
        return reject(helpfulError(`failed to download files!`));
    }
    const pluginPath = resolvePath('plugins');
    if(!fs.existsSync(pluginPath)) fs.mkdirSync(pluginPath);
    const pluginsInternalPath = resolveInternalPluginPath();
    if(fs.existsSync(path.join(pluginsInternalPath, ".git"))) {
        // do not delete the internal plugin if it is checked out through git!
        // otherwise progress might be lost >w<
        return reject(helpfulError('the internal plugin is a git repository which needs to be updated via git manually'));
    }
    const folderPath = resolvePath('update');
    // FIXME: this is super dangerous, maybe creating a marker file into the directory would be a good idea to check before running `rm`
    if(fs.existsSync(folderPath)) fs.rmSync(folderPath, {recursive: true, force: true});
    fs.mkdirSync(folderPath);
    const url = info.info.assets.find(v => v.name === info.update_data.filename)?.url;
    if(!url) {
        return reject(helpfulError('failed to find the required update file'));
    }
    console.log(url);
    function verifyDownload() {
        console.log(`finished inflating update at ${folderPath}`);
        if(!verifyHash(folderPath, pubKey)) return reject(helpfulError('Hash of downloaded folder is incorrect!!!'));
        if(!verifyVersion(meta.version, folderPath)) return reject(helpfulError('Clawffee executable outdated for the update, please download the newest Clawffee executable manually if you wish to update!'))
        
        const pluginsInternalBackupPath = path.join(pluginPath, 'internal.bak');
        try {
            // FIXME: this is super dangerous, maybe creating a marker file into the directory would be a good idea to check before running `rm`
            fs.rmSync(pluginsInternalBackupPath, {force: true, recursive: true});
        } catch(e) {} // can silently fail
        try {
            fs.renameSync(pluginsInternalPath, pluginsInternalBackupPath);
        } catch(e) {} // can silently fail, either means the file doesnt exist or it will fail loudly in the next step
        try {
            fs.renameSync(folderPath, pluginsInternalPath);
        } catch(e) {
            return reject(helpfulError('failed to move the update to the required position'));
        }
        resolve(void(0));
    }

    const https = require('https');
    /**
     * 
     * @param {IncomingMessage} res 
     * @returns 
     */
    function handleDownload(res) {
        if(res.statusCode == 302) {
            https.get(res.headers.location, {
                headers: info.update_data.headers
            }, handleDownload);
            return;
        }
        const tar = require('tar-stream');
        const gzip = require('zlib');
        const zipFile = tar.extract();
        const {createWriteStream} = require('fs');
        let writers = 0;
        let finished = false;
        zipFile.on('entry', (headers, stream, next) => {
            if(path.posix.normalize(headers.name).startsWith('../')) {
                return reject(helpfulError(`path ${headers.name} is pointing outside the folder!!!`));
            }
            fs.mkdirSync(path.join(folderPath, path.dirname(headers.name)), {recursive: true});
            writers++;
            stream.pipe(createWriteStream(path.join(folderPath, headers.name))).on('finish', () => {
                writers--;
                if(writers == 0 && finished) verifyDownload();
            });
            stream.on('end', () => {
                next();
            });
        }).once('close', () => {
            finished = true;
            if(writers == 0) verifyDownload();
        });
        res.pipe(gzip.createGunzip()).pipe(zipFile);
    }
    https.get(url, {
        headers: info.update_data.headers
    }, handleDownload);
});});}

// convert Error to string (note that Error and string are resolved and not rejected)
const update_info = error_update_info.then(data => Promise.resolve(data instanceof Error ? data.message : data));

const pluginApiV0 = {
    /**
     * @param {InternalData} internalData 
     */
    prepareEnvironment: (internalData) => {
        const { resolvePath, chdir, pluginArgv } = environment;
        // add the global options
        globalThis.clawffeeInternals = {
            /**
             * @type {InternalData & { update_info: InternalData["updateInfo"] }}
             */
            launcher: { ...internalData, update_info: internalData["updateInfo"] }
        }
        // change to the working directory that is configured
        chdir(resolvePath());
        // override argv until the plugin knows how to handle launcher options
        process.argv = new Array(...pluginArgv());
    },
    /**
     * @param {string} id The path to `index.js`
     */
    launch: (id) => {
        // launch
        require(id);
    },
};

const pluginApiV1 = {
    /**
     * @param {string} id The path to `index.js`
     * @returns {(internalData: InternalData) => Promise<PluginV1>} loadPlugin
     */
    loadModule: (id) => {
        /** @type {unknown} */
        const unknownModule = require(id);
        if (unknownModule == null || typeof unknownModule != "object" || !("loadPlugin" in unknownModule) || typeof unknownModule.loadPlugin !== "function") {
            throw helpfulError(`The module '${id.replaceAll("'", "\\'")}' is not an object containing a function 'loadPlugin'.`);
        }
        /**
         * The type of an unknown function can not be checked.
         * Lets hope for the best.
         *
         * @type {any}
         */
        const anyLoadPlugin = unknownModule.loadPlugin;
        /** @type {ModuleV1["loadPlugin"]} */
        const loadPlugin = anyLoadPlugin;
        return (internalData) => loadPlugin({
                    path: resolvePath(),
                    args,
                    logLevel: options.verbose,
                    logLevels,
                    internalData,
                });
    },
};

module.exports = {
    pubKey,
    update_info,
    runUpdate,
    verifyHash,
    getPubHash,
    meta,
    getVerInfoSafe,
    resolvePath,
    resolveInternalPluginPath,
    helpfulError,
    pluginApi: {
        "v0": pluginApiV0,
        "v1": pluginApiV1,
    },
    options
};
