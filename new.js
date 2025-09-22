const {runCommands} = require('./internal/JSRunManager');

globalThis.clawffee = {};

runCommands('./commands');