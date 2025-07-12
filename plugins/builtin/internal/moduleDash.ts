import fs from 'fs';
import path from 'path';
const crypto = require('crypto');

const { setFunction } = require("../server");
const { moduleByPath, moduleLoad, moduleUnload } = require("./ClawCallbacks");

let loadTimeout: NodeJS.Timeout | null = null;
setFunction('/internal/moduleLoad', (searchParams, res) => {
    if (loadTimeout) {
        return;
    }
    loadTimeout = setTimeout(() => {
        loadTimeout = null;
    }, 400);
    let modulePath = searchParams.get("path");
    const module = moduleByPath[modulePath];
    if (!module) return;
    module.conf.enabled = false;
    moduleLoad(module);
});

setFunction('/internal/moduleLoad', (searchParams, res) => {
    if (loadTimeout) {
        return;
    }
    loadTimeout = setTimeout(() => {
        loadTimeout = null;
    }, 400);
    let modulePath = searchParams.get("path");
    const module = moduleByPath[modulePath];
    if (!module) return;
    module.conf.enabled = true;
    moduleUnload(module);
});

setFunction('/internal/setModulePos', (searchParams, res) => {
    let modulePath = searchParams.get("path");
    const module = moduleByPath[modulePath];
    if (!module) return;
    module.conf.pos = {
        left: parseInt(searchParams.get("left")) ?? 1,
        top: parseInt(searchParams.get("top")) ?? 1,
        w: parseInt(searchParams.get("w")) ?? 1,
        h: parseInt(searchParams.get("h")) ?? 1,
    }
});

setFunction('/internal/setModuleImage', (searchParams, res, req, body) => {
    let modulePath = searchParams.get("path");
    let image = JSON.parse(body).image;
    const module = moduleByPath[modulePath];
    if (!module || !image) return;
    const imagesDir = path.resolve(__dirname, '../../../html/images');
    if (!fs.existsSync(imagesDir)) {
        fs.mkdirSync(imagesDir, { recursive: true });
    }

    const ext = image.startsWith('data:image/png') ? '.png'
        : image.startsWith('data:image/jpeg') ? '.jpg'
        : image.startsWith('data:image/gif') ? '.gif'
        : image.startsWith('data:image/webp') ? '.webp'
        : image.startsWith('data:image/svg+xml') ? '.svg'
        : image.startsWith('data:image/bmp') ? '.bmp'
        : image.startsWith('data:image/x-icon') ? '.ico'
        : '.img';

    const randomName = crypto.randomBytes(16).toString('hex') + ext;
    const filePath = path.join(imagesDir, randomName);

    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    fs.writeFileSync(filePath, base64Data, { encoding: 'base64' });

    if (module.conf.img) {
        const oldImagePath = path.join(imagesDir, module.conf.img);
        if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
        }
    }
    module.conf.img = `${randomName}`;
});

setFunction('/internal/setModuleName', (searchParams, res) => {
    let modulePath = searchParams.get("path");
    let name = searchParams.get("name");
    const module = moduleByPath[modulePath];
    if (!module) return;
    module.conf.name = name;
});

export {}