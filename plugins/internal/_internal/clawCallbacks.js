const callbacks = {};
let moduleByPath = {};

function registerModuleByPath(MBP) {
    moduleByPath = MBP;
}

function registerCallback(name, callback) {
    callbacks[name] = callbacks[name] ?? [];
    callbacks[name].push(callback);
}
function callback(name, ...parameters) {
    callbacks[name]?.forEach(element => {
        element(...parameters);
    });
}

function onFileCreate(callback) {registerCallback('fileCreate', callback)}
function fileCreate(fileName) {callback('fileCreate', fileName)}

function onFileChange(callback) {registerCallback('fileChange', callback)}
function fileChange(fileName) {callback('fileChange', fileName)}

function onFileDelete(callback) {registerCallback('fileDelete', callback)}
function fileDelete(fileName) {callback('fileDelete', fileName)}

function onModuleLoad(callback) {registerCallback('moduleLoad', callback)}
function moduleLoad(fileName) {callback('moduleLoad', fileName)}

function onModuleUnload(callback) {registerCallback('moduleUnload', callback)}
function moduleUnload(fileName) {callback('moduleUnload', fileName)}

function onReloadPlugin(callback) {registerCallback('pluginReload', callback)}
function reloadPlugin(fileName) {callback('pluginReload', fileName)}

function onBlockPlugin(callback) {registerCallback('pluginBlock', callback)}
function blockPlugin(fileName) {callback('pluginBlock', fileName)}

module.exports = {
    moduleByPath: new Proxy({}, {
        get(target, property, receiver) {
            return moduleByPath[property];
        },
        ownKeys(target) {
            return Object.keys(target);
        }
    }), registerModuleByPath,

    onFileCreate,fileCreate,
    onFileChange,fileChange,
    onFileDelete,fileDelete,
    onModuleLoad,moduleLoad,
    onModuleUnload,moduleUnload,

    onReloadPlugin, reloadPlugin,
    onBlockPlugin, blockPlugin
}