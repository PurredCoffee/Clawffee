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
 * @param {string} name 
 * @param {Function} callback 
 * @param {Array} args 
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
                addIRCData(id, args);
            });
        });
    }
    if(type != 'IRC') {
        EVSListener = evsCbk(channelID, (...args) => {
            let id = evsIDCbk(...args);
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
        onChannelSubscription(callback, broadcasterID = uid) { return wrapEvent(evs, 'onChannelSubscription', callback, [broadcasterID]) },
        /**
         * Subscribes to events that represent a user gifting a subscription to a channel to someone else.
         * @param {TwurpleCallback<EventSubWsListener['onChannelSubscriptionGift']>} callback 
         * @param {string?} broadcasterID broadcaster to listen to (defaults to self)
         */
        onChannelSubscriptionGift(callback, broadcasterID = uid) { return wrapEvent(evs, 'onChannelSubscriptionGift', callback, [broadcasterID]) },
        /**
         * Subscribes to events that represent a user's subscription to a channel being announced.
         * @param {TwurpleCallback<EventSubWsListener['onChannelSubscriptionMessage']>} callback 
         * @param {string?} broadcasterID broadcaster to listen to (defaults to self)
         */
        onChannelSubscriptionMessage(callback, broadcasterID = uid) { return wrapEvent(evs, 'onChannelSubscriptionMessage', callback, [broadcasterID]) },
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
         */
        onChannelChatNotification(callback, broadcasterID = uid) { return wrapEvent(evs, 'onChannelChatNotification', callback, [broadcasterID, uid]) },
        /**
         * @typedef onChannelMessageParam
         * @prop {Parameters<TwurpleCallback<EventSubWsListener['onChannelChatMessage']>>[0]} EventSubData
         * @prop {Parameters<TwurpleCallback<ChatClient['onMessage']>>[3]} IRCData
         * @prop {'text' | 'cheermote' | 'emote' | 'mention' | null} messageType
         * @prop {string} broadcasterID
         * @prop {string} broadcasterDisplayName
         * @prop {string} chatterId
         * @prop {string} chatterName
         * @prop {string} chatterDisplayName
         * @prop {string} color
         * @prop {string} badges
         * @prop {string} messageId
         * @prop {string} messageText
         * @prop {Parameters<TwurpleCallback<EventSubWsListener['onChannelChatMessage']>>[0]['messageParts'] | null} messageParts
         * @prop {boolean | null} isFirst
         * @prop {boolean | null} isReturningChatter
         * @prop {boolean | null} isHighlight
         * @prop {boolean} isReply
         * @prop {{[tag: string]: string} | nul} tags
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
                (evsData, ircData) => {
                    callback({
                        EventSubData: evsData,
                        IRCData: ircData[3],
                        messageType: evsData.messageType ?? null, // TODO text, cheermote (emote only but p2w), emote, mention
                        broadcasterID: evsData.broadcasterId ?? ircData[3].channelId,
                        broadcasterDisplayName: evsData.broadcasterDisplayName ?? ircData[3].userInfo.displayName,
                        chatterId: evsData.chatterId ?? ircData[3].userInfo.userId,
                        chatterName: evsData.chatterName ?? ircData[3].userInfo.userName,
                        chatterDisplayName: evsData.chatterDisplayName ?? ircData[3].userInfo.displayName,
                        color: evsData.color ?? ircData[3].userInfo.color,
                        badges: evsData.badges ?? ircData[3].userInfo.badges,
                        messageId: evsData.messageId ?? ircData[3].id,
                        messageText: evsData.messageText ?? ircData[2],
                        messageParts: evsData.messageParts ?? null, // TODO?
                        parentMessageId: evsData.parentMessageId ?? ircData[3].parentMessageId,
                        parentMessageText: evsData.parentMessageText ?? ircData[3].parentMessageText,
                        parentMessageUserId: evsData.parentMessageUserId ?? ircData[3].parentMessageUserId,
                        parentMessageUserName: evsData.parentMessageUserId ?? ircData[3].parentMessageUserId,
                        parentMessageUserDisplayName: evsData.parentMessageUserDisplayName ?? ircData[3].parentMessageUserDisplayName,
                        threadMessageId: evsData.threadMessageId ?? ircData[3].threadMessageId,
                        threadMessageUserId: evsData.threadMessageUserId ?? ircData[3].threadMessageUserId,
                        threadMessageUserName: evsData.threadMessageUserName ?? ircData[3].threadMessageUserName,
                        threadMessageUserDisplayName: evsData.threadMessageUserDisplayName ?? ircData[3].threadMessageUserDisplayName,
                        isCheer: evsData.isCheer ?? ircData[3].isCheer,
                        bits: evsData.bits ?? ircData[3].bits,
                        isRedemption: evsData.isRedemption ?? ircData[3].isRedemption,
                        rewardId: evsData.rewardId ?? ircData[3].rewardId,
                        sourceBroadcasterId: evsData.sourceBroadcasterId ?? null, // Doesn't ecist in IRC
                        sourceBroadcasterName: evsData.sourceBroadcasterName ?? null,
                        sourceBroadcasterDisplayName: evsData.sourceBroadcasterDisplayName ?? null,
                        sourceMessageId: evsData.sourceMessageId ?? null,
                        sourceBadges: evsData.sourceBadges ?? null,
                        isSorceOnly: evsData.isSourceOnly ?? null,
                        
                        isFirst: ircData[3].isFirst ?? null, // Doesn't exist in EVS
                        isReturningChatter: ircData[3].isReturningChatter ?? null, // Doesn't exist in EVS
                        isHighlight: ircData[3].isHighlight ?? null, // Doesn't exist in EVS
                        isReply: ircData[3].isReply ?? Boolean(evsData.parentMessageId),
                        tags: ircData[3].tags ?? null
                    });
                }
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