/**
 * @returns {object} object that will always have every object and always be callable
 */
function createUnfailable() {
    return new Proxy(() => { }, {
        get(target, property, receiver) {
            if (property === "__katz__unfailable") {
                return () => true;
            }
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