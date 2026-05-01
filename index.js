//@ts-check
const { verifyHash, pubKey, runUpdate, getVerInfoSafe, helpfulError, resolveInternalPluginPath } = require('./internals/shared');

function main() {
    const verInfo = getVerInfoSafe();

    if(!verInfo) return (async () => {
        console.error('could not find internal plugins folder, assuming first launch. Downloading dependencies...');
        try {
            await runUpdate();
        } catch(e) {
            throw helpfulError("update failed", e);
        }
        require('./launch');
    })();

    const InternalPluginPath = resolveInternalPluginPath();

    if(!verifyHash(InternalPluginPath, pubKey)) throw helpfulError(`FAILED TO VERIFY CLAWFFEE INTEGRITY (try deleting '${InternalPluginPath.replaceAll("'", "\\'")}' if this doesn't resolve itself)`);

    require('./launch');
}

try {
    main();
} catch (e) {
    prompt(String(e));
}
