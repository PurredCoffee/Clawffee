function flatten_inheritance(e) {
    var o = Object.create(null),
        c = e, i, prop;
    do {
        prop = Object.getOwnPropertyNames(c).filter(v => !v.startsWith("_"));
        for (i = 0; i < prop.length; ++i)
            try {
                if (!(prop[i] in o) && typeof e[prop[i]] != 'function')
                    o[prop[i]] = e[prop[i]];
            } catch (ex) {}
    } while (c = c.__proto__);
    return o;
}

function deepCleanTwitchData(value, seen = new Map()) {
    if (seen.has(value)) {
        return seen.get(value);
    }
    seen.set(value, value);
    if (typeof value !== 'object' || value === null) return value;
    if(value.toJSON) return value;
    if(Array.isArray(value)) {
        value.forEach(v => deepCleanTwitchData(v, seen));
        return value;
    }
    if (value instanceof Map) {
        const newMap = new Map();
        for (const [k, v] of value.entries()) {
            newMap.set(k, deepCleanTwitchData(v, seen));
        }
        return newMap;
    } 

    var o = flatten_inheritance(value);
    var r = Object.create(null);
    for (const key in o) {
        r[key] = deepCleanTwitchData(value[key], seen);
    }
    seen.set(value, new Proxy(r, {
        get(target, prop, receiver) {
            if(target[prop] !== undefined) {
                const result = Reflect.get(target, prop, receiver);
                if(typeof result === 'function') {
                    return function(...args) {
                        return result.apply(value, args);
                    }
                }
                return result;
            }
            return value[prop];
        }
    }));
    return seen.get(value);
}

module.exports = {
    deepCleanTwitchData
}