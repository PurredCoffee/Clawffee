/**
 * @returns {object} object that will always have every object and always be callable
 */
function createUnfailable() {
    return new Proxy(() => { }, {
        getOwnPropertyDescriptor(target, property) {
            if (property === "valueOf") {
                return {
                    configurable: true,
                    enumerable: false,
                    writable: true,
                    value: () => () => "[Unfailable]"
                };
            }
            return {
                configurable: true,
                enumerable: false,
                writable: true,
                value: createUnfailable()
            };
        },
        get(target, property, receiver) {
            if (property === "valueOf") {
                return () => "";
            }
            if (property === Symbol.toPrimitive) {
                return (hint) => {
                    return false;
                };
            }
            if (property === "__katz__unfailable") {
                return true;
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


module.exports = {
    createUnfailable
}