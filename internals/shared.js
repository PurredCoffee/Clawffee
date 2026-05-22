//@ts-check
/**
 * @import {  InternalData, ModuleV1, PluginV1 } from '../plugins/internal/_clawffee/internal/Globals/launcher'
 */
const crypto = require('crypto');
const { IncomingMessage } = require('http');
const { logLevels, parseOptions } = require('./options.js');
const dns = require('dns/promises');
const path = require('path')
const git = require('isomorphic-git')
const http = require('isomorphic-git/http/node')
const fs = require('fs')

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
        if(!verInfo.version) throw helpfulError("The verInfo JSON does not contain a valid 'version'.");
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
 * @param {crypto.KeyLike} pubKey 
 * @returns 
 */
function getPubHash(encHash, pubKey) {
    try {
        return crypto.publicDecrypt(pubKey, encHash).toString('base64');
    } catch (e) {
        return null;
    }
}
/**
 * 
 * @param {string} folder
 * @param {crypto.KeyLike} pubKey 
 * @returns 
 */
function verifyHash(folder, pubKey) {
    const encHash = Buffer.from(fs.readFileSync(path.join(folder,"hash.x")).toString(), "base64");
    const decHash = getPubHash(encHash, pubKey);
    const compHash = require('./hash_folder.js')(folder, []).hash.toString('base64');
    console.log(encHash, decHash, compHash);
    return decHash === compHash;
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
const pubKey = crypto.createPublicKey(require('../internal.pub.txt')?.default || require('../internal.pub.txt'));

/**
 * 
 * @param {crypto.KeyLike} pubkey
 * @returns {Promise<{url: string, branch: string, time: number} | Error | string>}
 */
async function getInternalInfo(pubkey) {
    try {
        /*const data = await dns.resolveTxt('update.clawffee.com');*/
        /*if(!data) return helpfulError('failed to retrieve update information, potential clawffee downage?');*/
        try {
            let [update_signature, update_data] = 
                "TChboqjyaBb828v1NX+OzJc0c5wvmTs0ACLX+opKTNsAHN+JXP1xUhkqFu2hf2Xg7yRUdZz13WqeN+1YE4n7+FymZTgeXUsLduEyIi8TJsyCIPUGYzttSGWQIrHSugVTWUGpcXXdsawuXM8itrAexSuzwVNFndTA7bcEEbncLE9pz7AgjzwCToLoC8KwM3Ly4SmmGcwWR1MoluF+lAq8IlvBJDfVt1xebHZ6UkZMY+q9E6zbkTLBS8aWCDeDRRyZucja6EfYsWbMuDpHFma+sdFBAx3oLk3empSQGyOTmvyuZnNRtRxSs0SgRc/EF9KeYr4zn+EjfXLAPtqnExF5JucDoQNb/YvKoL/pymMmqR8VgvYu62vI9JqTDk096Vq1kVoPLQoVYDZ4/VxJ6+XJ3LaNExgNMG/HtcLafs3vZl/HkkPwgY450ksMwBTxhsVi2CChLxapOLgDgy5NnYxzJHWR6ErLAT4rRw7n42S6xztKAVm4/4wSNlduNbt9mGe6BZBwB1WZLJZ0jVu9ab5ZJu0timK8Gcxo4UvyeTpcyFKwRsnGfmYu88tIr8n0BwjWhPCXZxRiNLMc6CcIE4mklwRzvAqVW0GUY5CliLTzSCNho43dNw+4xhfItDTcOfQRMmGlzXOI/A8ALpRIwQs8n9hzqS2+VHLC20o0ATRVNkc= eyJ1cmwiOiJodHRwczovL2dpdGh1Yi5jb20vQ2xhd2ZmZWUvY2xhd2ZmZWUtcGx1Z2luLWludGVybmFsLmdpdCIsImJyYW5jaCI6InJlbGVhc2UiLCJ0aW1lIjoxNzc5MzQ4MDYzNTU2fQ==".split(' ');
                //data.map(v => v[0]).join('').split(' ');
            const Sign = crypto.createVerify("sha256");
            const buff = Buffer.from(update_data, "base64");
            Sign.write(buff);
            if(Sign.verify(pubkey, Buffer.from(update_signature, "base64")))
                return JSON.parse(buff.toString());
            return helpfulError("failed to validate clawffee update information, potential clawffee server misconfiguration?");
        } catch(e) {
            return helpfulError("failed to read clawffee update information, potential clawffee server misconfiguration?", e);
        }
    } catch(e) {
        return helpfulError('failed to retrieve update information, potential clawffee downage?', e);
    }
}
const error_update_info = getInternalInfo(pubKey);

function installInternals() { return new Promise((resolve, reject) => {error_update_info.then((info) => {
    if (info instanceof Error) {
        return reject(helpfulError(`failed to download files!`, info));
    }
    if (typeof info == 'string') {
        return reject(helpfulError(`failed to download files! ${info}`));
    }
    if(!confirm(`Installing internals from ${info.url}:${info.branch}`)) return reject(helpfulError(`cancelled download! ${info}`));
    const dir = path.join(process.cwd(), 'plugins/internal.upd' );
    try {
        try {
            fs.rmSync(dir, {recursive: true});
        } catch(_) {}
        fs.mkdirSync(dir, {recursive: true});
    } catch(e) {
        return reject(helpfulError("failed to create the plguin folder!", e));
    }
    git.clone({ 
        fs, http, dir,
        url: info.url,
        singleBranch: true,
        depth: 1,
        ref: info.branch,
        onProgress(v) {
            console.log(v.phase);
            console.log(v.loaded / v.total || 0);
        }
    }).then(() => {
        console.log('done!');
        if(!verifyHash(dir, pubKey)) {
            return reject(helpfulError("plugin failed to pass hash verification!"));
        }
        fs.renameSync(dir, dir.substring(0, dir.length-4));
        return resolve(true);
    }, (err) => {
        return reject(helpfulError("failed to download plugin, check your internet settings!", err));
    });
})})}

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
    options,
    installInternals
};
