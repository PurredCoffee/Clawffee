//@ts-check
const path = require("path")

/**
 * @typedef {Object} HandlerReturnValue
 * @property {number} [exit]
 * @property {string} [error]
 * @property {boolean} [showUsage]
 */
/**
 * @typedef {Object} FlagWithoutArgument
 * @property {string} description
 * @property {string | null} [longName]
 * @property {string | null | string[]} [shortName]
 * @property {() => void | HandlerReturnValue} handler
 */
/**
 * @typedef {Object} FlagWithRequiredArgument
 * @property {string} description
 * @property {string | null} [longName]
 * @property {string} [envName]
 * @property {string | null | string[]} [shortName]
 * @property {string} requiredArgument
 * @property {(arg: string) => void | HandlerReturnValue} handler
 */
/**
 * @typedef {Object} FlagWithOptionalArgument
 * @property {string} description
 * @property {string | null} [longName]
 * @property {string} [envName]
 * @property {string | null | string[]} [shortName]
 * @property {string} optionalArgument
 * @property {(arg?: string) => void | HandlerReturnValue} handler
 */
/**
 * @typedef {FlagWithoutArgument | FlagWithRequiredArgument | FlagWithOptionalArgument} Flag
 */

/**
 * @param {(() => string | undefined)[]} values
 * 
 * @returns {string | undefined} 
 */
const getValue = (...values) => {
    for (const value of values) {
        const result = value();
        if (typeof result === "string") {
            return result;
        }
    }
};

/**
 * @param {string[]} args 
 * @returns {string} The `args` escaped for shells
 */
function escapeShellArgs(...args) {
    return args.map(arg => {
        const safeShellArg = /^[a-zA-Z0-9,._+:@%\/-]+$/;
        if (safeShellArg.test(arg)) {
            return arg;
        }
        return `'${arg.replaceAll("'", "\\'")}'`;
    }).join(" ");
}

/**
 * @param {string} runtimePath `process.argv[0]` - This contains the path to the runtime like `bun`
 * @param {string} scriptPath `process.argv[1]` - This contains the path to the main script like `index.js` or `launch.js`
 * @returns {string} The user friendly way of calling the main script again, used in the help text
 */
function getBestArgv0(runtimePath, scriptPath) {
    const argv0 = process.argv0;
    if (path.basename(argv0) == path.basename(runtimePath)) {
        // if the runtime is called directly
        return escapeShellArgs(argv0, ...process.execArgv, scriptPath, "--");
    }
    // if argv[0] is overriden with `exec -a` or `env -a` we expect it to wrap the bun binary correctly
    // e.g. by appending the arguments to bun with `"--" "${@}"`
    return escapeShellArgs(argv0);
}

/**
 * @param {[key: string, value: Flag]} entry
 * @returns {{longName: string | null, shortNames: string[], envName: string | null}}
 */
function readFlag([key, flag]) {
    return {
        longName: flag.longName === undefined ? key : flag.longName,
        shortNames: flag.shortName == null ? [] : typeof flag.shortName === "string" ? [flag.shortName] : flag.shortName,
        envName: "envName" in flag ? flag.envName ?? null : null,
    }
}

/**
 * @param {Record<string, Flag>} flags
 */
function parseArguments(flags) {
    const argv = [...process.argv];

    const [runtimePath, scriptPath] = argv.splice(0, 2);
    const bestArgv0 = () => getBestArgv0(runtimePath, scriptPath);

    /** @type {string[]} */
    const args = [];

    const usage = () => {
        console.log(`Usage: ${bestArgv0()} [...OPTIONS] [--] [...ARGS]`);
        console.log(`A simple Twitch bot tool for streamers!`);
        console.log();
        console.log(`Flags:`);
        for (const [key, flag] of Object.entries(flags)) {
            const { longName, shortNames, envName } = readFlag([key, flag]);
            if (longName != null) {
                longOptions.set(longName, flag);
            }
            for (const shortName of shortNames) {
                shortOptions.set(shortName, flag);
            }
            if (envName != null) {
                envOptions.set(envName, flag);
            }

            const options = [];

            if ("requiredArgument" in flag) {
                shortNames.map(value => `-${value} ${flag.requiredArgument}`).forEach(value => options.push(value));
                if (longName != null) {
                    options.push(`--${longName}=${flag.requiredArgument}`);
                }
                if (envName != null) {
                    options.push(`${envName}=${flag.requiredArgument}`);
                }
            } else if ("optionalArgument" in flag) {
                shortNames.map(value => `-${value}`).forEach(value => options.push(value));
                if (longName != null) {
                    options.push(`--${longName}[=${flag.optionalArgument}]`);
                }
            } else {
                shortNames.map(value => `-${value}`).forEach(value => options.push(value));
                if (longName != null) {
                    options.push(`--${longName}`);
                }
            }
            console.log(`${options.join(", ")}`);
            console.log(`\t${flag.description.replaceAll("\n", "\n\t")}`);
            console.log("");
        }
    };

    /**
     * @param {HandlerReturnValue} result 
     * @param {(() => string)} [errorContext]
     */
    const handleResult = (result, errorContext) => {
        if (result.error != null) {
            const context = errorContext ? `${errorContext()}: ` : "";
            console.error(`Error: ${context}${result.error}.`);
        }
        if (result.showUsage) {
            usage();
        }
        if (result.exit != null) {
            process.exit(result.exit);
        }
    };

    /** @type {Map<string, Flag>} */
    const longOptions = new Map();
    /** @type {Map<string, Flag>} */
    const shortOptions = new Map();
    /** @type {Map<string, Flag>} */
    const envOptions = new Map();

    for (const [key, flag] of Object.entries(flags)) {
        const { longName, shortNames, envName } = readFlag([key, flag]);
        if (longName != null) {
            longOptions.set(longName, flag);
        }
        for (const shortName of shortNames) {
            shortOptions.set(shortName, flag);
        }
        if (envName != null) {
            envOptions.set(envName, flag);
        }
    }

    /**
     * @param {Flag} [flag]
     * @param {(() => string | undefined)[]} values
     * @returns {HandlerReturnValue}
     */
    const callHandler = (flag, ...values) => {
        if (flag == null) {
            return {};
        }
        const envName = "envName" in flag ? flag.envName : null;
        if (envName != null) {
            // do not use environment variable, since flag is present
            envOptions.delete(envName);
        }
        if ("requiredArgument" in flag) {
            const value = getValue(...values, () => argv.splice(0, 1)[0]);
            if (value == null) {
                return {
                    showUsage: true,
                    error: "requires an argument",
                    exit: 1,
                };
            }
            return flag.handler(value) ?? {};
        }
        const value = getValue(...values);
        if (!("optionalArgument" in flag) && value != null) {
            return {
                showUsage: true,
                error: "doesn't allow an argument",
                exit: 1,
            };
        }
        return flag.handler(value) ?? {};
    };

    while (argv.length > 0) {
        const [arg] = argv.splice(0, 1);
        if (arg == "-") {
            // - is a positional argument
            // usually used to indicate that stdin should be read instead of a file
            args.push("-");
        } else if (arg.startsWith("-")) {
            if (arg == "--") {
                // end of optional arguments
                args.push(...argv.splice(0));
            } else if (arg.startsWith("--")) {
                // --long[=value]
                const equalIndex = arg.indexOf("=");
                const longName = equalIndex == -1 ? arg.substring(2) : arg.substring(2, equalIndex);
                handleResult(
                    callHandler(
                        longOptions.get(longName),
                        () => equalIndex == -1 ? undefined : arg.substring(equalIndex + 1)
                    ),
                    () => `option '--${longName}'${equalIndex != -1 ? ` in '${arg}'` : ""}`
                );
            } else {
                // -s
                const shortNames = [...arg.substring(1)];
                for (const shortName of shortNames) {
                    handleResult(
                        callHandler(
                            shortOptions.get(shortName)
                        ),
                        () => `option '-${shortName}'${shortNames.length > 1 ? ` in '${arg}'` : ""}`
                    );
                }
            }
        } else {
            // positional argument
            args.push(arg);
        }
    }

    for (const [envName, flag] of envOptions.entries()) {
        const envValue = process.env[envName];
        if (envValue != null) {
            handleResult(
                callHandler(
                    flag,
                    () => envValue
                ),
                () => `environment variable ${envName}=${envValue}`
            );
        }
    }

    return {
        args,
        usage,
        bestArgv0,
    };

}

module.exports = {
    parseArguments,
    escapeShellArgs
}