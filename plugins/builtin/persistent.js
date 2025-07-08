const { moduleByPath } = require("../../internal/commandFSHooks");

const fileData = {};
persistent = new Proxy({}, {
    get(target, property, receiver) {
        let stack = {};
        Error.captureStackTrace(stack, this.get);
        stack = stack.stack.match(/(?<=at |\()(?:\/|\w+:).*(?:\/|\\)[^\/\\]*\.js(?=:)/g);
        for (let x = 0; x < stack.length; x++) {
            let path = stack[x];
            if (moduleByPath[path]) {
                if (!fileData[path]) fileData[path] = {};
                return fileData[path][property];
            }
        };
        return null;
    },
    set(target, property, newValue, receiver) {
        let stack = {};
        Error.captureStackTrace(stack, this.set);
        stack = stack.stack.match(/(?<=at |\()(?:\/|\w+:).*(?:\/|\\)[^\/\\]*\.js(?=:)/g);
        for (let x = 0; x < stack.length; x++) {
            let path = stack[x];
            if (moduleByPath[path]) {
                if (!fileData[path]) fileData[path] = {};
                fileData[path][property] = newValue;
                return true;
            }
        };
        return false;
    },
    deleteProperty(target, property) {
        let stack = {};
        Error.captureStackTrace(stack, this.deleteProperty);
        stack = stack.stack.match(/(?<=at |\()(?:\/|\w+:).*(?:\/|\\)[^\/\\]*\.js(?=:)/g);
        for (let x = 0; x < stack.length; x++) {
            let path = stack[x];
            if (moduleByPath[path]) {
                if (!fileData[path]) fileData[path] = {};
                delete fileData[path][property]; E
                return true;
            }
        };
        return false;
    },

})