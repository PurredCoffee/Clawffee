const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const readline = require('readline');

function dryRun(modulelist) {
    return new Promise((resolve, reject) => {
        const add = execFile(process.execPath, ["add", "--only-missing", "--no-sumary", "--dry-run", "--", ...modulelist], {
            env: {
                "BUN_BE_BUN": "1"
            }
        });
        let output = "";
        let err = "";
        add.stdout.on('data', (data) => {
            output += data;
        });
        add.stderr.on('data', (data) => {
            err += data;
        })
        add.on('close', () => {
            const errors = err.split("\n").filter((val) => val.startsWith("error: "));
            errors.forEach((e) => {
                console.error(e);
            });
            if(errors.length) {
                return reject(errors);
            }
            let dependencies = output.split("\n").filter((val) => val.startsWith("installed")).map((val) => val.substring(10));
            return resolve(dependencies);
        });
    });
}

async function update(modulelist) {
    return new Promise((resolve, reject) => {
        const add = execFile(process.execPath, ["add", "--only-missing", "--", ...modulelist], {
            env: {
                "BUN_BE_BUN": "1"
            }
        });
        add.on('close', () => {
            resolve();
        });
    });
}

function downloadDependencies(basePath) {
    return new Promise(async (resolve, reject) => {
        if(!Bun) return resolve();

        const items = fs.readdirSync(basePath, { withFileTypes: true }).filter(item => item.isDirectory()).map(dir => dir.name);
        let modules = {};
        function getModules(subfolder) {
            return new Promise(async(resolve, reject) => {
                const filePath = path.join(basePath, subfolder, 'dependencies.json');
                if (!fs.existsSync(filePath) ) {
                    return resolve();
                }
                let config;
                try {
                    config = JSON.parse(fs.readFileSync(filePath));
                    if(!Array.isArray(config)) throw Error();
                } catch (e) {
                    console.error(`failed to read dependencies.json on ${subfolder}`);
                    return;
                }
                config.forEach(dep => {
                    modules[dep] = true;
                });
            });
        }
        for(let x = 0; x < items.length; x++) {
            getModules(items[x]);
        }
        let modulelist = [];
        for (const dep in modules) {
            if (Object.prototype.hasOwnProperty.call(modules, dep)) {
                modulelist.push(`${dep}@latest`)
            }
        }
        console.log("Updating dependencies...");
        try {
            let updateList = await dryRun(modulelist);
            if(updateList.length == 0) {
                console.log("No updates found!");
                resolve();
                return;
            }
            console.log(`Installing the following dependencies:`);
            updateList.forEach((dep) => {
                console.log("    ", dep);
            });
            const readline = require('readline');
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });
            rl.question("Are you sure? [Press Enter to continue]", async () => {
                rl.close();
                await update(modulelist);
                resolve();
            });
        } catch(e) {console.error(e)}
    });
}

module.exports = {
    downloadDependencies
}