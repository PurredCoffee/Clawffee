
type moduledata = {
    module: any,
    filePath: string,
    confPath: string,
    modulePath: string,
    parsedModulePath: string | null,
    name: string,
    watcher: any,
    errored: boolean,
}
type loadedmodule = {
    children: {[file: string]: loadedmodule}
    parent: loadedmodule | null
    dependencies: string[]
    conf: {enabled: boolean}
    active: boolean
    module: moduledata,
    serverData: any
}

const callbacks: {[name: string]: ((...any) => void)[]} = {};
let moduleByPath: loadedmodule = {
    children: {},
    parent: null,
    dependencies: [],
    conf: {enabled:false},
    module: {
        module: null, filePath: "", confPath: "", modulePath: "",
        parsedModulePath: "", name: "", watcher: null, errored: false,
    },
    active: false,
    serverData: {}
};
function registerModuleByPath(MBP: loadedmodule) {
    moduleByPath = MBP;
}

function registerCallback(name: string, callback: (...any) => void) {
    callbacks[name] = callbacks[name] ?? [];
    callbacks[name].push(callback);
}
function callback(name: string, ...parameters) {
    callbacks[name]?.forEach(element => {
        element(...parameters);
    });
}

function onFileCreate(callback: (string) => void) {registerCallback('fileCreate', callback)}
function fileCreate(fileName: string) {callback('fileCreate', fileName)}

function onFileChange(callback: (string) => void) {registerCallback('fileChange', callback)}
function fileChange(fileName: string) {callback('fileChange', fileName)}

function onFileDelete(callback: (string) => void) {registerCallback('fileDelete', callback)}
function fileDelete(fileName: string) {callback('fileDelete', fileName)}

function onModuleLoad(callback: (string) => void) {registerCallback('moduleLoad', callback)}
function moduleLoad(fileName: string) {callback('moduleLoad', fileName)}

function onModuleUnload(callback: (string) => void) {registerCallback('moduleUnload', callback)}
function moduleUnload(fileName: string) {callback('moduleUnload', fileName)}

function onReloadPlugin(callback: (string) => void) {registerCallback('pluginReload', callback)}
function reloadPlugin(fileName: string) {callback('pluginReload', fileName)}

function onBlockPlugin(callback: (string) => void) {registerCallback('pluginBlock', callback)}
function blockPlugin(fileName: string) {callback('pluginBlock', fileName)}

export {
    moduleByPath, registerModuleByPath,

    onFileCreate,fileCreate,
    onFileChange,fileChange,
    onFileDelete,fileDelete,
    onModuleLoad,moduleLoad,
    onModuleUnload,moduleUnload,

    onReloadPlugin, reloadPlugin,
    onBlockPlugin, blockPlugin
}