const { obs } = require('#helpers');

// this will be automatically cleaned up when the module is unloaded
obs.onEvent("InputVolumeChanged", (inputName, inputUuid, inputVolumeMul, inputVOlumeDb) => {
    console.log(`${inputName} changed volume to ${inputVolumeMul}`);
});

// doing requests
let inputList = await obs.requests.inputs.getInputList();
console.log(inputList);

/*
    For more information read:
    https://www.npmjs.com/package/obs-websocket-js
*/