const fs = require('node:fs');
const { ApiClient } = require('@twurple/api');
const { ChatClient } = require('@twurple/chat');
const { EventSubWsListener } = require('@twurple/eventsub-ws');
const { RefreshingAuthProvider, exchangeCode } = require('@twurple/auth');
const path = require("path");

const { autoSavedJSON, encryptData, decryptData } = require("./files");
const { associateClassWithFile } = require('./internal/codeBinder');
const { setFunction } = require("./server");
const { createUnfailable } = require("./unfailable");
const { reloadPlugin } = require('./internal/pluginReg');

const confPath = 'config/internal/';
const oauthFilesPath = confPath + 'twitch/oauth/';
const clientSecret = decryptData(confPath + 'twitch/secret.enc');
const conf = autoSavedJSON(confPath + 'twitch.json', {
    chats: {},
    clientID: "",
    printChannel: ""
});
const clientID = conf.clientID;
const channels = conf.chats;


/**
 * @typedef {Object} ConnectedBot
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
     * @param channel - The channel to send the message to.
     * @param text - The message to send.
     * @returns {Promise<void>}
     */
    say: async (channel, message) => {
        throw new Error("No connected User to say something")
    },
    /**
     * Replies to a chat message in a channel.
     * @param {string} channel - The channel to send the message to.
     * @param {string} text - The message to send.
     * @param {import('@twurple/chat').ChatMessage} replyTo - The message to reply to.
     * @returns {Promise<void>}
     */
    reply: async (channel, message) => {
        throw new Error("No connected User to say something")
    },
};

/* -------------------------- Connection Management ------------------------- */

/**
 * Adds a new bot using the provided token data.
 * @param {object} tokenData - The OAuth token data for the bot.
 * @returns {Promise<{id: string, name: string}>} The user ID and name of the added bot.
 */
async function addBot(tokenData, main = false) {
    const auth = new RefreshingAuthProvider({ clientId: clientID, clientSecret: clientSecret })
    auth.onRefresh(async (userID, newTokenData) => encryptData(`${oauthFilesPath}${userID}${(main?".main":"")}.json.enc`, JSON.stringify(newTokenData)));
    userID = await auth.addUserForToken(tokenData, ['chat']);

    const api = associateClassWithFile(new ApiClient({ authProvider: auth }), "unbind");
    const ownName = (await api.users.getUserById(userID)).name;
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
        id: userID,
        say: async (channel, message) => await chat.say(channel, message),
        reply: async (channel, message, replyTo) => await chat.say(channel, message, {
            replyTo: replyTo
        }),
        onWhisper: (callback) => chat.onWhisper(callback)
    };
    console.log(`added token for ${userID} (${ownName}) and connected to [${ownedChannels}]`);
    return { id: userID, name: ownName };
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

                    while(argscopy.length > 1) {
                        let curarg = argscopy.pop();
                        el = el[curarg] = el[curarg] ?? {};
                        al = al[curarg] = al[curarg] ?? {};
                    }
                    if(!el[argscopy[0]]) el[argscopy[0]] = [];
                    el[argscopy[0]].push(callback);
                    if(!al[argscopy[0]]) {
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
                            let name = (await addBot(tokenData, true)).name;
                            connectedUser.api = connectedBots[name].api;
                            connectedUser.chat = connectedBots[name].chat;
                            connectedUser.listener = associateClassWithFile(
                                makeEventSubListenerEventable(new EventSubWsListener({ apiClient: connectedUser.api })), 
                                "stop"
                            );
                            connectedUser.listener.start();
                            connectedUser.say = connectedBots[name].say;
                            connectedUser.reply = connectedBots[name].reply;
                        } else {
                            await addBot(tokenData, false);
                        }
                    } catch (e) {
                        console.error(`Failed to load token for user ${userId}:`, e);
                    }
                } else {
                    console.error(`Failed to decrypt the token for user ${userId}`);
                }
            }
        }
    }
    console.log("Connected to Twitch API with Twurple.");
    reloadPlugin(__filename);
}
connect()

/* ------------------------ Websites to add accounts ------------------------ */

function addNew(main, scopes) {
    return (searchParams, res) => {
        const redirectURL = "http://localhost:4444/twitch";
        const twitchURL = "https://id.twitch.tv/oauth2/authorize";
        const oauthURL = `${twitchURL}?response_type=code&client_id=${clientID}&redirect_uri=${redirectURL}&scope=${scopes.join("+")}`

        setFunction("/twitch", async (searchParams, res) => {
            // Save the code to a file
            const code = searchParams.get("code");
            const tokenData = await exchangeCode(clientID, clientSecret, code, redirectURL);
            addBot(tokenData, main).then((value) => {
                if (main) {
                    let name = value.name;
                    connectedUser.api = connectedBots[name].api;
                    connectedUser.chat = connectedBots[name].chat;
                    connectedUser.say = connectedBots[name].say;
                    connectedUser.reply = connectedBots[name].reply;
                    encryptData(`${oauthFilesPath}${value.id}.main.json.enc`, JSON.stringify(tokenData));
                } else {
                    encryptData(`${oauthFilesPath}${value.id}.json.enc`, JSON.stringify(tokenData));
                }
                reloadPlugin(__filename);
                res.end(`Code for ${userID} saved and encrypted.`);
            });
        });
        res.end(`
            <html>
                <head>
                    <meta http-equiv="refresh" content="0; url=${oauthURL}" />
                </head>
                <body>
                    <p>Redirecting to <a href="${oauthURL}">Twitch OAuth</a>...</p>
                </body>
            </html>
        `);
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


/* --------------------------------- Exports -------------------------------- */

const debug_channel = conf.printChannel;
let rateLimit = null;
let cache = "";
function print() {
    let text = "";
    for(let x = 0; x < arguments.length; x++) {
        text += " " + arguments[x].toString();
    }
    text = text.trim();
    if(text) {
        console.log(...arguments);
        cache += " - " + text;
    }
    if(rateLimit == null && cache) {
        rateLimit = setTimeout((200, () => {
            if(cache.length > 450) {
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

async function idFromUser(name) {
    await connectedUser.api.users.getUserByName(name);
}

module.exports = {
    connectedBots,
    connectedUser,
    print,
    idFromUser
}