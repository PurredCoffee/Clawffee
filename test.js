class a {
    get a() {
        return 1;
    }
}

class b extends a {
}
class c extends b {
}
class d extends c {
}


let obj = new d();

function flatten_inheritance(e) {
    var o = Object.create(null), i, prop;
    do {
        prop = Object.getOwnPropertyNames(e);
        for (i = 0; i < prop.length; ++i)
            if (!(prop[i] in o))
                o[prop[i]] = e[prop[i]];
    } while (e = Object.getPrototypeOf(e));
    return o;
}

function stringifyJSON(obj) {
    // if the object has getters, we need to convert them to regular properties
    return JSON.stringify(obj, (key, value) => {
        if (typeof value === 'object' && value !== null) {
            const newObj = {};
            for (const k of Object.getOwnPropertyNames(flatten_inheritance(value))) {
                newObj[k] = value[k];
            }
            return newObj;
        }
        return value;
    }, 4);
}

console.log(stringifyJSON(obj));
