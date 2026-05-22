//@ts-check
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const {promptClear, promptPassword} = require('./buildReqs/prompt.js');
(async () => {
    const paramCache = {};
    async function getParam(name, message, hidden = false) {
        if (paramCache[name]) {
            return paramCache[name];
        }
        const index = process.argv.findIndex(v => v === name);
        if (index >= 0) {
            return process.argv[index + 1];
        }
        let input = await (hidden ? promptPassword : promptClear)(message);
        paramCache[name] = input;
        return input;
    }

    const foldername = await getParam('-f', 'specify a plugin folder name');
    const folder = path.join("plugins", foldername);
    const ignoredFiles = [...process.argv.slice(process.argv.findLastIndex(v => v.startsWith('-')) + 2)];
    const clearHash = require('./internals/hash_folder.js')(folder, ignoredFiles);
    console.log(clearHash);
    const foundFiles = new Set();
    const err = new Set();
    function checkFolder(p) {
        const files = fs.readdirSync(p);
        files.filter(v => !ignoredFiles.includes(path.basename(v))).forEach(v => {
            v = p + '/' + v;
            const lv = v.toLowerCase();
            if(foundFiles.has(lv)) {
                err.add(v);
                return;
            }
            foundFiles.add(v.toLowerCase());
            const stat = fs.statSync(v);
            if(stat.isDirectory()) {
                checkFolder(v);
            }
        });
    }
    checkFolder(folder);
    if(err.size) {
        console.error('the following files exist multiple times!\n');
        return console.log(JSON.stringify(Array.from(err),null,4));
    }

    let keypath = await getParam('-k', 'specify a key path(null to generate a new one)');
    if (!keypath) {
        const {
            publicKey,
            privateKey,
        } = crypto.generateKeyPairSync('rsa', {
            modulusLength: 4096,
            publicKeyEncoding: {
                type: 'spki',
                format: 'pem',
            },
            privateKeyEncoding: {
                type: 'pkcs8',
                format: 'pem',
                cipher: 'aes-256-cbc',
                passphrase: await getParam('-p', 'specify a password for the file', true),
            },
        });

        fs.writeFileSync(foldername + '.priv', privateKey);
        fs.writeFileSync(foldername + '.pub.txt', publicKey);
        const json = require('./' + path.join(folder, 'version.json'));
        json.pub_key = publicKey;
        fs.writeFileSync(path.join(folder, 'version.json'), JSON.stringify(json, null, 4));
        console.info(`wrote the keys into ${foldername + '.priv'} and ${foldername + '.pub.txt'}`)
    }
    let password = await getParam('-p', 'specify a password(empty for null)', true) || null;
    const privateKey = fs.readFileSync(keypath);
    console.log(clearHash.hash.toString('base64'));
    const encHash = crypto.privateEncrypt(crypto.createPrivateKey({ key: privateKey, format: 'pem', passphrase: password}), clearHash.hash).toString('base64');
    fs.writeFileSync(path.join(folder, 'hash.x'), encHash);
})();