// this module will now only load once depender is loaded
// if depender is locked or otherwise unloaded
// this module will follow suit
const { meaning } = require('./dependency')

console.log(meaning);