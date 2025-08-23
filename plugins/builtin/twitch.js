const fs = require('fs');
const { ApiClient } = require('@twurple/api');
const { ChatClient } = require('@twurple/chat');
const { EventSubWsListener } = require('@twurple/eventsub-ws');
const { RefreshingAuthProvider, StaticAuthProvider, exchangeCode } = require('@twurple/auth');
const path = require("path");

const {
    codeBinder: { associateClassWithFile }, 
    clawCallbacks: { reloadPlugin, blockPlugin }
} = require('../internal/internal');

const { autoSavedJSON, encryptData, decryptData, readFileSyncDefault } = require("./files");
const { setFunction, sharedServerData, openURL } = require("./server");
const { createUnfailable } = require("./unfailable");

if(!fs.existsSync(path.join(__dirname, 'twitch_data.js'))) {
    fs.writeFileSync(path.join(__dirname, 'twitch_data.js'), "module.exports = " + JSON.stringify({
        IDs: {},
        redeems: {}
    }))
}
const extraData = require("./twitch_data");


const confPath = 'config/internal/';
const oauthFilesPath = confPath + 'twitch/oauth/';
let clientSecret = fs.existsSync(confPath + 'twitch/secret.enc') ? decryptData(confPath + 'twitch/secret.enc') : null;
const conf = autoSavedJSON(confPath + 'twitch.json', {
    chats: {},
    clientID: "e728jp4m53o8o9jb0q34nfefhjmd8t",
    printChannel: ""
});
const clientID = conf.clientID;
const channels = conf.chats;


/**
 * @typedef {Object} ConnectedBot
 * @property {number} id - The user ID of the bot.
 * @property {string} name - The user login of the bot.
 * @property {import('@twurple/api').ApiClient} api - The Twurple API client for the bot.
 * @property {import('@twurple/chat').ChatClient} chat - The Twurple Chat client for the bot.
 * @property {(channel: string, message: string) => Promise<void>} say - Function to send a message to a channel.
 * @property {(channel: string, message: string, replyTo: import('@twurple/chat').ChatMessage) => Promise<void>} reply - Function to reply to a message in a channel.
 * @property {(callback: Function) => void} onWhisper - Function to register a whisper event callback.
 */

/**
 * Stores connected bots by username.
 * @type {Object.<string, ConnectedBot>}
 */
const connectedBots = {};

/**
 * The main user connected to twitch. Main API object.
 */
const connectedUser = {
    /**
     * @type number
     */
    id: 0,
    /**
     * @type string
     */
    name: "",
    /**
     * @type import('@twurple/api').ApiClient
     */
    api: createUnfailable(),
    /**
     * @type import('@twurple/chat').ChatClient
     */
    chat: createUnfailable(),
    /**
     * @type import('@twurple/eventsub-ws').EventSubWsListener
     */
    listener: createUnfailable(),
    /**
     * Sends a regular chat message to a channel.
     * @param {string} channel - The channel to send the message to.
     * @param {string} text - The message to send.
     * @returns {Promise<void>}
     */
    say: async (channel, message) => { },
    /**
     * Replies to a chat message in a channel.
     * @param {string} channel - The channel to send the message to.
     * @param {string} text - The message to send.
     * @param {import('@twurple/chat').ChatMessage} replyTo - The message to reply to.
     * @returns {Promise<void>}
     */
    reply: async (channel, message) => { },
};


/* -------------------------- Connection Management ------------------------- */

function saveToken(path, newTokenData) {
    let data = JSON.stringify(decryptData(path));
    data.tokenData = newTokenData;
    encryptData(path, JSON.stringify(data));
}

/**
 * Adds a new bot using the provided token data.
 * @param {object} tokenData - The OAuth token data for the bot.
 * @returns {Promise<{id: string, name: string}>} The user ID and name of the added bot.
 */
async function addBot(tokenData, main = false) {
    let auth;

    // depending on the grant flow, work differently
    if (clientSecret) {
        auth = new RefreshingAuthProvider({ clientId: clientID, clientSecret: clientSecret });
        auth.onRefresh(async (userID, newTokenData) => saveToken(`${oauthFilesPath}${userID}${(main ? ".main" : "")}.json.enc`, newTokenData));
        userID = await auth.addUserForToken(tokenData, ['chat']);
    } else {
        auth = new StaticAuthProvider(clientID, tokenData.accessToken || tokenData.access_token, tokenData.scopes || ['chat']);
        const tempApi = new ApiClient({ authProvider: auth });
    }

    const api = associateClassWithFile(new ApiClient({ authProvider: auth }), "unbind");
    const userInfo = (await api.callApi({
        type: 'helix',
        url: 'users'
    })).data[0];
    const TokenInfo = (await api.getTokenInfo());
    const ownName = userInfo.login;
    if (!channels[ownName] || !channels[ownName].channels) {
        channels[ownName] = {
            channels: []
        }
    }
    const ownedChannels = channels[ownName].channels;
    const chat = associateClassWithFile(new ChatClient({ authProvider: auth, channels: ownedChannels }), "unbind");
    chat.connect();

    connectedBots[ownName] = {
        api: api,
        chat: chat,
        id: userInfo.id,
        name: ownName,
        say: async (channel, message) => await chat.say(channel, message),
        reply: async (channel, message, replyTo) => await chat.say(channel, message, {
            replyTo: replyTo
        }),
        onWhisper: (callback) => chat.onWhisper(callback)
    };
    console.log(`added token for ${userInfo.id} (${ownName}) and connected to [${ownedChannels}]`);
    return { id: userInfo.id, name: ownName, pfp: userInfo.profile_image_url, expiryDate: TokenInfo.expiryDate.getTime() };
}

/**
 * make the eventsublistener listeners subscribable instead of requiring a new sub for everything
 * @param {EventSubWsListener} object 
 * @returns 
 */
function makeEventSubListenerEventable(object) {
    const activeEventListeners = {};
    const activeListeners = {};
    return new Proxy(object, {
        get(target, property, receiver) {
            const value = Reflect.get(target, property, receiver);
            if (typeof value === 'function' && property.startsWith('on')) {
                return (...args) => {
                    let callback = args.pop();
                    let argscopy = [...args, property];

                    let el = activeEventListeners;
                    let al = activeListeners;

                    while (argscopy.length > 1) {
                        let curarg = argscopy.pop();
                        el = el[curarg] = el[curarg] ?? {};
                        al = al[curarg] = al[curarg] ?? {};
                    }
                    if (!el[argscopy[0]]) el[argscopy[0]] = [];
                    el[argscopy[0]].push(callback);
                    if (!al[argscopy[0]]) {
                        args.push((...newargs) => {
                            el[argscopy[0]].forEach((call) => call(...newargs));
                        });
                        al[argscopy[0]] = value.apply(object, args);
                    }
                    return {
                        ...al[argscopy[0]],
                        suspend() {
                            el[argscopy[0]] = el[argscopy[0]].filter((v) => v != callback);
                        },
                        start() {
                            el[argscopy[0]].push(callback);
                        },
                        stop() {
                            el[argscopy[0]] = el[argscopy[0]].filter((v) => v != callback);
                        }
                    }
                }
            }
            return value;
        }
    });
}

/**
 * Connects all bots by loading and decrypting their OAuth tokens.
 * @returns {Promise<void>}
 */
async function connect() {
    connectedUser.listener.stop();
    Object.keys(connectedBots).forEach(key => {
        connectedBots[key].chat.quit()
        delete connectedBots[key]
    });
    const connectionInfo = {
        main: {},
        bots: [],
        failed: [],
        redeems: {}
    }
    if (fs.existsSync(oauthFilesPath)) {
        const files = fs.readdirSync(oauthFilesPath);
        for (const file of files) {
            if (file.endsWith('.json.enc')) {
                const userId = path.basename(file, '.json.enc');
                const decrypted = decryptData(path.join(oauthFilesPath, file));
                if (decrypted) {
                    try {
                        const tokenData = JSON.parse(decrypted);
                        if (file.endsWith('.main.json.enc')) {
                            let user = (await addBot(tokenData.tokenData, true));
                            let name = user.name;
                            connectedUser.api = connectedBots[name].api;
                            connectedUser.chat = connectedBots[name].chat;
                            connectedUser.listener = associateClassWithFile(
                                makeEventSubListenerEventable(new EventSubWsListener({ apiClient: connectedUser.api })),
                                "stop"
                            );
                            connectedUser.listener.start();
                            connectedUser.say = connectedBots[name].say;
                            connectedUser.reply = connectedBots[name].reply;
                            try {
                                (await connectedUser.api.channelPoints.getCustomRewards(user.id, false)).forEach((val) => {
                                    connectionInfo.redeems[val.id] = {id: val.id, title: val.title, img: val.getImageUrl(2), managed: false};
                                });
                                (await connectedUser.api.channelPoints.getCustomRewards(user.id, true)).forEach((val) => {
                                    connectionInfo.redeems[val.id].managed = true;
                                });
                            } catch (e) {}
                            connectionInfo.main = { ...user, listenTo: channels[name].channels };
                        } else {
                            let user = (await addBot(tokenData.tokenData, true));
                            let name = user.name;
                            connectionInfo.bots.push(
                                { ...user, listenTo: channels[name].channels }
                            );
                        }
                    } catch (e) {
                        console.error(`Failed to load token for user ${userId}:`, e);
                        let user = JSON.parse(decrypted).userInfo;
                        let name = user.name;
                        connectionInfo.failed.push({ ...user, listenTo: channels[name].channels });
                    }
                } else {
                    console.error(`Failed to decrypt the token for user ${userId}`);
                }
            }
        }
    }

    connectionInfo.redeems = {
        "0748ce7c-a1b9-4510-874d-953c7c4dbe70": {"id":"0748ce7c-a1b9-4510-874d-953c7c4dbe70","title":"Feed the Dragon","img":"https://static-cdn.jtvnw.net/custom-reward-images/default-2.png","managed":false},
        "3a78b9fe-7fa5-4a07-a9f3-cb402b138c0d": {"id":"3a78b9fe-7fa5-4a07-a9f3-cb402b138c0d","title":"Suggest a Poll","img":"https://static-cdn.jtvnw.net/custom-reward-images/bulb-2.png","managed":false},
        "1c47f2c1-9a55-4c4f-9feb-242a00b3b194": {"id":"1c47f2c1-9a55-4c4f-9feb-242a00b3b194","title":"Fireworks!","img":"https://static-cdn.jtvnw.net/custom-reward-images/default-2.png","managed":false},
        "1c868368-df29-4c70-aaf1-9626d3fcb01c": {"id":"1c868368-df29-4c70-aaf1-9626d3fcb01c","title":"Let's Make a Level","img":"https://static-cdn.jtvnw.net/custom-reward-images/default-2.png","managed":false},
        "2a591ee0-76c3-42de-afb1-508d91ac9cd8": {"id":"2a591ee0-76c3-42de-afb1-508d91ac9cd8","title":"Super Expert","img":"https://static-cdn.jtvnw.net/custom-reward-images/23425107/2a591ee0-76c3-42de-afb1-508d91ac9cd8/49893aca-91ba-48bb-8319-6af03a367080/custom-2.png","managed":false},
        "32b3f7bc-7e2d-43a9-92c8-73e70bf55eac": {"id":"32b3f7bc-7e2d-43a9-92c8-73e70bf55eac","title":"FaxonZeta 's VIP","img":"https://static-cdn.jtvnw.net/custom-reward-images/23425107/32b3f7bc-7e2d-43a9-92c8-73e70bf55eac/3bee4498-78c2-431f-8598-10645e85d7d9/custom-2.png","managed":false},
        "35297971-8bdf-4f0d-b5db-1ca9d5aa35e8": {"id":"35297971-8bdf-4f0d-b5db-1ca9d5aa35e8","title":"Throw Something","img":"https://static-cdn.jtvnw.net/custom-reward-images/23425107/35297971-8bdf-4f0d-b5db-1ca9d5aa35e8/0588cd38-890b-4e9a-a21b-f766f7ec4420/custom-2.png","managed":false},
        "3a78b9fe-7fa5-4a07-a9f3-cb402b138c0d": {"id":"3a78b9fe-7fa5-4a07-a9f3-cb402b138c0d","title":"Suggest a Poll","img":"https://static-cdn.jtvnw.net/custom-reward-images/bulb-2.png","managed":false},
        "47014161-05e4-4dd7-abf1-e70299bd3468": {"id":"47014161-05e4-4dd7-abf1-e70299bd3468","title":"Gift Sub","img":"https://static-cdn.jtvnw.net/custom-reward-images/23425107/47014161-05e4-4dd7-abf1-e70299bd3468/abd63474-8346-424a-b5cb-2dfb30f0843c/custom-2.png","managed":false},
        "5d7cd6bf-ddf9-4d66-836f-642f58e4d51f": {"id":"5d7cd6bf-ddf9-4d66-836f-642f58e4d51f","title":"Change Character","img":"https://static-cdn.jtvnw.net/custom-reward-images/23425107/5d7cd6bf-ddf9-4d66-836f-642f58e4d51f/633efcc4-7e3d-41c7-9adb-47beaae67dc6/custom-2.png","managed":false},
        "657dc93f-f766-41fc-85e5-7bf4fa5b28d6": {"id":"657dc93f-f766-41fc-85e5-7bf4fa5b28d6","title":"Emote Only Mode","img":"https://static-cdn.jtvnw.net/custom-reward-images/23425107/657dc93f-f766-41fc-85e5-7bf4fa5b28d6/8f14d2c1-d4c5-440c-b362-7dfc7878f0dc/custom-2.png","managed":false},
        "660e4e71-e4b8-4311-aa1f-3270ba8742cf": {"id":"660e4e71-e4b8-4311-aa1f-3270ba8742cf","title":"Bad fox, bad!","img":"https://static-cdn.jtvnw.net/custom-reward-images/23425107/660e4e71-e4b8-4311-aa1f-3270ba8742cf/9b949843-6615-4c6d-9c85-ba0e338ae73d/custom-2.png","managed":false},
        "6de870a1-42dd-4f72-8b4b-f04945af8f46": {"id":"6de870a1-42dd-4f72-8b4b-f04945af8f46","title":"Play My Level(s)!","img":"https://static-cdn.jtvnw.net/custom-reward-images/23425107/6de870a1-42dd-4f72-8b4b-f04945af8f46/a87e9cae-08db-483d-87bb-52ba0e8808d9/custom-2.png","managed":false},
        "75ab4d39-508c-43fa-ab00-1364f5a4e330": {"id":"75ab4d39-508c-43fa-ab00-1364f5a4e330","title":"Pet the Foxes","img":"https://static-cdn.jtvnw.net/custom-reward-images/23425107/75ab4d39-508c-43fa-ab00-1364f5a4e330/5d897f39-fdc6-41b3-bf6e-7b45d03adb19/custom-2.png","managed":false},
        "7a319179-d235-4d6f-b48f-bea5510c696f": {"id":"7a319179-d235-4d6f-b48f-bea5510c696f","title":"Gift Sub-old","img":"https://static-cdn.jtvnw.net/custom-reward-images/23425107/7a319179-d235-4d6f-b48f-bea5510c696f/ab9d330e-3e01-4507-b99c-efb8696dee90/custom-2.png","managed":false},
        "7e58ceb9-80c7-4410-a447-283d2bc869f7": {"id":"7e58ceb9-80c7-4410-a447-283d2bc869f7","title":"Water the Foxes","img":"https://static-cdn.jtvnw.net/custom-reward-images/23425107/7e58ceb9-80c7-4410-a447-283d2bc869f7/876ce77c-14fb-46f7-bd97-36d4adfe5dbb/custom-2.png","managed":false},
        "89793a59-1d11-4ff8-9e0f-7158ffc532ab": {"id":"89793a59-1d11-4ff8-9e0f-7158ffc532ab","title":"FaxonZeta 's VIPCOPY","img":"https://static-cdn.jtvnw.net/custom-reward-images/default-2.png","managed":false},
        "950c67b7-d606-41b1-9b47-0fc719b9bed1": {"id":"950c67b7-d606-41b1-9b47-0fc719b9bed1","title":"1st: LavFox","img":"https://static-cdn.jtvnw.net/custom-reward-images/23425107/950c67b7-d606-41b1-9b47-0fc719b9bed1/023557c7-2d95-404d-9cb6-b1c03f99267a/custom-2.png","managed":false},
        "a33d36b3-53ba-4a2d-97b8-a15f525ec822": {"id":"a33d36b3-53ba-4a2d-97b8-a15f525ec822","title":"Comments On/Off","img":"https://static-cdn.jtvnw.net/custom-reward-images/23425107/a33d36b3-53ba-4a2d-97b8-a15f525ec822/7f1b7be1-f8fe-42b4-85d8-fbc0b57d3c4d/custom-2.png","managed":false},
        "b221b55f-ab1b-409b-a536-5551b9295e49": {"id":"b221b55f-ab1b-409b-a536-5551b9295e49","title":"New Arrivals","img":"https://static-cdn.jtvnw.net/custom-reward-images/23425107/b221b55f-ab1b-409b-a536-5551b9295e49/5a179046-1052-45bf-b7be-1168db1dd1d1/custom-2.png","managed":false},
        "b4db4bd0-1fe4-45ac-86ff-0db523d5debe": {"id":"b4db4bd0-1fe4-45ac-86ff-0db523d5debe","title":"Eat your Blueberries","img":"https://static-cdn.jtvnw.net/custom-reward-images/23425107/b4db4bd0-1fe4-45ac-86ff-0db523d5debe/e071a7d9-764d-49b7-9133-b598b9631c56/custom-2.png","managed":false},
        "c3033f3d-a644-42c8-a6f5-f7c46363d977": {"id":"c3033f3d-a644-42c8-a6f5-f7c46363d977","title":"Draw a comment!","img":"https://static-cdn.jtvnw.net/custom-reward-images/23425107/c3033f3d-a644-42c8-a6f5-f7c46363d977/5649104d-a75a-49f8-896d-203688e5ee47/custom-2.png","managed":false},
        "c317d9b3-3592-480e-a89a-5357eb6043a1": {"id":"c317d9b3-3592-480e-a89a-5357eb6043a1","title":"I'll draw you actual art","img":"https://static-cdn.jtvnw.net/custom-reward-images/23425107/c317d9b3-3592-480e-a89a-5357eb6043a1/fd9859ff-a876-4421-b621-3bd8be09b8a7/custom-2.png","managed":false},
        "c49936b8-eec5-484c-8376-702cc01e8790": {"id":"c49936b8-eec5-484c-8376-702cc01e8790","title":"Highlight a Moment","img":"https://static-cdn.jtvnw.net/custom-reward-images/23425107/c49936b8-eec5-484c-8376-702cc01e8790/ff847955-537b-4953-bedb-76e279d72c0d/custom-2.png","managed":false},
        "cb2436a4-d2d2-4631-83df-290bd91b51dc": {"id":"cb2436a4-d2d2-4631-83df-290bd91b51dc","title":"Play Balatro","img":"https://static-cdn.jtvnw.net/custom-reward-images/23425107/cb2436a4-d2d2-4631-83df-290bd91b51dc/b6bad27a-3264-4804-8143-1bd595aff362/custom-2.png","managed":false},
        "cbf5d992-1e21-48ce-9d8d-982e77a74ff2": {"id":"cbf5d992-1e21-48ce-9d8d-982e77a74ff2","title":"Change Avatar","img":"https://static-cdn.jtvnw.net/custom-reward-images/23425107/cbf5d992-1e21-48ce-9d8d-982e77a74ff2/ac5f5db4-8711-4d8b-9b53-ead14cae1c95/custom-2.png","managed":false},
        "d9dc4683-52a8-4855-bae8-8fca4760d86a": {"id":"d9dc4683-52a8-4855-bae8-8fca4760d86a","title":"Dodge, quick!","img":"https://static-cdn.jtvnw.net/custom-reward-images/23425107/d9dc4683-52a8-4855-bae8-8fca4760d86a/95b00eed-c685-4b31-8400-65036dd256a9/custom-2.png","managed":false},
        "dc5822bc-4268-4416-be00-562ea158d9ca": {"id":"dc5822bc-4268-4416-be00-562ea158d9ca","title":"Endless Expert","img":"https://static-cdn.jtvnw.net/custom-reward-images/23425107/dc5822bc-4268-4416-be00-562ea158d9ca/f23d94b1-3335-49b0-a49c-c191f2c7cb08/custom-2.png","managed":false},
        "e05143f2-48cb-4eb9-8416-7fae63aa7168": {"id":"e05143f2-48cb-4eb9-8416-7fae63aa7168","title":"It's time to D‑D‑DUEL!","img":"https://static-cdn.jtvnw.net/custom-reward-images/23425107/e05143f2-48cb-4eb9-8416-7fae63aa7168/548d3270-76b9-4f7e-bb9a-32676208328c/custom-2.png","managed":false},
        "e3e84800-0cbe-4e9f-90d8-7a377efc8e65": {"id":"e3e84800-0cbe-4e9f-90d8-7a377efc8e65","title":"Choose Next Jackbox Game!","img":"https://static-cdn.jtvnw.net/custom-reward-images/default-2.png","managed":false},
        "e9de8b54-a956-49b0-8073-5b8ebbcdd0e2": {"id":"e9de8b54-a956-49b0-8073-5b8ebbcdd0e2","title":"Smooch the Foxes","img":"https://static-cdn.jtvnw.net/custom-reward-images/23425107/e9de8b54-a956-49b0-8073-5b8ebbcdd0e2/61f4afe6-f769-4a1a-92e3-07ea53b5ae40/custom-2.png","managed":false},
    };
    sharedServerData.internal.twitch = connectionInfo;
    console.log("Connected to Twitch API with Twurple.");
    reloadPlugin(__filename);
}
blockPlugin(__filename);
connect()


/* ------------------------ Websites to add accounts ------------------------ */

function addNew(main, scopes) {
    return (req, url) => {
        const redirectURL = "http://localhost:4444/twitch";
        const twitchURL = "https://id.twitch.tv/oauth2/authorize";
        const oauthURL = `${twitchURL}?response_type=${clientSecret ? 'code' : 'token'}&force_verify=true&client_id=${clientID}&redirect_uri=${redirectURL}&scope=${scopes.join("+")}`

        setFunction("/twitch", async (req, url) => {
            // Save the code to a file
            let tokenData;

            //depending on the grant flow, work differently
            if (clientSecret) {
                const code = url.searchParams.get("code");
                if (!code) {
                    return new Response("Missing code for grant flow.", {
                        status: 402
                    });
                }
                tokenData = await exchangeCode(clientID, clientSecret, code, redirectURL);
            } else {
                let accessToken = null;
                accessToken = url.searchParams.get("access_token");
                if (!accessToken) {
                    return new Response(`
                        <html>
                            <body>
                                <script>
                                    // If access_token is in the fragment, redirect with it as a search param
                                    if (window.location.hash) {
                                        const params = new URLSearchParams(window.location.hash.slice(1));
                                        if (params.has('access_token')) {
                                            const url = new URL(window.location.href);
                                            url.hash = '';
                                            url.search = params.toString();
                                            window.location.replace(url.toString());
                                        } else {}
                                    }
                                </script>
                                <p>Processing Twitch OAuth...</p>
                            </body>
                        </html>
                    `, {
                        headers: { "Content-Type": "text/html" }
                    });
                }
                tokenData = {
                    accessToken,
                    scopes: (url.searchParams.get("scope") || "").split(" ").filter(Boolean)
                };
            }
            const oldMainPath = `${oauthFilesPath}${connectedUser.id}.main.json.enc`;
            const value = await addBot(tokenData, main);
            if (main) {
                if (fs.existsSync(oldMainPath)) {
                    fs.unlinkSync(oldMainPath);
                }
                encryptData(`${oauthFilesPath}${value.id}.main.json.enc`, JSON.stringify({
                    userInfo: value,
                    tokenData: tokenData
                }))
            } else {
                encryptData(`${oauthFilesPath}${value.id}.main.enc`, JSON.stringify({
                    userInfo: value,
                    tokenData: tokenData
                }))
            }
            extraData.IDs[value.name] = parseInt(value.id);
            fs.writeFileSync(path.join(__dirname, 'twitch_data.js'), "module.exports = " + JSON.stringify(extraData));
            connect();
            return new Response(`Code for ${value.id} saved and encrypted.`);
        });
        openURL(oauthURL);
    }
}
setFunction("/twitch/add/main", addNew(true, [
    "channel:bot",
    "channel:moderate",
    "chat:edit",
    "chat:read",
    "user:bot",
    "user:read:chat",
    "user:write:chat",
    "user:edit",
    "moderation:read",
    "bits:read",
    "channel:read:charity",
    "moderator:read:chatters",
    "channel:read:goals",
    "channel:read:editors",
    "user:read:email",
    "user:read:follows",
    "user:edit:follows",
    "moderator:read:followers",
    "analytics:read:games",
    "channel:read:hype_train",
    "user:read:moderated_channels",
    "channel:read:stream_key",
    "channel:read:subscriptions",
    "user:read:subscriptions",
    "channel:manage:ads",
    "channel:read:ads",
    "channel:edit:commercial",
    "moderator:manage:announcements",
    "moderator:manage:automod",
    "moderator:read:automod_settings",
    "moderator:manage:automod_settings",
    "moderator:manage:banned_users",
    "moderator:manage:blocked_terms",
    "user:manage:blocked_users",
    "channel:manage:broadcast",
    "user:read:broadcast",
    "channel:manage:redemptions",
    "user:manage:chat_color",
    "moderator:manage:chat_messages",
    "moderator:manage:chat_settings",
    "analytics:read:extensions",
    "channel:manage:guest_star",
    "moderator:manage:guest_star",
    "channel:manage:moderators",
    "moderator:read:moderators",
    "channel:manage:polls",
    "channel:manage:predictions",
    "channel:manage:raids",
    "moderator:manage:shield_mode",
    "moderator:manage:shoutouts",
    "channel:manage:schedule",
    "channel:manage:videos",
    "clips:edit",
    "channel:read:vips",
    "channel:manage:vips",
    "moderator:read:vips",
    "whispers:read",
    "whispers:edit",
    "user:manage:whispers",
    "moderator:read:unban_requests",
    "moderator:manage:unban_requests",
    "user:read:emotes",
    "moderator:manage:warnings"
]));
setFunction("/twitch/add/bot", addNew(false, [
    "chat:edit",
    "whispers:read",
    "whispers:edit"
]));
setFunction("/twitch/setSecret", (req, url) => {
    const clientID = url.searchParams.get("clientID");
    const secret = url.searchParams.get("secret");
    if (clientID) {
        encryptData(confPath + 'twitch/secret.enc', secret);
        clientSecret = secret;
        conf.clientID = clientID;
        connect();
    }
})
setFunction("/twitch/addListenTo", async (req, url) => {
    const user = url.searchParams.get("id");
    const channel = url.searchParams.get("user");
    if (!user || !channel) {
        return;
    }
    const botEntry = Object.values(connectedBots).find(b => b.id === user);
    if (botEntry && !channels[botEntry.name].channels.includes(channel)) {
        const channelObj = await botEntry.api.users.getUserByName(channel);
        if(!channelObj || channelObj.name != channel) {
            console.error("cannot find user!", channel);
        }
        extraData.IDs[channel] = parseInt(channelObj.id);
        fs.writeFileSync(path.join(__dirname, 'twitch_data.js'), "module.exports = " + JSON.stringify(extraData))
        channels[botEntry.name].channels.push(channel);
    }
    connect();
});
setFunction("/twitch/removeListenTo", (req, url) => {
    const bot = url.searchParams.get("id");
    const channel = url.searchParams.get("user");
    if (!bot || !channel) {
        return;
    }
    const botEntry = Object.values(connectedBots).find(b => b.id === bot);
    if (botEntry) {
        channels[botEntry.name].channels = channels[botEntry.name].channels.filter((val) => val != channel);
    }
    connect();
});
setFunction("/twitch/cloneRedeem", (req, url) => {
    console.log(url);
    const redeemId = url.searchParams.get("redeemId");

    console.log("meow")
    if (!redeemId) {
        return;
    }
    (async () => {
        try {
            console.log("bark")
            const redeem = await connectedUser.api.channelPoints.getCustomRewardById(connectedUser.id, redeemId);
            console.log("bark")
            if (!redeem) {
                console.error(`Could not get redeem ${redeemId}`);
                return;
            }
            console.log("bark")
            const cloned = await connectedUser.api.channelPoints.createCustomReward(connectedUser.id, {
                title: redeem.title + " (Clone)",
                cost: redeem.cost,
                prompt: redeem.prompt,
                backgroundColor: redeem.backgroundColor,
                isEnabled: false,
                globalCooldown: redeem.globalCooldown,
                autoFulfill: redeem.autoFulfill,
                maxRedemptionsPerStream: redeem.maxRedemptionsPerStream,
                maxRedemptionsPerUserPerStream: redeem.maxRedemptionsPerUserPerStream,
                userInputRequired: redeem.userInputRequired
            });
            console.log("bark")
            sharedServerData.twitch.redeems[cloned.id] = {...cloned, img: undefined};
            console.log("bark")

            let redeemName = redeem.title;
            console.log("bark")
            redeemName.replaceAll(" ", "_");
            redeemName.replaceAll(/[^a-zA-Z0-9_$]+/g,"");
            if(redeemName.match(/^[0-9]/)) {
                redeemName = "_" + redeemName;
            }
            if(redeemName == "") {
                redeemName = "$" + redeem.id;
            }
            console.log("bark")
            extraData.redeems[redeemName] = redeem.id;
            fs.writeFileSync(path.join(__dirname, 'twitch_data.js'), "module.exports = " + JSON.stringify(extraData))
            console.log("bark")
            console.log(`Cloned redeem ${redeem.title}`);
        } catch (err) {
            console.error(`Could not clone redeem ${redeemId}`);
        }
    })();
});
setFunction("/twitch/deleteRedeem", (req, url) => {
    const redeemId = url.searchParams.get("redeemId");

    if (!redeemId) {
        return;
    }
    (async () => {
        try {
            const redeem = await connectedUser.api.channelPoints.deleteCustomReward(connectedUser.id, redeemId);
            delete sharedServerData.twitch.redeems[cloned.id];
            console.log(`Deleted redeem ${redeem.title}`);
        } catch (err) {
            console.error(`Could not delete redeem ${redeemId}`);
        }
    })();
});


/* --------------------------------- Exports -------------------------------- */

const debug_channel = conf.printChannel;
let rateLimit = null;
let cache = "";
function print() {
    let text = "";
    for (let x = 0; x < arguments.length; x++) {
        text += " " + arguments[x].toString();
    }
    text = text.trim();
    if (text) {
        console.log(...arguments);
        cache += " - " + text;
    }
    if (rateLimit == null && cache) {
        rateLimit = setTimeout((200, () => {
            if (cache.length > 450) {
                cache = cache.substring(0, 450) + " ... truncated (API issue)";
            }
            connectedUser.say(debug_channel, cache.substring(3).trim());
            cache = "";
            rateLimit = setTimeout((1300, () => {
                rateLimit = null;
                print();
            }));
        }));
    }
}


module.exports = {
    connectedBots,
    connectedUser,
    print,
    IDs: extraData.IDs,
    redeems: extraData.redeems
}