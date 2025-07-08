const { files } = require('#helpers');

// read config/data.json or use the default {} if it doesnt exist
const data = files.autoSavedJSON('config/data.json', {});

// write {x = 5} to config/data.json
data.x = 5;

// also exists for .ini files
const inidata = files.autoSavedINI('config/data.ini', {});

// save data encrypted so that when you accidentally open it the contents will not be readable
// (you still shouldnt open it because the encryption password can theoretically be cracked)
files.encryptData('config/data.enc', JSON.stringify(data));

// the other way around
files.decryptData('config/data.enc');