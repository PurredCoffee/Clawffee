//@ts-check
const os = require('os');
const path = require('path');
const fs = require('fs');
/** @import { FlagWithOptionalArgument, FlagWithRequiredArgument } from './arguments.mjs' */
import { parseArguments } from './arguments.mjs';

export const logLevels = Object.fromEntries([
    "error",
    "warn",
    "info",
    "debug",
    "trace",
    "vomit"
].map((value, index) => [value, index]));

/**
 * @typedef {Object} Options
 * @property {boolean} version
 * @property {"human"|"text"|"json"} format
 * @property {number} verbose
 * @property {boolean} xdg
 * @property {string | null} path
 * @property {Set<"folder"|"plugins">} create
 * @property {boolean} acceptPrompts
 */

/**
 * @param {string} value boolean
 * @returns true if and only if the value is `true`, `1`, `yes`, `y`, or `on` (case-insensitive)
 */
const isTrue = (value) => {
    return !!value.match(/^true|1|yes|y|on$/i);
};

const trueValues = ["true", "1", "yes", "y", "on"];

/**
 * @returns clawffee's user-specific configuration
 */
export function xdgPath() {
    switch (process.platform) {
        case 'darwin': return path.join(os.homedir(), "Library", "Preferences", "com.clawffee");
        case 'win32': return path.join(process.env.LOCALAPPDATA ?? path.join(os.homedir(), "AppData", "Local"), "Clawffee", "Config");
        default: return path.join(process.env.XDG_CONFIG_HOME ?? path.join(os.homedir(), ".config"), "clawffee");
    }
}

export function xdgPathDescription() {
    switch (process.platform) {
        case 'darwin': return "~/Library/Preferences/com.clawffee";
        case 'win32': return path.join("%LOCALAPPDATA%", "Clawffee", "Config");
        default: return "$XDG_CONFIG_HOME/clawffee or ~/.config/clawffee";
    }
}

/**
 * @param {string} p path
 * @returns The path `p` where `~` is resolved to the user's home directory
 */
export function resolveHome(p) {
    if (p == "~" || p.startsWith("~/")) {
        return path.join(os.homedir(), p.substring(1));
    }
    return p;
}

/**
 * Check the error code of an error.
 *
 * @param {unknown} e The error that was thrown.
 * @param {string} code The error code, like "ENOENT".
 * @returns true if and only if the error has the error `code`.
 */
export function hasErrorCode(e, code) {
    return typeof e === "object" && e != null && "code" in e && e.code === code;
}

export function parseOptions() {
    /** @type {Options} */
    const options = {
        version: false,
        verbose: logLevels["info"],
        format: "human",
        xdg: false,
        path: null,
        create: new Set(["folder", "plugins"]),
        acceptPrompts: false,
    };
    const help = {
        shortName: ["h", "?"], handler: () => {
            return {
                showUsage: true,
                exit: 0,
            };
        },
        description: "prints this help text"
    };
    const version = {
        shortName: "V", handler: () => {
            options.version = true;
        },
        description: "prints the version of the clawffee launcher and its plugins if applicable"
    };
    /** @type {FlagWithRequiredArgument} */
    const format = {
        shortName: "f", requiredArgument: "FORMAT", handler: (format) => {
            // case-insensitive
            const lowerFormat = format.toLowerCase();
            if (lowerFormat === "human") {
                options.format = "human";
            } else if (lowerFormat === "text") {
                options.format = "text";
            } else if (lowerFormat === "json") {
                options.format = "json";
            } else {
                return {
                    showUsage: true,
                    error: `unknown output format '${format}': allowed values are 'human', 'text' or 'json'`,
                    exit: 1,
                };
            }
        },
        description: [
            `the used format when outputting data`,
            `at the moment this is only used for the version output`,
            `possible values for FORMAT:`,
            ` - human\tthe output will be human readable (default)`,
            ` - text \tThe output can be parsed as text`,
            ` - json \tThe output can be parsed as a JSON`
        ].join("\n")
    };
    /** @type {FlagWithOptionalArgument} */
    const verbose = {
        shortName: "v", envName: "CLAWFFEE_VERBOSE", optionalArgument: "LEVEL", handler: (levelText) => {
            if (levelText == undefined) {
                options.verbose++;
                return;
            }
            if (levelText.match(/^\d+$/)) {
                options.verbose = parseInt(levelText, 10);
                return;
            }
            const level = logLevels[levelText];
            if (level != undefined) {
                options.verbose = level;
                return;
            }
            return {
                showUsage: true,
                error: `unknown log level '${level}': allowed values are ${Object.entries(logLevels).map(([value, index]) => `${value} (${index})`).join(", ")}`,
                exit: 1,
            };
        },
        description: [
            "if LEVEL is set then the log level is set to LEVEL,",
            "otherwise the LEVEL is increased by one",
            `possible values for LEVEL:`,
            Object.entries(logLevels).map(([value, index]) => `${value} (${index})`).join(", ")
        ].join("\n")
    };
    /** @type {FlagWithRequiredArgument} */
    const p = {
        longName: "path", shortName: "p", envName: "CLAWFFEE_PATH", requiredArgument: "PATH", handler: (p) => {
            options.path = p;
        },
        description: `sets the path of clawffee to PATH\nthe default path is the current working directory ./`,
    };
    /** @type {FlagWithOptionalArgument} */
    const xdg = {
        longName: "xdg", shortName: ["x", "c"], envName: "CLAWFFEE_XDG", optionalArgument: "ENABLED", handler: (xdg) => {
            options.xdg = isTrue(xdg ?? `${true}`);
        },
        description: `if set or ENABLED is any of ${trueValues.join(", ")} (case-insensitive)\nthen the default path of clawffee will be set to ${xdgPathDescription()}`,
    };

    const { args, usage, bestArgv0 } = parseArguments({ help, version, format, verbose, p, xdg });

    /**
     * @param {string} message
     * @param {unknown} [cause]
     * @returns {Error | string}
     */
    const helpfulError = (message, cause) => {
        if (options.verbose >= logLevels["debug"]) {
            const e = new Error(message, { cause });
            Error.captureStackTrace(e, helpfulError);
            return e;
        } else {
            // keep formatted
            return `\u001b[31m${message.replaceAll("\u001b[0m", "\u001b[0m\u001b[31m")}\u001b[0m`;
        }
    };

    /**
     * @param {string} directory 
     */
    const chdir = (directory) => {
        try {
            process.chdir(directory);
        } catch (e) {
            if (hasErrorCode(e, "ENOENT")) {
                throw helpfulError(`The path '${directory.replaceAll("'", "\\'")}' does not exist: please create that path to use Clawffee.`, e);
            } else {
                throw e;
            }
        }
    };

    /**
     * @param {...string} paths
     */
    const resolvePath = (...paths) => {
        if (options.path != null) {
            return path.join(process.cwd(), resolveHome(options.path), ...paths);
        } else if (!options.xdg) {
            return path.join(process.cwd(), ...paths);
        }
        const configPath = xdgPath();
        try {
            if (!fs.existsSync(configPath)) {
                fs.mkdirSync(configPath, {
                    recursive: true,
                });
            }
        } catch (e) {
            throw helpfulError(`Could not create directory '${configPath.replaceAll("'", "\\'")}'.`, e)
        }
        return path.join(configPath, ...paths);
    };

    const pluginArgv = () => {
        if (options.verbose >= logLevels["vomit"]) {
            return ["--verbose"];
        }
        return [];
    };

    return {
        args,
        options,
        environment: {
            helpfulError,
            usage,
            bestArgv0,
            pluginArgv,
            resolvePath,
            chdir,
        }
    };
}
