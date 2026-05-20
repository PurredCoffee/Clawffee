//@ts-check
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const readline = require('readline');
const Writable = require('stream').Writable;
(async () => {
    var mutableStdout = new Writable({
    write: function(chunk, encoding, callback) {
        if (!this.muted)
            process.stdout.write(chunk, encoding);
        callback();
    }
    });
    var rl = readline.createInterface({
    input: process.stdin,
    output: mutableStdout,
    terminal: true
    });
    function promptClear(message) {
        mutableStdout.muted = false;
        return new Promise(resolve => {
            rl.question(message + ": ", resolve);
        });
    }

    function promptPassword(message) {
        mutableStdout.muted = false;
        return new Promise(resolve => {
            rl.question(message + ": ", resolve);
            mutableStdout.muted = true;
        });
    }
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
        console.info(`wrote the keys into ${oldername + '.priv'} and ${foldername + '.pub.txt'}`)
    }
    const privateKey = fs.readFileSync(keypath);
    console.log(clearHash.hash.toString('base64'));
    const encHash = crypto.privateEncrypt(crypto.createPrivateKey({ key: privateKey, format: 'pem', passphrase: await getParam('-p', 'specify a password(empty for null)', true) || null }), clearHash.hash).toString('base64');
    console.log(encHash);
    const json = require('./' + path.join(folder, 'version.json'));
    json.hash = encHash;
    fs.writeFileSync(path.join(folder, 'version.json'), JSON.stringify(json, null, 4));

    // create the tarball
    const tar = require('tar-stream').pack();

    
    function enterFolder(p) {
        const files = fs.readdirSync(p);
        files.forEach(v => {
            v = p + '/' + v;
            if(ignoredFiles.includes(v.substring(folder.length + 1)))
                return;
            const stat = fs.statSync(v);
            if(stat.isFile()) {
                tar.entry({
                    name: v.substring(folder.length + 1)
                }, fs.readFileSync(v));
            } else if(stat.isDirectory()) {
                enterFolder(v);
            }
        });
    }
    enterFolder(folder);
    const gzip = require('zlib');
    tar.pipe(gzip.createGzip()).pipe(fs.createWriteStream(foldername + '.tar.gz'));
    tar.finalize();
})();