const { obs } = require('#helpers');

// this will be automatically cleaned up when the module is unloaded
obs.client.on("InputVolumeChanged", (data) => {
    console.log(`${data.inputName} changed volume to ${data.inputVolumeMul}`);
});

// doing requests
let inputList = await obs.client.call('GetInputList', {});
console.log(inputList);

/*
    For more information read:
    https://www.npmjs.com/package/obs-websocket-js
*/