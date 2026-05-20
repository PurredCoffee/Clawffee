//@ts-check
/**
 * @import { InternalData } from './plugins/internal/_clawffee/internal/Globals/launcher'
 */
const { semver } = require('bun');
const shared = require('./internals/shared');
const { resolvePath, resolveInternalPluginPath, getVerInfoSafe, helpfulError, pluginApi, meta, options } = shared;
const { escapeShellArg } = require('./internals/arguments.mjs');

/**
 * @returns {InternalData}
 */
const getInternalData = () => {
    const { update_info, verifyHash, runUpdate, pubKey, getPubHash } = shared;

    return {
        updateInfo: update_info, verifyHash, runUpdate, pubKey, getPubHash, meta
    };
};

const v0 = () => {
    return {
        launch: () => {
            const internalData = getInternalData();
            pluginApi.v0.prepareEnvironment(internalData);
            pluginApi.v0.launch(resolveInternalPluginPath('_clawffee', 'index.js'));
        },
    };
};

const v1 = async () => {
    const loadPlugin = pluginApi.v1.loadModule(resolveInternalPluginPath('_clawffee', 'index.js'));
    const plugin = await loadPlugin(getInternalData());

    return {
        launch: async () => {
            // launch clawffee
            return await plugin.launch();
        },
        printVersion: async () => {
            // move as much logic into the clawffee plugin
            console.log(await plugin.version(options.format));
        },
    };
};

/**
 * @typedef {object} Api
 * @property {() => void | Promise<void>} launch
 * @property {() => void | Promise<void>} [printVersion]
 */

/**
 * Just remove or add plugin api versions here.
 *
 * @type {Record<string, () => Api | Promise<Api>>}
 */
const apis = {
    v0,
    v1
};

const getPluginApi = () => {
    const versionInfo = getVerInfoSafe();
    if (versionInfo == null) {
        // this error should only ever happen during development
        throw helpfulError([
            'The internal clawffee plugin does not have a version.',
            'This error should not happen unless you are running a development build.',
            `The plugin path is '${resolveInternalPluginPath().replaceAll("'", "\\'")}'.`
        ].join("\n\t -> "));
    }
    const pluginVersion = versionInfo?.version;
    const requiredVersion = versionInfo?.dependents?.launcher?.version;
    const launcherPluginApi = versionInfo?.dependents?.launcher?.pluginApi;
    if (typeof pluginVersion !== "string" || typeof requiredVersion !== "string" || typeof launcherPluginApi !== "string") {
        return {
            pluginVersion,
            requiredVersion,
            pluginApi: "v0"
        };
    }
    if (!semver.satisfies(meta.version, requiredVersion)) {
        throw helpfulError([
            `The internal clawffee plugin (version ${pluginVersion}) is not compatible with this launcher (version ${meta.version}).`,
            `Please update your launcher to version ${requiredVersion}.`,
            `The plugin path is '${resolveInternalPluginPath().replaceAll("'", "\\'")}'.`
        ].join("\n\t -> "));
    }
    return {
        pluginVersion,
        requiredVersion,
        pluginApi: launcherPluginApi
    };
};

const getApi = async () => {
    const { pluginVersion, pluginApi } = getPluginApi();
    const api = apis[pluginApi];
    if (api == null) {
        throw helpfulError([
            `The internal clawffee plugin (version ${pluginVersion}) requires the plugin api ${pluginApi}.`,
            `This launcher (version ${meta.version}) does not support the plugin api ${pluginApi}.`,
            [
                'This most likely means that the internal clawffee plugin is too old.',
                'Please upgrade the internal clawffee plugin manually.'
            ].join("\n\t    "),
            `The plugin path is '${resolveInternalPluginPath().replaceAll("'", "\\'")}'.`
        ].join("\n\t -> "));
    }
    return await api();
};

/**
 * try... catch, but functional instead of imperative
 *
 * @template {unknown[]} A
 * @template R
 * @param {(...args: A) => Promise<R> | R} fn 
 * @returns {(...args: A) => Promise<{ value?: Awaited<R>, error?: unknown }>}
 */
const wrapTry = (fn) => async (...args) => {
    try {
        return { value: await fn(...args) };
    } catch (error) {
        return { error };
    }
}

const main = async () => {
    if (options.version) {
        const { value: api, error } = await wrapTry(() => getApi())();
        if (api?.printVersion != null && error == null) {
            // call printVersion if plugin loaded successfully
            return await api.printVersion();
        }
        // plugin does not support version printing
        // fallback:
        const versionInfo = getVerInfoSafe();
        switch (options.format) {
            case "human":
                console.log(`Clawffee Launcher Version \u001b[33;1m${meta.version}\u001b[0m 🐾`);
                console.log(`Clawffee Path \u001b[33;1m${escapeShellArg(resolvePath())}\u001b[0m 🐾`);
                console.log(`Clawffee Version \u001b[33;1m${versionInfo?.version ?? "unknown"}\u001b[0m 🐾`);
                return;
            case "text":
                console.log(`CLAWFFEE_LAUNCHER_VERSION=${escapeShellArg(meta.version)}`);
                console.log(`CLAWFFEE_PATH=${escapeShellArg(resolvePath())}`);
                if (versionInfo != null) {
                    console.log(`CLAWFFEE_VERSION=${versionInfo?.version}`);
                }
                return;
            case "json":
                console.log(JSON.stringify({
                    path: resolvePath(),
                    launcher: meta,
                    plugins: versionInfo == null ? [] : [versionInfo],
                }, null, "\t"));
                return;
        }
    } else {
        const api = await getApi();
        return await api.launch();
    }
}

void main();
