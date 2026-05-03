//@ts-check
const path = require('path');
const crypto = require('crypto');
const { IncomingMessage } = require('http');
const fs = require('fs');

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

async function getUpdate() {
    const dns = require('dns/promises');
    let update_data;
    try {
        const data = await dns.resolveTxt('update.clawffee.com');
        if(!data) return 'failed to retrieve update information, potential clawffee downage?';
        try {
            update_data = JSON.parse(new Buffer(data.map(v => v[0]).join(''), 'base64').toString('ascii'));
            if(!update_data.url || !update_data.headers || !update_data.filename) throw new Error();
        } catch(e) {
            return "failed to update clawffee, potential clawffee server misconfiguration?";
        }
    } catch(e) {
        return 'failed to retrieve update information, potential clawffee downage?';
    }
    try {
        const update_info = await (await fetch(update_data.url)).json();
        if(update_info.status && update_info.status != 200) {
            return `failed to fetch clawffee version information! Error code: ${update_info.status}`;
        }
        return {info: update_info, update_data};
    } catch(e) {
        return 'failed to fetch clawffee version information!';
    }
}
const update_info = getUpdate();

function runUpdate() { return new Promise((resolve, reject) => {update_info.then((info) => {
    if(!info.info || info.info.message) {
        return reject('failed to download files!', info.info.message);
    }
    if(fs.existsSync('update')) fs.rmSync('update', {recursive: true, force: true});
    fs.mkdirSync('update');
    const folderPath = 'update';
    const url = info.info.assets.find(v => v.name === info.update_data.filename)?.url;
    if(!url) {
        return reject('failed to find the required update file');
    }
    console.log(url);
    function verifyDownload() {
        console.log(`finished inflating update at ${folderPath}`);
        if(!verifyHash(folderPath, pubKey)) return reject('Hash of downloaded folder is incorrect!!!');
        if(!verifyVersion(meta.version, folderPath)) return reject('Clawffee executable outdated for the update, please download the newest Clawffee executable manually if you wish to update!')
        try {
            fs.rmSync('plugins/internal.bak', {force: true, recursive: true});
        } catch(e) {} // can silently fail
        try {
            fs.renameSync('plugins/internal', 'plugins/internal.bak');
        } catch(e) {} // can silently fail, either means the file doesnt exist or it will fail loudly in the next step
        try {
            fs.renameSync(folderPath, 'plugins/internal');
        } catch(e) {
            return reject('failed to move the update to the required position');
        }
        resolve();
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
                return reject(`path ${headers.name} is pointing outside the folder!!!`);
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

module.exports = {
    pubKey, update_info, runUpdate, verifyHash, getPubHash, meta
}