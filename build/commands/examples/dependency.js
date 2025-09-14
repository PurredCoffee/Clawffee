let meaning = 42;

// this makes `meaning` accessible from other modules

// if other modules require this they will only get loaded
// when this module is loaded first
module.exports = {
    meaning
}