const { ApiClient } = require("@twurple/api");
const { EventSubWsListener } = require("@twurple/eventsub-ws");
const { ChatClient } = require("@twurple/chat");
const wrapEVS = require('./wrapEventSub');
const { deepCleanTwitchData } = require('./cleanTwurple');

/**
 * @typedef {{[K in keyof T as T[K] extends U ? never : K] : T[K]}} ExcludeSubType
 * @template T
 * @template U
 */
/**
 * @typedef {{[K in keyof ExcludeSubType<ApiClient, Function> as K extends `_${string}` ? never : K]: ApiClient[K]} & {callApi(): ApiClient['callApi']}} TwitchApi
 */

/**
 * 
 * @param {ApiClient} object 
 */
function cleanAPIOutput(object) {
    return new Proxy(object, {
        get(target, prop, receiver) {
            let result = Reflect.get(target, prop, receiver);
            if(typeof result == 'function') {
                return (...args) => {
                    try {
                        let ret = result.bind(object)(...args);
                        if(ret instanceof Promise) {
                            return ret.then(data => deepCleanTwitchData(data));
                        }
                        return deepCleanTwitchData(ret);
                    } catch (e) {
                        throw e;
                    }
                }
            }
            if(result && typeof result == 'object')
                return cleanAPIOutput(result);
            return result;
        }
    });
}

function wrapEventSubListener(evs, api, uid) {
    const EventSubFunctions = wrapEVS(evs, api, uid);
    
    return {
        internal: {
            onUserSocketConnect: EventSubFunctions.onUserSocketConnect,
            onUserSocketDisconnect: EventSubFunctions.onUserSocketDisconnect,
            onRevoke: EventSubFunctions.onRevoke,
            onSubscriptionCreateSuccess: EventSubFunctions.onSubscriptionCreateSuccess,
            onSubscriptionCreateFailure: EventSubFunctions.onSubscriptionCreateFailure,
            onSubscriptionDeleteSuccess: EventSubFunctions.onSubscriptionDeleteSuccess,
            onSubscriptionDeleteFailure: EventSubFunctions.onSubscriptionDeleteFailure,
            onUserAuthorizationGrant: EventSubFunctions.onUserAuthorizationGrant,
            onUserAuthorizationRevoke: EventSubFunctions.onUserAuthorizationRevoke
        },
        channel: {
            onStreamOnline: EventSubFunctions.onStreamOnline,
            onStreamOffline: EventSubFunctions.onStreamOffline,
            onAdBreakBegin: EventSubFunctions.onChannelAdBreakBegin,
            onUpdate: EventSubFunctions.onChannelUpdate,
            onFollow: EventSubFunctions.onChannelFollow,
            onRaidFrom: EventSubFunctions.onChannelRaidFrom,
            onRaidTo: EventSubFunctions.onChannelRaidTo,
            onUserUpdate: EventSubFunctions.onUserUpdate
        },
        autoMod: {
            onMessageHold: EventSubFunctions.onAutoModMessageHoldV2,
            onMessageUpdate: EventSubFunctions.onAutoModMessageUpdateV2,
            onSettingsUpdate: EventSubFunctions.onAutoModSettingsUpdate,
            onTermsUpdate: EventSubFunctions.onAutoModTermsUpdate,
            onShieldModeBegin: EventSubFunctions.onChannelShieldModeBegin,
            onShieldModeEnd: EventSubFunctions.onChannelShieldModeEnd,
        },
        redeems: {
            onAutomaticRedemptionAdd: EventSubFunctions.onChannelAutomaticRewardRedemptionAddV2,
            onAdd: EventSubFunctions.onChannelRewardAdd,
            onRemove: EventSubFunctions.onChannelRewardRemove,
            onUpdate: EventSubFunctions.onChannelRewardUpdate,
            onRedeem: EventSubFunctions.onChannelRedemptionAdd,
            onRedeemUpdate: EventSubFunctions.onChannelRedemptionUpdate,
        },
        chat: {
            onBan: EventSubFunctions.onChannelBan,
            onUnban: EventSubFunctions.onChannelUnban,
            onModerate: EventSubFunctions.onChannelModerate,
            onModeratorAdd: EventSubFunctions.onChannelModeratorAdd,
            onModeratorRemove: EventSubFunctions.onChannelModeratorRemove,
            onClear: EventSubFunctions.onChannelChatClear,
            onClearUserMessages: EventSubFunctions.onChannelChatClearUserMessages,
            onMessageDelete: EventSubFunctions.onChannelChatMessageDelete,
            onMessage: EventSubFunctions.onChannelChatMessage,
            onNotification: EventSubFunctions.onChannelChatNotification,
            onUpdate: EventSubFunctions.onChannelChatSettingsUpdate,
            onUnbanRequest: EventSubFunctions.onChannelUnbanRequestCreate,
            onUnbanRequestResolve: EventSubFunctions.onChannelUnbanRequestResolve,
            onWarning: EventSubFunctions.onChannelWarningSend,
            onWarningAcknowledge: EventSubFunctions.onChannelWarningAcknowledge,
            onVipAdd: EventSubFunctions.onChannelVipAdd,
            onVipRemove: EventSubFunctions.onChannelVipRemove,
            onWhisper: EventSubFunctions.onUserWhisperMessage,
        },
        bits: {
            onCheer: EventSubFunctions.onChannelCheer,
        },
        subs: {
            raw: {
                onSub: EventSubFunctions.onChannelSubscription,
                onResub: EventSubFunctions.onChannelSubscriptionMessage,
            },
            /**
             * @typedef OnGiftSubAddedData
             * @prop {Parameters<import('./wrapEventSub').TwurpleCallback<ChatClient['onMessage']>>[2]?} IRCData Original IRC Data that this data is obtained from
             * @prop {Parameters<import('./wrapEventSub').TwurpleCallback<ChatClient['onSub']>>[3]?} IRCUser Original IRC Data about the subscribing user that this data is obtained from
             */
            /**
             * @typedef {OnGiftSubAddedData & import('../node_modules/@twurple/eventsub-base/lib/events/chatNotifications/EventSubChannelChatSubGiftNotificationEvent').EventSubChannelChatSubGiftNotificationEvent} onGiftData
             */
            /**
             * Subscribes to events that represent a user being gifted a subscription to a channel.
             * @param {(data: onGiftData) => void} callback 
             * @param {string?} broadcasterID broadcaster to listen to (defaults to self)
             * @param {number | 'EventSub'} type 
             */
            onGift: (callback, broadcasterID = uid, type = 5) => {
                EventSubFunctions.onChannelChatNotification(data => {
                    if(data.type == 'sub_gift') callback(data);
                }, broadcasterID, type);
            },
            /**
             * @typedef OnSubAddedData
             * @prop {Parameters<import('./wrapEventSub').TwurpleCallback<ChatClient['onMessage']>>[2]?} IRCData Original IRC Data that this data is obtained from
             * @prop {Parameters<import('./wrapEventSub').TwurpleCallback<ChatClient['onSub']>>[3]?} IRCUser Original IRC Data about the subscribing user that this data is obtained from
             */
            /**
             * @typedef {OnSubAddedData & import('../node_modules/@twurple/eventsub-base/lib/events/chatNotifications/EventSubChannelChatSubNotificationEvent').EventSubChannelChatSubNotificationEvent} onSubData
             */
            /**
             * Subscribes to events that represent a user subscribing to a channel.
             * @param {(data: onSubData) => void} callback 
             * @param {string?} broadcasterID broadcaster to listen to (defaults to self)
             * @param {number | 'EventSub'} type 
             */
            onSub: (callback, broadcasterID = uid, type = 5) => {
                EventSubFunctions.onChannelChatNotification(data => {
                    if(data.type == 'sub') callback(data);
                }, broadcasterID, type);
            },
            /**
             * @typedef OnResubAddedData
             * @prop {Parameters<import('./wrapEventSub').TwurpleCallback<ChatClient['onMessage']>>[2]?} IRCData Original IRC Data that this data is obtained from
             * @prop {Parameters<import('./wrapEventSub').TwurpleCallback<ChatClient['onSub']>>[3]?} IRCUser Original IRC Data about the subscribing user that this data is obtained from
             */
            /**
             * 
             * @typedef {OnResubAddedData & import('../node_modules/@twurple/eventsub-base/lib/events/chatNotifications/EventSubChannelChatResubNotificationEvent').EventSubChannelChatResubNotificationEvent} onResubData
             */
            /**
             * Subscribes to events that represent a user's subscription to a channel being announced.
             * @param {(data: onResubData) => void} callback 
             * @param {string?} broadcasterID broadcaster to listen to (defaults to self)
             * @param {number | 'EventSub'} type 
             */
            onResub: (callback, broadcasterID = uid, type = 5) => {
                EventSubFunctions.onChannelChatNotification(data => {
                    if(data.type == 'resub') callback(data);
                }, broadcasterID, type);
            },
            onCommunityGift: EventSubFunctions.onChannelSubscriptionGift,
            onEnd: EventSubFunctions.onChannelSubscriptionEnd,
        },
        charity: {
            onStart: EventSubFunctions.onChannelCharityCampaignStart,
            onStop: EventSubFunctions.onChannelCharityCampaignStop,
            onDonation: EventSubFunctions.onChannelCharityDonation,
            onProgress: EventSubFunctions.onChannelCharityCampaignProgress,
        },
        poll: {
            onBegin: EventSubFunctions.onChannelPollBegin,
            onProgress: EventSubFunctions.onChannelPollProgress,
            onEnd: EventSubFunctions.onChannelPollEnd
        },
        prediction: {
            onBegin: EventSubFunctions.onChannelPredictionBegin,
            onProgress: EventSubFunctions.onChannelPredictionProgress,
            onLock: EventSubFunctions.onChannelPredictionLock,
            onEnd: EventSubFunctions.onChannelPredictionEnd,
        },
        goal: {
            onBegin: EventSubFunctions.onChannelGoalBegin,
            onProgress: EventSubFunctions.onChannelGoalProgress,
            onEnd: EventSubFunctions.onChannelGoalEnd
        },
        hypeTrain: {
            onBegin: EventSubFunctions.onChannelHypeTrainBeginV2,
            onProgress: EventSubFunctions.onChannelHypeTrainProgressV2,
            onEnd: EventSubFunctions.onChannelHypeTrainEndV2
        }
    }
}

/**
 * @typedef {{[K in keyof {[J in keyof EventSubWsListener as J extends `on${string}`? J : never]: true} as K extends `on${Categories[keyof Categories]}${string}`? never : K]: EventSubWsListener[K]}} A
 */
/**
 * @typedef {{[K in keyof Categories]: {[J in keyof EventSubWsListener as J extends `on${Categories[K]}${infer Rest}` ? Rest : never]: EventSubWsListener[J]}} & {Other: A}} TwitchListener
 */

class TwitchBot {
    /**
     * 
     * @param {string} userID 
     * @param {EventSubWsListener} EventSub 
     * @param {ApiClient} api
     */
    constructor(userID, EventSub, api) {
        /**
         * @type {TwitchApi}
         */
        this.requests = cleanAPIOutput(api);
        this.events = wrapEventSubListener(EventSub, api, userID);
        this.userID = userID;
    }
}

module.exports = {
    TwitchBot
}