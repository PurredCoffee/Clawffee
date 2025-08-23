const { createServer, addListener } = require('../plugins/internal/_internal/subscribable.js');
const { server: ServerListener } = require('../plugins/internal/internal.js');
const sharedServerData = createServer({internal: {}});

let bakedhtml;
let awaiters = [];

let requirements = {
    html: null,
    css: null,
    js: null
};

import('./htmlbuilder.js').then((baked) => {
    bakedhtml = baked.default;
    awaiters.forEach(element => {
        element(new Response(bakedhtml, {headers: { "Content-Type": "text/html" }}))
    });
})

const server = Bun.serve({
    port: 4444,
    hostname: "localhost",
    websocket: {
        async message(ws, message) {
        },
        async open(ws) {
            if(ws.data.path === "internal") {
                ws.subscribe('internal');
                ws.send(JSON.stringify({
                    p: [],
                    v: sharedServerData
                }));
            } else {
                ws.send(JSON.stringify({
                    p: [],
                    v: {...sharedServerData, internal: undefined}
                }));
            }
            ws.subscribe('all');
        }
    },
    fetch(req) {
        let extradata = { data: {} }
        const url = new URL(req.url, 'http://localhost:4444');
        if(url.pathname == '/internal/')
            extradata.data.path = "internal";
        const success = server.upgrade(req, extradata);
        if (success) {
            return undefined
        }

        function wrapIncorrectData(res) {
            if(res instanceof Response) return res;
            if(typeof res == 'string') return new Response(res);
            if(typeof res == 'object') return new Response(JSON.stringify(res));
            if(!res) return new Response("");
            return new Response(String(res));
        }

        if(functions[url.pathname]) {
            try {
                let res = functions[url.pathname](req, url);
                if(res instanceof Promise) {
                    return new Promise((resolve) => {
                        res.then((val) => resolve(wrapIncorrectData(val))).catch((e) => {
                            console.error(e);
                            resolve(new Response('Internal Error: ' + e, {
                                status: 501
                            }));
                        });
                    });
                }
                return wrapIncorrectData(res);
            } catch (e) {
                console.error(e);
                return new Response('Internal Error: ' + e, {
                    status: 501
                })
            }
        }
        console.warn("unknown url", url.pathname);
        return new Response('404 not found', {
            status: 404
        });
    },
    routes: {
        "/internal/dashboard/": () => {
            return new Promise((resolve) => {
                if(bakedhtml) {
                    resolve(new Response(bakedhtml, {headers: { "Content-Type": "text/html" }}));
                }
                awaiters.push(resolve);
            });
        },
        "/internal/dashboard/images/:image": (req) => {
            try {
                return new Response(Bun.file(`./images/${req.params.image}`));
            } catch (e) {
                return new Response("404 not found", {
                    status: 404
                });
            }
        }
    }
})

addListener(sharedServerData, "", (path, newValue, oldValue) => {
    if (path[0] == 'internal') {
        server.publish('internal', JSON.stringify({
            v: newValue,
            p: path
        }));
    } else {
        server.publish('all', JSON.stringify({
            v: newValue,
            p: path
        }));
    }
});

const functions = {};
ServerListener["#setFunctionsObj"](functions);
ServerListener['#setSharedServerData'](sharedServerData);

console.log(`server running on port ${server.port}`);

module.exports = {
    sharedServerData
}