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
    const redeemId = url.searchParams.get("redeemId");

    if (!redeemId) {
        return;
    }
    (async () => {
        try {
            const redeem = await connectedUser.api.channelPoints.getCustomRewardById(connectedUser.id, redeemId);
            if (!redeem) {
                console.error(`Could not get redeem ${redeemId}`);
                return;
            }
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
            sharedServerData.twitch.redeems[cloned.id] = {...cloned, img: undefined};

            let redeemName = redeem.title;
            redeemName.replaceAll(" ", "_");
            redeemName.replaceAll(/[^a-zA-Z0-9_$]+/g,"");
            if(redeemName.match(/^[0-9]/)) {
                redeemName = "_" + redeemName;
            }
            if(redeemName == "") {
                redeemName = "$" + redeem.id;
            }
            extraData.redeems[redeemName] = redeem.id;
            fs.writeFileSync(path.join(__dirname, 'twitch_data.js'), "module.exports = " + JSON.stringify(extraData))
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