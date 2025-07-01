/**
 * @returns {object} object that will always have every object and always be callable
 */
function createUnfailable() {
    return new Proxy(() => {}, {
        get() {
            return createUnfailable();
        },
        apply() {
            return createUnfailable();
        },
        construct() {
            return createUnfailable();
        }
    });
}

createUnfailable().meow();

module.exports = {
    createUnfailable
}