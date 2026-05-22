const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const {promptClear, promptPassword} = require('./buildReqs/prompt');
(async () => {
    const url = await promptClear("URL") || "https://github.com/Clawffee/clawffee-plugin-internal.git";
    const branch = await promptClear("Branch") || "release";
    const time = Date.now();
    const str = JSON.stringify({url, branch, time});
    const hex = Buffer.from(str);
    console.log(str, hex.toBase64());

    const keyfile = fs.readFileSync(await promptClear("Keyfile") || "internal.priv");
    const password = await promptPassword("Password");
    const key = crypto.createPrivateKey({
        "key": keyfile,
        "passphrase": password || undefined
    });
    console.log(crypto.getHashes());
    const Sign = crypto.createSign("sha256");
    Sign.write(hex);
    console.log(key);
    console.log(Sign.sign(key, "base64"), hex.toBase64());
})();