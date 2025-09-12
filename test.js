function getFileName() {
    return this.getThis();
}

/**
 * gets the current stack trace as an array
 * @param {Function} fn function to start the stack trace from
 * @returns {NodeJS.CallSite[]} stack trace as an array
 */
function getStackTrace(fn) {
    const oldPrepareStack = Error.prepareStackTrace;
    Error.prepareStackTrace = (err, stack) => {
        stack.forEach((v) => {
            console.log("Stack trace this:");
            console.log(v.getThis()); // always undefined
            console.log(v.getFunction()); // always undefined
            console.log(v.getFunctionName()); // "" instead of null
            // console.log(v.getLineNumber());
            // console.log(v.getColumnNumber());
            // console.log(v.getEnclosingColumnNumber()); NOT SUPPORTED
            // console.log(v.getEnclosingLineNumber()); NOT SUPPORTED
            // console.log(v.getEvalOrigin()); // undefined
            // console.log(v.getFileName());
            // console.log(v.getMethodName()); // "" instead of null
            // console.log(v.getPosition()); NOT SUPPORTED
            // console.log(v.getPromiseIndex());
            // console.log(v.getScriptHash()); NOT SUPPORTED
            // console.log(v.getScriptNameOrSourceURL());
            // console.log(v.getTypeName()); // "undefined" instead of null
            // console.log(v.isAsync()); // always false
            // console.log(v.isConstructor());
            // console.log(v.isEval());
            // console.log(v.isPromiseAll());
            // console.log(v.isNative());
            // console.log(v.isToplevel()); // always true??
            console.log(v.toJSON());
            v.getFileName = () => "bark";
            v.getScriptNameOrSourceURL = () => "bark";
        })
        return stack;
    }
    const err = {};
    Error.captureStackTrace(err, fn ?? getStackTrace);
    const stack = err.stack;
    Error.prepareStackTrace = oldPrepareStack;
    return stack;
}

class test {
    main() {
        getStackTrace().forEach(v => {
        });
    }
    constructor() {
        getStackTrace().forEach(v => {
        });
    }
}

function flatten_inheritance(e) {
    var o = Object.create(null),
        c = e, i, prop;
    do {
        prop = Object.getOwnPropertyNames(c).filter(v => !v.startsWith("_"));
        for (i = 0; i < prop.length; ++i)
            try {
                o[prop[i]] = e[prop[i]];
            } catch (ex) {}
    } while (c = c.__proto__ || Object.getPrototypeOf(c));
    return o;
}

function main() {
    function inner() {
        let error = Error("bark");
        error.stack = getStackTrace();
        console.log(Bun.inspect(error, { colors: true }));
    }
    inner();
    console.log("main() this:");
    console.log(this);
    console.log(main);
}

const obj = {
  bar: function() {
    getStackTrace();
    console.log("main() this:");
    console.log(this);
    console.log(main);
  }
};
obj.bar(); 