const fs = require('fs');
module.exports = {
    /**
     * @type {import("./_internal/clawCallbacks")}
     */
    clawCallbacks: require(fs.realpathSync('./plugins/internal/_internal/clawCallbacks.js')),
    /**
     * @type {import("./_internal/codeBinder")}
     */
    codeBinder: require(fs.realpathSync('./plugins/internal/_internal/codeBinder.js'))
}