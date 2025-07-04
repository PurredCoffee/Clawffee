const {
    createServer,
    addListener
} = require("./subscribable");
const WebSocket = require('ws');
const http = require('http');
const { associateObjectWithFile } = require("./internal/codeBinder");
const { autoSavedJSON } = require("./files");

const sharedServerData = createServer({ internal: {} });

const confPath = 'config/internal/';
const conf = autoSavedJSON(confPath + "html.json", JSON.stringify({
    "port": 4444
}))

__katz__global__listener = addListener(sharedServerData, ".", (path, newValue, oldValue) => {
    if (path[0] != 'internal')
        console.debug(`# set ${path.map((val) => val.includes('.') ? `"${val}"` : val).join(".")} from ${JSON.stringify(oldValue)} to`, newValue);
});

const functions = {}

/**
 * @callback URLCallback
 * 
 * @param {URLSearchParams} searchParams
 * @param {http.ServerResponse} response
 * @param {http.IncomingMessage} request
 */

/**
 * 
 * @param {string} path 
 * @param {URLCallback} callback 
 * @returns 
 */
function setFunction(path, callback) {
    functions[path] = callback;
    return associateObjectWithFile({
        path: path,
        callback: callback,
        unbind() {
            if (callback == functions[path])
                functions[path] = null;
        }
    }, "unbind");
}

let server = http.createServer((req, res) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'OPTIONS, POST, GET',
        'Access-Control-Max-Age': 2592000, // 30 days
    };
    let url = new URL(req.url, "http://localhost/");
    let path = url.pathname;
    if (!functions[path]) {
        console.error(`Could Not Find Function at ${path}`);
        res.writeHead(404, "no such function defined");
        res.end();
        return;
    }
    res.writeHead(200, headers);
    origwrite = res.write;
    res.write = (...data) => {
        if (!res.headersSent) {
            res.writeHead(200, headers);
        }
        origwrite(...data);
    }

    var body = "";
    req.on('readable', function () {
        let buffer = req.read();
        if (buffer !== null) {
            body += buffer.toString();
        }
    });
    req.on('end', function () {
        try {
            functions[path]?.(url.searchParams, res, req, body);
        } catch (e) {
            console.error(e);
        }
        res.end();
    });
});

let wss = new WebSocket.Server({
    server: server
});

wss.on('connection', (ws) => {
    ws.on('message', (message) => {
        try {
            console.log(JSON.parse(message.toString()));
        } catch (e) {
            console.log(e);
        }
    });
    var fun = (path, newValue) => {
        ws.send(JSON.stringify({
            p: path,
            v: newValue
        }));
    }
    const listener = addListener(sharedServerData, ".", fun);
    ws.send(JSON.stringify({
        p: "",
        v: sharedServerData
    }));
    ws.on('close', () => {
        listener.removeSelf();
    });
})


server.listen(conf.port, "localhost", () => {
    console.log(`created server on ${conf.port}`);
});

module.exports = {
    setFunction,
    sharedServerData
}