const fileData = {};
globalThis.persistent = new Proxy({}, {
    get(target, property, receiver) {
        const path = globalThis.clawffeeInternals.getRunningScriptName();
        if (moduleByPath[path]) {
            if (!fileData[path]) fileData[path] = {};
            return fileData[path][property];
        }
        return null;
    },
    set(target, property, newValue, receiver) {
        const path = globalThis.clawffeeInternals.getRunningScriptName();
        if (moduleByPath[path]) {
            if (!fileData[path]) fileData[path] = {};
            fileData[path][property] = newValue;
            return true;
        }
        return false;
    },
    deleteProperty(target, property) {
        const path = globalThis.clawffeeInternals.getRunningScriptName();
        if (moduleByPath[path]) {
            if (!fileData[path]) fileData[path] = {};
            delete fileData[path][property];
            return true;
        }
        return false;
    },
})

module.exports = {
    persistent: globalThis.persistent
}