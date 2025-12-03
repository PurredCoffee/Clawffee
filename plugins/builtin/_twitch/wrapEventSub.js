const { EventSubWsListener } = require("@twurple/eventsub-ws");
const { ChatClient } = require("@twurple/chat");
const { deepCleanTwitchData } = require('./cleanTwurple');
const { ApiClient } = require("@twurple/api");

// TODO: add IRC PRIVMSG event to onMessage and USERNOTICE to onSub onGiftSub etc. using their ids

/**
 * @typedef {Parameters<T> extends [...infer _, infer L] ? L : never} TwurpleCallback
 * @template {Function} T
 */

/**
 * @typedef EventCache
 * @prop {Map<string, Function>} listeners
 * @prop {Map<any, EventCache>} nextarg
 * @prop {TwurpleCallback<EventSubWsListener['onUserSocketConnect']>} listener
 */

/**
 * @typedef {'IRC'|'EventSub'|number} IRCEventableType type of listener to subscribe to, defaults to a combination of IRC and EventSub messages (number for timeout period)
 */

/**
 * @type {Map<EventSubWsListener, {[k: string]: EventCache}}
 */
const eventManagers = new Map();

/**
 * @type {Map<EventSubWsListener, ChatClient>}
 */
const chatListeners = new Map();

const ID2UserCache = new Map();

/**
 * @typedef EventListener
 * 
 * @prop {string} key
 * @prop {Function} callback
 * @prop {() => void} on
 * @prop {() => void} off
 * @prop {() => void} enable
 * @prop {() => void} disable
 * @prop {() => void} subscribe
 * @prop {() => void} unsubscribe
 */
/**
 * wrap an event mgr
 * @param {EventSubWsListener} evs 
 * @param {EVSCallbackName} name 
 * @param {TwurpleCallback<EventSubWsListener[EVSCallbackName]>} callback 
 * @param {Array} args 
 * @template {keyof EventSubWsListener} EVSCallbackName
 * @returns {EventListener}
 */
function wrapEvent(evs, name, callback, args = []) {
    if(!eventManagers.has(evs)) eventManagers.set(evs, {});
    const eventManager = eventManagers.get(evs);
    eventManager[name] = eventManager[name] ?? {listeners: new Map(), nextarg: new Map(), listener: null}
    let mgr = eventManager[name];
    const argsbak = [...args];
    while(args.length > 0) {
        const arg = args.shift();
        if(!mgr.nextarg.has(arg)) mgr.nextarg.set(arg, {listeners: new Map(), nextarg: new Map(), listener: null});
        mgr = mgr.nextarg.get(arg);
    }
    if(!mgr.listener) {
        console.debug(`subscribing to new event ${name}`)
        mgr.listener = evs[name](...argsbak, (...data) => mgr.listeners.forEach(v => {try {v(...data.map(v => deepCleanTwitchData(v)))} catch (e) { console.error(e)}}));
    }
    const key = Bun.randomUUIDv7();
    // TODO: unsubscribe empty listeners
    const listener = {
        key: key,
        callback: callback,
        on() { return mgr.listeners.set(key, callback) },
        off() { return mgr.listeners.delete(key) },
        enable() { return mgr.listeners.set(key, callback) },
        disable() { return mgr.listeners.delete(key) },
        subscribe() { return mgr.listeners.set(key, callback) },
        unsubscribe() { return mgr.listeners.delete(key) },
    }
    listener.on();
    return listener;
}

/**
 * 
 * @param {EventSubWsListener} evs 
 * @param {string} userName 
 * @param {IRCCallbackName} name 
 * @param {TwurpleCallback<ChatClient[IRCCallbackName]>} callback 
 * @template {keyof ChatClient} IRCCallbackName
 * @returns 
 */
function wrapChat(evs, userName, name, callback) {
    const chat = chatListeners.get(evs);
    if(!chat.currentChannels.includes(userName)) {
        chat.join(userName);
    }
    if(!eventManagers.has(chat)) eventManagers.set(chat, {});
    const eventManager = eventManagers.get(chat);
    eventManager[name] = eventManager[name] ?? {listeners: new Map(), nextarg: new Map(), listener: null}
    let mgr = eventManager[name];
    if(!mgr.listener) {
        console.debug(`subscribing to new message ${name}`)
        mgr.listener = chat[name]((channel, ...data) => eventManager[name].nextarg.get(channel)?.listeners.forEach(v => {try {v(channel, ...data.map(v => deepCleanTwitchData(v)))} catch (e) { console.error(e)}}));
    }

    if(!mgr.nextarg.has(userName)) mgr.nextarg.set(userName, {listeners: new Map(), nextarg: new Map(), listener: null});
    mgr = mgr.nextarg.get(userName);

    const key = Bun.randomUUIDv7();
    // TODO: unsubscribe empty listeners
    const listener = {
        key: key,
        callback: callback,
        on() { return mgr.listeners.set(key, callback) },
        off() { return mgr.listeners.delete(key) },
        enable() { return mgr.listeners.set(key, callback) },
        disable() { return mgr.listeners.delete(key) },
        subscribe() { return mgr.listeners.set(key, callback) },
        unsubscribe() { return mgr.listeners.delete(key) },
    }
    listener.on();
    return listener;
}

function combineChat(callback, ...args) {
    const listeners = args.map(v => v(callback));
    const listener = {
        on() { listeners.forEach(v => v.on()) },
        off() { listeners.forEach(v => v.off()) },
        enable() { listeners.forEach(v => v.enable()) },
        disable() { listeners.forEach(v => v.disable()) },
        subscribe() { listeners.forEach(v => v.subscribe()) },
        unsubscribe() { listeners.forEach(v => v.unsubscribe()) },
    }
    return listener;
}

/**
 * 
 * @param {any} channelID 
 * @param {ApiClient} api 
 * @returns 
 */
function resolveName(channelID, api) {
    if(ID2UserCache.has(channelID)) return Promise.resolve(ID2UserCache.get(channelID));
    return api.users.getUserById(channelID).then((value) => value.name);
}

/**
 * @function combineListener
 * @param {*} IRCIDCbk 
 */
/**
 * 
 * @param {IRCEventableType} type 
 * @param {ApiClient} api 
 * @param {number} channelID
 * @param {(id: number, callback: EVSCallback) => EventSubWsListener} evsCbk 
 * @param {(...params: Parameters<EVSCallback>) => number} evsIDCbk 
 * @param {(name: string, callback: IRCCallback) => ChatClient} IRCCbk 
 * @param {(...params: Parameters<IRCCallback>) => number} IRCIDCbk 
 * @param {(EVSargs: Parameters<EVSCallback>[0], IRCargs: Parameters<IRCCallback>) => any} dataCbk
 * @template IRCCallback
 * @template EVSCallback
 * @returns {EventListener}
 */
function combineListeners(type, api, channelID, evsCbk, evsIDCbk, IRCCbk, IRCIDCbk, dataCbk) {
    let IRCListener = null;
    let EVSListener = null;
    let IRCCache = new Map();
    let EVSCache = new Map();
    let Cache = [];
    let Resolved = new Map();
    function flush(id) {
        if(Resolved.get(id) === true) return;
        clearTimeout(Resolved.get(id));
        Resolved.set(id, true);
        dataCbk(EVSCache.get(id), IRCCache.get(id));
    }
    function resolve(id) {
        if(Resolved.get(id) === true) return;
        Cache.push(id);
        if(
            type == 'EventSub' || type == 'IRC'
            || (EVSCache.has(id) && IRCCache.has(id))
        ) {
            flush(id);
        } else {
            Resolved.set(id, setTimeout(() => flush(id), type * 1000));
        }
        if(Cache.length > 64) {
            flush(id);
            const id = Cache.shift();
            IRCCache.delete(id);
            EVSCache.delete(id);
            Resolved.delete(id);
        }
    }
    function addEVSData(id, data) {
        EVSCache.set(id, data);
        resolve(id);
    }
    function addIRCData(id, data) {
        IRCCache.set(id, data);
        resolve(id);
    }
    if(type != 'EventSub') {
        resolveName(channelID, api).then((name) => {
            IRCListener = IRCCbk(name, (...args) => {
                let id = IRCIDCbk(...args);
                if(!id) return dataCbk(args, null);
                addIRCData(id, args);
            });
        });
    }
    if(type != 'IRC') {
        EVSListener = evsCbk(channelID, (...args) => {
            let id = evsIDCbk(...args);
                if(!id) return dataCbk(null, args);
            addEVSData(id, args);
        })
    }
    if(type != 'EventSub' && type != 'IRC' && typeof type != "number") {
        console.warn("type is not a number or 'IRC' or 'EventSub'");
        type = 5;
    }
    return {
        on() { IRCListener?.enable(); EVSListener?.enable() },
        off() { IRCListener?.disable(); EVSListener?.disable() },
        enable() { IRCListener?.enable(); EVSListener?.enable() },
        disable() { IRCListener?.disable(); EVSListener?.disable() },
        subscribe() { IRCListener?.enable(); EVSListener?.enable() },
        unsubscribe() { IRCListener?.disable(); EVSListener?.disable() }
    };
}

/**
 * 
 * @param {EventSubWsListener} evs 
 * @param {ApiClient} api
 * @param {number} uid
 */
module.exports = function wrapEventSubListener(evs, api, uid) {
    if(!chatListeners.has(evs)) {
        chatListeners.set(evs, new ChatClient({
            authProvider: api._authProvider
        }));
        chatListeners.get(evs).connect();
    }
    const EventSubFunctions = {
        /**
         * Fires when a user socket has established a connection with the EventSub server.
         * @param {TwurpleCallback<EventSubWsListener['onUserSocketConnect']>} callback 
         */
        onUserSocketConnect(callback) {return wrapEvent(evs, 'onUserSocketConnect', callback)},
        /**
         * Fires when a user socket has disconnected from the EventSub server.
         * @param {TwurpleCallback<EventSubWsListener['onUserSocketDisconnect']>} callback 
         */
        onUserSocketDisconnect(callback) { return wrapEvent(evs, 'onUserSocketDisconnect', callback) },
        /**
         * Subscribes to events that represent a user granting authorization to an application.
         * @param {TwurpleCallback<EventSubWsListener['onUserAuthorizationGrant']>} callback 
         */
        onUserAuthorizationGrant(callback) { return wrapEvent(evs, 'onUserAuthorizationGrant', callback) },
        /**
         * Subscribes to events that represent a user revoking authorization from an application.
         * @param {TwurpleCallback<EventSubWsListener['onUserAuthorizationRevoke']>} callback 
         */
        onUserAuthorizationRevoke(callback) { return wrapEvent(evs, 'onUserAuthorizationRevoke', callback) },
        /**
         * Fires when a subscription is revoked.
         * @param {TwurpleCallback<EventSubWsListener['onRevoke']>} callback 
         */
        onRevoke(callback) { return wrapEvent(evs, 'onRevoke', callback) },
        /**
         * Fires when a subscription is revoked.
         * @param {TwurpleCallback<EventSubWsListener['onRevoke']>} callback 
         */
        onSubscriptionCreateSuccess(callback) { return wrapEvent(evs, 'onSubscriptionCreateSuccess', callback) },
        /**
         * Fires when the client fails to create a subscription.
         * @param {TwurpleCallback<EventSubWsListener['onSubscriptionCreateFailure']>} callback 
         */
        onSubscriptionCreateFailure(callback) { return wrapEvent(evs, 'onSubscriptionCreateFailure', callback) },
        /**
         * Fires when the client successfully deleted a subscription.
         * @param {TwurpleCallback<EventSubWsListener['onSubscriptionDeleteSuccess']>} callback 
         */
        onSubscriptionDeleteSuccess(callback) { return wrapEvent(evs, 'onSubscriptionDeleteSuccess', callback) },
        /**
         * Fires when the client fails to delete a subscription.
         * @param {TwurpleCallback<EventSubWsListener['onSubscriptionDeleteFailure']>} callback 
         */
        onSubscriptionDeleteFailure(callback) { return wrapEvent(evs, 'onSubscriptionDeleteFailure', callback) },
        /**
         * Subscribes to events representing a stream going live.
         * @param {TwurpleCallback<EventSubWsListener['onStreamOnline']>} callback 
         * @param {string?} broadcasterID broadcaster to listen to (defaults to self)
         */
        onStreamOnline(callback, broadcasterID = uid) { return wrapEvent(evs, 'onStreamOnline', callback, [broadcasterID]) },
        /**
         * Subscribes to events representing a stream going offline.
         * @param {TwurpleCallback<EventSubWsListener['onStreamOffline']>} callback 
         * @param {string?} broadcasterID broadcaster to listen to (defaults to self)
         */
        onStreamOffline(callback, broadcasterID = uid) { return wrapEvent(evs, 'onStreamOffline', callback, [broadcasterID]) },
        /**
         * Subscribes to events that represent a chat message being held by AutoMod in a channel.
         * @param {TwurpleCallback<EventSubWsListener['onAutoModMessageHold']>} callback 
         * @param {string?} broadcasterID broadcaster to listen to (defaults to self)
         */
        onAutoModMessageHold(callback, broadcasterID = uid) { return wrapEvent(evs, 'onAutoModMessageHold', callback, [broadcasterID, uid]) },
        /**
         * Subscribes to events that represent a chat message being held by AutoMod in a channel.
         * @param {TwurpleCallback<EventSubWsListener['onAutoModMessageHoldV2']>} callback 
         * @param {string?} broadcasterID broadcaster to listen to (defaults to self)
         */
        onAutoModMessageHoldV2(callback, broadcasterID = uid) { return wrapEvent(evs, 'onAutoModMessageHoldV2', callback, [broadcasterID, uid]) },
        /**
         * Subscribes to events that represent a held chat message by AutoMod being resolved in a channel.
         * @param {TwurpleCallback<EventSubWsListener['onAutoModMessageUpdate']>} callback 
         * @param {string?} broadcasterID broadcaster to listen to (defaults to self)
         */
        onAutoModMessageUpdate(callback, broadcasterID = uid) { return wrapEvent(evs, 'onAutoModMessageUpdate', callback, [broadcasterID, uid]) },
        /**
         * Subscribes to events that represent a held chat message by AutoMod being resolved in a channel.
         * @param {TwurpleCallback<EventSubWsListener['onAutoModMessageUpdateV2']>} callback 
         * @param {string?} broadcasterID broadcaster to listen to (defaults to self)
         */
        onAutoModMessageUpdateV2(callback, broadcasterID = uid) { return wrapEvent(evs, 'onAutoModMessageUpdateV2', callback, [broadcasterID, uid]) },
        /**
         * Subscribes to events that represent the AutoMod settings being updated in a channel.
         * @param {TwurpleCallback<EventSubWsListener['onAutoModSettingsUpdate']>} callback 
         * @param {string?} broadcasterID broadcaster to listen to (defaults to self)
         */
        onAutoModSettingsUpdate(callback, broadcasterID = uid) { return wrapEvent(evs, 'onAutoModSettingsUpdate', callback, [broadcasterID, uid]) },
        /**
         * Subscribes to events that represent the AutoMod settings being updated in a channel.
         * @param {TwurpleCallback<EventSubWsListener['onAutoModTermsUpdate']>} callback 
         * @param {string?} broadcasterID broadcaster to listen to (defaults to self)
         */
        onAutoModTermsUpdate(callback, broadcasterID = uid) { return wrapEvent(evs, 'onAutoModTermsUpdate', callback, [broadcasterID, uid]) },
        /**
         * Subscribes to events that represent an ad break beginning.
         * @param {TwurpleCallback<EventSubWsListener['onChannelAdBreakBegin']>} callback 
         * @param {string?} broadcasterID broadcaster to listen to (defaults to self)
         */
        onChannelAdBreakBegin(callback, broadcasterID = uid) { return wrapEvent(evs, 'onChannelAdBreakBegin', callback, [broadcasterID]) },
        /**
         * Subscribes to events that represent a specific Channel Points automatic reward being redeemed.
         * @param {TwurpleCallback<EventSubWsListener['onChannelAutomaticRewardRedemptionAdd']>} callback 
         * @param {string?} broadcasterID broadcaster to listen to (defaults to self)
         */
        onChannelAutomaticRewardRedemptionAdd(callback, broadcasterID = uid) { return wrapEvent(evs, 'onChannelAutomaticRewardRedemptionAdd', callback, [broadcasterID]) },
        /**
         * Subscribes to events that represent a specific Channel Points automatic reward being redeemed.
         * @param {TwurpleCallback<EventSubWsListener['onChannelAutomaticRewardRedemptionAddV2']>} callback 
         * @param {string?} broadcasterID broadcaster to listen to (defaults to self)
         */
        onChannelAutomaticRewardRedemptionAddV2(callback, broadcasterID = uid) { return wrapEvent(evs, 'onChannelAutomaticRewardRedemptionAddV2', callback, [broadcasterID]) },
        /**
         * Subscribes to events that represent a user getting banned from a channel.
         * @param {TwurpleCallback<EventSubWsListener['onChannelBan']>} callback 
         * @param {string?} broadcasterID broadcaster to listen to (defaults to self)
         */
        onChannelBan(callback, broadcasterID = uid) { return wrapEvent(evs, 'onChannelBan', callback, [broadcasterID]) },
        /**
         * Subscribes to events representing a change in channel metadata, e.g. stream title or category.
         * @param {TwurpleCallback<EventSubWsListener['onChannelUpdate']>} callback 
         * @param {string?} broadcasterID broadcaster to listen to (defaults to self)
         */
        onChannelUpdate(callback, broadcasterID = uid) { return wrapEvent(evs, 'onChannelUpdate', callback, [broadcasterID]) },
        /**
         * Subscribes to events that represent a user following a channel.
         * @param {TwurpleCallback<EventSubWsListener['onChannelFollow']>} callback 
         * @param {string?} broadcasterID broadcaster to listen to (defaults to self)
         */
        onChannelFollow(callback, broadcasterID = uid) { return wrapEvent(evs, 'onChannelFollow', callback, [broadcasterID, uid]) },
        /**
         * Subscribes to events that represent a user subscribing to a channel.
         * @param {TwurpleCallback<EventSubWsListener['onChannelSubscription']>} callback 
         * @param {string?} broadcasterID broadcaster to listen to (defaults to self)
         */
        onChannelSubscription(callback, broadcasterID = uid, type = 5) {
            return combineListeners(type, api, broadcasterID,
                /**
                 * 
                 * @param {number} id 
                 * @param {TwurpleCallback<EventSubWsListener['onChannelSubscription']>} cbk 
                 * @returns 
                 */
                (id, cbk) => wrapEvent(evs, 'onChannelSubscription', callback, [id]),
                (data) => data.tier + " - " + data.userId + " - " + data.isGift,
                /**
                 * 
                 * @param {string} name 
                 * @param {TwurpleCallback<ChatClient['onSub']> | TwurpleCallback<ChatClient['onSubGift']>} cbk 
                 * @returns 
                 */
                (name, cbk) => combineChat(cbk,
                    (c) => wrapChat(evs, name, 'onSub', (channel, user, subInfo, msg) => c(channel, user, {...subInfo, isGift: false}, msg)),
                    (c) => wrapChat(evs, name, 'onSubGift', (channel, user, subInfo, msg) => c(channel, user, {...subInfo, isGift: true}, msg))
                ),
                (channel, user, subInfo, msg) => (subInfo.isPrime?'1000':subInfo.plan) + " - " + subInfo.userId + " - " + subInfo.isGift,
                (EVSData, IRCargs) => callback({
                    EVSData: evsData,
                    IRCData: IRCargs?.[2],
                    IRCUser: IRCargs?.[3],
                    broadcasterId: EVSData?.broadcasterId ?? broadcasterID,
                    broadcasterName: EVSData?.broadcasterName ?? IRCargs?.[1],
                    broadcasterDisplayName: EVSData?.broadcasterDisplayName ?? null,
                    isGift: EVSData?.isGift ?? IRCargs?.[2].isGift,
                    tier: IRCargs?.[2].plan ?? EVSData?.tier,
                    userId: EVSData?.userId ?? IRCargs?.[2].userId,
                    userName: EVSData?.userName ?? IRCargs?.[3].userInfo.userName,
                    userDisplayName: EVSData?.userDisplayName ?? IRCargs[2].displayName,
                    getBroadcaster: () => evsData?.getBroadcaster() ?? api.users.getUserById(broadcasterID),
                    getUser: () => evsData?.getUser() ?? api.users.getUserById(IRCargs?.[3].id),
                    streak: IRCargs?.[2].streak ?? IRCargs?.[2],

                    
                })
            )
            return wrapEvent(evs, 'onChannelSubscription', callback, [broadcasterID])
        },
        /**
         * Subscribes to events that represent a user gifting a subscription to a channel to someone else.
         * @param {TwurpleCallback<EventSubWsListener['onChannelSubscriptionGift']>} callback
         * @param {string?} broadcasterID broadcaster to listen to (defaults to self)
         */
        onChannelSubscriptionGift(callback, broadcasterID = uid,) { return wrapEvent(evs, 'onChannelSubscriptionGift', callback, [broadcasterID])},
        /**
         * @typedef onChannelSubscriptionType
         * @prop {Parameters<TwurpleCallback<EventSubWsListener['onChannelChatMessage']>>[0]?} EventSubData Original EventSub Data that this data is obtained from
         * @prop {Parameters<TwurpleCallback<ChatClient['onMessage']>>[2]?} IRCData Original IRC Data that this data is obtained from
         * @prop {Parameters<TwurpleCallback<ChatClient['onSub']>>[3]?} IRCUser Original IRC Data about the subscribing user that this data is obtained from
         * @prop {string} broadcasterId ID of the broadcaster being subscribed to
         * @prop {string} broadcasterName User Name of the broadcaster being subscribed to
         * @prop {string} broadcasterDisplayName Display Name of the broadcaster being subscribed to
         * @prop {number} cumulativeMonths Cumulative Months of subscriptions that the user subscribed to the broadcaster
         * @prop {number?} durationMonths Duration of Months user subscribed to at once (null if EventSub packet is dropped)
         * @prop {Map<string, string[]>?} emoteOffsets Map of emote offsets in the message (null if EventSub packet is dropped)
         * @prop {string?} messageText Subscription text (if any)
         * @prop {number?} streakMonths Month straek of the user subscribing (if shared)
         * @prop {'Prime' | '1000' | '2000' | '3000'} tier Type of sub of the user (if IRC packet is dropped, Prime subs will be counted as 1000! (check if IRCData is null to check if the packet was dropped))
         * @prop {string} userId ID of the user that is subscribing
         * @prop {string} userName User Name of the user that is subscribing
         * @prop {string} userDisplayName Display Name of the user that is subscibing
         * @prop {Parameters<TwurpleCallback<EventSubWsListener['onChannelSubscriptionMessage']>>[0]['getBroadcaster']} getBroadcaster Fetch more information about the broadcaster
         * @prop {Parameters<TwurpleCallback<EventSubWsListener['onChannelSubscriptionMessage']>>[0]['getUser']} getUser Fetch more information about the subscriber
         * @prop {Parameters<TwurpleCallback<ChatClient['onSub']>>[2]['originalGiftInfo']?} originalGiftInfo The info about the original gift of the subscription, when renewing a multi-month gift. (null if IRC packet is dropped)
         */
        /**
         * Subscribes to events that represent a user's subscription to a channel being announced.
         * @param {(data: onChannelSubscriptionType) => void} callback 
         * @param {string?} broadcasterID broadcaster to listen to (defaults to self)
         * @param {IRCEventableType?} type type of listener to subscribe as, defaults to a combination of IRC and EventSub messages (number for timeout period)
         */
        onChannelSubscriptionMessage(callback, broadcasterID = uid, type = 5) {
            return combineListeners(type, api, broadcasterID, 
                /**
                 * 
                 * @param {number} id 
                 * @param {TwurpleCallback<EventSubWsListener['onChannelSubscriptionMessage']>} cbk 
                 * @returns 
                 */
                (id, cbk) => wrapEvent(evs, 'onChannelSubscriptionMessage', cbk, [id]),
                data => data.tier + " - " + data.userId,
                /**
                 * 
                 * @param {string} name 
                 * @param {TwurpleCallback<ChatClient['onResub']>} cbk 
                 * @returns 
                 */
                (name, cbk) => wrapChat(evs, name, 'onResub', cbk),
                (channel, user, subInfo) => (subInfo.isPrime?'1000':subInfo.plan) + " - " + subInfo.userId,
                (evsData, IRCargs) => callback({
                    EVSData: evsData,
                    IRCData: IRCargs?.[2],
                    IRCUser: IRCargs?.[3],
                    broadcasterId: evsData?.broadcasterId ?? IRCargs?.[3].channelId,
                    broadcasterName: evsData?.broadcasterName ?? IRCargs?.[0],
                    broadcasterDisplayName: evsData?.broadcasterDisplayName ?? null,
                    cumulativeMonths: evsData?.cumulativeMonths ?? IRCargs?.[2]?.months,
                    durationMonths: evsData?.durationMonths ?? null,
                    emoteOffsets: evsData?.emoteOffsets ?? null,
                    messageText: evsData?.messageText ?? IRCargs?.[2].message,
                    streakMonths: evsData?.streakMonths ?? IRCargs?.[2].streak,
                    tier: IRCargs?.[2].tier ?? evsData?.tier,
                    userId: evsData?.userId ?? IRCargs?.[3].userInfo.userId,
                    userName: evsData?.userName ?? IRCargs?.[3].userInfo.userName,
                    userDisplayName: evsData?.userDisplayName ?? IRCargs?.[2].displayName,
                    getBroadcaster: () => evsData?.getBroadcaster() ?? api.users.getUserById(broadcasterID),
                    getUser: () => evsData?.getUser() ?? api.users.getUserById(IRCargs?.[3].id),
                    originalGiftInfo: IRCargs?.[2].originalGiftInfo ?? null,
                })
            );
        },
        /**
         * Subscribes to events that represent a user's subscription to a channel ending.
         * @param {TwurpleCallback<EventSubWsListener['onChannelSubscriptionEnd']>} callback 
         * @param {string?} broadcasterID broadcaster to listen to (defaults to self)
         */
        onChannelSubscriptionEnd(callback, broadcasterID = uid) { return wrapEvent(evs, 'onChannelSubscriptionEnd', callback, [broadcasterID]) },
        /**
         * Subscribes to events that represent a user cheering some bits.
         * @param {TwurpleCallback<EventSubWsListener['onChannelCheer']>} callback 
         * @param {string?} broadcasterID broadcaster to listen to (defaults to self)
         */
        onChannelCheer(callback, broadcasterID = uid) { return wrapEvent(evs, 'onChannelCheer', callback, [broadcasterID]) },
        /**
         * Subscribes to events that represent a charity campaign starting in a channel.
         * @param {TwurpleCallback<EventSubWsListener['onChannelCharityCampaignStart']>} callback 
         * @param {string?} broadcasterID broadcaster to listen to (defaults to self)
         */
        onChannelCharityCampaignStart(callback, broadcasterID = uid) { return wrapEvent(evs, 'onChannelCharityCampaignStart', callback, [broadcasterID]) },
        /**
         * Subscribes to events that represent a charity campaign ending in a channel.
         * @param {TwurpleCallback<EventSubWsListener['onChannelCharityCampaignStop']>} callback 
         * @param {string?} broadcasterID broadcaster to listen to (defaults to self)
         */
        onChannelCharityCampaignStop(callback, broadcasterID = uid) { return wrapEvent(evs, 'onChannelCharityCampaignStop', callback, [broadcasterID]) },
        /**
         * Subscribes to events that represent a donation to a charity campaign in a channel.
         * @param {TwurpleCallback<EventSubWsListener['onChannelCharityDonation']>} callback 
         * @param {string?} broadcasterID broadcaster to listen to (defaults to self)
         */
        onChannelCharityDonation(callback, broadcasterID = uid) { return wrapEvent(evs, 'onChannelCharityDonation', callback, [broadcasterID]) },
        /**
         * Subscribes to events that represent progress in a charity campaign in a channel.
         * @param {TwurpleCallback<EventSubWsListener['onChannelCharityCampaignProgress']>} callback 
         * @param {string?} broadcasterID broadcaster to listen to (defaults to self)
         */
        onChannelCharityCampaignProgress(callback, broadcasterID = uid) { return wrapEvent(evs, 'onChannelCharityCampaignProgress', callback, [broadcasterID]) },
        /**
         * Subscribes to events that represent a user getting unbanned from a channel.
         * @param {TwurpleCallback<EventSubWsListener['onChannelUnban']>} callback 
         * @param {string?} broadcasterID broadcaster to listen to (defaults to self)
         */
        onChannelUnban(callback, broadcasterID = uid) { return wrapEvent(evs, 'onChannelUnban', callback, [broadcasterID]) },
        /**
         * Subscribes to events that represent Shield Mode being activated in a channel.
         * @param {TwurpleCallback<EventSubWsListener['onChannelShieldModeBegin']>} callback 
         * @param {string?} broadcasterID broadcaster to listen to (defaults to self)
         */
        onChannelShieldModeBegin(callback, broadcasterID = uid) { return wrapEvent(evs, 'onChannelShieldModeBegin', callback, [broadcasterID, uid]) },
        /**
         * Subscribes to events that represent Shield Mode being deactivated in a channel.
         * @param {TwurpleCallback<EventSubWsListener['onChannelShieldModeEnd']>} callback 
         * @param {string?} broadcasterID broadcaster to listen to (defaults to self)
         */
        onChannelShieldModeEnd(callback, broadcasterID = uid) { return wrapEvent(evs, 'onChannelShieldModeEnd', callback, [broadcasterID, uid]) },
        /**
         * Subscribes to events that represent a moderator performing an action on a channel.
         * @param {TwurpleCallback<EventSubWsListener['onChannelModerate']>} callback 
         * @param {string?} broadcasterID broadcaster to listen to (defaults to self)
         */
        onChannelModerate(callback, broadcasterID = uid) { return wrapEvent(evs, 'onChannelModerate', callback, [broadcasterID, uid]) },
        /**
         * Subscribes to events that represent a user getting moderator permissions in a channel.
         * @param {TwurpleCallback<EventSubWsListener['onChannelModeratorAdd']>} callback 
         * @param {string?} broadcasterID broadcaster to listen to (defaults to self)
         */
        onChannelModeratorAdd(callback, broadcasterID = uid) { return wrapEvent(evs, 'onChannelModeratorAdd', callback, [broadcasterID]) },
        /**
         * Subscribes to events that represent a user losing moderator permissions in a channel.
         * @param {TwurpleCallback<EventSubWsListener['onChannelModeratorRemove']>} callback 
         * @param {string?} broadcasterID broadcaster to listen to (defaults to self)
         */
        onChannelModeratorRemove(callback, broadcasterID = uid) { return wrapEvent(evs, 'onChannelModeratorRemove', callback, [broadcasterID]) },
        /**
         * Subscribes to events that represent a broadcaster raiding another broadcaster.
         * @param {TwurpleCallback<EventSubWsListener['onChannelRaidFrom']>} callback 
         * @param {string?} broadcasterID broadcaster to listen to (defaults to self)
         */
        onChannelRaidFrom(callback, broadcasterID = uid) { return wrapEvent(evs, 'onChannelRaidFrom', callback, [broadcasterID]) },
        /**
         * Subscribes to events that represent a broadcaster being raided by another broadcaster.
         * @param {TwurpleCallback<EventSubWsListener['onChannelRaidTo']>} callback 
         * @param {string?} broadcasterID broadcaster to listen to (defaults to self)
         */
        onChannelRaidTo(callback, broadcasterID = uid) { return wrapEvent(evs, 'onChannelRaidTo', callback, [broadcasterID]) },
        /**
         * Subscribes to events that represent a Channel Points reward being added to a channel.
         * @param {TwurpleCallback<EventSubWsListener['onChannelRewardAdd']>} callback
         * @param {string?} broadcasterID broadcaster to listen to (defaults to self)
         */
        onChannelRewardAdd(callback, broadcasterID = uid) { return wrapEvent(evs, 'onChannelRewardAdd', callback, [broadcasterID]) },
        /**
         * Subscribes to events that represent a Channel Points reward being updated.
         * @param {TwurpleCallback<EventSubWsListener['onChannelRewardUpdate']>} callback 
         * @param {string?} emoteID emote ID to listen to (all if undefined)
         * @param {string?} broadcasterID broadcaster to listen to (defaults to self)
         */
        onChannelRewardUpdate(callback, emoteID = null, broadcasterID = uid) {
            if(emoteID) return wrapEvent(evs, 'onChannelRewardUpdateForReward', callback, [broadcasterID, emoteID]);
            return wrapEvent(evs, 'onChannelRewardUpdate', callback, [broadcasterID]);
        },
        /**
         * Subscribes to events that represent a specific Channel Points reward being updated.
         * @param {TwurpleCallback<EventSubWsListener['onChannelRewardUpdateForReward']>} callback 
         * @param {string} emoteID emote ID to listen to
         * @param {string?} broadcasterID broadcaster to listen to (defaults to self)
         */
        onChannelRewardUpdateForReward(callback, emoteID, broadcasterID = uid) { return wrapEvent(evs, 'onChannelRewardUpdateForReward', callback, [broadcasterID, emoteID]) },
        /**
         * Subscribes to events that represent a Channel Points reward being removed.
         * @param {TwurpleCallback<EventSubWsListener['onChannelRewardRemove']>} callback 
         * @param {string?} emoteID emote ID to listen to (all if undefined)
         * @param {string?} broadcasterID broadcaster to listen to (defaults to self)
         */
        onChannelRewardRemove(callback, emoteID = null, broadcasterID = uid) {
            if(emoteID) return wrapEvent(evs, 'onChannelRewardRemoveForReward', callback, [broadcasterID, emoteID]);
            return wrapEvent(evs, 'onChannelRewardRemove', callback, [broadcasterID]);
        },
        /**
         * Subscribes to events that represent a specific Channel Points reward being removed.
         * @param {TwurpleCallback<EventSubWsListener['onChannelRewardRemoveForReward']>} callback
         * @param {string} emoteID emote ID to listen to
         * @param {string?} broadcasterID broadcaster to listen to (defaults to self)
         */
        onChannelRewardRemoveForReward(callback, emoteID, broadcasterID = uid) { return wrapEvent(evs, 'onChannelRewardRemoveForReward', callback, [broadcasterID, emoteID]) },
        /**
         * Subscribes to events that represents a Channel Points reward being redeemed.
         * @param {TwurpleCallback<EventSubWsListener['onChannelRedemptionAdd']>} callback 
         * @param {string?} emoteID emote ID to listen to (all if undefined)
         * @param {string?} broadcasterID broadcaster to listen to (defaults to self)
         */
        onChannelRedemptionAdd(callback, emoteID = null, broadcasterID = uid) {
            if(emoteID) return wrapEvent(evs, 'onChannelRedemptionAddForReward', callback, [broadcasterID, emoteID]);
            return wrapEvent(evs, 'onChannelRedemptionAdd', callback, [broadcasterID]);
        },
        /**
         * Subscribes to events that represent a specific Channel Points reward being redeemed.
         * @param {TwurpleCallback<EventSubWsListener['onChannelRedemptionAddForReward']>} callback 
         * @param {string} emoteID emote ID to listen to
         * @param {string?} broadcasterID broadcaster to listen to (defaults to self)
         */
        onChannelRedemptionAddForReward(callback, emoteID, broadcasterID = uid) { return wrapEvent(evs, 'onChannelRedemptionAddForReward', callback, [broadcasterID, emoteID]) },
        /**
         * Subscribes to events that represent pending redemptions being resolved.
         * @param {TwurpleCallback<EventSubWsListener['onChannelRedemptionUpdate']>} callback 
         * @param {string?} emoteID emote ID to listen to (all if undefined)
         * @param {string?} broadcasterID broadcaster to listen to (defaults to self)
         */
        onChannelRedemptionUpdate(callback, emoteID = null, broadcasterID = uid) {
            if(emoteID) return wrapEvent(evs, 'onChannelRedemptionUpdateForReward', callback, [broadcasterID, emoteID]);
            return wrapEvent(evs, 'onChannelRedemptionUpdate', callback, [broadcasterID]);
        },
        /**
         * Subscribes to events that represent pending redemptions being resolved.
         * @param {TwurpleCallback<EventSubWsListener['onChannelRedemptionUpdateForReward']>} callback 
         * @param {string?} broadcasterID broadcaster to listen to (defaults to self)
         */
        onChannelRedemptionUpdateForReward(callback, emoteID, broadcasterID = uid) { return wrapEvent(evs, 'onChannelRedemptionUpdateForReward', callback, [broadcasterID, emoteID]) },
        /**
         * Subscribes to events that represent a poll starting in a channel.
         * @param {TwurpleCallback<EventSubWsListener['onChannelPollBegin']>} callback 
         * @param {string?} broadcasterID broadcaster to listen to (defaults to self)
         */
        onChannelPollBegin(callback, broadcasterID = uid) { return wrapEvent(evs, 'onChannelPollBegin', callback, [broadcasterID]) },
        /**
         * Subscribes to events that represent a poll being voted on in a channel.
         * @param {TwurpleCallback<EventSubWsListener['onChannelPollProgress']>} callback 
         * @param {string?} broadcasterID broadcaster to listen to (defaults to self)
         */
        onChannelPollProgress(callback, broadcasterID = uid) { return wrapEvent(evs, 'onChannelPollProgress', callback, [broadcasterID]) },
        /**
         * Subscribes to events that represent a poll ending in a channel.
         * @param {TwurpleCallback<EventSubWsListener['onChannelPollEnd']>} callback 
         * @param {string?} broadcasterID broadcaster to listen to (defaults to self)
         */
        onChannelPollEnd(callback, broadcasterID = uid) { return wrapEvent(evs, 'onChannelPollEnd', callback, [broadcasterID]) },
        /**
         * Subscribes to events that represent a prediction starting in a channel.
         * @param {TwurpleCallback<EventSubWsListener['onChannelPredictionBegin']>} callback 
         * @param {string?} broadcasterID broadcaster to listen to (defaults to self)
         */
        onChannelPredictionBegin(callback, broadcasterID = uid) { return wrapEvent(evs, 'onChannelPredictionBegin', callback, [broadcasterID]) },
        /**
         * Subscribes to events that represent a prediction being voted on in a channel.
         * @param {TwurpleCallback<EventSubWsListener['onChannelPredictionProgress']>} callback 
         * @param {string?} broadcasterID broadcaster to listen to (defaults to self)
         */
        onChannelPredictionProgress(callback, broadcasterID = uid) { return wrapEvent(evs, 'onChannelPredictionProgress', callback, [broadcasterID]) },
        /**
         * Subscribes to events that represent a prediction being locked in a channel.
         * @param {TwurpleCallback<EventSubWsListener['onChannelPredictionLock']>} callback 
         * @param {string?} broadcasterID broadcaster to listen to (defaults to self)
         */
        onChannelPredictionLock(callback, broadcasterID = uid) { return wrapEvent(evs, 'onChannelPredictionLock', callback, [broadcasterID]) },
        /**
         * Subscribes to events that represent a prediction ending in a channel.
         * @param {TwurpleCallback<EventSubWsListener['onChannelPredictionEnd']>} callback 
         * @param {string?} broadcasterID broadcaster to listen to (defaults to self)
         */
        onChannelPredictionEnd(callback, broadcasterID = uid) { return wrapEvent(evs, 'onChannelPredictionEnd', callback, [broadcasterID]) },
        /**
         * Subscribes to events that represent a Goal beginning.
         * @param {TwurpleCallback<EventSubWsListener['onChannelGoalBegin']>} callback 
         * @param {string?} broadcasterID broadcaster to listen to (defaults to self)
         */
        onChannelGoalBegin(callback, broadcasterID = uid) { return wrapEvent(evs, 'onChannelGoalBegin', callback, [broadcasterID]) },
        /**
         * Subscribes to events that represent progress in a Goal in a channel.
         * @param {TwurpleCallback<EventSubWsListener['onChannelGoalProgress']>} callback 
         * @param {string?} broadcasterID broadcaster to listen to (defaults to self)
         */
        onChannelGoalProgress(callback, broadcasterID = uid) { return wrapEvent(evs, 'onChannelGoalProgress', callback, [broadcasterID]) },
        /**
         * Subscribes to events that represent the end of a Goal in a channel.
         * @param {TwurpleCallback<EventSubWsListener['onChannelGoalEnd']>} callback 
         * @param {string?} broadcasterID broadcaster to listen to (defaults to self)
         */
        onChannelGoalEnd(callback, broadcasterID = uid) { return wrapEvent(evs, 'onChannelGoalEnd', callback, [broadcasterID]) },
        /**
         * Subscribes to events that represent a Hype Train beginning.
         * @param {TwurpleCallback<EventSubWsListener['onChannelHypeTrainBegin']>} callback 
         * @param {string?} broadcasterID broadcaster to listen to (defaults to self)
         */
        onChannelHypeTrainBegin(callback, broadcasterID = uid) { return wrapEvent(evs, 'onChannelHypeTrainBegin', callback, [broadcasterID]) },
        /**
         * Subscribes to events that represent progress in a Hype Train in a channel.
         * @param {TwurpleCallback<EventSubWsListener['onChannelHypeTrainProgress']>} callback 
         * @param {string?} broadcasterID broadcaster to listen to (defaults to self)
         */
        onChannelHypeTrainProgress(callback, broadcasterID = uid) { return wrapEvent(evs, 'onChannelHypeTrainProgress', callback, [broadcasterID]) },
        /**
         * Subscribes to events that represent the end of a Hype Train in a channel.
         * @param {TwurpleCallback<EventSubWsListener['onChannelHypeTrainEnd']>} callback 
         * @param {string?} broadcasterID broadcaster to listen to (defaults to self)
         */
        onChannelHypeTrainEnd(callback, broadcasterID = uid) { return wrapEvent(evs, 'onChannelHypeTrainEnd', callback, [broadcasterID]) },
        /**
         * Subscribes to events that represent a Hype Train beginning.
         * @param {TwurpleCallback<EventSubWsListener['onChannelHypeTrainBeginV2']>} callback 
         * @param {string?} broadcasterID broadcaster to listen to (defaults to self)
         */
        onChannelHypeTrainBeginV2(callback, broadcasterID = uid) { return wrapEvent(evs, 'onChannelHypeTrainBeginV2', callback, [broadcasterID]) },
        /**
         * Subscribes to events that represent progress in a Hype Train in a channel.
         * @param {TwurpleCallback<EventSubWsListener['onChannelHypeTrainProgressV2']>} callback 
         * @param {string?} broadcasterID broadcaster to listen to (defaults to self)
         */
        onChannelHypeTrainProgressV2(callback, broadcasterID = uid) { return wrapEvent(evs, 'onChannelHypeTrainProgressV2', callback, [broadcasterID]) },
        /**
         * Subscribes to events that represent the end of a Hype Train in a channel.
         * @param {TwurpleCallback<EventSubWsListener['onChannelHypeTrainEndV2']>} callback 
         * @param {string?} broadcasterID broadcaster to listen to (defaults to self)
         */
        onChannelHypeTrainEndV2(callback, broadcasterID = uid) { return wrapEvent(evs, 'onChannelHypeTrainEndV2', callback, [broadcasterID]) },
        /**
         * Subscribes to events that represent a broadcaster shouting out another broadcaster.
         * @param {TwurpleCallback<EventSubWsListener['onChannelShoutoutCreate']>} callback 
         * @param {string?} broadcasterID broadcaster to listen to (defaults to self)
         */
        onChannelShoutoutCreate(callback, broadcasterID = uid) { return wrapEvent(evs, 'onChannelShoutoutCreate', callback, [broadcasterID, uid]) },
        /**
         * Subscribes to events that represent a broadcaster being shouted out by another broadcaster.
         * @param {TwurpleCallback<EventSubWsListener['onChannelShoutoutReceive']>} callback 
         * @param {string?} broadcasterID broadcaster to listen to (defaults to self)
         */
        onChannelShoutoutReceive(callback, broadcasterID = uid) { return wrapEvent(evs, 'onChannelShoutoutReceive', callback, [broadcasterID, uid]) },
        /**
         * Subscribes to events that represent an channel's chat being cleared.
         * @param {TwurpleCallback<EventSubWsListener['onChannelChatClear']>} callback 
         * @param {string?} broadcasterID broadcaster to listen to (defaults to self)
         */
        onChannelChatClear(callback, broadcasterID = uid) { return wrapEvent(evs, 'onChannelChatClear', callback, [broadcasterID, uid]) },
        /**
         * Subscribes to events that represent a user's chat messages being cleared in a channel.
         * @param {TwurpleCallback<EventSubWsListener['onChannelChatClearUserMessages']>} callback 
         * @param {string?} broadcasterID broadcaster to listen to (defaults to self)
         */
        onChannelChatClearUserMessages(callback, broadcasterID = uid) { return wrapEvent(evs, 'onChannelChatClearUserMessages', callback, [broadcasterID, uid]) },
        /**
         * Subscribes to events that represent a chat message being deleted in a channel.
         * @param {TwurpleCallback<EventSubWsListener['onChannelChatMessageDelete']>} callback 
         * @param {string?} broadcasterID broadcaster to listen to (defaults to self)
         */
        onChannelChatMessageDelete(callback, broadcasterID = uid) {return wrapEvent(evs, 'onChannelChatMessageDelete', callback, [broadcasterID, uid]);},
        /**
         * Subscribes to events that represent a chat notification being sent to a channel.
         * @param {TwurpleCallback<EventSubWsListener['onChannelChatNotification']>} callback 
         * @param {string?} broadcasterID broadcaster to listen to (defaults to self)
         * @param {'EventSub' | number?} type type of combination to use for the notification event (IRC is invalid)
         */
        onChannelChatNotification(callback, broadcasterID = uid, type = 5) {
            if(type == 'IRC') {
                return console.error('onChannelChatNotification does not support the IRC event type');
            }
            /**
             * @typedef {{type: T, args: Parameters<TwurpleCallback<ChatClient[T]>>}} NotificationChatFunc
             * @template {keyof ChatClient} T
             */
            /**
             * @typedef { NotificationChatFunc<'onResub'> | 
             *  NotificationChatFunc<'onSub'> | 
             *  NotificationChatFunc<'onSub'> | 
             *  NotificationChatFunc<'onSubGift'>
             * } tmp
             */
            /**
             * @param {Parameters<TwurpleCallback<EventSubWsListener['onChannelChatNotification']>>[0]} data
             */
            function getEVSID(data) {
                switch(data.type) {
                    case "announcement": return null;
                    case 'bits_badge_tier': return null;
                    case 'charity_donation': return null;
                    case 'community_sub_gift': return null;
                    case 'gift_paid_upgrade': return null;
                    case 'pay_it_forward': return null;
                    case 'prime_paid_upgrade': return null;
                    case 'raid': return null;
                    case 'resub': return data.tier + " - " + data.chatterId + " - " + data.cumulativeMonths;
                    case 'sub': return data.tier + " - " + data.chatterId;
                    case 'sub_gift': return data.tier + " - " + data.recipientId;
                    case 'unraid': return null;
                }
            }
            /**
             * 
             * @param {tmp} data 
             */
            function getChatID(data) {
                switch(data.type) {
                    case 'onResub': return "resub - " + (data.args[2].isPrime?'1000':data.args[2].plan) + " - " + data.args[2].userId + " - " + data.args[2].months;
                    case 'onSub': return "sub - " + (data.args[2].isPrime?'1000':data.args[2].plan) + " - " + data.args[2].userId;
                    case 'onSubGift': return "sub_gift - " + (data.args[2].isPrime?'1000':data.args[2].plan) + " - " + data.args[2].userId;
                }
            }
            return combineListeners(type, api, broadcasterID,
                /**
                 * @param {number} id
                 * @param {TwurpleCallback<EventSubWsListener['onChannelChatNotification']>} cbk
                 */
                (id, cbk) => wrapEvent(evs, 'onChannelChatNotification', cbk, [id, uid]),
                (data) => {
                    const d = getEVSID(data);
                    if(!d) return null;
                    return data.type + " - " + d;
                },
                /**
                 * 
                 * @param {string} name 
                 * @param {(data: tmp) => any} cbk 
                 * @returns 
                 */
                (name, cbk) => combineChat(cbk,
                    (c) => wrapChat(evs, name, 'onResub', (...args) => c({type: 'onResub', args})),
                    (c) => wrapChat(evs, name, 'onSub', (...args) => c({type: 'onSub', args})),
                    (c) => wrapChat(evs, name, 'onSub', (...args) => c({type: 'onSub', args})),
                    (c) => wrapChat(evs, name, 'onSubGift', (...args) => c({type: 'onSubGift', args}))
                ),
                (data) => {
                    return getChatID(data);
                },
                (evsdata, ircData) => {
                switch(evsdata.type) {
                    case "announcement": return callback(evsdata);
                    case 'bits_badge_tier':
                    case 'charity_donation':
                    case 'community_sub_gift':
                    case 'gift_paid_upgrade':
                    case 'pay_it_forward':
                    case 'prime_paid_upgrade':
                    case 'unraid':
                    case 'raid': return callback(data);
                    case 'resub': 
                    case 'sub':
                    case 'sub_gift':
                        evsdata.ircData = ircData[0].args[2];
                        evsdata.ircUser = ircData[0].args[3];
                        return callback(data);
                }
                }
            )
            return wrapEvent(evs, 'onChannelChatNotification', callback, [broadcasterID, uid])
        },
        /**
         * @typedef onChannelMessageParam
         * @prop {Parameters<TwurpleCallback<EventSubWsListener['onChannelChatMessage']>>[0]?} EventSubData Original EventSub Data that this data is obtained from
         * @prop {Parameters<TwurpleCallback<ChatClient['onMessage']>>[3]?} IRCData Original IRC Data that this data is obtained from
         * @prop {'text' | 'cheermote' | 'emote' | 'mention' | null} messageType Type of Message that was sent (null if EventSub packet was dropped)
         * @prop {string} broadcasterID ID of the channel this message was sent in
         * @prop {string?} broadcasterName Username of the channel this message was sent in (null if EventSub packet was dropped)
         * @prop {string?} broadcasterDisplayName Display Name of the channel this message was sent in (null if EventSub packet was dropped)
         * @prop {string} chatterId ID of the user who sent the message
         * @prop {string} chatterName Username of the user who sent the message
         * @prop {string} chatterDisplayName Display Name of the user who sent the message
         * @prop {string} parentMessageId ID of the message the user replied to
         * @prop {string} parentMessageText Message Text of the message the user replied to
         * @prop {string} parentMessageUserId User ID of the message the user replied to
         * @prop {string} parentMessageUserName User Name of the message the user replied to
         * @prop {string} parentMessageUserDisplayName User Display Name of the message the user replied to
         * @prop {string} threadMessageId ID of the first message of the thread the user replied to
         * @prop {string} threadMessageUserId User ID of the first message of the thread the user replied to
         * @prop {string} threadMessageUserName User Name of the first message of the thread the user replied to
         * @prop {string} threadMessageUserDisplayName User Display Name of the first message of the thread the user replied to
         * @prop {number} bits amounts of bits used in this message
         * @prop {boolean} isRedemption true if this message redeems a redeem
         * @prop {string} rewardId ID of the redeem that was claimed with this message
         * @prop {string} redeemId ID of the redeem that was claimed with this message
         * @prop {string?} sourceBroadcasterId during multi streams, the ID of the broadcaster the chatter originally sent the message in (null if EventSub packet was dropped)
         * @prop {string?} sourceBroadcasterName during multi streams, the Name of the broadcaster the chatter originally sent the message in (null if EventSub packet was dropped)
         * @prop {string?} sourceBroadcasterDisplayName during multi streams, the Display Name of the broadcaster the chatter originally sent the message in (null if EventSub packet was dropped)
         * @prop {string?} sourceMessageId during multi streams, the original ID of the message in its original chat (null if EventSub packet was dropped)
         * @prop {{[badge: string]: string}?} sourceBadges during multi streams, the badges the user has in their original chat (null if EventSub packet was dropped)
         * @prop {boolean?} isSorceOnly during multi streams, true if this message was not shared to other streamers
         * @prop {string} color User Color of the user who sent the message
         * @prop {{[badge: string]: string}} badges Badges of the user who sent the message {badge name: badge version}
         * @prop {string} messageId ID of the message that was sent
         * @prop {string} messageText Message text
         * @prop {Parameters<TwurpleCallback<EventSubWsListener['onChannelChatMessage']>>[0]['messageParts']?} messageParts Individual Parts of the message (split by emotes and etc) (null if EventSub packet was dropped)
         * @prop {boolean?} isFirst true if this is the chatters first message (null if IRC packet was dropped)
         * @prop {boolean?} isReturningChatter true if the chatter has not messaged in a long time (null if IRC packet was dropped)
         * @prop {boolean?} isHighlight true if chatter highlighted their message (null if IRC packet was dropped)
         * @prop {boolean} isReply true if chatter replied to someone
         * @prop {{[tag: string]: string}?} tags Individual IRC Tags of the message (null if IRC packet was dropped)
         */
        /**
         * Subscribes to events that represent a chat message being sent to a channel.
         * @param {(data: onChannelMessageParam) => void} callback 
         * @param {string?} broadcasterID broadcaster to listen to (defaults to self)
         * @param {IRCEventableType?} type type of listener to subscribe as, defaults to a combination of IRC and EventSub messages (number for timeout period)
         */
        onChannelChatMessage(callback, broadcasterID = uid, type = 5) {
            return combineListeners(type, api, broadcasterID,
                /**
                 * 
                 * @param {number} id 
                 * @param {TwurpleCallback<EventSubWsListener['onChannelChatMessage']>} cbk 
                 * @returns 
                 */
                (id, cbk) => wrapEvent(evs, 'onChannelChatMessage', cbk, [broadcasterID, uid]),
                (data) => data.messageId,
                /**
                 * 
                 * @param {string} name 
                 * @param {TwurpleCallback<ChatClient['onMessage']} cbk 
                 * @returns 
                 */
                (name, cbk) => wrapChat(evs, name, 'onMessage', cbk),
                (channel, user, text, msg) => msg.id,
                (evsData, ircData) => callback({
                    EventSubData: evsData,
                    IRCData: ircData?.[3],
                    messageType: evsData?.messageType ?? null, // TODO text, cheermote (emote only but p2w), emote, mention
                    broadcasterID: evsData?.broadcasterId ?? ircData?.[3].channelId,
                    broadcasterName: evsData?.broadcasterName ?? undefined,
                    broadcasterDisplayName: evsData?.broadcasterDisplayName ?? undefined,
                    chatterId: evsData?.chatterId ?? ircData?.[3].userInfo.userId,
                    chatterName: evsData?.chatterName ?? ircData?.[3].userInfo.userName,
                    chatterDisplayName: evsData?.chatterDisplayName ?? ircData?.[3].userInfo.displayName,
                    color: evsData?.color ?? ircData?.[3].userInfo.color,
                    badges: evsData?.badges ?? ircData?.[3].userInfo.badges,
                    messageId: evsData?.messageId ?? ircData?.[3].id,
                    messageText: evsData?.messageText ?? ircData?.[2],
                    messageParts: evsData?.messageParts ?? null, // TODO?
                    parentMessageId: evsData?.parentMessageId ?? ircData?.[3].parentMessageId,
                    parentMessageText: evsData?.parentMessageText ?? ircData?.[3].parentMessageText,
                    parentMessageUserId: evsData?.parentMessageUserId ?? ircData?.[3].parentMessageUserId,
                    parentMessageUserName: evsData?.parentMessageUserId ?? ircData?.[3].parentMessageUserName,
                    parentMessageUserDisplayName: evsData?.parentMessageUserDisplayName ?? ircData?.[3].parentMessageUserDisplayName,
                    threadMessageId: evsData?.threadMessageId ?? ircData?.[3].threadMessageId,
                    threadMessageUserId: evsData?.threadMessageUserId ?? ircData?.[3].threadMessageUserId,
                    threadMessageUserName: evsData?.threadMessageUserName ?? ircData?.[3].threadMessageUserName,
                    threadMessageUserDisplayName: evsData?.threadMessageUserDisplayName ?? ircData?.[3].threadMessageUserDisplayName,
                    isCheer: evsData?.isCheer ?? ircData?.[3].isCheer,
                    bits: evsData?.bits ?? ircData?.[3].bits,
                    isRedemption: evsData?.isRedemption ?? ircData?.[3].isRedemption,
                    rewardId: evsData?.rewardId ?? ircData?.[3].rewardId,
                    redeemId: evsData?.rewardId ?? ircData?.[3].rewardId,
                    sourceBroadcasterId: evsData?.sourceBroadcasterId ?? null, // Doesn't ecist in IRC
                    sourceBroadcasterName: evsData?.sourceBroadcasterName ?? null,
                    sourceBroadcasterDisplayName: evsData?.sourceBroadcasterDisplayName ?? null,
                    sourceMessageId: evsData?.sourceMessageId ?? null,
                    sourceBadges: evsData?.sourceBadges ?? null,
                    isSorceOnly: evsData?.isSourceOnly ?? null,
                    
                    isFirst: ircData?.[3].isFirst ?? null, // Doesn't exist in EVS
                    isReturningChatter: ircData?.[3].isReturningChatter ?? null, // Doesn't exist in EVS
                    isHighlight: ircData?.[3].isHighlight ?? null, // Doesn't exist in EVS
                    isReply: ircData?.[3].isReply ?? Boolean(evsData?.parentMessageId),
                    tags: ircData?.[3].tags ?? null
                })
            );
        },
        /**
         * Subscribes to events that represent chat settings being updated in a channel.
         * @param {TwurpleCallback<EventSubWsListener['onChannelChatSettingsUpdate']>} callback 
         * @param {string?} broadcasterID broadcaster to listen to (defaults to self)
         */
        onChannelChatSettingsUpdate(callback, broadcasterID = uid) { return wrapEvent(evs, 'onChannelChatSettingsUpdate', callback, [broadcasterID, uid]) },
        /**
         * Subscribes to events that represent an unban request being created.
         * @param {TwurpleCallback<EventSubWsListener['onChannelUnbanRequestCreate']>} callback 
         * @param {string?} broadcasterID broadcaster to listen to (defaults to self)
         */
        onChannelUnbanRequestCreate(callback, broadcasterID = uid) { return wrapEvent(evs, 'onChannelUnbanRequestCreate', callback, [broadcasterID, uid]) },
        /**
         * Subscribes to events that represent an unban request being resolved.
         * @param {TwurpleCallback<EventSubWsListener['onChannelUnbanRequestResolve']>} callback 
         * @param {string?} broadcasterID broadcaster to listen to (defaults to self)
         */
        onChannelUnbanRequestResolve(callback, broadcasterID = uid) { return wrapEvent(evs, 'onChannelUnbanRequestResolve', callback, [broadcasterID, uid]) },
        /**
         * Subscribes to events that represent a warning being acknowledged by a user.
         * @param {TwurpleCallback<EventSubWsListener['onChannelWarningAcknowledge']>} callback 
         * @param {string?} broadcasterID broadcaster to listen to (defaults to self)
         */
        onChannelWarningAcknowledge(callback, broadcasterID = uid) { return wrapEvent(evs, 'onChannelWarningAcknowledge', callback, [broadcasterID, uid]) },
        /**
         * Subscribes to events that represent a warning sent to a user.
         * @param {TwurpleCallback<EventSubWsListener['onChannelWarningSend']>} callback 
         * @param {string?} broadcasterID broadcaster to listen to (defaults to self)
         */
        onChannelWarningSend(callback, broadcasterID = uid) { return wrapEvent(evs, 'onChannelWarningSend', callback, [broadcasterID, uid]) },
        /**
         * Subscribes to events that represent a user getting VIP status in a channel.
         * @param {TwurpleCallback<EventSubWsListener['onChannelVipAdd']>} callback 
         * @param {string?} broadcasterID broadcaster to listen to (defaults to self)
         */
        onChannelVipAdd(callback, broadcasterID = uid) { return wrapEvent(evs, 'onChannelVipAdd', callback, [broadcasterID]) },
        /**
         * Subscribes to events that represent a user losing VIP status in a channel.
         * @param {TwurpleCallback<EventSubWsListener['onChannelVipRemove']>} callback 
         * @param {string?} broadcasterID broadcaster to listen to (defaults to self)
         */
        onChannelVipRemove(callback, broadcasterID = uid) { return wrapEvent(evs, 'onChannelVipRemove', callback, [broadcasterID]) },
        /**
         * Subscribes to events that represent a suspicious user updated in a channel.
         * @param {TwurpleCallback<EventSubWsListener['onChannelSuspiciousUserUpdate']>} callback 
         * @param {string?} broadcasterID broadcaster to listen to (defaults to self)
         */
        onChannelSuspiciousUserUpdate(callback, broadcasterID = uid) { return wrapEvent(evs, 'onChannelSuspiciousUserUpdate', callback, [broadcasterID, uid]) },
        /**
         * Subscribes to events that represent a message sent by a suspicious user.
         * @param {TwurpleCallback<EventSubWsListener['onChannelSuspiciousUserMessage']>} callback 
         * @param {string?} broadcasterID broadcaster to listen to (defaults to self)
         */
        onChannelSuspiciousUserMessage(callback, broadcasterID = uid) { return wrapEvent(evs, 'onChannelSuspiciousUserMessage', callback, [broadcasterID, uid]) },
        /**
         * Subscribes to events that represent a drop entitlement being granted.
         * @param {TwurpleCallback<EventSubWsListener['onDropEntitlementGrant']>} callback 
         * @param {string?} broadcasterID broadcaster to listen to (defaults to self)
         */
        onDropEntitlementGrant(callback, broadcasterID = uid) { return wrapEvent(evs, 'onDropEntitlementGrant', callback, [broadcasterID]) },
        /**
         * Subscribes to events that represent a Bits transaction in an extension.
         * @param {TwurpleCallback<EventSubWsListener['onExtensionBitsTransactionCreate']>} callback 
         * @param {string?} broadcasterID broadcaster to listen to (defaults to self)
         */
        onExtensionBitsTransactionCreate(callback) { return wrapEvent(evs, 'onExtensionBitsTransactionCreate', callback) },
        /**
         * Subscribes to events that represent a user's notification about their chat message being held by AutoMod.
         * @param {TwurpleCallback<EventSubWsListener['onChannelChatUserMessageHold']>} callback 
         * @param {string?} broadcasterID broadcaster to listen to (defaults to self)
         */
        onChannelChatUserMessageHold(callback, broadcasterID = uid) { return wrapEvent(evs, 'onChannelChatUserMessageHold', callback, [broadcasterID, uid]) },
        /**
         * Subscribes to events that represent a user's notification about their held chat message being resolved.
         * @param {TwurpleCallback<EventSubWsListener['onChannelChatUserMessageUpdate']>} callback 
         * @param {string?} broadcasterID broadcaster to listen to (defaults to self)
         */
        onChannelChatUserMessageUpdate(callback, broadcasterID = uid) { return wrapEvent(evs, 'onChannelChatUserMessageUpdate', callback, [broadcasterID, uid]) },
        /**
         * Subscribes to events that indicate the start of a shared chat session in a channel.
         * @param {TwurpleCallback<EventSubWsListener['onChannelSharedChatSessionBegin']>} callback 
         * @param {string?} broadcasterID broadcaster to listen to (defaults to self)
         */
        onChannelSharedChatSessionBegin(callback, broadcasterID = uid) { return wrapEvent(evs, 'onChannelSharedChatSessionBegin', callback, [broadcasterID]) },
        /**
         * Subscribes to events that indicate updates to a shared chat session in a channel.
         * @param {TwurpleCallback<EventSubWsListener['onChannelSharedChatSessionUpdate']>} callback 
         * @param {string?} broadcasterID broadcaster to listen to (defaults to self)
         */
        onChannelSharedChatSessionUpdate(callback, broadcasterID = uid) { return wrapEvent(evs, 'onChannelSharedChatSessionUpdate', callback, [broadcasterID]) },
        /**
         * Subscribes to events that indicate the end of a shared chat session in a channel.
         * @param {TwurpleCallback<EventSubWsListener['onChannelSharedChatSessionEnd']>} callback 
         * @param {string?} broadcasterID broadcaster to listen to (defaults to self)
         */
        onChannelSharedChatSessionEnd(callback, broadcasterID = uid) { return wrapEvent(evs, 'onChannelSharedChatSessionEnd', callback, [broadcasterID]) },
        /**
         * Subscribes to events indicating that bits are used in a channel.
         * @param {TwurpleCallback<EventSubWsListener['onChannelBitsUse']>} callback 
         * @param {string?} broadcasterID broadcaster to listen to (defaults to self)
         */
        onChannelBitsUse(callback, broadcasterID = uid) { return wrapEvent(evs, 'onChannelBitsUse', callback, [broadcasterID]) },
        /**
         * Subscribes to events that represent a user updating their account details.
         * @param {TwurpleCallback<EventSubWsListener['onUserUpdate']>} callback 
         * @param {string?} broadcasterID broadcaster to listen to (defaults to self)
         */
        onUserUpdate(callback, broadcasterID = uid) { return wrapEvent(evs, 'onUserUpdate', callback, [broadcasterID]) },
        /**
         * Subscribes to events that represent a user receiving a whisper message from another user.
         * @param {TwurpleCallback<EventSubWsListener['onUserWhisperMessage']>} callback 
         * @param {string?} broadcasterID broadcaster to listen to (defaults to self)
         */
        onUserWhisperMessage(callback, broadcasterID = uid) { return wrapEvent(evs, 'onUserWhisperMessage', callback, [broadcasterID]) },
    }

    // DEV
    /**
     * @typedef {keyof {[K in keyof A as K extends keyof B[keyof B]? never: K]: any}} missingFunctions
     * @template A
     * @template B
     */
    /**
     * @type {{[K in keyof {[J in keyof EventSubWsListener as J extends `on${string}` ? J : never]: EventSubWsListener[J]} as K extends keyof typeof EventSubFunctions? never : K]: any}}
     */
    const missingFunctions = {};
    missingFunctions

    return EventSubFunctions;
}

/**
 * @type {missingFunctions<{c: true, b:true}, {a: {b: true}}>}
 */
const a = '';