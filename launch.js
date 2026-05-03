//@ts-check
const fs = require('fs');
const {update_info, verifyHash, runUpdate, pubKey, getPubHash, meta} = require('./src/internals/shared');

globalThis.clawffeeInternals = {
    /**
     * @type {import('./plugins/internal/_clawffee/internal/Globals/launcher').InternalData}
     */
    launcher: {
        updateInfo: update_info,
        //@ts-ignore
        update_info,
        verifyHash,
        runUpdate,
        pubKey,
        getPubHash,
        meta: meta
    }
}
require(fs.realpathSync('./plugins/clawffee/internal/launch.js'));