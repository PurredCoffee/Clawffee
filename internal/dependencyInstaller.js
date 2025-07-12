const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');

function checkDependenciesFile(basePath) {
    return new Promise(async (resolve, reject) => {
        if(!Bun) return resolve();

        const items = fs.readdirSync(basePath, { withFileTypes: true }).filter(item => item.isDirectory()).map(dir => dir.name);
        async function update(subfolder) {
            return new Promise(async(resolve, reject) => {
                const filePath = path.join(basePath, subfolder, 'dependencies.json');
                if (!fs.existsSync(filePath) ) {
                    return resolve();
                }
                let config;
                try {
                    config = JSON.parse(fs.readFileSync(filePath));
                } catch (e) {
                    console.error(`failed to read dependencies.json on ${subfolder}`);
                    return reject();
                }
                let modules = [];
                for (const key in config) {
                    if (Object.prototype.hasOwnProperty.call(config, key)) {
                        const version = config[key];
                        modules.push(`${key}@${version}`);
                    }
                }
                if(modules.length == 0) {
                    return resolve();
                }
                console.log(`requiring ${modules.length} dependencies from ${subfolder}`)
                const child = execFile(process.execPath, ["add", "-E", "--", ...modules], {
                    env: {
                        "BUN_BE_BUN": "1"
                    }
                });
                let output = "";
                child.stdout.on('data', (data) => {
                    output += data;
                });
                let err = "";
                child.stderr.on('data', (data) => {
                    err += data;
                })
                child.on('close', () => {
                    if(err && !err.endsWith("Saved lockfile\n")) {
                        console.error(`failed to resolve ${subfolder}:`);
                        console.error(err);
                        return reject();
                    }
                    if(output.indexOf("(no changes)" != -1)) {
                        resolve();
                    } else {
                        setTimeout(resolve, 100);
                    }
                });
            });
        }
        for(let x = 0; x < items.length; x++) {
            await update(items[x]);
        }
        resolve();
    });
}

module.exports = {
    checkDependenciesFile
}