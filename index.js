//@ts-check
const {verifyHash, pubKey, runUpdate} = require('./src/internals/shared')
const fs = require('fs');
function getVerInfoSafe() {
    try {
        const verInfo = JSON.parse(fs.readFileSync('plugins/internal/version.json').toString());
        if(!verInfo.hash || !verInfo.version) throw Error();
        return verInfo;
    } catch(e) {
        return null;
    };
}
function main() {
    const verInfo = getVerInfoSafe();

    if(!verInfo) return (async () => {
        if(!fs.existsSync('plugins')) fs.mkdirSync('plugins');
        console.error('could not find internal plugins folder, assuming first launch. Downloading dependencies...');
        try {
            await runUpdate();
        } catch(e) {
            return prompt('\u001b' + e);
        }
        require('./launch');
    })();

    if(!verifyHash('plugins/internal', pubKey)) return prompt(`\u001b[31mFAILED TO VERIFY CLAWFFEE INTEGRITY (try deleting ./plugins/internal if this doesnt resolve itself)\u001b[0m`);

    require('./launch');
}
main();