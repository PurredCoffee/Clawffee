return;

const fs = require('fs');
const pathModule = require('path');
const crypto = require('crypto');

const { setFunction } = require("./server");
const { clawCallbacks: { moduleByPath, moduleLoad, moduleUnload } } = require("../internal/internal");

let loadTimeout = null;
setFunction('/internal/moduleUnload', (req, url) => {
    if (loadTimeout) {
        return;
    }
    loadTimeout = setTimeout(() => {
        loadTimeout = null;
    }, 400);
    let path = url.searchParams.get("path");
    const module = moduleByPath[path];
    if (!module) return;
    module.conf.enabled = false;
    moduleUnload(path);
});

setFunction('/internal/moduleLoad', (req, url) => {
    if (loadTimeout) {
        return;
    }
    loadTimeout = setTimeout(() => {
        loadTimeout = null;
    }, 400);
    let path = url.searchParams.get("path");
    const module = moduleByPath[path];
    if (!module) return;
    module.conf.enabled = true;
    moduleLoad(path);
});

setFunction('/internal/setModulePos', (req, url) => {
    let path = url.searchParams.get("path");
    const module = moduleByPath[path];
    if (!module) return;
    module.conf.pos = {
        left: parseInt(url.searchParams.get("left")) ?? 1,
        top: parseInt(url.searchParams.get("top")) ?? 1,
        w: parseInt(url.searchParams.get("w")) ?? 1,
        h: parseInt(url.searchParams.get("h")) ?? 1,
    }
});

setFunction('/internal/setModuleImage', async (req, url) => {
    let path = url.searchParams.get("path");
    let image = (await req.text()).image;
    const module = moduleByPath[path];
    if (!module || !image) return;
    const imagesDir = './html/images';
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
    const filePath = pathModule.join(imagesDir, randomName);

    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    fs.writeFileSync(filePath, base64Data, { encoding: 'base64' });

    if (module.conf.img) {
        const oldImagePath = pathModule.join(imagesDir, module.conf.img);
        if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
        }
    }
    module.conf.img = `${randomName}`;
});

setFunction('/internal/setModuleName', (req, url) => {
    let path = url.searchParams.get("path");
    let name = url.searchParams.get("name");
    const module = moduleByPath[path];
    if (!module) return;
    module.conf.name = name;
});