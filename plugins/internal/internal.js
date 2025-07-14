const fs = require('fs');
/**
 * @type {import("./_internal/clawCallbacks")}
 */
const clawCallbacks = require(fs.realpathSync('./plugins/internal/_internal/clawCallbacks.js'));
/**
 * @type {import("./_internal/codeBinder")}
 */
const codeBinder = require(fs.realpathSync('./plugins/internal/_internal/codeBinder.js'));
/**
 * @type {import("./_internal/server")}
 */
const server = require(fs.realpathSync('./plugins/internal/_internal/server.js'));
module.exports = {
    clawCallbacks,
    codeBinder,
    server
}