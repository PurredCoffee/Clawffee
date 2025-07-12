import { moduleByPath } from "./internal/ClawCallbacks";

const fileData = {};

declare global {
    var persistent: object;
}

persistent = new Proxy({}, {
    get(target, property, receiver) {
        let stack = {stack: ""};
        Error.captureStackTrace(stack, this.get);
        let regstack = stack.stack.match(/(?<=at |\()(?:\/|\w+:).*(?:\/|\\)[^\/\\]*\.js(?=:)/g) ?? [];
        for (let x = 0; x < regstack.length; x++) {
            let path = regstack[x];
            if (moduleByPath[path]) {
                if (!fileData[path]) fileData[path] = {};
                return fileData[path][property];
            }
        };
        return null;
    },
    set(target, property, newValue, receiver) {
        let stack = {stack: ""};
        Error.captureStackTrace(stack, this.set);
        let regstack = stack.stack.match(/(?<=at |\()(?:\/|\w+:).*(?:\/|\\)[^\/\\]*\.js(?=:)/g) ?? [];
        for (let x = 0; x < regstack.length; x++) {
            let path = regstack[x];
            if (moduleByPath[path]) {
                if (!fileData[path]) fileData[path] = {};
                fileData[path][property] = newValue;
                return true;
            }
        };
        return false;
    },
    deleteProperty(target, property) {
        let stack = {stack: ""};
        Error.captureStackTrace(stack, this.deleteProperty);
        let regstack = stack.stack.match(/(?<=at |\()(?:\/|\w+:).*(?:\/|\\)[^\/\\]*\.js(?=:)/g) ?? [];
        for (let x = 0; x < regstack.length; x++) {
            let path = regstack[x];
            if (moduleByPath[path]) {
                if (!fileData[path]) fileData[path] = {};
                delete fileData[path][property];
                return true;
            }
        };
        return false;
    },

})