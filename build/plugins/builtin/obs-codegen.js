module.exports.enums = {
    eventSubscription: {
        /**
         * Subcription value used to disable all events.
         */
        none: 0,
        /**
         * Subscription value to receive events in the `General` category.
         */
        general: 1,
        /**
         * Subscription value to receive events in the `Config` category.
         */
        config: 2,
        /**
         * Subscription value to receive events in the `Scenes` category.
         */
        scenes: 4,
        /**
         * Subscription value to receive events in the `Inputs` category.
         */
        inputs: 8,
        /**
         * Subscription value to receive events in the `Transitions` category.
         */
        transitions: 16,
        /**
         * Subscription value to receive events in the `Filters` category.
         */
        filters: 32,
        /**
         * Subscription value to receive events in the `Outputs` category.
         */
        outputs: 64,
        /**
         * Subscription value to receive events in the `SceneItems` category.
         */
        sceneItems: 128,
        /**
         * Subscription value to receive events in the `MediaInputs` category.
         */
        mediaInputs: 256,
        /**
         * Subscription value to receive the `VendorEvent` event.
         */
        vendors: 512,
        /**
         * Subscription value to receive events in the `Ui` category.
         */
        ui: 1024,
        /**
         * Helper to receive all non-high-volume events.
         */
        all: 2047,
        /**
         * Subscription value to receive the `InputVolumeMeters` high-volume event.
         */
        inputVolumeMeters: 65536,
        /**
         * Subscription value to receive the `InputActiveStateChanged` high-volume event.
         */
        inputActiveStateChanged: 131072,
        /**
         * Subscription value to receive the `InputShowStateChanged` high-volume event.
         */
        inputShowStateChanged: 262144,
        /**
         * Subscription value to receive the `SceneItemTransformChanged` high-volume event.
         */
        sceneItemTransformChanged: 524288,
    },
    eventSubscriptionDocs: {
        "0": "Subcription value used to disable all events.",
        "1": "Subscription value to receive events in the `General` category.",
        "2": "Subscription value to receive events in the `Config` category.",
        "4": "Subscription value to receive events in the `Scenes` category.",
        "8": "Subscription value to receive events in the `Inputs` category.",
        "16": "Subscription value to receive events in the `Transitions` category.",
        "32": "Subscription value to receive events in the `Filters` category.",
        "64": "Subscription value to receive events in the `Outputs` category.",
        "128": "Subscription value to receive events in the `SceneItems` category.",
        "256": "Subscription value to receive events in the `MediaInputs` category.",
        "512": "Subscription value to receive the `VendorEvent` event.",
        "1024": "Subscription value to receive events in the `Ui` category.",
        "2047": "Helper to receive all non-high-volume events.",
        "65536": "Subscription value to receive the `InputVolumeMeters` high-volume event.",
        "131072": "Subscription value to receive the `InputActiveStateChanged` high-volume event.",
        "262144": "Subscription value to receive the `InputShowStateChanged` high-volume event.",
        "524288": "Subscription value to receive the `SceneItemTransformChanged` high-volume event.",
    },
    requestBatchExecutionType: {
        /**
         * Not a request batch.
         */
        none: "-1",
        /**
         * A request batch which processes all requests serially, as fast as possible.
         * 
         * Note: To introduce artificial delay, use the `Sleep` request and the `sleepMillis` request field.
         */
        serialRealtime: 0,
        /**
         * A request batch type which processes all requests serially, in sync with the graphics thread. Designed to provide high accuracy for animations.
         * 
         * Note: To introduce artificial delay, use the `Sleep` request and the `sleepFrames` request field.
         */
        serialFrame: 1,
        /**
         * A request batch type which processes all requests using all available threads in the thread pool.
         * 
         * Note: This is mainly experimental, and only really shows its colors during requests which require lots of
         * active processing, like `GetSourceScreenshot`.
         */
        parallel: 2,
    },
    requestBatchExecutionTypeDocs: {
        "-1": "Not a request batch.",
        "0": "A request batch which processes all requests serially, as fast as possible.\n\nNote: To introduce artificial delay, use the `Sleep` request and the `sleepMillis` request field.",
        "1": "A request batch type which processes all requests serially, in sync with the graphics thread. Designed to provide high accuracy for animations.\n\nNote: To introduce artificial delay, use the `Sleep` request and the `sleepFrames` request field.",
        "2": "A request batch type which processes all requests using all available threads in the thread pool.\n\nNote: This is mainly experimental, and only really shows its colors during requests which require lots of\nactive processing, like `GetSourceScreenshot`.",
    },
    requestStatus: {
        /**
         * Unknown status, should never be used.
         */
        unknown: 0,
        /**
         * For internal use to signify a successful field check.
         */
        noError: 10,
        /**
         * The request has succeeded.
         */
        success: 100,
        /**
         * The `requestType` field is missing from the request data.
         */
        missingRequestType: 203,
        /**
         * The request type is invalid or does not exist.
         */
        unknownRequestType: 204,
        /**
         * Generic error code.
         * 
         * Note: A comment is required to be provided by obs-websocket.
         */
        genericError: 205,
        /**
         * The request batch execution type is not supported.
         */
        unsupportedRequestBatchExecutionType: 206,
        /**
         * The server is not ready to handle the request.
         * 
         * Note: This usually occurs during OBS scene collection change or exit. Requests may be tried again after a delay if this code is given.
         */
        notReady: 207,
        /**
         * A required request field is missing.
         */
        missingRequestField: 300,
        /**
         * The request does not have a valid requestData object.
         */
        missingRequestData: 301,
        /**
         * Generic invalid request field message.
         * 
         * Note: A comment is required to be provided by obs-websocket.
         */
        invalidRequestField: 400,
        /**
         * A request field has the wrong data type.
         */
        invalidRequestFieldType: 401,
        /**
         * A request field (number) is outside of the allowed range.
         */
        requestFieldOutOfRange: 402,
        /**
         * A request field (string or array) is empty and cannot be.
         */
        requestFieldEmpty: 403,
        /**
         * There are too many request fields (eg. a request takes two optionals, where only one is allowed at a time).
         */
        tooManyRequestFields: 404,
        /**
         * An output is running and cannot be in order to perform the request.
         */
        outputRunning: 500,
        /**
         * An output is not running and should be.
         */
        outputNotRunning: 501,
        /**
         * An output is paused and should not be.
         */
        outputPaused: 502,
        /**
         * An output is not paused and should be.
         */
        outputNotPaused: 503,
        /**
         * An output is disabled and should not be.
         */
        outputDisabled: 504,
        /**
         * Studio mode is active and cannot be.
         */
        studioModeActive: 505,
        /**
         * Studio mode is not active and should be.
         */
        studioModeNotActive: 506,
        /**
         * The resource was not found.
         * 
         * Note: Resources are any kind of object in obs-websocket, like inputs, profiles, outputs, etc.
         */
        resourceNotFound: 600,
        /**
         * The resource already exists.
         */
        resourceAlreadyExists: 601,
        /**
         * The type of resource found is invalid.
         */
        invalidResourceType: 602,
        /**
         * There are not enough instances of the resource in order to perform the request.
         */
        notEnoughResources: 603,
        /**
         * The state of the resource is invalid. For example, if the resource is blocked from being accessed.
         */
        invalidResourceState: 604,
        /**
         * The specified input (obs_source_t-OBS_SOURCE_TYPE_INPUT) had the wrong kind.
         */
        invalidInputKind: 605,
        /**
         * The resource does not support being configured.
         * 
         * This is particularly relevant to transitions, where they do not always have changeable settings.
         */
        resourceNotConfigurable: 606,
        /**
         * The specified filter (obs_source_t-OBS_SOURCE_TYPE_FILTER) had the wrong kind.
         */
        invalidFilterKind: 607,
        /**
         * Creating the resource failed.
         */
        resourceCreationFailed: 700,
        /**
         * Performing an action on the resource failed.
         */
        resourceActionFailed: 701,
        /**
         * Processing the request failed unexpectedly.
         * 
         * Note: A comment is required to be provided by obs-websocket.
         */
        requestProcessingFailed: 702,
        /**
         * The combination of request fields cannot be used to perform an action.
         */
        cannotAct: 703,
    },
    requestStatusDocs: {
        "0": "Unknown status, should never be used.",
        "10": "For internal use to signify a successful field check.",
        "100": "The request has succeeded.",
        "203": "The `requestType` field is missing from the request data.",
        "204": "The request type is invalid or does not exist.",
        "205": "Generic error code.\n\nNote: A comment is required to be provided by obs-websocket.",
        "206": "The request batch execution type is not supported.",
        "207": "The server is not ready to handle the request.\n\nNote: This usually occurs during OBS scene collection change or exit. Requests may be tried again after a delay if this code is given.",
        "300": "A required request field is missing.",
        "301": "The request does not have a valid requestData object.",
        "400": "Generic invalid request field message.\n\nNote: A comment is required to be provided by obs-websocket.",
        "401": "A request field has the wrong data type.",
        "402": "A request field (number) is outside of the allowed range.",
        "403": "A request field (string or array) is empty and cannot be.",
        "404": "There are too many request fields (eg. a request takes two optionals, where only one is allowed at a time).",
        "500": "An output is running and cannot be in order to perform the request.",
        "501": "An output is not running and should be.",
        "502": "An output is paused and should not be.",
        "503": "An output is not paused and should be.",
        "504": "An output is disabled and should not be.",
        "505": "Studio mode is active and cannot be.",
        "506": "Studio mode is not active and should be.",
        "600": "The resource was not found.\n\nNote: Resources are any kind of object in obs-websocket, like inputs, profiles, outputs, etc.",
        "601": "The resource already exists.",
        "602": "The type of resource found is invalid.",
        "603": "There are not enough instances of the resource in order to perform the request.",
        "604": "The state of the resource is invalid. For example, if the resource is blocked from being accessed.",
        "605": "The specified input (obs_source_t-OBS_SOURCE_TYPE_INPUT) had the wrong kind.",
        "606": "The resource does not support being configured.\n\nThis is particularly relevant to transitions, where they do not always have changeable settings.",
        "607": "The specified filter (obs_source_t-OBS_SOURCE_TYPE_FILTER) had the wrong kind.",
        "700": "Creating the resource failed.",
        "701": "Performing an action on the resource failed.",
        "702": "Processing the request failed unexpectedly.\n\nNote: A comment is required to be provided by obs-websocket.",
        "703": "The combination of request fields cannot be used to perform an action.",
    },
    obsOutputState: {
        /**
         * Unknown state.
         */
        /**
         * The output is starting.
         */
        /**
         * The input has started.
         */
        /**
         * The output is stopping.
         */
        /**
         * The output has stopped.
         */
        /**
         * The output has disconnected and is reconnecting.
         */
        /**
         * The output has reconnected successfully.
         */
        /**
         * The output is now paused.
         */
        /**
         * The output has been resumed (unpaused).
         */
    },
    obsOutputStateDocs: {
        "OBS_WEBSOCKET_OUTPUT_UNKNOWN": "Unknown state.",
        "OBS_WEBSOCKET_OUTPUT_STARTING": "The output is starting.",
        "OBS_WEBSOCKET_OUTPUT_STARTED": "The input has started.",
        "OBS_WEBSOCKET_OUTPUT_STOPPING": "The output is stopping.",
        "OBS_WEBSOCKET_OUTPUT_STOPPED": "The output has stopped.",
        "OBS_WEBSOCKET_OUTPUT_RECONNECTING": "The output has disconnected and is reconnecting.",
        "OBS_WEBSOCKET_OUTPUT_RECONNECTED": "The output has reconnected successfully.",
        "OBS_WEBSOCKET_OUTPUT_PAUSED": "The output is now paused.",
        "OBS_WEBSOCKET_OUTPUT_RESUMED": "The output has been resumed (unpaused).",
    },
    obsMediaInputAction: {
        /**
         * No action.
         */
        /**
         * Play the media input.
         */
        /**
         * Pause the media input.
         */
        /**
         * Stop the media input.
         */
        /**
         * Restart the media input.
         */
        /**
         * Go to the next playlist item.
         */
        /**
         * Go to the previous playlist item.
         */
    },
    obsMediaInputActionDocs: {
        "OBS_WEBSOCKET_MEDIA_INPUT_ACTION_NONE": "No action.",
        "OBS_WEBSOCKET_MEDIA_INPUT_ACTION_PLAY": "Play the media input.",
        "OBS_WEBSOCKET_MEDIA_INPUT_ACTION_PAUSE": "Pause the media input.",
        "OBS_WEBSOCKET_MEDIA_INPUT_ACTION_STOP": "Stop the media input.",
        "OBS_WEBSOCKET_MEDIA_INPUT_ACTION_RESTART": "Restart the media input.",
        "OBS_WEBSOCKET_MEDIA_INPUT_ACTION_NEXT": "Go to the next playlist item.",
        "OBS_WEBSOCKET_MEDIA_INPUT_ACTION_PREVIOUS": "Go to the previous playlist item.",
    },
    webSocketCloseCode: {
        /**
         * For internal use only to tell the request handler not to perform any close action.
         */
        dontClose: 0,
        /**
         * Unknown reason, should never be used.
         */
        unknownReason: 4000,
        /**
         * The server was unable to decode the incoming websocket message.
         */
        messageDecodeError: 4002,
        /**
         * A data field is required but missing from the payload.
         */
        missingDataField: 4003,
        /**
         * A data field's value type is invalid.
         */
        invalidDataFieldType: 4004,
        /**
         * A data field's value is invalid.
         */
        invalidDataFieldValue: 4005,
        /**
         * The specified `op` was invalid or missing.
         */
        unknownOpCode: 4006,
        /**
         * The client sent a websocket message without first sending `Identify` message.
         */
        notIdentified: 4007,
        /**
         * The client sent an `Identify` message while already identified.
         * 
         * Note: Once a client has identified, only `Reidentify` may be used to change session parameters.
         */
        alreadyIdentified: 4008,
        /**
         * The authentication attempt (via `Identify`) failed.
         */
        authenticationFailed: 4009,
        /**
         * The server detected the usage of an old version of the obs-websocket RPC protocol.
         */
        unsupportedRpcVersion: 4010,
        /**
         * The websocket session has been invalidated by the obs-websocket server.
         * 
         * Note: This is the code used by the `Kick` button in the UI Session List. If you receive this code, you must not automatically reconnect.
         */
        sessionInvalidated: 4011,
        /**
         * A requested feature is not supported due to hardware/software limitations.
         */
        unsupportedFeature: 4012,
    },
    webSocketCloseCodeDocs: {
        "0": "For internal use only to tell the request handler not to perform any close action.",
        "4000": "Unknown reason, should never be used.",
        "4002": "The server was unable to decode the incoming websocket message.",
        "4003": "A data field is required but missing from the payload.",
        "4004": "A data field's value type is invalid.",
        "4005": "A data field's value is invalid.",
        "4006": "The specified `op` was invalid or missing.",
        "4007": "The client sent a websocket message without first sending `Identify` message.",
        "4008": "The client sent an `Identify` message while already identified.\n\nNote: Once a client has identified, only `Reidentify` may be used to change session parameters.",
        "4009": "The authentication attempt (via `Identify`) failed.",
        "4010": "The server detected the usage of an old version of the obs-websocket RPC protocol.",
        "4011": "The websocket session has been invalidated by the obs-websocket server.\n\nNote: This is the code used by the `Kick` button in the UI Session List. If you receive this code, you must not automatically reconnect.",
        "4012": "A requested feature is not supported due to hardware/software limitations.",
    },
    webSocketOpCode: {
        /**
         * The initial message sent by obs-websocket to newly connected clients.
         */
        hello: 0,
        /**
         * The message sent by a newly connected client to obs-websocket in response to a `Hello`.
         */
        identify: 1,
        /**
         * The response sent by obs-websocket to a client after it has successfully identified with obs-websocket.
         */
        identified: 2,
        /**
         * The message sent by an already-identified client to update identification parameters.
         */
        reidentify: 3,
        /**
         * The message sent by obs-websocket containing an event payload.
         */
        event: 5,
        /**
         * The message sent by a client to obs-websocket to perform a request.
         */
        request: 6,
        /**
         * The message sent by obs-websocket in response to a particular request from a client.
         */
        requestResponse: 7,
        /**
         * The message sent by a client to obs-websocket to perform a batch of requests.
         */
        requestBatch: 8,
        /**
         * The message sent by obs-websocket in response to a particular batch of requests from a client.
         */
        requestBatchResponse: 9,
    },
    webSocketOpCodeDocs: {
        "0": "The initial message sent by obs-websocket to newly connected clients.",
        "1": "The message sent by a newly connected client to obs-websocket in response to a `Hello`.",
        "2": "The response sent by obs-websocket to a client after it has successfully identified with obs-websocket.",
        "3": "The message sent by an already-identified client to update identification parameters.",
        "5": "The message sent by obs-websocket containing an event payload.",
        "6": "The message sent by a client to obs-websocket to perform a request.",
        "7": "The message sent by obs-websocket in response to a particular request from a client.",
        "8": "The message sent by a client to obs-websocket to perform a batch of requests.",
        "9": "The message sent by obs-websocket in response to a particular batch of requests from a client.",
    },
}
/**
 * @callback CurrentSceneCollectionChanging The current scene collection has begun changing.
 * 
 * Note: We recommend using this event to trigger a pause of all polling requests, as performing any requests during a
 * scene collection change is considered undefined behavior and can cause crashes!
 * @param {string} sceneCollectionName Name of the current scene collection
**/
/**
 * @callback CurrentSceneCollectionChanged The current scene collection has changed.
 * 
 * Note: If polling has been paused during `CurrentSceneCollectionChanging`, this is the que to restart polling.
 * @param {string} sceneCollectionName Name of the new scene collection
**/
/**
 * @callback SceneCollectionListChanged The scene collection list has changed.
 * @param {Array<string>} sceneCollections Updated list of scene collections
**/
/**
 * @callback CurrentProfileChanging The current profile has begun changing.
 * @param {string} profileName Name of the current profile
**/
/**
 * @callback CurrentProfileChanged The current profile has changed.
 * @param {string} profileName Name of the new profile
**/
/**
 * @callback ProfileListChanged The profile list has changed.
 * @param {Array<string>} profiles Updated list of profiles
**/

/**
 * @typedef configEvent
 * @prop {CurrentSceneCollectionChanging} CurrentSceneCollectionChanging The current scene collection has begun changing.
 * 
 * Note: We recommend using this event to trigger a pause of all polling requests, as performing any requests during a
 * scene collection change is considered undefined behavior and can cause crashes!
 * @prop {CurrentSceneCollectionChanged} CurrentSceneCollectionChanged The current scene collection has changed.
 * 
 * Note: If polling has been paused during `CurrentSceneCollectionChanging`, this is the que to restart polling.
 * @prop {SceneCollectionListChanged} SceneCollectionListChanged The scene collection list has changed.
 * @prop {CurrentProfileChanging} CurrentProfileChanging The current profile has begun changing.
 * @prop {CurrentProfileChanged} CurrentProfileChanged The current profile has changed.
 * @prop {ProfileListChanged} ProfileListChanged The profile list has changed.
**/

/**
 * @callback SourceFilterListReindexed A source's filter list has been reindexed.
 * @param {string} sourceName Name of the source
 * @param {Array<object>} filters Array of filter objects
**/
/**
 * @callback SourceFilterCreated A filter has been added to a source.
 * @param {string} sourceName Name of the source the filter was added to
 * @param {string} filterName Name of the filter
 * @param {string} filterKind The kind of the filter
 * @param {number} filterIndex Index position of the filter
 * @param {object} filterSettings The settings configured to the filter when it was created
 * @param {object} defaultFilterSettings The default settings for the filter
**/
/**
 * @callback SourceFilterRemoved A filter has been removed from a source.
 * @param {string} sourceName Name of the source the filter was on
 * @param {string} filterName Name of the filter
**/
/**
 * @callback SourceFilterNameChanged The name of a source filter has changed.
 * @param {string} sourceName The source the filter is on
 * @param {string} oldFilterName Old name of the filter
 * @param {string} filterName New name of the filter
**/
/**
 * @callback SourceFilterSettingsChanged An source filter's settings have changed (been updated).
 * @param {string} sourceName Name of the source the filter is on
 * @param {string} filterName Name of the filter
 * @param {object} filterSettings New settings object of the filter
**/
/**
 * @callback SourceFilterEnableStateChanged A source filter's enable state has changed.
 * @param {string} sourceName Name of the source the filter is on
 * @param {string} filterName Name of the filter
 * @param {boolean} filterEnabled Whether the filter is enabled
**/

/**
 * @typedef filtersEvent
 * @prop {SourceFilterListReindexed} SourceFilterListReindexed A source's filter list has been reindexed.
 * @prop {SourceFilterCreated} SourceFilterCreated A filter has been added to a source.
 * @prop {SourceFilterRemoved} SourceFilterRemoved A filter has been removed from a source.
 * @prop {SourceFilterNameChanged} SourceFilterNameChanged The name of a source filter has changed.
 * @prop {SourceFilterSettingsChanged} SourceFilterSettingsChanged An source filter's settings have changed (been updated).
 * @prop {SourceFilterEnableStateChanged} SourceFilterEnableStateChanged A source filter's enable state has changed.
**/

/**
 * @callback ExitStarted OBS has begun the shutdown process.
**/
/**
 * @callback VendorEvent An event has been emitted from a vendor.
 * 
 * A vendor is a unique name registered by a third-party plugin or script, which allows for custom requests and events to be added to obs-websocket.
 * If a plugin or script implements vendor requests or events, documentation is expected to be provided with them.
 * @param {string} vendorName Name of the vendor emitting the event
 * @param {string} eventType Vendor-provided event typedef
 * @param {object} eventData Vendor-provided event data. {} if event does not provide any data
**/
/**
 * @callback CustomEvent Custom event emitted by `BroadcastCustomEvent`.
 * @param {object} eventData Custom event data
**/

/**
 * @typedef generalEvent
 * @prop {ExitStarted} ExitStarted OBS has begun the shutdown process.
 * @prop {VendorEvent} VendorEvent An event has been emitted from a vendor.
 * 
 * A vendor is a unique name registered by a third-party plugin or script, which allows for custom requests and events to be added to obs-websocket.
 * If a plugin or script implements vendor requests or events, documentation is expected to be provided with them.
 * @prop {CustomEvent} CustomEvent Custom event emitted by `BroadcastCustomEvent`.
**/

/**
 * @callback InputCreated An input has been created.
 * @param {string} inputName Name of the input
 * @param {string} inputUuid UUID of the input
 * @param {string} inputKind The kind of the input
 * @param {string} unversionedInputKind The unversioned kind of input (aka no `_v2` stuff)
 * @param {number} inputKindCaps Bitflag value for the caps that an input supports. See obs_source_info.output_flags in the libobs docs
 * @param {object} inputSettings The settings configured to the input when it was created
 * @param {object} defaultInputSettings The default settings for the input
**/
/**
 * @callback InputRemoved An input has been removed.
 * @param {string} inputName Name of the input
 * @param {string} inputUuid UUID of the input
**/
/**
 * @callback InputNameChanged The name of an input has changed.
 * @param {string} inputUuid UUID of the input
 * @param {string} oldInputName Old name of the input
 * @param {string} inputName New name of the input
**/
/**
 * @callback InputSettingsChanged An input's settings have changed (been updated).
 * 
 * Note: On some inputs, changing values in the properties dialog will cause an immediate update. Pressing the "Cancel" button will revert the settings, resulting in another event being fired.
 * @param {string} inputName Name of the input
 * @param {string} inputUuid UUID of the input
 * @param {object} inputSettings New settings object of the input
**/
/**
 * @callback InputActiveStateChanged An input's active state has changed.
 * 
 * When an input is active, it means it's being shown by the program feed.
 * @param {string} inputName Name of the input
 * @param {string} inputUuid UUID of the input
 * @param {boolean} videoActive Whether the input is active
**/
/**
 * @callback InputShowStateChanged An input's show state has changed.
 * 
 * When an input is showing, it means it's being shown by the preview or a dialog.
 * @param {string} inputName Name of the input
 * @param {string} inputUuid UUID of the input
 * @param {boolean} videoShowing Whether the input is showing
**/
/**
 * @callback InputMuteStateChanged An input's mute state has changed.
 * @param {string} inputName Name of the input
 * @param {string} inputUuid UUID of the input
 * @param {boolean} inputMuted Whether the input is muted
**/
/**
 * @callback InputVolumeChanged An input's volume level has changed.
 * @param {string} inputName Name of the input
 * @param {string} inputUuid UUID of the input
 * @param {number} inputVolumeMul New volume level multiplier
 * @param {number} inputVolumeDb New volume level in dB
**/
/**
 * @callback InputAudioBalanceChanged The audio balance value of an input has changed.
 * @param {string} inputName Name of the input
 * @param {string} inputUuid UUID of the input
 * @param {number} inputAudioBalance New audio balance value of the input
**/
/**
 * @callback InputAudioSyncOffsetChanged The sync offset of an input has changed.
 * @param {string} inputName Name of the input
 * @param {string} inputUuid UUID of the input
 * @param {number} inputAudioSyncOffset New sync offset in milliseconds
**/
/**
 * @callback InputAudioTracksChanged The audio tracks of an input have changed.
 * @param {string} inputName Name of the input
 * @param {string} inputUuid UUID of the input
 * @param {object} inputAudioTracks object of audio tracks along with their associated enable states
**/
/**
 * @callback InputAudioMonitorTypeChanged The monitor type of an input has changed.
 * 
 * Available types are:
 * 
 * - `OBS_MONITORING_TYPE_NONE`
 * - `OBS_MONITORING_TYPE_MONITOR_ONLY`
 * - `OBS_MONITORING_TYPE_MONITOR_AND_OUTPUT`
 * @param {string} inputName Name of the input
 * @param {string} inputUuid UUID of the input
 * @param {string} monitorType New monitor type of the input
**/
/**
 * @callback InputVolumeMeters A high-volume event providing volume levels of all active inputs every 50 milliseconds.
 * @param {Array<object>} inputs Array of active inputs with their associated volume levels
**/

/**
 * @typedef inputsEvent
 * @prop {InputCreated} InputCreated An input has been created.
 * @prop {InputRemoved} InputRemoved An input has been removed.
 * @prop {InputNameChanged} InputNameChanged The name of an input has changed.
 * @prop {InputSettingsChanged} InputSettingsChanged An input's settings have changed (been updated).
 * 
 * Note: On some inputs, changing values in the properties dialog will cause an immediate update. Pressing the "Cancel" button will revert the settings, resulting in another event being fired.
 * @prop {InputActiveStateChanged} InputActiveStateChanged An input's active state has changed.
 * 
 * When an input is active, it means it's being shown by the program feed.
 * @prop {InputShowStateChanged} InputShowStateChanged An input's show state has changed.
 * 
 * When an input is showing, it means it's being shown by the preview or a dialog.
 * @prop {InputMuteStateChanged} InputMuteStateChanged An input's mute state has changed.
 * @prop {InputVolumeChanged} InputVolumeChanged An input's volume level has changed.
 * @prop {InputAudioBalanceChanged} InputAudioBalanceChanged The audio balance value of an input has changed.
 * @prop {InputAudioSyncOffsetChanged} InputAudioSyncOffsetChanged The sync offset of an input has changed.
 * @prop {InputAudioTracksChanged} InputAudioTracksChanged The audio tracks of an input have changed.
 * @prop {InputAudioMonitorTypeChanged} InputAudioMonitorTypeChanged The monitor type of an input has changed.
 * 
 * Available types are:
 * 
 * - `OBS_MONITORING_TYPE_NONE`
 * - `OBS_MONITORING_TYPE_MONITOR_ONLY`
 * - `OBS_MONITORING_TYPE_MONITOR_AND_OUTPUT`
 * @prop {InputVolumeMeters} InputVolumeMeters A high-volume event providing volume levels of all active inputs every 50 milliseconds.
**/

/**
 * @callback MediaInputPlaybackStarted A media input has started playing.
 * @param {string} inputName Name of the input
 * @param {string} inputUuid UUID of the input
**/
/**
 * @callback MediaInputPlaybackEnded A media input has finished playing.
 * @param {string} inputName Name of the input
 * @param {string} inputUuid UUID of the input
**/
/**
 * @callback MediaInputActionTriggered An action has been performed on an input.
 * @param {string} inputName Name of the input
 * @param {string} inputUuid UUID of the input
 * @param {string} mediaAction Action performed on the input. See `ObsMediaInputAction` enum
**/

/**
 * @typedef mediainputsEvent
 * @prop {MediaInputPlaybackStarted} MediaInputPlaybackStarted A media input has started playing.
 * @prop {MediaInputPlaybackEnded} MediaInputPlaybackEnded A media input has finished playing.
 * @prop {MediaInputActionTriggered} MediaInputActionTriggered An action has been performed on an input.
**/

/**
 * @callback StreamStateChanged The state of the stream output has changed.
 * @param {boolean} outputActive Whether the output is active
 * @param {string} outputState The specific state of the output
**/
/**
 * @callback RecordStateChanged The state of the record output has changed.
 * @param {boolean} outputActive Whether the output is active
 * @param {string} outputState The specific state of the output
 * @param {string} outputPath File name for the saved recording, if record stopped. `null` otherwise
**/
/**
 * @callback RecordFileChanged The record output has started writing to a new file. For example, when a file split happens.
 * @param {string} newOutputPath File name that the output has begun writing to
**/
/**
 * @callback ReplayBufferStateChanged The state of the replay buffer output has changed.
 * @param {boolean} outputActive Whether the output is active
 * @param {string} outputState The specific state of the output
**/
/**
 * @callback VirtualcamStateChanged The state of the virtualcam output has changed.
 * @param {boolean} outputActive Whether the output is active
 * @param {string} outputState The specific state of the output
**/
/**
 * @callback ReplayBufferSaved The replay buffer has been saved.
 * @param {string} savedReplayPath Path of the saved replay file
**/

/**
 * @typedef outputsEvent
 * @prop {StreamStateChanged} StreamStateChanged The state of the stream output has changed.
 * @prop {RecordStateChanged} RecordStateChanged The state of the record output has changed.
 * @prop {RecordFileChanged} RecordFileChanged The record output has started writing to a new file. For example, when a file split happens.
 * @prop {ReplayBufferStateChanged} ReplayBufferStateChanged The state of the replay buffer output has changed.
 * @prop {VirtualcamStateChanged} VirtualcamStateChanged The state of the virtualcam output has changed.
 * @prop {ReplayBufferSaved} ReplayBufferSaved The replay buffer has been saved.
**/

/**
 * @callback SceneItemCreated A scene item has been created.
 * @param {string} sceneName Name of the scene the item was added to
 * @param {string} sceneUuid UUID of the scene the item was added to
 * @param {string} sourceName Name of the underlying source (input/scene)
 * @param {string} sourceUuid UUID of the underlying source (input/scene)
 * @param {number} sceneItemId Numeric ID of the scene item
 * @param {number} sceneItemIndex Index position of the item
**/
/**
 * @callback SceneItemRemoved A scene item has been removed.
 * 
 * This event is not emitted when the scene the item is in is removed.
 * @param {string} sceneName Name of the scene the item was removed from
 * @param {string} sceneUuid UUID of the scene the item was removed from
 * @param {string} sourceName Name of the underlying source (input/scene)
 * @param {string} sourceUuid UUID of the underlying source (input/scene)
 * @param {number} sceneItemId Numeric ID of the scene item
**/
/**
 * @callback SceneItemListReindexed A scene's item list has been reindexed.
 * @param {string} sceneName Name of the scene
 * @param {string} sceneUuid UUID of the scene
 * @param {Array<object>} sceneItems Array of scene item objects
**/
/**
 * @callback SceneItemEnableStateChanged A scene item's enable state has changed.
 * @param {string} sceneName Name of the scene the item is in
 * @param {string} sceneUuid UUID of the scene the item is in
 * @param {number} sceneItemId Numeric ID of the scene item
 * @param {boolean} sceneItemEnabled Whether the scene item is enabled (visible)
**/
/**
 * @callback SceneItemLockStateChanged A scene item's lock state has changed.
 * @param {string} sceneName Name of the scene the item is in
 * @param {string} sceneUuid UUID of the scene the item is in
 * @param {number} sceneItemId Numeric ID of the scene item
 * @param {boolean} sceneItemLocked Whether the scene item is locked
**/
/**
 * @callback SceneItemSelected A scene item has been selected in the Ui.
 * @param {string} sceneName Name of the scene the item is in
 * @param {string} sceneUuid UUID of the scene the item is in
 * @param {number} sceneItemId Numeric ID of the scene item
**/
/**
 * @callback SceneItemTransformChanged The transform/crop of a scene item has changed.
 * @param {string} sceneName The name of the scene the item is in
 * @param {string} sceneUuid The UUID of the scene the item is in
 * @param {number} sceneItemId Numeric ID of the scene item
 * @param {object} sceneItemTransform New transform/crop info of the scene item
**/

/**
 * @typedef sceneitemsEvent
 * @prop {SceneItemCreated} SceneItemCreated A scene item has been created.
 * @prop {SceneItemRemoved} SceneItemRemoved A scene item has been removed.
 * 
 * This event is not emitted when the scene the item is in is removed.
 * @prop {SceneItemListReindexed} SceneItemListReindexed A scene's item list has been reindexed.
 * @prop {SceneItemEnableStateChanged} SceneItemEnableStateChanged A scene item's enable state has changed.
 * @prop {SceneItemLockStateChanged} SceneItemLockStateChanged A scene item's lock state has changed.
 * @prop {SceneItemSelected} SceneItemSelected A scene item has been selected in the Ui.
 * @prop {SceneItemTransformChanged} SceneItemTransformChanged The transform/crop of a scene item has changed.
**/

/**
 * @callback SceneCreated A new scene has been created.
 * @param {string} sceneName Name of the new scene
 * @param {string} sceneUuid UUID of the new scene
 * @param {boolean} isGroup Whether the new scene is a group
**/
/**
 * @callback SceneRemoved A scene has been removed.
 * @param {string} sceneName Name of the removed scene
 * @param {string} sceneUuid UUID of the removed scene
 * @param {boolean} isGroup Whether the scene was a group
**/
/**
 * @callback SceneNameChanged The name of a scene has changed.
 * @param {string} sceneUuid UUID of the scene
 * @param {string} oldSceneName Old name of the scene
 * @param {string} sceneName New name of the scene
**/
/**
 * @callback CurrentProgramSceneChanged The current program scene has changed.
 * @param {string} sceneName Name of the scene that was switched to
 * @param {string} sceneUuid UUID of the scene that was switched to
**/
/**
 * @callback CurrentPreviewSceneChanged The current preview scene has changed.
 * @param {string} sceneName Name of the scene that was switched to
 * @param {string} sceneUuid UUID of the scene that was switched to
**/
/**
 * @callback SceneListChanged The list of scenes has changed.
 * 
 * TODO: Make OBS fire this event when scenes are reordered.
 * @param {Array<object>} scenes Updated array of scenes
**/

/**
 * @typedef scenesEvent
 * @prop {SceneCreated} SceneCreated A new scene has been created.
 * @prop {SceneRemoved} SceneRemoved A scene has been removed.
 * @prop {SceneNameChanged} SceneNameChanged The name of a scene has changed.
 * @prop {CurrentProgramSceneChanged} CurrentProgramSceneChanged The current program scene has changed.
 * @prop {CurrentPreviewSceneChanged} CurrentPreviewSceneChanged The current preview scene has changed.
 * @prop {SceneListChanged} SceneListChanged The list of scenes has changed.
 * 
 * TODO: Make OBS fire this event when scenes are reordered.
**/

/**
 * @callback CurrentSceneTransitionChanged The current scene transition has changed.
 * @param {string} transitionName Name of the new transition
 * @param {string} transitionUuid UUID of the new transition
**/
/**
 * @callback CurrentSceneTransitionDurationChanged The current scene transition duration has changed.
 * @param {number} transitionDuration Transition duration in milliseconds
**/
/**
 * @callback SceneTransitionStarted A scene transition has started.
 * @param {string} transitionName Scene transition name
 * @param {string} transitionUuid Scene transition UUID
**/
/**
 * @callback SceneTransitionEnded A scene transition has completed fully.
 * 
 * Note: Does not appear to trigger when the transition is interrupted by the user.
 * @param {string} transitionName Scene transition name
 * @param {string} transitionUuid Scene transition UUID
**/
/**
 * @callback SceneTransitionVideoEnded A scene transition's video has completed fully.
 * 
 * Useful for stinger transitions to tell when the video *actually* ends.
 * `SceneTransitionEnded` only signifies the cut point, not the completion of transition playback.
 * 
 * Note: Appears to be called by every transition, regardless of relevance.
 * @param {string} transitionName Scene transition name
 * @param {string} transitionUuid Scene transition UUID
**/

/**
 * @typedef transitionsEvent
 * @prop {CurrentSceneTransitionChanged} CurrentSceneTransitionChanged The current scene transition has changed.
 * @prop {CurrentSceneTransitionDurationChanged} CurrentSceneTransitionDurationChanged The current scene transition duration has changed.
 * @prop {SceneTransitionStarted} SceneTransitionStarted A scene transition has started.
 * @prop {SceneTransitionEnded} SceneTransitionEnded A scene transition has completed fully.
 * 
 * Note: Does not appear to trigger when the transition is interrupted by the user.
 * @prop {SceneTransitionVideoEnded} SceneTransitionVideoEnded A scene transition's video has completed fully.
 * 
 * Useful for stinger transitions to tell when the video *actually* ends.
 * `SceneTransitionEnded` only signifies the cut point, not the completion of transition playback.
 * 
 * Note: Appears to be called by every transition, regardless of relevance.
**/

/**
 * @callback StudioModeStateChanged Studio mode has been enabled or disabled.
 * @param {boolean} studioModeEnabled True == Enabled, False == Disabled
**/
/**
 * @callback ScreenshotSaved A screenshot has been saved.
 * 
 * Note: Triggered for the screenshot feature available in `Settings -> Hotkeys -> Screenshot Output` ONLY.
 * Applications using `Get/SaveSourceScreenshot` should implement a `CustomEvent` if this kind of inter-client
 * communication is desired.
 * @param {string} savedScreenshotPath Path of the saved image file
**/

/**
 * @typedef uiEvent
 * @prop {StudioModeStateChanged} StudioModeStateChanged Studio mode has been enabled or disabled.
 * @prop {ScreenshotSaved} ScreenshotSaved A screenshot has been saved.
 * 
 * Note: Triggered for the screenshot feature available in `Settings -> Hotkeys -> Screenshot Output` ONLY.
 * Applications using `Get/SaveSourceScreenshot` should implement a `CustomEvent` if this kind of inter-client
 * communication is desired.
**/


/**
 * @typedef { configEvent & filtersEvent & generalEvent & inputsEvent & mediainputsEvent & outputsEvent & sceneitemsEvent & scenesEvent & transitionsEvent & uiEvent } AllEvents
**/

module.exports.eventParams = {
    CurrentSceneCollectionChanging: [
        "sceneCollectionName",
    ],
    CurrentSceneCollectionChanged: [
        "sceneCollectionName",
    ],
    SceneCollectionListChanged: [
        "sceneCollections",
    ],
    CurrentProfileChanging: [
        "profileName",
    ],
    CurrentProfileChanged: [
        "profileName",
    ],
    ProfileListChanged: [
        "profiles",
    ],
    SourceFilterListReindexed: [
        "sourceName",
        "filters",
    ],
    SourceFilterCreated: [
        "sourceName",
        "filterName",
        "filterKind",
        "filterIndex",
        "filterSettings",
        "defaultFilterSettings",
    ],
    SourceFilterRemoved: [
        "sourceName",
        "filterName",
    ],
    SourceFilterNameChanged: [
        "sourceName",
        "oldFilterName",
        "filterName",
    ],
    SourceFilterSettingsChanged: [
        "sourceName",
        "filterName",
        "filterSettings",
    ],
    SourceFilterEnableStateChanged: [
        "sourceName",
        "filterName",
        "filterEnabled",
    ],
    ExitStarted: [
    ],
    VendorEvent: [
        "vendorName",
        "eventType",
        "eventData",
    ],
    CustomEvent: [
        "eventData",
    ],
    InputCreated: [
        "inputName",
        "inputUuid",
        "inputKind",
        "unversionedInputKind",
        "inputKindCaps",
        "inputSettings",
        "defaultInputSettings",
    ],
    InputRemoved: [
        "inputName",
        "inputUuid",
    ],
    InputNameChanged: [
        "inputUuid",
        "oldInputName",
        "inputName",
    ],
    InputSettingsChanged: [
        "inputName",
        "inputUuid",
        "inputSettings",
    ],
    InputActiveStateChanged: [
        "inputName",
        "inputUuid",
        "videoActive",
    ],
    InputShowStateChanged: [
        "inputName",
        "inputUuid",
        "videoShowing",
    ],
    InputMuteStateChanged: [
        "inputName",
        "inputUuid",
        "inputMuted",
    ],
    InputVolumeChanged: [
        "inputName",
        "inputUuid",
        "inputVolumeMul",
        "inputVolumeDb",
    ],
    InputAudioBalanceChanged: [
        "inputName",
        "inputUuid",
        "inputAudioBalance",
    ],
    InputAudioSyncOffsetChanged: [
        "inputName",
        "inputUuid",
        "inputAudioSyncOffset",
    ],
    InputAudioTracksChanged: [
        "inputName",
        "inputUuid",
        "inputAudioTracks",
    ],
    InputAudioMonitorTypeChanged: [
        "inputName",
        "inputUuid",
        "monitorType",
    ],
    InputVolumeMeters: [
        "inputs",
    ],
    MediaInputPlaybackStarted: [
        "inputName",
        "inputUuid",
    ],
    MediaInputPlaybackEnded: [
        "inputName",
        "inputUuid",
    ],
    MediaInputActionTriggered: [
        "inputName",
        "inputUuid",
        "mediaAction",
    ],
    StreamStateChanged: [
        "outputActive",
        "outputState",
    ],
    RecordStateChanged: [
        "outputActive",
        "outputState",
        "outputPath",
    ],
    RecordFileChanged: [
        "newOutputPath",
    ],
    ReplayBufferStateChanged: [
        "outputActive",
        "outputState",
    ],
    VirtualcamStateChanged: [
        "outputActive",
        "outputState",
    ],
    ReplayBufferSaved: [
        "savedReplayPath",
    ],
    SceneItemCreated: [
        "sceneName",
        "sceneUuid",
        "sourceName",
        "sourceUuid",
        "sceneItemId",
        "sceneItemIndex",
    ],
    SceneItemRemoved: [
        "sceneName",
        "sceneUuid",
        "sourceName",
        "sourceUuid",
        "sceneItemId",
    ],
    SceneItemListReindexed: [
        "sceneName",
        "sceneUuid",
        "sceneItems",
    ],
    SceneItemEnableStateChanged: [
        "sceneName",
        "sceneUuid",
        "sceneItemId",
        "sceneItemEnabled",
    ],
    SceneItemLockStateChanged: [
        "sceneName",
        "sceneUuid",
        "sceneItemId",
        "sceneItemLocked",
    ],
    SceneItemSelected: [
        "sceneName",
        "sceneUuid",
        "sceneItemId",
    ],
    SceneItemTransformChanged: [
        "sceneName",
        "sceneUuid",
        "sceneItemId",
        "sceneItemTransform",
    ],
    SceneCreated: [
        "sceneName",
        "sceneUuid",
        "isGroup",
    ],
    SceneRemoved: [
        "sceneName",
        "sceneUuid",
        "isGroup",
    ],
    SceneNameChanged: [
        "sceneUuid",
        "oldSceneName",
        "sceneName",
    ],
    CurrentProgramSceneChanged: [
        "sceneName",
        "sceneUuid",
    ],
    CurrentPreviewSceneChanged: [
        "sceneName",
        "sceneUuid",
    ],
    SceneListChanged: [
        "scenes",
    ],
    CurrentSceneTransitionChanged: [
        "transitionName",
        "transitionUuid",
    ],
    CurrentSceneTransitionDurationChanged: [
        "transitionDuration",
    ],
    SceneTransitionStarted: [
        "transitionName",
        "transitionUuid",
    ],
    SceneTransitionEnded: [
        "transitionName",
        "transitionUuid",
    ],
    SceneTransitionVideoEnded: [
        "transitionName",
        "transitionUuid",
    ],
    StudioModeStateChanged: [
        "studioModeEnabled",
    ],
    ScreenshotSaved: [
        "savedScreenshotPath",
    ],
}
/**
 * @typedef GetPersistentDataResponse
 * @prop {Any} slotValue Value associated with the slot. `null` if not set
**/
/**
 * @callback GetPersistentData Gets the value of a "slot" from the selected persistent data realm.
 * @param {string} realm The data realm to select. `OBS_WEBSOCKET_DATA_REALM_GLOBAL` or `OBS_WEBSOCKET_DATA_REALM_PROFILE`
 * @param {string} slotName The name of the slot to retrieve data from
 * @returns {Promise<GetPersistentDataResponse>}
**/
/**
 * @callback SetPersistentData Sets the value of a "slot" from the selected persistent data realm.
 * @param {string} realm The data realm to select. `OBS_WEBSOCKET_DATA_REALM_GLOBAL` or `OBS_WEBSOCKET_DATA_REALM_PROFILE`
 * @param {string} slotName The name of the slot to retrieve data from
 * @param {Any} slotValue The value to apply to the slot
 * @returns {Promise<void>}
**/
/**
 * @typedef GetSceneCollectionListResponse
 * @prop {string} currentSceneCollectionName The name of the current scene collection
 * @prop {Array<string>} sceneCollections Array of all available scene collections
**/
/**
 * @callback GetSceneCollectionList Gets an array of all scene collections
 * @returns {Promise<GetSceneCollectionListResponse>}
**/
/**
 * @callback SetCurrentSceneCollection Switches to a scene collection.
 * 
 * Note: This will block until the collection has finished changing.
 * @param {string} sceneCollectionName Name of the scene collection to switch to
 * @returns {Promise<void>}
**/
/**
 * @callback CreateSceneCollection Creates a new scene collection, switching to it in the process.
 * 
 * Note: This will block until the collection has finished changing.
 * @param {string} sceneCollectionName Name for the new scene collection
 * @returns {Promise<void>}
**/
/**
 * @typedef GetProfileListResponse
 * @prop {string} currentProfileName The name of the current profile
 * @prop {Array<string>} profiles Array of all available profiles
**/
/**
 * @callback GetProfileList Gets an array of all profiles
 * @returns {Promise<GetProfileListResponse>}
**/
/**
 * @callback SetCurrentProfile Switches to a profile.
 * @param {string} profileName Name of the profile to switch to
 * @returns {Promise<void>}
**/
/**
 * @callback CreateProfile Creates a new profile, switching to it in the process
 * @param {string} profileName Name for the new profile
 * @returns {Promise<void>}
**/
/**
 * @callback RemoveProfile Removes a profile. If the current profile is chosen, it will change to a different profile first.
 * @param {string} profileName Name of the profile to remove
 * @returns {Promise<void>}
**/
/**
 * @typedef GetProfileParameterResponse
 * @prop {string} parameterValue Value associated with the parameter. `null` if not set and no default
 * @prop {string} defaultParameterValue Default value associated with the parameter. `null` if no default
**/
/**
 * @callback GetProfileParameter Gets a parameter from the current profile's configuration.
 * @param {string} parameterCategory Category of the parameter to get
 * @param {string} parameterName Name of the parameter to get
 * @returns {Promise<GetProfileParameterResponse>}
**/
/**
 * @callback SetProfileParameter Sets the value of a parameter in the current profile's configuration.
 * @param {string} parameterCategory Category of the parameter to set
 * @param {string} parameterName Name of the parameter to set
 * @param {string} parameterValue Value of the parameter to set. Use `null` to delete
 * @returns {Promise<void>}
**/
/**
 * @typedef GetVideoSettingsResponse
 * @prop {number} fpsNumerator Numerator of the fractional FPS value
 * @prop {number} fpsDenominator Denominator of the fractional FPS value
 * @prop {number} baseWidth Width of the base (canvas) resolution in pixels
 * @prop {number} baseHeight Height of the base (canvas) resolution in pixels
 * @prop {number} outputWidth Width of the output resolution in pixels
 * @prop {number} outputHeight Height of the output resolution in pixels
**/
/**
 * @callback GetVideoSettings Gets the current video settings.
 * 
 * Note: To get the true FPS value, divide the FPS numerator by the FPS denominator. Example: `60000/1001`
 * @returns {Promise<GetVideoSettingsResponse>}
**/
/**
 * @callback SetVideoSettings Sets the current video settings.
 * 
 * Note: Fields must be specified in pairs. For example, you cannot set only `baseWidth` without needing to specify `baseHeight`.
 * @param {number?} fpsNumerator Numerator of the fractional FPS value
 * @param {number?} fpsDenominator Denominator of the fractional FPS value
 * @param {number?} baseWidth Width of the base (canvas) resolution in pixels
 * @param {number?} baseHeight Height of the base (canvas) resolution in pixels
 * @param {number?} outputWidth Width of the output resolution in pixels
 * @param {number?} outputHeight Height of the output resolution in pixels
 * @returns {Promise<void>}
**/
/**
 * @typedef GetStreamServiceSettingsResponse
 * @prop {string} streamServiceType Stream service type, like `rtmp_custom` or `rtmp_common`
 * @prop {object} streamServiceSettings Stream service settings
**/
/**
 * @callback GetStreamServiceSettings Gets the current stream service settings (stream destination).
 * @returns {Promise<GetStreamServiceSettingsResponse>}
**/
/**
 * @callback SetStreamServiceSettings Sets the current stream service settings (stream destination).
 * 
 * Note: Simple RTMP settings can be set with type `rtmp_custom` and the settings fields `server` and `key`.
 * @param {string} streamServiceType Type of stream service to apply. Example: `rtmp_common` or `rtmp_custom`
 * @param {object} streamServiceSettings Settings to apply to the service
 * @returns {Promise<void>}
**/
/**
 * @typedef GetRecordDirectoryResponse
 * @prop {string} recordDirectory Output directory
**/
/**
 * @callback GetRecordDirectory Gets the current directory that the record output is set to.
 * @returns {Promise<GetRecordDirectoryResponse>}
**/
/**
 * @callback SetRecordDirectory Sets the current directory that the record output writes files to.
 * @param {string} recordDirectory Output directory
 * @returns {Promise<void>}
**/

/**
 * @typedef configRequest
 * @prop {GetPersistentData} getPersistentData Gets the value of a "slot" from the selected persistent data realm.
 * @prop {SetPersistentData} setPersistentData Sets the value of a "slot" from the selected persistent data realm.
 * @prop {GetSceneCollectionList} getSceneCollectionList Gets an array of all scene collections
 * @prop {SetCurrentSceneCollection} setCurrentSceneCollection Switches to a scene collection.
 * 
 * Note: This will block until the collection has finished changing.
 * @prop {CreateSceneCollection} createSceneCollection Creates a new scene collection, switching to it in the process.
 * 
 * Note: This will block until the collection has finished changing.
 * @prop {GetProfileList} getProfileList Gets an array of all profiles
 * @prop {SetCurrentProfile} setCurrentProfile Switches to a profile.
 * @prop {CreateProfile} createProfile Creates a new profile, switching to it in the process
 * @prop {RemoveProfile} removeProfile Removes a profile. If the current profile is chosen, it will change to a different profile first.
 * @prop {GetProfileParameter} getProfileParameter Gets a parameter from the current profile's configuration.
 * @prop {SetProfileParameter} setProfileParameter Sets the value of a parameter in the current profile's configuration.
 * @prop {GetVideoSettings} getVideoSettings Gets the current video settings.
 * 
 * Note: To get the true FPS value, divide the FPS numerator by the FPS denominator. Example: `60000/1001`
 * @prop {SetVideoSettings} setVideoSettings Sets the current video settings.
 * 
 * Note: Fields must be specified in pairs. For example, you cannot set only `baseWidth` without needing to specify `baseHeight`.
 * @prop {GetStreamServiceSettings} getStreamServiceSettings Gets the current stream service settings (stream destination).
 * @prop {SetStreamServiceSettings} setStreamServiceSettings Sets the current stream service settings (stream destination).
 * 
 * Note: Simple RTMP settings can be set with type `rtmp_custom` and the settings fields `server` and `key`.
 * @prop {GetRecordDirectory} getRecordDirectory Gets the current directory that the record output is set to.
 * @prop {SetRecordDirectory} setRecordDirectory Sets the current directory that the record output writes files to.
**/

/**
 * @typedef GetSourceFilterKindListResponse
 * @prop {Array<string>} sourceFilterKinds Array of source filter kinds
**/
/**
 * @callback GetSourceFilterKindList Gets an array of all available source filter kinds.
 * 
 * Similar to `GetInputKindList`
 * @returns {Promise<GetSourceFilterKindListResponse>}
**/
/**
 * @typedef GetSourceFilterListResponse
 * @prop {Array<object>} filters Array of filters
**/
/**
 * @callback GetSourceFilterList Gets an array of all of a source's filters.
 * @param {string?} sourceIdentifier Name/UUID of the source
 * @returns {Promise<GetSourceFilterListResponse>}
**/
/**
 * @typedef GetSourceFilterDefaultSettingsResponse
 * @prop {object} defaultFilterSettings object of default settings for the filter kind
**/
/**
 * @callback GetSourceFilterDefaultSettings Gets the default settings for a filter kind.
 * @param {string} filterKind Filter kind to get the default settings for
 * @returns {Promise<GetSourceFilterDefaultSettingsResponse>}
**/
/**
 * @callback CreateSourceFilter Creates a new filter, adding it to the specified source.
 * @param {string?} sourceIdentifier Name/UUID of the source to add the filter to
 * @param {string} filterName Name of the new filter to be created
 * @param {string} filterKind The kind of filter to be created
 * @param {object?} filterSettings Settings object to initialize the filter with
 * @returns {Promise<void>}
**/
/**
 * @callback RemoveSourceFilter Removes a filter from a source.
 * @param {string?} sourceIdentifier Name/UUID of the source the filter is on
 * @param {string} filterName Name of the filter to remove
 * @returns {Promise<void>}
**/
/**
 * @callback SetSourceFilterName Sets the name of a source filter (rename).
 * @param {string?} sourceIdentifier Name/UUID of the source the filter is on
 * @param {string} filterName Current name of the filter
 * @param {string} newFilterName New name for the filter
 * @returns {Promise<void>}
**/
/**
 * @typedef GetSourceFilterResponse
 * @prop {boolean} filterEnabled Whether the filter is enabled
 * @prop {number} filterIndex Index of the filter in the list, beginning at 0
 * @prop {string} filterKind The kind of filter
 * @prop {object} filterSettings Settings object associated with the filter
**/
/**
 * @callback GetSourceFilter Gets the info for a specific source filter.
 * @param {string?} sourceIdentifier Name/UUID of the source
 * @param {string} filterName Name of the filter
 * @returns {Promise<GetSourceFilterResponse>}
**/
/**
 * @callback SetSourceFilterIndex Sets the index position of a filter on a source.
 * @param {string?} sourceIdentifier Name/UUID of the source the filter is on
 * @param {string} filterName Name of the filter
 * @param {number} filterIndex New index position of the filter
 * @returns {Promise<void>}
**/
/**
 * @callback SetSourceFilterSettings Sets the settings of a source filter.
 * @param {string?} sourceIdentifier Name/UUID of the source the filter is on
 * @param {string} filterName Name of the filter to set the settings of
 * @param {object} filterSettings object of settings to apply
 * @param {boolean?} overlay True == apply the settings on top of existing ones, False == reset the input to its defaults, then apply settings.
 * @returns {Promise<void>}
**/
/**
 * @callback SetSourceFilterEnabled Sets the enable state of a source filter.
 * @param {string?} sourceIdentifier Name/UUID of the source the filter is on
 * @param {string} filterName Name of the filter
 * @param {boolean} filterEnabled New enable state of the filter
 * @returns {Promise<void>}
**/

/**
 * @typedef filtersRequest
 * @prop {GetSourceFilterKindList} getSourceFilterKindList Gets an array of all available source filter kinds.
 * 
 * Similar to `GetInputKindList`
 * @prop {GetSourceFilterList} getSourceFilterList Gets an array of all of a source's filters.
 * @prop {GetSourceFilterDefaultSettings} getSourceFilterDefaultSettings Gets the default settings for a filter kind.
 * @prop {CreateSourceFilter} createSourceFilter Creates a new filter, adding it to the specified source.
 * @prop {RemoveSourceFilter} removeSourceFilter Removes a filter from a source.
 * @prop {SetSourceFilterName} setSourceFilterName Sets the name of a source filter (rename).
 * @prop {GetSourceFilter} getSourceFilter Gets the info for a specific source filter.
 * @prop {SetSourceFilterIndex} setSourceFilterIndex Sets the index position of a filter on a source.
 * @prop {SetSourceFilterSettings} setSourceFilterSettings Sets the settings of a source filter.
 * @prop {SetSourceFilterEnabled} setSourceFilterEnabled Sets the enable state of a source filter.
**/

/**
 * @typedef GetVersionResponse
 * @prop {string} obsVersion Current OBS Studio version
 * @prop {string} obsWebSocketVersion Current obs-websocket version
 * @prop {number} rpcVersion Current latest obs-websocket RPC version
 * @prop {Array<string>} availableRequests Array of available RPC requests for the currently negotiated RPC version
 * @prop {Array<string>} supportedImageFormats Image formats available in `GetSourceScreenshot` and `SaveSourceScreenshot` requests.
 * @prop {string} platform Name of the platform. Usually `windows`, `macos`, or `ubuntu` (linux flavor). Not guaranteed to be any of those
 * @prop {string} platformDescription Description of the platform, like `Windows 10 (10.0)`
**/
/**
 * @callback GetVersion Gets data about the current plugin and RPC version.
 * @returns {Promise<GetVersionResponse>}
**/
/**
 * @typedef GetStatsResponse
 * @prop {number} cpuUsage Current CPU usage in percent
 * @prop {number} memoryUsage Amount of memory in MB currently being used by OBS
 * @prop {number} availableDiskSpace Available disk space on the device being used for recording storage
 * @prop {number} activeFps Current FPS being rendered
 * @prop {number} averageFrameRenderTime Average time in milliseconds that OBS is taking to render a frame
 * @prop {number} renderSkippedFrames number of frames skipped by OBS in the render thread
 * @prop {number} renderTotalFrames Total number of frames outputted by the render thread
 * @prop {number} outputSkippedFrames number of frames skipped by OBS in the output thread
 * @prop {number} outputTotalFrames Total number of frames outputted by the output thread
 * @prop {number} webSocketSessionIncomingMessages Total number of messages received by obs-websocket from the client
 * @prop {number} webSocketSessionOutgoingMessages Total number of messages sent by obs-websocket to the client
**/
/**
 * @callback GetStats Gets statistics about OBS, obs-websocket, and the current session.
 * @returns {Promise<GetStatsResponse>}
**/
/**
 * @callback BroadcastCustomEvent Broadcasts a `CustomEvent` to all WebSocket clients. Receivers are clients which are identified and subscribed.
 * @param {object} eventData Data payload to emit to all receivers
 * @returns {Promise<void>}
**/
/**
 * @typedef CallVendorRequestResponse
 * @prop {string} vendorName Echoed of `vendorName`
 * @prop {string} requestType Echoed of `requestType`
 * @prop {object} responseData object containing appropriate response data. {} if request does not provide any response data
**/
/**
 * @callback CallVendorRequest Call a request registered to a vendor.
 * 
 * A vendor is a unique name registered by a third-party plugin or script, which allows for custom requests and events to be added to obs-websocket.
 * If a plugin or script implements vendor requests or events, documentation is expected to be provided with them.
 * @param {string} vendorName Name of the vendor to use
 * @param {string} requestType The request type to call
 * @param {object?} requestData object containing appropriate request data
 * @returns {Promise<CallVendorRequestResponse>}
**/
/**
 * @typedef GetHotkeyListResponse
 * @prop {Array<string>} hotkeys Array of hotkey names
**/
/**
 * @callback GetHotkeyList Gets an array of all hotkey names in OBS.
 * 
 * Note: Hotkey functionality in obs-websocket comes as-is, and we do not guarantee support if things are broken. In 9/10 usages of hotkey requests, there exists a better, more reliable method via other requests.
 * @returns {Promise<GetHotkeyListResponse>}
**/
/**
 * @callback TriggerHotkeyByName Triggers a hotkey using its name. See `GetHotkeyList`.
 * 
 * Note: Hotkey functionality in obs-websocket comes as-is, and we do not guarantee support if things are broken. In 9/10 usages of hotkey requests, there exists a better, more reliable method via other requests.
 * @param {string} hotkeyName Name of the hotkey to trigger
 * @param {string?} contextName Name of context of the hotkey to trigger
 * @returns {Promise<void>}
**/
/**
 * @callback TriggerHotkeyByKeySequence Triggers a hotkey using a sequence of keys.
 * 
 * Note: Hotkey functionality in obs-websocket comes as-is, and we do not guarantee support if things are broken. In 9/10 usages of hotkey requests, there exists a better, more reliable method via other requests.
 * @param {string?} keyId The OBS key ID to use. See https://github.com/obsproject/obs-studio/blob/master/libobs/obs-hotkeys.h
 * @param {{shift: boolean, keyModifiers.control: boolean?, keyModifiers.alt: boolean?, keyModifiers.command: boolean??}?} keyModifiers object containing key modifiers to apply
 * @returns {Promise<void>}
**/
/**
 * @callback Sleep Sleeps for a time duration or number of frames. Only available in request batches with types `SERIAL_REALTIME` or `SERIAL_FRAME`.
 * @param {number?} sleepMillis number of milliseconds to sleep for (if `SERIAL_REALTIME` mode)
 * @param {number?} sleepFrames number of frames to sleep for (if `SERIAL_FRAME` mode)
 * @returns {Promise<void>}
**/

/**
 * @typedef generalRequest
 * @prop {GetVersion} getVersion Gets data about the current plugin and RPC version.
 * @prop {GetStats} getStats Gets statistics about OBS, obs-websocket, and the current session.
 * @prop {BroadcastCustomEvent} broadcastCustomEvent Broadcasts a `CustomEvent` to all WebSocket clients. Receivers are clients which are identified and subscribed.
 * @prop {CallVendorRequest} callVendorRequest Call a request registered to a vendor.
 * 
 * A vendor is a unique name registered by a third-party plugin or script, which allows for custom requests and events to be added to obs-websocket.
 * If a plugin or script implements vendor requests or events, documentation is expected to be provided with them.
 * @prop {GetHotkeyList} getHotkeyList Gets an array of all hotkey names in OBS.
 * 
 * Note: Hotkey functionality in obs-websocket comes as-is, and we do not guarantee support if things are broken. In 9/10 usages of hotkey requests, there exists a better, more reliable method via other requests.
 * @prop {TriggerHotkeyByName} triggerHotkeyByName Triggers a hotkey using its name. See `GetHotkeyList`.
 * 
 * Note: Hotkey functionality in obs-websocket comes as-is, and we do not guarantee support if things are broken. In 9/10 usages of hotkey requests, there exists a better, more reliable method via other requests.
 * @prop {TriggerHotkeyByKeySequence} triggerHotkeyByKeySequence Triggers a hotkey using a sequence of keys.
 * 
 * Note: Hotkey functionality in obs-websocket comes as-is, and we do not guarantee support if things are broken. In 9/10 usages of hotkey requests, there exists a better, more reliable method via other requests.
 * @prop {Sleep} sleep Sleeps for a time duration or number of frames. Only available in request batches with types `SERIAL_REALTIME` or `SERIAL_FRAME`.
**/

/**
 * @typedef GetInputListResponse
 * @prop {Array<object>} inputs Array of inputs
**/
/**
 * @callback GetInputList Gets an array of all inputs in OBS.
 * @param {string?} inputKind Restrict the array to only inputs of the specified kind
 * @returns {Promise<GetInputListResponse>}
**/
/**
 * @typedef GetInputKindListResponse
 * @prop {Array<string>} inputKinds Array of input kinds
**/
/**
 * @callback GetInputKindList Gets an array of all available input kinds in OBS.
 * @param {boolean?} unversioned True == Return all kinds as unversioned, False == Return with version suffixes (if available)
 * @returns {Promise<GetInputKindListResponse>}
**/
/**
 * @typedef GetSpecialInputsResponse
 * @prop {string} desktop1 Name of the Desktop Audio input
 * @prop {string} desktop2 Name of the Desktop Audio 2 input
 * @prop {string} mic1 Name of the Mic/Auxiliary Audio input
 * @prop {string} mic2 Name of the Mic/Auxiliary Audio 2 input
 * @prop {string} mic3 Name of the Mic/Auxiliary Audio 3 input
 * @prop {string} mic4 Name of the Mic/Auxiliary Audio 4 input
**/
/**
 * @callback GetSpecialInputs Gets the names of all special inputs.
 * @returns {Promise<GetSpecialInputsResponse>}
**/
/**
 * @typedef CreateInputResponse
 * @prop {string} inputUuid UUID of the newly created input
 * @prop {number} sceneItemId ID of the newly created scene item
**/
/**
 * @callback CreateInput Creates a new input, adding it as a scene item to the specified scene.
 * @param {string?} sceneIdentifier Name/UUID of the scene to add the input to as a scene item
 * @param {string} inputName Name of the new input to created
 * @param {string} inputKind The kind of input to be created
 * @param {object?} inputSettings Settings object to initialize the input with
 * @param {boolean?} sceneItemEnabled Whether to set the created scene item to enabled or disabled
 * @returns {Promise<CreateInputResponse>}
**/
/**
 * @callback RemoveInput Removes an existing input.
 * 
 * Note: Will immediately remove all associated scene items.
 * @param {string?} inputIdentifier Name/UUID of the input to remove
 * @returns {Promise<void>}
**/
/**
 * @callback SetInputName Sets the name of an input (rename).
 * @param {string?} inputIdentifier Current input Name/UUID
 * @param {string} newInputName New name for the input
 * @returns {Promise<void>}
**/
/**
 * @typedef GetInputDefaultSettingsResponse
 * @prop {object} defaultInputSettings object of default settings for the input kind
**/
/**
 * @callback GetInputDefaultSettings Gets the default settings for an input kind.
 * @param {string} inputKind Input kind to get the default settings for
 * @returns {Promise<GetInputDefaultSettingsResponse>}
**/
/**
 * @typedef GetInputSettingsResponse
 * @prop {object} inputSettings object of settings for the input
 * @prop {string} inputKind The kind of the input
**/
/**
 * @callback GetInputSettings Gets the settings of an input.
 * 
 * Note: Does not include defaults. To create the entire settings object, overlay `inputSettings` over the `defaultInputSettings` provided by `GetInputDefaultSettings`.
 * @param {string?} inputIdentifier Name/UUID of the input to get the settings of
 * @returns {Promise<GetInputSettingsResponse>}
**/
/**
 * @callback SetInputSettings Sets the settings of an input.
 * @param {string?} inputIdentifier Name/UUID of the input to set the settings of
 * @param {object} inputSettings object of settings to apply
 * @param {boolean?} overlay True == apply the settings on top of existing ones, False == reset the input to its defaults, then apply settings.
 * @returns {Promise<void>}
**/
/**
 * @typedef GetInputMuteResponse
 * @prop {boolean} inputMuted Whether the input is muted
**/
/**
 * @callback GetInputMute Gets the audio mute state of an input.
 * @param {string?} inputIdentifier Name/UUID of input to get the mute state of
 * @returns {Promise<GetInputMuteResponse>}
**/
/**
 * @callback SetInputMute Sets the audio mute state of an input.
 * @param {string?} inputIdentifier Name/UUID of the input to set the mute state of
 * @param {boolean} inputMuted Whether to mute the input or not
 * @returns {Promise<void>}
**/
/**
 * @typedef ToggleInputMuteResponse
 * @prop {boolean} inputMuted Whether the input has been muted or unmuted
**/
/**
 * @callback ToggleInputMute Toggles the audio mute state of an input.
 * @param {string?} inputIdentifier Name/UUID of the input to toggle the mute state of
 * @returns {Promise<ToggleInputMuteResponse>}
**/
/**
 * @typedef GetInputVolumeResponse
 * @prop {number} inputVolumeMul Volume setting in mul
 * @prop {number} inputVolumeDb Volume setting in dB
**/
/**
 * @callback GetInputVolume Gets the current volume setting of an input.
 * @param {string?} inputIdentifier Name/UUID of the input to get the volume of
 * @returns {Promise<GetInputVolumeResponse>}
**/
/**
 * @callback SetInputVolume Sets the volume setting of an input.
 * @param {string?} inputIdentifier Name/UUID of the input to set the volume of
 * @param {number?} inputVolumeMul Volume setting in mul
 * @param {number?} inputVolumeDb Volume setting in dB
 * @returns {Promise<void>}
**/
/**
 * @typedef GetInputAudioBalanceResponse
 * @prop {number} inputAudioBalance Audio balance value from 0.0-1.0
**/
/**
 * @callback GetInputAudioBalance Gets the audio balance of an input.
 * @param {string?} inputIdentifier Name/UUID of the input to get the audio balance of
 * @returns {Promise<GetInputAudioBalanceResponse>}
**/
/**
 * @callback SetInputAudioBalance Sets the audio balance of an input.
 * @param {string?} inputIdentifier Name/UUID of the input to set the audio balance of
 * @param {number} inputAudioBalance New audio balance value
 * @returns {Promise<void>}
**/
/**
 * @typedef GetInputAudioSyncOffsetResponse
 * @prop {number} inputAudioSyncOffset Audio sync offset in milliseconds
**/
/**
 * @callback GetInputAudioSyncOffset Gets the audio sync offset of an input.
 * 
 * Note: The audio sync offset can be negative too!
 * @param {string?} inputIdentifier Name/UUID of the input to get the audio sync offset of
 * @returns {Promise<GetInputAudioSyncOffsetResponse>}
**/
/**
 * @callback SetInputAudioSyncOffset Sets the audio sync offset of an input.
 * @param {string?} inputIdentifier Name/UUID of the input to set the audio sync offset of
 * @param {number} inputAudioSyncOffset New audio sync offset in milliseconds
 * @returns {Promise<void>}
**/
/**
 * @typedef GetInputAudioMonitorTypeResponse
 * @prop {string} monitorType Audio monitor type
**/
/**
 * @callback GetInputAudioMonitorType Gets the audio monitor type of an input.
 * 
 * The available audio monitor types are:
 * 
 * - `OBS_MONITORING_TYPE_NONE`
 * - `OBS_MONITORING_TYPE_MONITOR_ONLY`
 * - `OBS_MONITORING_TYPE_MONITOR_AND_OUTPUT`
 * @param {string?} inputIdentifier Name/UUID of the input to get the audio monitor type of
 * @returns {Promise<GetInputAudioMonitorTypeResponse>}
**/
/**
 * @callback SetInputAudioMonitorType Sets the audio monitor type of an input.
 * @param {string?} inputIdentifier Name/UUID of the input to set the audio monitor type of
 * @param {string} monitorType Audio monitor type
 * @returns {Promise<void>}
**/
/**
 * @typedef GetInputAudioTracksResponse
 * @prop {object} inputAudioTracks object of audio tracks and associated enable states
**/
/**
 * @callback GetInputAudioTracks Gets the enable state of all audio tracks of an input.
 * @param {string?} inputIdentifier Name/UUID of the input
 * @returns {Promise<GetInputAudioTracksResponse>}
**/
/**
 * @callback SetInputAudioTracks Sets the enable state of audio tracks of an input.
 * @param {string?} inputIdentifier Name/UUID of the input
 * @param {object} inputAudioTracks Track settings to apply
 * @returns {Promise<void>}
**/
/**
 * @typedef GetInputDeinterlaceModeResponse
 * @prop {string} inputDeinterlaceMode Deinterlace mode of the input
**/
/**
 * @callback GetInputDeinterlaceMode Gets the deinterlace mode of an input.
 * 
 * Deinterlace Modes:
 * 
 * - `OBS_DEINTERLACE_MODE_DISABLE`
 * - `OBS_DEINTERLACE_MODE_DISCARD`
 * - `OBS_DEINTERLACE_MODE_RETRO`
 * - `OBS_DEINTERLACE_MODE_BLEND`
 * - `OBS_DEINTERLACE_MODE_BLEND_2X`
 * - `OBS_DEINTERLACE_MODE_LINEAR`
 * - `OBS_DEINTERLACE_MODE_LINEAR_2X`
 * - `OBS_DEINTERLACE_MODE_YADIF`
 * - `OBS_DEINTERLACE_MODE_YADIF_2X`
 * 
 * Note: Deinterlacing functionality is restricted to async inputs only.
 * @param {string?} inputIdentifier Name/UUID of the input
 * @returns {Promise<GetInputDeinterlaceModeResponse>}
**/
/**
 * @callback SetInputDeinterlaceMode Sets the deinterlace mode of an input.
 * 
 * Note: Deinterlacing functionality is restricted to async inputs only.
 * @param {string?} inputIdentifier Name/UUID of the input
 * @param {string} inputDeinterlaceMode Deinterlace mode for the input
 * @returns {Promise<void>}
**/
/**
 * @typedef GetInputDeinterlaceFieldOrderResponse
 * @prop {string} inputDeinterlaceFieldOrder Deinterlace field order of the input
**/
/**
 * @callback GetInputDeinterlaceFieldOrder Gets the deinterlace field order of an input.
 * 
 * Deinterlace Field Orders:
 * 
 * - `OBS_DEINTERLACE_FIELD_ORDER_TOP`
 * - `OBS_DEINTERLACE_FIELD_ORDER_BOTTOM`
 * 
 * Note: Deinterlacing functionality is restricted to async inputs only.
 * @param {string?} inputIdentifier Name/UUID of the input
 * @returns {Promise<GetInputDeinterlaceFieldOrderResponse>}
**/
/**
 * @callback SetInputDeinterlaceFieldOrder Sets the deinterlace field order of an input.
 * 
 * Note: Deinterlacing functionality is restricted to async inputs only.
 * @param {string?} inputIdentifier Name/UUID of the input
 * @param {string} inputDeinterlaceFieldOrder Deinterlace field order for the input
 * @returns {Promise<void>}
**/
/**
 * @typedef GetInputPropertiesListPropertyItemsResponse
 * @prop {Array<object>} propertyItems Array of items in the list property
**/
/**
 * @callback GetInputPropertiesListPropertyItems Gets the items of a list property from an input's properties.
 * 
 * Note: Use this in cases where an input provides a dynamic, selectable list of items. For example, display capture, where it provides a list of available displays.
 * @param {string?} inputIdentifier Name/UUID of the input
 * @param {string} propertyName Name of the list property to get the items of
 * @returns {Promise<GetInputPropertiesListPropertyItemsResponse>}
**/
/**
 * @callback PressInputPropertiesButton Presses a button in the properties of an input.
 * 
 * Some known `propertyName` values are:
 * 
 * - `refreshnocache` - Browser source reload button
 * 
 * Note: Use this in cases where there is a button in the properties of an input that cannot be accessed in any other way. For example, browser sources, where there is a refresh button.
 * @param {string?} inputIdentifier Name/UUID of the input
 * @param {string} propertyName Name of the button property to press
 * @returns {Promise<void>}
**/

/**
 * @typedef inputsRequest
 * @prop {GetInputList} getInputList Gets an array of all inputs in OBS.
 * @prop {GetInputKindList} getInputKindList Gets an array of all available input kinds in OBS.
 * @prop {GetSpecialInputs} getSpecialInputs Gets the names of all special inputs.
 * @prop {CreateInput} createInput Creates a new input, adding it as a scene item to the specified scene.
 * @prop {RemoveInput} removeInput Removes an existing input.
 * 
 * Note: Will immediately remove all associated scene items.
 * @prop {SetInputName} setInputName Sets the name of an input (rename).
 * @prop {GetInputDefaultSettings} getInputDefaultSettings Gets the default settings for an input kind.
 * @prop {GetInputSettings} getInputSettings Gets the settings of an input.
 * 
 * Note: Does not include defaults. To create the entire settings object, overlay `inputSettings` over the `defaultInputSettings` provided by `GetInputDefaultSettings`.
 * @prop {SetInputSettings} setInputSettings Sets the settings of an input.
 * @prop {GetInputMute} getInputMute Gets the audio mute state of an input.
 * @prop {SetInputMute} setInputMute Sets the audio mute state of an input.
 * @prop {ToggleInputMute} toggleInputMute Toggles the audio mute state of an input.
 * @prop {GetInputVolume} getInputVolume Gets the current volume setting of an input.
 * @prop {SetInputVolume} setInputVolume Sets the volume setting of an input.
 * @prop {GetInputAudioBalance} getInputAudioBalance Gets the audio balance of an input.
 * @prop {SetInputAudioBalance} setInputAudioBalance Sets the audio balance of an input.
 * @prop {GetInputAudioSyncOffset} getInputAudioSyncOffset Gets the audio sync offset of an input.
 * 
 * Note: The audio sync offset can be negative too!
 * @prop {SetInputAudioSyncOffset} setInputAudioSyncOffset Sets the audio sync offset of an input.
 * @prop {GetInputAudioMonitorType} getInputAudioMonitorType Gets the audio monitor type of an input.
 * 
 * The available audio monitor types are:
 * 
 * - `OBS_MONITORING_TYPE_NONE`
 * - `OBS_MONITORING_TYPE_MONITOR_ONLY`
 * - `OBS_MONITORING_TYPE_MONITOR_AND_OUTPUT`
 * @prop {SetInputAudioMonitorType} setInputAudioMonitorType Sets the audio monitor type of an input.
 * @prop {GetInputAudioTracks} getInputAudioTracks Gets the enable state of all audio tracks of an input.
 * @prop {SetInputAudioTracks} setInputAudioTracks Sets the enable state of audio tracks of an input.
 * @prop {GetInputDeinterlaceMode} getInputDeinterlaceMode Gets the deinterlace mode of an input.
 * 
 * Deinterlace Modes:
 * 
 * - `OBS_DEINTERLACE_MODE_DISABLE`
 * - `OBS_DEINTERLACE_MODE_DISCARD`
 * - `OBS_DEINTERLACE_MODE_RETRO`
 * - `OBS_DEINTERLACE_MODE_BLEND`
 * - `OBS_DEINTERLACE_MODE_BLEND_2X`
 * - `OBS_DEINTERLACE_MODE_LINEAR`
 * - `OBS_DEINTERLACE_MODE_LINEAR_2X`
 * - `OBS_DEINTERLACE_MODE_YADIF`
 * - `OBS_DEINTERLACE_MODE_YADIF_2X`
 * 
 * Note: Deinterlacing functionality is restricted to async inputs only.
 * @prop {SetInputDeinterlaceMode} setInputDeinterlaceMode Sets the deinterlace mode of an input.
 * 
 * Note: Deinterlacing functionality is restricted to async inputs only.
 * @prop {GetInputDeinterlaceFieldOrder} getInputDeinterlaceFieldOrder Gets the deinterlace field order of an input.
 * 
 * Deinterlace Field Orders:
 * 
 * - `OBS_DEINTERLACE_FIELD_ORDER_TOP`
 * - `OBS_DEINTERLACE_FIELD_ORDER_BOTTOM`
 * 
 * Note: Deinterlacing functionality is restricted to async inputs only.
 * @prop {SetInputDeinterlaceFieldOrder} setInputDeinterlaceFieldOrder Sets the deinterlace field order of an input.
 * 
 * Note: Deinterlacing functionality is restricted to async inputs only.
 * @prop {GetInputPropertiesListPropertyItems} getInputPropertiesListPropertyItems Gets the items of a list property from an input's properties.
 * 
 * Note: Use this in cases where an input provides a dynamic, selectable list of items. For example, display capture, where it provides a list of available displays.
 * @prop {PressInputPropertiesButton} pressInputPropertiesButton Presses a button in the properties of an input.
 * 
 * Some known `propertyName` values are:
 * 
 * - `refreshnocache` - Browser source reload button
 * 
 * Note: Use this in cases where there is a button in the properties of an input that cannot be accessed in any other way. For example, browser sources, where there is a refresh button.
**/

/**
 * @typedef GetMediaInputStatusResponse
 * @prop {string} mediaState State of the media input
 * @prop {number} mediaDuration Total duration of the playing media in milliseconds. `null` if not playing
 * @prop {number} mediaCursor Position of the cursor in milliseconds. `null` if not playing
**/
/**
 * @callback GetMediaInputStatus Gets the status of a media input.
 * 
 * Media States:
 * 
 * - `OBS_MEDIA_STATE_NONE`
 * - `OBS_MEDIA_STATE_PLAYING`
 * - `OBS_MEDIA_STATE_OPENING`
 * - `OBS_MEDIA_STATE_BUFFERING`
 * - `OBS_MEDIA_STATE_PAUSED`
 * - `OBS_MEDIA_STATE_STOPPED`
 * - `OBS_MEDIA_STATE_ENDED`
 * - `OBS_MEDIA_STATE_ERROR`
 * @param {string?} inputIdentifier Name/UUID of the media input
 * @returns {Promise<GetMediaInputStatusResponse>}
**/
/**
 * @callback SetMediaInputCursor Sets the cursor position of a media input.
 * 
 * This request does not perform bounds checking of the cursor position.
 * @param {string?} inputIdentifier Name/UUID of the media input
 * @param {number} mediaCursor New cursor position to set
 * @returns {Promise<void>}
**/
/**
 * @callback OffsetMediaInputCursor Offsets the current cursor position of a media input by the specified value.
 * 
 * This request does not perform bounds checking of the cursor position.
 * @param {string?} inputIdentifier Name/UUID of the media input
 * @param {number} mediaCursorOffset Value to offset the current cursor position by
 * @returns {Promise<void>}
**/
/**
 * @callback TriggerMediaInputAction Triggers an action on a media input.
 * @param {string?} inputIdentifier Name/UUID of the media input
 * @param {string} mediaAction Identifier of the `ObsMediaInputAction` enum
 * @returns {Promise<void>}
**/

/**
 * @typedef mediainputsRequest
 * @prop {GetMediaInputStatus} getMediaInputStatus Gets the status of a media input.
 * 
 * Media States:
 * 
 * - `OBS_MEDIA_STATE_NONE`
 * - `OBS_MEDIA_STATE_PLAYING`
 * - `OBS_MEDIA_STATE_OPENING`
 * - `OBS_MEDIA_STATE_BUFFERING`
 * - `OBS_MEDIA_STATE_PAUSED`
 * - `OBS_MEDIA_STATE_STOPPED`
 * - `OBS_MEDIA_STATE_ENDED`
 * - `OBS_MEDIA_STATE_ERROR`
 * @prop {SetMediaInputCursor} setMediaInputCursor Sets the cursor position of a media input.
 * 
 * This request does not perform bounds checking of the cursor position.
 * @prop {OffsetMediaInputCursor} offsetMediaInputCursor Offsets the current cursor position of a media input by the specified value.
 * 
 * This request does not perform bounds checking of the cursor position.
 * @prop {TriggerMediaInputAction} triggerMediaInputAction Triggers an action on a media input.
**/

/**
 * @typedef GetVirtualCamStatusResponse
 * @prop {boolean} outputActive Whether the output is active
**/
/**
 * @callback GetVirtualCamStatus Gets the status of the virtualcam output.
 * @returns {Promise<GetVirtualCamStatusResponse>}
**/
/**
 * @typedef ToggleVirtualCamResponse
 * @prop {boolean} outputActive Whether the output is active
**/
/**
 * @callback ToggleVirtualCam Toggles the state of the virtualcam output.
 * @returns {Promise<ToggleVirtualCamResponse>}
**/
/**
 * @callback StartVirtualCam Starts the virtualcam output.
 * @returns {Promise<void>}
**/
/**
 * @callback StopVirtualCam Stops the virtualcam output.
 * @returns {Promise<void>}
**/
/**
 * @typedef GetReplayBufferStatusResponse
 * @prop {boolean} outputActive Whether the output is active
**/
/**
 * @callback GetReplayBufferStatus Gets the status of the replay buffer output.
 * @returns {Promise<GetReplayBufferStatusResponse>}
**/
/**
 * @typedef ToggleReplayBufferResponse
 * @prop {boolean} outputActive Whether the output is active
**/
/**
 * @callback ToggleReplayBuffer Toggles the state of the replay buffer output.
 * @returns {Promise<ToggleReplayBufferResponse>}
**/
/**
 * @callback StartReplayBuffer Starts the replay buffer output.
 * @returns {Promise<void>}
**/
/**
 * @callback StopReplayBuffer Stops the replay buffer output.
 * @returns {Promise<void>}
**/
/**
 * @callback SaveReplayBuffer Saves the contents of the replay buffer output.
 * @returns {Promise<void>}
**/
/**
 * @typedef GetLastReplayBufferReplayResponse
 * @prop {string} savedReplayPath File path
**/
/**
 * @callback GetLastReplayBufferReplay Gets the filename of the last replay buffer save file.
 * @returns {Promise<GetLastReplayBufferReplayResponse>}
**/
/**
 * @typedef GetOutputListResponse
 * @prop {Array<object>} outputs Array of outputs
**/
/**
 * @callback GetOutputList Gets the list of available outputs.
 * @returns {Promise<GetOutputListResponse>}
**/
/**
 * @typedef GetOutputStatusResponse
 * @prop {boolean} outputActive Whether the output is active
 * @prop {boolean} outputReconnecting Whether the output is reconnecting
 * @prop {string} outputTimecode Current formatted timecode string for the output
 * @prop {number} outputDuration Current duration in milliseconds for the output
 * @prop {number} outputCongestion Congestion of the output
 * @prop {number} outputBytes number of bytes sent by the output
 * @prop {number} outputSkippedFrames number of frames skipped by the output's process
 * @prop {number} outputTotalFrames Total number of frames delivered by the output's process
**/
/**
 * @callback GetOutputStatus Gets the status of an output.
 * @param {string} outputName Output name
 * @returns {Promise<GetOutputStatusResponse>}
**/
/**
 * @typedef ToggleOutputResponse
 * @prop {boolean} outputActive Whether the output is active
**/
/**
 * @callback ToggleOutput Toggles the status of an output.
 * @param {string} outputName Output name
 * @returns {Promise<ToggleOutputResponse>}
**/
/**
 * @callback StartOutput Starts an output.
 * @param {string} outputName Output name
 * @returns {Promise<void>}
**/
/**
 * @callback StopOutput Stops an output.
 * @param {string} outputName Output name
 * @returns {Promise<void>}
**/
/**
 * @typedef GetOutputSettingsResponse
 * @prop {object} outputSettings Output settings
**/
/**
 * @callback GetOutputSettings Gets the settings of an output.
 * @param {string} outputName Output name
 * @returns {Promise<GetOutputSettingsResponse>}
**/
/**
 * @callback SetOutputSettings Sets the settings of an output.
 * @param {string} outputName Output name
 * @param {object} outputSettings Output settings
 * @returns {Promise<void>}
**/

/**
 * @typedef outputsRequest
 * @prop {GetVirtualCamStatus} getVirtualCamStatus Gets the status of the virtualcam output.
 * @prop {ToggleVirtualCam} toggleVirtualCam Toggles the state of the virtualcam output.
 * @prop {StartVirtualCam} startVirtualCam Starts the virtualcam output.
 * @prop {StopVirtualCam} stopVirtualCam Stops the virtualcam output.
 * @prop {GetReplayBufferStatus} getReplayBufferStatus Gets the status of the replay buffer output.
 * @prop {ToggleReplayBuffer} toggleReplayBuffer Toggles the state of the replay buffer output.
 * @prop {StartReplayBuffer} startReplayBuffer Starts the replay buffer output.
 * @prop {StopReplayBuffer} stopReplayBuffer Stops the replay buffer output.
 * @prop {SaveReplayBuffer} saveReplayBuffer Saves the contents of the replay buffer output.
 * @prop {GetLastReplayBufferReplay} getLastReplayBufferReplay Gets the filename of the last replay buffer save file.
 * @prop {GetOutputList} getOutputList Gets the list of available outputs.
 * @prop {GetOutputStatus} getOutputStatus Gets the status of an output.
 * @prop {ToggleOutput} toggleOutput Toggles the status of an output.
 * @prop {StartOutput} startOutput Starts an output.
 * @prop {StopOutput} stopOutput Stops an output.
 * @prop {GetOutputSettings} getOutputSettings Gets the settings of an output.
 * @prop {SetOutputSettings} setOutputSettings Sets the settings of an output.
**/

/**
 * @typedef GetRecordStatusResponse
 * @prop {boolean} outputActive Whether the output is active
 * @prop {boolean} outputPaused Whether the output is paused
 * @prop {string} outputTimecode Current formatted timecode string for the output
 * @prop {number} outputDuration Current duration in milliseconds for the output
 * @prop {number} outputBytes number of bytes sent by the output
**/
/**
 * @callback GetRecordStatus Gets the status of the record output.
 * @returns {Promise<GetRecordStatusResponse>}
**/
/**
 * @typedef ToggleRecordResponse
 * @prop {boolean} outputActive The new active state of the output
**/
/**
 * @callback ToggleRecord Toggles the status of the record output.
 * @returns {Promise<ToggleRecordResponse>}
**/
/**
 * @callback StartRecord Starts the record output.
 * @returns {Promise<void>}
**/
/**
 * @typedef StopRecordResponse
 * @prop {string} outputPath File name for the saved recording
**/
/**
 * @callback StopRecord Stops the record output.
 * @returns {Promise<StopRecordResponse>}
**/
/**
 * @callback ToggleRecordPause Toggles pause on the record output.
 * @returns {Promise<void>}
**/
/**
 * @callback PauseRecord Pauses the record output.
 * @returns {Promise<void>}
**/
/**
 * @callback ResumeRecord Resumes the record output.
 * @returns {Promise<void>}
**/
/**
 * @callback SplitRecordFile Splits the current file being recorded into a new file.
 * @returns {Promise<void>}
**/
/**
 * @callback CreateRecordChapter Adds a new chapter marker to the file currently being recorded.
 * 
 * Note: As of OBS 30.2.0, the only file format supporting this feature is Hybrid MP4.
 * @param {string?} chapterName Name of the new chapter
 * @returns {Promise<void>}
**/

/**
 * @typedef recordRequest
 * @prop {GetRecordStatus} getRecordStatus Gets the status of the record output.
 * @prop {ToggleRecord} toggleRecord Toggles the status of the record output.
 * @prop {StartRecord} startRecord Starts the record output.
 * @prop {StopRecord} stopRecord Stops the record output.
 * @prop {ToggleRecordPause} toggleRecordPause Toggles pause on the record output.
 * @prop {PauseRecord} pauseRecord Pauses the record output.
 * @prop {ResumeRecord} resumeRecord Resumes the record output.
 * @prop {SplitRecordFile} splitRecordFile Splits the current file being recorded into a new file.
 * @prop {CreateRecordChapter} createRecordChapter Adds a new chapter marker to the file currently being recorded.
 * 
 * Note: As of OBS 30.2.0, the only file format supporting this feature is Hybrid MP4.
**/

/**
 * @typedef GetSceneItemListResponse
 * @prop {Array<object>} sceneItems Array of scene items in the scene
**/
/**
 * @callback GetSceneItemList Gets a list of all scene items in a scene.
 * 
 * Scenes only
 * @param {string?} sceneIdentifier Name/UUID of the scene to get the items of
 * @returns {Promise<GetSceneItemListResponse>}
**/
/**
 * @typedef GetGroupSceneItemListResponse
 * @prop {Array<object>} sceneItems Array of scene items in the group
**/
/**
 * @callback GetGroupSceneItemList Basically GetSceneItemList, but for groups.
 * 
 * Using groups at all in OBS is discouraged, as they are very broken under the hood. Please use nested scenes instead.
 * 
 * Groups only
 * @param {string?} sceneIdentifier Name/UUID of the group to get the items of
 * @returns {Promise<GetGroupSceneItemListResponse>}
**/
/**
 * @typedef GetSceneItemIdResponse
 * @prop {number} sceneItemId Numeric ID of the scene item
**/
/**
 * @callback GetSceneItemId Searches a scene for a source, and returns its id.
 * 
 * Scenes and Groups
 * @param {string?} sceneIdentifier Name/UUID of the scene or group to search in
 * @param {string} sourceName Name of the source to find
 * @param {number?} searchOffset number of matches to skip during search. >= 0 means first forward. -1 means last (top) item
 * @returns {Promise<GetSceneItemIdResponse>}
**/
/**
 * @typedef GetSceneItemSourceResponse
 * @prop {string} sourceName Name of the source associated with the scene item
 * @prop {string} sourceUuid UUID of the source associated with the scene item
**/
/**
 * @callback GetSceneItemSource Gets the source associated with a scene item.
 * @param {string?} sceneIdentifier Name/UUID of the scene the item is in
 * @param {number} sceneItemId Numeric ID of the scene item
 * @returns {Promise<GetSceneItemSourceResponse>}
**/
/**
 * @typedef CreateSceneItemResponse
 * @prop {number} sceneItemId Numeric ID of the scene item
**/
/**
 * @callback CreateSceneItem Creates a new scene item using a source.
 * 
 * Scenes only
 * @param {string?} sourceIdentifier Name/UUID of the source to add to the scene
 * @param {string?} sceneIdentifier Name/UUID of the scene to create the new item in
 * @param {boolean?} sceneItemEnabled Enable state to apply to the scene item on creation
 * @returns {Promise<CreateSceneItemResponse>}
**/
/**
 * @callback RemoveSceneItem Removes a scene item from a scene.
 * 
 * Scenes only
 * @param {string?} sceneIdentifier Name/UUID of the scene the item is in
 * @param {number} sceneItemId Numeric ID of the scene item
 * @returns {Promise<void>}
**/
/**
 * @typedef DuplicateSceneItemResponse
 * @prop {number} sceneItemId Numeric ID of the duplicated scene item
**/
/**
 * @callback DuplicateSceneItem Duplicates a scene item, copying all transform and crop info.
 * 
 * Scenes only
 * @param {string?} destinationSceneIdentifier Name/UUID of the scene to create the duplicated item in
 * @param {string?} sceneIdentifier Name/UUID of the scene the item is in
 * @param {number} sceneItemId Numeric ID of the scene item
 * @returns {Promise<DuplicateSceneItemResponse>}
**/
/**
 * @typedef GetSceneItemTransformResponse
 * @prop {object} sceneItemTransform object containing scene item transform info
**/
/**
 * @callback GetSceneItemTransform Gets the transform and crop info of a scene item.
 * 
 * Scenes and Groups
 * @param {string?} sceneIdentifier Name/UUID of the scene the item is in
 * @param {number} sceneItemId Numeric ID of the scene item
 * @returns {Promise<GetSceneItemTransformResponse>}
**/
/**
 * @callback SetSceneItemTransform Sets the transform and crop info of a scene item.
 * @param {string?} sceneIdentifier Name/UUID of the scene the item is in
 * @param {number} sceneItemId Numeric ID of the scene item
 * @param {object} sceneItemTransform object containing scene item transform info to update
 * @returns {Promise<void>}
**/
/**
 * @typedef GetSceneItemEnabledResponse
 * @prop {boolean} sceneItemEnabled Whether the scene item is enabled. `true` for enabled, `false` for disabled
**/
/**
 * @callback GetSceneItemEnabled Gets the enable state of a scene item.
 * 
 * Scenes and Groups
 * @param {string?} sceneIdentifier Name/UUID of the scene the item is in
 * @param {number} sceneItemId Numeric ID of the scene item
 * @returns {Promise<GetSceneItemEnabledResponse>}
**/
/**
 * @callback SetSceneItemEnabled Sets the enable state of a scene item.
 * 
 * Scenes and Groups
 * @param {string?} sceneIdentifier Name/UUID of the scene the item is in
 * @param {number} sceneItemId Numeric ID of the scene item
 * @param {boolean} sceneItemEnabled New enable state of the scene item
 * @returns {Promise<void>}
**/
/**
 * @typedef GetSceneItemLockedResponse
 * @prop {boolean} sceneItemLocked Whether the scene item is locked. `true` for locked, `false` for unlocked
**/
/**
 * @callback GetSceneItemLocked Gets the lock state of a scene item.
 * 
 * Scenes and Groups
 * @param {string?} sceneIdentifier Name/UUID of the scene the item is in
 * @param {number} sceneItemId Numeric ID of the scene item
 * @returns {Promise<GetSceneItemLockedResponse>}
**/
/**
 * @callback SetSceneItemLocked Sets the lock state of a scene item.
 * 
 * Scenes and Group
 * @param {string?} sceneIdentifier Name/UUID of the scene the item is in
 * @param {number} sceneItemId Numeric ID of the scene item
 * @param {boolean} sceneItemLocked New lock state of the scene item
 * @returns {Promise<void>}
**/
/**
 * @typedef GetSceneItemIndexResponse
 * @prop {number} sceneItemIndex Index position of the scene item
**/
/**
 * @callback GetSceneItemIndex Gets the index position of a scene item in a scene.
 * 
 * An index of 0 is at the bottom of the source list in the UI.
 * 
 * Scenes and Groups
 * @param {string?} sceneIdentifier Name/UUID of the scene the item is in
 * @param {number} sceneItemId Numeric ID of the scene item
 * @returns {Promise<GetSceneItemIndexResponse>}
**/
/**
 * @callback SetSceneItemIndex Sets the index position of a scene item in a scene.
 * 
 * Scenes and Groups
 * @param {string?} sceneIdentifier Name/UUID of the scene the item is in
 * @param {number} sceneItemId Numeric ID of the scene item
 * @param {number} sceneItemIndex New index position of the scene item
 * @returns {Promise<void>}
**/
/**
 * @typedef GetSceneItemBlendModeResponse
 * @prop {string} sceneItemBlendMode Current blend mode
**/
/**
 * @callback GetSceneItemBlendMode Gets the blend mode of a scene item.
 * 
 * Blend modes:
 * 
 * - `OBS_BLEND_NORMAL`
 * - `OBS_BLEND_ADDITIVE`
 * - `OBS_BLEND_SUBTRACT`
 * - `OBS_BLEND_SCREEN`
 * - `OBS_BLEND_MULTIPLY`
 * - `OBS_BLEND_LIGHTEN`
 * - `OBS_BLEND_DARKEN`
 * 
 * Scenes and Groups
 * @param {string?} sceneIdentifier Name/UUID of the scene the item is in
 * @param {number} sceneItemId Numeric ID of the scene item
 * @returns {Promise<GetSceneItemBlendModeResponse>}
**/
/**
 * @callback SetSceneItemBlendMode Sets the blend mode of a scene item.
 * 
 * Scenes and Groups
 * @param {string?} sceneIdentifier Name/UUID of the scene the item is in
 * @param {number} sceneItemId Numeric ID of the scene item
 * @param {string} sceneItemBlendMode New blend mode
 * @returns {Promise<void>}
**/

/**
 * @typedef sceneitemsRequest
 * @prop {GetSceneItemList} getSceneItemList Gets a list of all scene items in a scene.
 * 
 * Scenes only
 * @prop {GetGroupSceneItemList} getGroupSceneItemList Basically GetSceneItemList, but for groups.
 * 
 * Using groups at all in OBS is discouraged, as they are very broken under the hood. Please use nested scenes instead.
 * 
 * Groups only
 * @prop {GetSceneItemId} getSceneItemId Searches a scene for a source, and returns its id.
 * 
 * Scenes and Groups
 * @prop {GetSceneItemSource} getSceneItemSource Gets the source associated with a scene item.
 * @prop {CreateSceneItem} createSceneItem Creates a new scene item using a source.
 * 
 * Scenes only
 * @prop {RemoveSceneItem} removeSceneItem Removes a scene item from a scene.
 * 
 * Scenes only
 * @prop {DuplicateSceneItem} duplicateSceneItem Duplicates a scene item, copying all transform and crop info.
 * 
 * Scenes only
 * @prop {GetSceneItemTransform} getSceneItemTransform Gets the transform and crop info of a scene item.
 * 
 * Scenes and Groups
 * @prop {SetSceneItemTransform} setSceneItemTransform Sets the transform and crop info of a scene item.
 * @prop {GetSceneItemEnabled} getSceneItemEnabled Gets the enable state of a scene item.
 * 
 * Scenes and Groups
 * @prop {SetSceneItemEnabled} setSceneItemEnabled Sets the enable state of a scene item.
 * 
 * Scenes and Groups
 * @prop {GetSceneItemLocked} getSceneItemLocked Gets the lock state of a scene item.
 * 
 * Scenes and Groups
 * @prop {SetSceneItemLocked} setSceneItemLocked Sets the lock state of a scene item.
 * 
 * Scenes and Group
 * @prop {GetSceneItemIndex} getSceneItemIndex Gets the index position of a scene item in a scene.
 * 
 * An index of 0 is at the bottom of the source list in the UI.
 * 
 * Scenes and Groups
 * @prop {SetSceneItemIndex} setSceneItemIndex Sets the index position of a scene item in a scene.
 * 
 * Scenes and Groups
 * @prop {GetSceneItemBlendMode} getSceneItemBlendMode Gets the blend mode of a scene item.
 * 
 * Blend modes:
 * 
 * - `OBS_BLEND_NORMAL`
 * - `OBS_BLEND_ADDITIVE`
 * - `OBS_BLEND_SUBTRACT`
 * - `OBS_BLEND_SCREEN`
 * - `OBS_BLEND_MULTIPLY`
 * - `OBS_BLEND_LIGHTEN`
 * - `OBS_BLEND_DARKEN`
 * 
 * Scenes and Groups
 * @prop {SetSceneItemBlendMode} setSceneItemBlendMode Sets the blend mode of a scene item.
 * 
 * Scenes and Groups
**/

/**
 * @typedef GetSceneListResponse
 * @prop {string} currentProgramSceneName Current program scene name. Can be `null` if internal state desync
 * @prop {string} currentProgramSceneUuid Current program scene UUID. Can be `null` if internal state desync
 * @prop {string} currentPreviewSceneName Current preview scene name. `null` if not in studio mode
 * @prop {string} currentPreviewSceneUuid Current preview scene UUID. `null` if not in studio mode
 * @prop {Array<object>} scenes Array of scenes
**/
/**
 * @callback GetSceneList Gets an array of all scenes in OBS.
 * @returns {Promise<GetSceneListResponse>}
**/
/**
 * @typedef GetGroupListResponse
 * @prop {Array<string>} groups Array of group names
**/
/**
 * @callback GetGroupList Gets an array of all groups in OBS.
 * 
 * Groups in OBS are actually scenes, but renamed and modified. In obs-websocket, we treat them as scenes where we can.
 * @returns {Promise<GetGroupListResponse>}
**/
/**
 * @typedef GetCurrentProgramSceneResponse
 * @prop {string} sceneName Current program scene name
 * @prop {string} sceneUuid Current program scene UUID
 * @prop {string} currentProgramSceneName Current program scene name (Deprecated)
 * @prop {string} currentProgramSceneUuid Current program scene UUID (Deprecated)
**/
/**
 * @callback GetCurrentProgramScene Gets the current program scene.
 * 
 * Note: This request is slated to have the `currentProgram`-prefixed fields removed from in an upcoming RPC version.
 * @returns {Promise<GetCurrentProgramSceneResponse>}
**/
/**
 * @callback SetCurrentProgramScene Sets the current program scene.
 * @param {string?} sceneIdentifier Scene Name/UUID to set as the current program scene
 * @returns {Promise<void>}
**/
/**
 * @typedef GetCurrentPreviewSceneResponse
 * @prop {string} sceneName Current preview scene name
 * @prop {string} sceneUuid Current preview scene UUID
 * @prop {string} currentPreviewSceneName Current preview scene name
 * @prop {string} currentPreviewSceneUuid Current preview scene UUID
**/
/**
 * @callback GetCurrentPreviewScene Gets the current preview scene.
 * 
 * Only available when studio mode is enabled.
 * 
 * Note: This request is slated to have the `currentPreview`-prefixed fields removed from in an upcoming RPC version.
 * @returns {Promise<GetCurrentPreviewSceneResponse>}
**/
/**
 * @callback SetCurrentPreviewScene Sets the current preview scene.
 * 
 * Only available when studio mode is enabled.
 * @param {string?} sceneIdentifier Scene Name/UUID to set as the current preview scene
 * @returns {Promise<void>}
**/
/**
 * @typedef CreateSceneResponse
 * @prop {string} sceneUuid UUID of the created scene
**/
/**
 * @callback CreateScene Creates a new scene in OBS.
 * @param {string} sceneName Name for the new scene
 * @returns {Promise<CreateSceneResponse>}
**/
/**
 * @callback RemoveScene Removes a scene from OBS.
 * @param {string?} sceneIdentifier Name/UUID of the scene to remove
 * @returns {Promise<void>}
**/
/**
 * @callback SetSceneName Sets the name of a scene (rename).
 * @param {string?} sceneIdentifier Name/UUID of the scene to be renamed
 * @param {string} newSceneName New name for the scene
 * @returns {Promise<void>}
**/
/**
 * @typedef GetSceneSceneTransitionOverrideResponse
 * @prop {string} transitionName Name of the overridden scene transition, else `null`
 * @prop {number} transitionDuration Duration of the overridden scene transition, else `null`
**/
/**
 * @callback GetSceneSceneTransitionOverride Gets the scene transition overridden for a scene.
 * 
 * Note: A transition UUID response field is not currently able to be implemented as of 2024-1-18.
 * @param {string?} sceneIdentifier Name/UUID of the scene
 * @returns {Promise<GetSceneSceneTransitionOverrideResponse>}
**/
/**
 * @callback SetSceneSceneTransitionOverride Sets the scene transition overridden for a scene.
 * @param {string?} sceneIdentifier Name/UUID of the scene
 * @param {string?} transitionName Name of the scene transition to use as override. Specify `null` to remove
 * @param {number?} transitionDuration Duration to use for any overridden transition. Specify `null` to remove
 * @returns {Promise<void>}
**/

/**
 * @typedef scenesRequest
 * @prop {GetSceneList} getSceneList Gets an array of all scenes in OBS.
 * @prop {GetGroupList} getGroupList Gets an array of all groups in OBS.
 * 
 * Groups in OBS are actually scenes, but renamed and modified. In obs-websocket, we treat them as scenes where we can.
 * @prop {GetCurrentProgramScene} getCurrentProgramScene Gets the current program scene.
 * 
 * Note: This request is slated to have the `currentProgram`-prefixed fields removed from in an upcoming RPC version.
 * @prop {SetCurrentProgramScene} setCurrentProgramScene Sets the current program scene.
 * @prop {GetCurrentPreviewScene} getCurrentPreviewScene Gets the current preview scene.
 * 
 * Only available when studio mode is enabled.
 * 
 * Note: This request is slated to have the `currentPreview`-prefixed fields removed from in an upcoming RPC version.
 * @prop {SetCurrentPreviewScene} setCurrentPreviewScene Sets the current preview scene.
 * 
 * Only available when studio mode is enabled.
 * @prop {CreateScene} createScene Creates a new scene in OBS.
 * @prop {RemoveScene} removeScene Removes a scene from OBS.
 * @prop {SetSceneName} setSceneName Sets the name of a scene (rename).
 * @prop {GetSceneSceneTransitionOverride} getSceneSceneTransitionOverride Gets the scene transition overridden for a scene.
 * 
 * Note: A transition UUID response field is not currently able to be implemented as of 2024-1-18.
 * @prop {SetSceneSceneTransitionOverride} setSceneSceneTransitionOverride Sets the scene transition overridden for a scene.
**/

/**
 * @typedef GetSourceActiveResponse
 * @prop {boolean} videoActive Whether the source is showing in Program
 * @prop {boolean} videoShowing Whether the source is showing in the UI (Preview, Projector, Properties)
**/
/**
 * @callback GetSourceActive Gets the active and show state of a source.
 * 
 * **Compatible with inputs and scenes.**
 * @param {string?} sourceIdentifier Name/UUID of the source to get the active state of
 * @returns {Promise<GetSourceActiveResponse>}
**/
/**
 * @typedef GetSourceScreenshotResponse
 * @prop {string} imageData Base64-encoded screenshot
**/
/**
 * @callback GetSourceScreenshot Gets a Base64-encoded screenshot of a source.
 * 
 * The `imageWidth` and `imageHeight` parameters are treated as "scale to inner", meaning the smallest ratio will be used and the aspect ratio of the original resolution is kept.
 * If `imageWidth` and `imageHeight` are not specified, the compressed image will use the full resolution of the source.
 * 
 * **Compatible with inputs and scenes.**
 * @param {string?} sourceIdentifier Name/UUID of the source to take a screenshot of
 * @param {string} imageFormat Image compression format to use. Use `GetVersion` to get compatible image formats
 * @param {number?} imageWidth Width to scale the screenshot to
 * @param {number?} imageHeight Height to scale the screenshot to
 * @param {number?} imageCompressionQuality Compression quality to use. 0 for high compression, 100 for uncompressed. -1 to use "default" (whatever that means, idk)
 * @returns {Promise<GetSourceScreenshotResponse>}
**/
/**
 * @callback SaveSourceScreenshot Saves a screenshot of a source to the filesystem.
 * 
 * The `imageWidth` and `imageHeight` parameters are treated as "scale to inner", meaning the smallest ratio will be used and the aspect ratio of the original resolution is kept.
 * If `imageWidth` and `imageHeight` are not specified, the compressed image will use the full resolution of the source.
 * 
 * **Compatible with inputs and scenes.**
 * @param {string?} sourceIdentifier Name/UUID of the source to take a screenshot of
 * @param {string} imageFormat Image compression format to use. Use `GetVersion` to get compatible image formats
 * @param {string} imageFilePath Path to save the screenshot file to. Eg. `C:\Users\user\Desktop\screenshot.png`
 * @param {number?} imageWidth Width to scale the screenshot to
 * @param {number?} imageHeight Height to scale the screenshot to
 * @param {number?} imageCompressionQuality Compression quality to use. 0 for high compression, 100 for uncompressed. -1 to use "default" (whatever that means, idk)
 * @returns {Promise<void>}
**/

/**
 * @typedef sourcesRequest
 * @prop {GetSourceActive} getSourceActive Gets the active and show state of a source.
 * 
 * **Compatible with inputs and scenes.**
 * @prop {GetSourceScreenshot} getSourceScreenshot Gets a Base64-encoded screenshot of a source.
 * 
 * The `imageWidth` and `imageHeight` parameters are treated as "scale to inner", meaning the smallest ratio will be used and the aspect ratio of the original resolution is kept.
 * If `imageWidth` and `imageHeight` are not specified, the compressed image will use the full resolution of the source.
 * 
 * **Compatible with inputs and scenes.**
 * @prop {SaveSourceScreenshot} saveSourceScreenshot Saves a screenshot of a source to the filesystem.
 * 
 * The `imageWidth` and `imageHeight` parameters are treated as "scale to inner", meaning the smallest ratio will be used and the aspect ratio of the original resolution is kept.
 * If `imageWidth` and `imageHeight` are not specified, the compressed image will use the full resolution of the source.
 * 
 * **Compatible with inputs and scenes.**
**/

/**
 * @typedef GetStreamStatusResponse
 * @prop {boolean} outputActive Whether the output is active
 * @prop {boolean} outputReconnecting Whether the output is currently reconnecting
 * @prop {string} outputTimecode Current formatted timecode string for the output
 * @prop {number} outputDuration Current duration in milliseconds for the output
 * @prop {number} outputCongestion Congestion of the output
 * @prop {number} outputBytes number of bytes sent by the output
 * @prop {number} outputSkippedFrames number of frames skipped by the output's process
 * @prop {number} outputTotalFrames Total number of frames delivered by the output's process
**/
/**
 * @callback GetStreamStatus Gets the status of the stream output.
 * @returns {Promise<GetStreamStatusResponse>}
**/
/**
 * @typedef ToggleStreamResponse
 * @prop {boolean} outputActive New state of the stream output
**/
/**
 * @callback ToggleStream Toggles the status of the stream output.
 * @returns {Promise<ToggleStreamResponse>}
**/
/**
 * @callback StartStream Starts the stream output.
 * @returns {Promise<void>}
**/
/**
 * @callback StopStream Stops the stream output.
 * @returns {Promise<void>}
**/
/**
 * @callback SendStreamCaption Sends CEA-608 caption text over the stream output.
 * @param {string} captionText Caption text
 * @returns {Promise<void>}
**/

/**
 * @typedef streamRequest
 * @prop {GetStreamStatus} getStreamStatus Gets the status of the stream output.
 * @prop {ToggleStream} toggleStream Toggles the status of the stream output.
 * @prop {StartStream} startStream Starts the stream output.
 * @prop {StopStream} stopStream Stops the stream output.
 * @prop {SendStreamCaption} sendStreamCaption Sends CEA-608 caption text over the stream output.
**/

/**
 * @typedef GetTransitionKindListResponse
 * @prop {Array<string>} transitionKinds Array of transition kinds
**/
/**
 * @callback GetTransitionKindList Gets an array of all available transition kinds.
 * 
 * Similar to `GetInputKindList`
 * @returns {Promise<GetTransitionKindListResponse>}
**/
/**
 * @typedef GetSceneTransitionListResponse
 * @prop {string} currentSceneTransitionName Name of the current scene transition. Can be null
 * @prop {string} currentSceneTransitionUuid UUID of the current scene transition. Can be null
 * @prop {string} currentSceneTransitionKind Kind of the current scene transition. Can be null
 * @prop {Array<object>} transitions Array of transitions
**/
/**
 * @callback GetSceneTransitionList Gets an array of all scene transitions in OBS.
 * @returns {Promise<GetSceneTransitionListResponse>}
**/
/**
 * @typedef GetCurrentSceneTransitionResponse
 * @prop {string} transitionName Name of the transition
 * @prop {string} transitionUuid UUID of the transition
 * @prop {string} transitionKind Kind of the transition
 * @prop {boolean} transitionFixed Whether the transition uses a fixed (unconfigurable) duration
 * @prop {number} transitionDuration Configured transition duration in milliseconds. `null` if transition is fixed
 * @prop {boolean} transitionConfigurable Whether the transition supports being configured
 * @prop {object} transitionSettings object of settings for the transition. `null` if transition is not configurable
**/
/**
 * @callback GetCurrentSceneTransition Gets information about the current scene transition.
 * @returns {Promise<GetCurrentSceneTransitionResponse>}
**/
/**
 * @callback SetCurrentSceneTransition Sets the current scene transition.
 * 
 * Small note: While the namespace of scene transitions is generally unique, that uniqueness is not a guarantee as it is with other resources like inputs.
 * @param {string} transitionName Name of the transition to make active
 * @returns {Promise<void>}
**/
/**
 * @callback SetCurrentSceneTransitionDuration Sets the duration of the current scene transition, if it is not fixed.
 * @param {number} transitionDuration Duration in milliseconds
 * @returns {Promise<void>}
**/
/**
 * @callback SetCurrentSceneTransitionSettings Sets the settings of the current scene transition.
 * @param {object} transitionSettings Settings object to apply to the transition. Can be `{}`
 * @param {boolean?} overlay Whether to overlay over the current settings or replace them
 * @returns {Promise<void>}
**/
/**
 * @typedef GetCurrentSceneTransitionCursorResponse
 * @prop {number} transitionCursor Cursor position, between 0.0 and 1.0
**/
/**
 * @callback GetCurrentSceneTransitionCursor Gets the cursor position of the current scene transition.
 * 
 * Note: `transitionCursor` will return 1.0 when the transition is inactive.
 * @returns {Promise<GetCurrentSceneTransitionCursorResponse>}
**/
/**
 * @callback TriggerStudioModeTransition Triggers the current scene transition. Same functionality as the `Transition` button in studio mode.
 * @returns {Promise<void>}
**/
/**
 * @callback SetTBarPosition Sets the position of the TBar.
 * 
 * **Very important note**: This will be deprecated and replaced in a future version of obs-websocket.
 * @param {number} position New position
 * @param {boolean?} release Whether to release the TBar. Only set `false` if you know that you will be sending another position update
 * @returns {Promise<void>}
**/

/**
 * @typedef transitionsRequest
 * @prop {GetTransitionKindList} getTransitionKindList Gets an array of all available transition kinds.
 * 
 * Similar to `GetInputKindList`
 * @prop {GetSceneTransitionList} getSceneTransitionList Gets an array of all scene transitions in OBS.
 * @prop {GetCurrentSceneTransition} getCurrentSceneTransition Gets information about the current scene transition.
 * @prop {SetCurrentSceneTransition} setCurrentSceneTransition Sets the current scene transition.
 * 
 * Small note: While the namespace of scene transitions is generally unique, that uniqueness is not a guarantee as it is with other resources like inputs.
 * @prop {SetCurrentSceneTransitionDuration} setCurrentSceneTransitionDuration Sets the duration of the current scene transition, if it is not fixed.
 * @prop {SetCurrentSceneTransitionSettings} setCurrentSceneTransitionSettings Sets the settings of the current scene transition.
 * @prop {GetCurrentSceneTransitionCursor} getCurrentSceneTransitionCursor Gets the cursor position of the current scene transition.
 * 
 * Note: `transitionCursor` will return 1.0 when the transition is inactive.
 * @prop {TriggerStudioModeTransition} triggerStudioModeTransition Triggers the current scene transition. Same functionality as the `Transition` button in studio mode.
 * @prop {SetTBarPosition} setTBarPosition Sets the position of the TBar.
 * 
 * **Very important note**: This will be deprecated and replaced in a future version of obs-websocket.
**/

/**
 * @typedef GetStudioModeEnabledResponse
 * @prop {boolean} studioModeEnabled Whether studio mode is enabled
**/
/**
 * @callback GetStudioModeEnabled Gets whether studio is enabled.
 * @returns {Promise<GetStudioModeEnabledResponse>}
**/
/**
 * @callback SetStudioModeEnabled Enables or disables studio mode
 * @param {boolean} studioModeEnabled True == Enabled, False == Disabled
 * @returns {Promise<void>}
**/
/**
 * @callback OpenInputPropertiesDialog Opens the properties dialog of an input.
 * @param {string?} inputIdentifier Name/UUID of the input to open the dialog of
 * @returns {Promise<void>}
**/
/**
 * @callback OpenInputFiltersDialog Opens the filters dialog of an input.
 * @param {string?} inputIdentifier Name/UUID of the input to open the dialog of
 * @returns {Promise<void>}
**/
/**
 * @callback OpenInputInteractDialog Opens the interact dialog of an input.
 * @param {string?} inputIdentifier Name/UUID of the input to open the dialog of
 * @returns {Promise<void>}
**/
/**
 * @typedef GetMonitorListResponse
 * @prop {Array<object>} monitors a list of detected monitors with some information
**/
/**
 * @callback GetMonitorList Gets a list of connected monitors and information about them.
 * @returns {Promise<GetMonitorListResponse>}
**/
/**
 * @callback OpenVideoMixProjector Opens a projector for a specific output video mix.
 * 
 * Mix types:
 * 
 * - `OBS_WEBSOCKET_VIDEO_MIX_TYPE_PREVIEW`
 * - `OBS_WEBSOCKET_VIDEO_MIX_TYPE_PROGRAM`
 * - `OBS_WEBSOCKET_VIDEO_MIX_TYPE_MULTIVIEW`
 * 
 * Note: This request serves to provide feature parity with 4.x. It is very likely to be changed/deprecated in a future release.
 * @param {string} videoMixType Type of mix to open
 * @param {number?} monitorIndex Monitor index, use `GetMonitorList` to obtain index
 * @param {string?} projectorGeometry Size/Position data for a windowed projector, in Qt Base64 encoded format. Mutually exclusive with `monitorIndex`
 * @returns {Promise<void>}
**/
/**
 * @callback OpenSourceProjector Opens a projector for a source.
 * 
 * Note: This request serves to provide feature parity with 4.x. It is very likely to be changed/deprecated in a future release.
 * @param {string?} sourceIdentifier Name/UUID of the source to open a projector for
 * @param {number?} monitorIndex Monitor index, use `GetMonitorList` to obtain index
 * @param {string?} projectorGeometry Size/Position data for a windowed projector, in Qt Base64 encoded format. Mutually exclusive with `monitorIndex`
 * @returns {Promise<void>}
**/

/**
 * @typedef uiRequest
 * @prop {GetStudioModeEnabled} getStudioModeEnabled Gets whether studio is enabled.
 * @prop {SetStudioModeEnabled} setStudioModeEnabled Enables or disables studio mode
 * @prop {OpenInputPropertiesDialog} openInputPropertiesDialog Opens the properties dialog of an input.
 * @prop {OpenInputFiltersDialog} openInputFiltersDialog Opens the filters dialog of an input.
 * @prop {OpenInputInteractDialog} openInputInteractDialog Opens the interact dialog of an input.
 * @prop {GetMonitorList} getMonitorList Gets a list of connected monitors and information about them.
 * @prop {OpenVideoMixProjector} openVideoMixProjector Opens a projector for a specific output video mix.
 * 
 * Mix types:
 * 
 * - `OBS_WEBSOCKET_VIDEO_MIX_TYPE_PREVIEW`
 * - `OBS_WEBSOCKET_VIDEO_MIX_TYPE_PROGRAM`
 * - `OBS_WEBSOCKET_VIDEO_MIX_TYPE_MULTIVIEW`
 * 
 * Note: This request serves to provide feature parity with 4.x. It is very likely to be changed/deprecated in a future release.
 * @prop {OpenSourceProjector} openSourceProjector Opens a projector for a source.
 * 
 * Note: This request serves to provide feature parity with 4.x. It is very likely to be changed/deprecated in a future release.
**/


/**
 * @typedef RequestsObject
 * @prop {configRequest} config
 * @prop {filtersRequest} filters
 * @prop {generalRequest} general
 * @prop {inputsRequest} inputs
 * @prop {mediainputsRequest} mediainputs
 * @prop {outputsRequest} outputs
 * @prop {recordRequest} record
 * @prop {sceneitemsRequest} sceneitems
 * @prop {scenesRequest} scenes
 * @prop {sourcesRequest} sources
 * @prop {streamRequest} stream
 * @prop {transitionsRequest} transitions
 * @prop {uiRequest} ui
 * @prop {configRequest&filtersRequest&generalRequest&inputsRequest&mediainputsRequest&outputsRequest&recordRequest&sceneitemsRequest&scenesRequest&sourcesRequest&streamRequest&transitionsRequest&uiRequest} all
**/


/**
 * @returns {RequestsObject}
**/
module.exports.createRequestObj = (callback) => {
    const returnobj = {
        config: {
            getPersistentData: callback("GetPersistentData"),
            setPersistentData: callback("SetPersistentData"),
            getSceneCollectionList: callback("GetSceneCollectionList"),
            setCurrentSceneCollection: callback("SetCurrentSceneCollection"),
            createSceneCollection: callback("CreateSceneCollection"),
            getProfileList: callback("GetProfileList"),
            setCurrentProfile: callback("SetCurrentProfile"),
            createProfile: callback("CreateProfile"),
            removeProfile: callback("RemoveProfile"),
            getProfileParameter: callback("GetProfileParameter"),
            setProfileParameter: callback("SetProfileParameter"),
            getVideoSettings: callback("GetVideoSettings"),
            setVideoSettings: callback("SetVideoSettings"),
            getStreamServiceSettings: callback("GetStreamServiceSettings"),
            setStreamServiceSettings: callback("SetStreamServiceSettings"),
            getRecordDirectory: callback("GetRecordDirectory"),
            setRecordDirectory: callback("SetRecordDirectory"),
        },
        filters: {
            getSourceFilterKindList: callback("GetSourceFilterKindList"),
            getSourceFilterList: callback("GetSourceFilterList"),
            getSourceFilterDefaultSettings: callback("GetSourceFilterDefaultSettings"),
            createSourceFilter: callback("CreateSourceFilter"),
            removeSourceFilter: callback("RemoveSourceFilter"),
            setSourceFilterName: callback("SetSourceFilterName"),
            getSourceFilter: callback("GetSourceFilter"),
            setSourceFilterIndex: callback("SetSourceFilterIndex"),
            setSourceFilterSettings: callback("SetSourceFilterSettings"),
            setSourceFilterEnabled: callback("SetSourceFilterEnabled"),
        },
        general: {
            getVersion: callback("GetVersion"),
            getStats: callback("GetStats"),
            broadcastCustomEvent: callback("BroadcastCustomEvent"),
            callVendorRequest: callback("CallVendorRequest"),
            getHotkeyList: callback("GetHotkeyList"),
            triggerHotkeyByName: callback("TriggerHotkeyByName"),
            triggerHotkeyByKeySequence: callback("TriggerHotkeyByKeySequence"),
            sleep: callback("Sleep"),
        },
        inputs: {
            getInputList: callback("GetInputList"),
            getInputKindList: callback("GetInputKindList"),
            getSpecialInputs: callback("GetSpecialInputs"),
            createInput: callback("CreateInput"),
            removeInput: callback("RemoveInput"),
            setInputName: callback("SetInputName"),
            getInputDefaultSettings: callback("GetInputDefaultSettings"),
            getInputSettings: callback("GetInputSettings"),
            setInputSettings: callback("SetInputSettings"),
            getInputMute: callback("GetInputMute"),
            setInputMute: callback("SetInputMute"),
            toggleInputMute: callback("ToggleInputMute"),
            getInputVolume: callback("GetInputVolume"),
            setInputVolume: callback("SetInputVolume"),
            getInputAudioBalance: callback("GetInputAudioBalance"),
            setInputAudioBalance: callback("SetInputAudioBalance"),
            getInputAudioSyncOffset: callback("GetInputAudioSyncOffset"),
            setInputAudioSyncOffset: callback("SetInputAudioSyncOffset"),
            getInputAudioMonitorType: callback("GetInputAudioMonitorType"),
            setInputAudioMonitorType: callback("SetInputAudioMonitorType"),
            getInputAudioTracks: callback("GetInputAudioTracks"),
            setInputAudioTracks: callback("SetInputAudioTracks"),
            getInputDeinterlaceMode: callback("GetInputDeinterlaceMode"),
            setInputDeinterlaceMode: callback("SetInputDeinterlaceMode"),
            getInputDeinterlaceFieldOrder: callback("GetInputDeinterlaceFieldOrder"),
            setInputDeinterlaceFieldOrder: callback("SetInputDeinterlaceFieldOrder"),
            getInputPropertiesListPropertyItems: callback("GetInputPropertiesListPropertyItems"),
            pressInputPropertiesButton: callback("PressInputPropertiesButton"),
        },
        mediainputs: {
            getMediaInputStatus: callback("GetMediaInputStatus"),
            setMediaInputCursor: callback("SetMediaInputCursor"),
            offsetMediaInputCursor: callback("OffsetMediaInputCursor"),
            triggerMediaInputAction: callback("TriggerMediaInputAction"),
        },
        outputs: {
            getVirtualCamStatus: callback("GetVirtualCamStatus"),
            toggleVirtualCam: callback("ToggleVirtualCam"),
            startVirtualCam: callback("StartVirtualCam"),
            stopVirtualCam: callback("StopVirtualCam"),
            getReplayBufferStatus: callback("GetReplayBufferStatus"),
            toggleReplayBuffer: callback("ToggleReplayBuffer"),
            startReplayBuffer: callback("StartReplayBuffer"),
            stopReplayBuffer: callback("StopReplayBuffer"),
            saveReplayBuffer: callback("SaveReplayBuffer"),
            getLastReplayBufferReplay: callback("GetLastReplayBufferReplay"),
            getOutputList: callback("GetOutputList"),
            getOutputStatus: callback("GetOutputStatus"),
            toggleOutput: callback("ToggleOutput"),
            startOutput: callback("StartOutput"),
            stopOutput: callback("StopOutput"),
            getOutputSettings: callback("GetOutputSettings"),
            setOutputSettings: callback("SetOutputSettings"),
        },
        record: {
            getRecordStatus: callback("GetRecordStatus"),
            toggleRecord: callback("ToggleRecord"),
            startRecord: callback("StartRecord"),
            stopRecord: callback("StopRecord"),
            toggleRecordPause: callback("ToggleRecordPause"),
            pauseRecord: callback("PauseRecord"),
            resumeRecord: callback("ResumeRecord"),
            splitRecordFile: callback("SplitRecordFile"),
            createRecordChapter: callback("CreateRecordChapter"),
        },
        sceneitems: {
            getSceneItemList: callback("GetSceneItemList"),
            getGroupSceneItemList: callback("GetGroupSceneItemList"),
            getSceneItemId: callback("GetSceneItemId"),
            getSceneItemSource: callback("GetSceneItemSource"),
            createSceneItem: callback("CreateSceneItem"),
            removeSceneItem: callback("RemoveSceneItem"),
            duplicateSceneItem: callback("DuplicateSceneItem"),
            getSceneItemTransform: callback("GetSceneItemTransform"),
            setSceneItemTransform: callback("SetSceneItemTransform"),
            getSceneItemEnabled: callback("GetSceneItemEnabled"),
            setSceneItemEnabled: callback("SetSceneItemEnabled"),
            getSceneItemLocked: callback("GetSceneItemLocked"),
            setSceneItemLocked: callback("SetSceneItemLocked"),
            getSceneItemIndex: callback("GetSceneItemIndex"),
            setSceneItemIndex: callback("SetSceneItemIndex"),
            getSceneItemBlendMode: callback("GetSceneItemBlendMode"),
            setSceneItemBlendMode: callback("SetSceneItemBlendMode"),
        },
        scenes: {
            getSceneList: callback("GetSceneList"),
            getGroupList: callback("GetGroupList"),
            getCurrentProgramScene: callback("GetCurrentProgramScene"),
            setCurrentProgramScene: callback("SetCurrentProgramScene"),
            getCurrentPreviewScene: callback("GetCurrentPreviewScene"),
            setCurrentPreviewScene: callback("SetCurrentPreviewScene"),
            createScene: callback("CreateScene"),
            removeScene: callback("RemoveScene"),
            setSceneName: callback("SetSceneName"),
            getSceneSceneTransitionOverride: callback("GetSceneSceneTransitionOverride"),
            setSceneSceneTransitionOverride: callback("SetSceneSceneTransitionOverride"),
        },
        sources: {
            getSourceActive: callback("GetSourceActive"),
            getSourceScreenshot: callback("GetSourceScreenshot"),
            saveSourceScreenshot: callback("SaveSourceScreenshot"),
        },
        stream: {
            getStreamStatus: callback("GetStreamStatus"),
            toggleStream: callback("ToggleStream"),
            startStream: callback("StartStream"),
            stopStream: callback("StopStream"),
            sendStreamCaption: callback("SendStreamCaption"),
        },
        transitions: {
            getTransitionKindList: callback("GetTransitionKindList"),
            getSceneTransitionList: callback("GetSceneTransitionList"),
            getCurrentSceneTransition: callback("GetCurrentSceneTransition"),
            setCurrentSceneTransition: callback("SetCurrentSceneTransition"),
            setCurrentSceneTransitionDuration: callback("SetCurrentSceneTransitionDuration"),
            setCurrentSceneTransitionSettings: callback("SetCurrentSceneTransitionSettings"),
            getCurrentSceneTransitionCursor: callback("GetCurrentSceneTransitionCursor"),
            triggerStudioModeTransition: callback("TriggerStudioModeTransition"),
            setTBarPosition: callback("SetTBarPosition"),
        },
        ui: {
            getStudioModeEnabled: callback("GetStudioModeEnabled"),
            setStudioModeEnabled: callback("SetStudioModeEnabled"),
            openInputPropertiesDialog: callback("OpenInputPropertiesDialog"),
            openInputFiltersDialog: callback("OpenInputFiltersDialog"),
            openInputInteractDialog: callback("OpenInputInteractDialog"),
            getMonitorList: callback("GetMonitorList"),
            openVideoMixProjector: callback("OpenVideoMixProjector"),
            openSourceProjector: callback("OpenSourceProjector"),
        },
    }
    returnobj.all = {
        ...returnobj.config,
        ...returnobj.filters,
        ...returnobj.general,
        ...returnobj.inputs,
        ...returnobj.mediainputs,
        ...returnobj.outputs,
        ...returnobj.record,
        ...returnobj.sceneitems,
        ...returnobj.scenes,
        ...returnobj.sources,
        ...returnobj.stream,
        ...returnobj.transitions,
        ...returnobj.ui,
    }
    return returnobj;
}
module.exports.requestParams = {
    GetPersistentData: [
        "realm",
        "slotName",
    ],
    SetPersistentData: [
        "realm",
        "slotName",
        "slotValue",
    ],
    GetSceneCollectionList: [
    ],
    SetCurrentSceneCollection: [
        "sceneCollectionName",
    ],
    CreateSceneCollection: [
        "sceneCollectionName",
    ],
    GetProfileList: [
    ],
    SetCurrentProfile: [
        "profileName",
    ],
    CreateProfile: [
        "profileName",
    ],
    RemoveProfile: [
        "profileName",
    ],
    GetProfileParameter: [
        "parameterCategory",
        "parameterName",
    ],
    SetProfileParameter: [
        "parameterCategory",
        "parameterName",
        "parameterValue",
    ],
    GetVideoSettings: [
    ],
    SetVideoSettings: [
        "fpsNumerator",
        "fpsDenominator",
        "baseWidth",
        "baseHeight",
        "outputWidth",
        "outputHeight",
    ],
    GetStreamServiceSettings: [
    ],
    SetStreamServiceSettings: [
        "streamServiceType",
        "streamServiceSettings",
    ],
    GetRecordDirectory: [
    ],
    SetRecordDirectory: [
        "recordDirectory",
    ],
    GetSourceFilterKindList: [
    ],
    GetSourceFilterList: [
        "sourceIdentifier",
    ],
    GetSourceFilterDefaultSettings: [
        "filterKind",
    ],
    CreateSourceFilter: [
        "sourceIdentifier",
        "filterName",
        "filterKind",
        "filterSettings",
    ],
    RemoveSourceFilter: [
        "sourceIdentifier",
        "filterName",
    ],
    SetSourceFilterName: [
        "sourceIdentifier",
        "filterName",
        "newFilterName",
    ],
    GetSourceFilter: [
        "sourceIdentifier",
        "filterName",
    ],
    SetSourceFilterIndex: [
        "sourceIdentifier",
        "filterName",
        "filterIndex",
    ],
    SetSourceFilterSettings: [
        "sourceIdentifier",
        "filterName",
        "filterSettings",
        "overlay",
    ],
    SetSourceFilterEnabled: [
        "sourceIdentifier",
        "filterName",
        "filterEnabled",
    ],
    GetVersion: [
    ],
    GetStats: [
    ],
    BroadcastCustomEvent: [
        "eventData",
    ],
    CallVendorRequest: [
        "vendorName",
        "requestType",
        "requestData",
    ],
    GetHotkeyList: [
    ],
    TriggerHotkeyByName: [
        "hotkeyName",
        "contextName",
    ],
    TriggerHotkeyByKeySequence: [
        "keyId",
        "keyModifiers",
    ],
    Sleep: [
        "sleepMillis",
        "sleepFrames",
    ],
    GetInputList: [
        "inputKind",
    ],
    GetInputKindList: [
        "unversioned",
    ],
    GetSpecialInputs: [
    ],
    CreateInput: [
        "sceneIdentifier",
        "inputName",
        "inputKind",
        "inputSettings",
        "sceneItemEnabled",
    ],
    RemoveInput: [
        "inputIdentifier",
    ],
    SetInputName: [
        "inputIdentifier",
        "newInputName",
    ],
    GetInputDefaultSettings: [
        "inputKind",
    ],
    GetInputSettings: [
        "inputIdentifier",
    ],
    SetInputSettings: [
        "inputIdentifier",
        "inputSettings",
        "overlay",
    ],
    GetInputMute: [
        "inputIdentifier",
    ],
    SetInputMute: [
        "inputIdentifier",
        "inputMuted",
    ],
    ToggleInputMute: [
        "inputIdentifier",
    ],
    GetInputVolume: [
        "inputIdentifier",
    ],
    SetInputVolume: [
        "inputIdentifier",
        "inputVolumeMul",
        "inputVolumeDb",
    ],
    GetInputAudioBalance: [
        "inputIdentifier",
    ],
    SetInputAudioBalance: [
        "inputIdentifier",
        "inputAudioBalance",
    ],
    GetInputAudioSyncOffset: [
        "inputIdentifier",
    ],
    SetInputAudioSyncOffset: [
        "inputIdentifier",
        "inputAudioSyncOffset",
    ],
    GetInputAudioMonitorType: [
        "inputIdentifier",
    ],
    SetInputAudioMonitorType: [
        "inputIdentifier",
        "monitorType",
    ],
    GetInputAudioTracks: [
        "inputIdentifier",
    ],
    SetInputAudioTracks: [
        "inputIdentifier",
        "inputAudioTracks",
    ],
    GetInputDeinterlaceMode: [
        "inputIdentifier",
    ],
    SetInputDeinterlaceMode: [
        "inputIdentifier",
        "inputDeinterlaceMode",
    ],
    GetInputDeinterlaceFieldOrder: [
        "inputIdentifier",
    ],
    SetInputDeinterlaceFieldOrder: [
        "inputIdentifier",
        "inputDeinterlaceFieldOrder",
    ],
    GetInputPropertiesListPropertyItems: [
        "inputIdentifier",
        "propertyName",
    ],
    PressInputPropertiesButton: [
        "inputIdentifier",
        "propertyName",
    ],
    GetMediaInputStatus: [
        "inputIdentifier",
    ],
    SetMediaInputCursor: [
        "inputIdentifier",
        "mediaCursor",
    ],
    OffsetMediaInputCursor: [
        "inputIdentifier",
        "mediaCursorOffset",
    ],
    TriggerMediaInputAction: [
        "inputIdentifier",
        "mediaAction",
    ],
    GetVirtualCamStatus: [
    ],
    ToggleVirtualCam: [
    ],
    StartVirtualCam: [
    ],
    StopVirtualCam: [
    ],
    GetReplayBufferStatus: [
    ],
    ToggleReplayBuffer: [
    ],
    StartReplayBuffer: [
    ],
    StopReplayBuffer: [
    ],
    SaveReplayBuffer: [
    ],
    GetLastReplayBufferReplay: [
    ],
    GetOutputList: [
    ],
    GetOutputStatus: [
        "outputName",
    ],
    ToggleOutput: [
        "outputName",
    ],
    StartOutput: [
        "outputName",
    ],
    StopOutput: [
        "outputName",
    ],
    GetOutputSettings: [
        "outputName",
    ],
    SetOutputSettings: [
        "outputName",
        "outputSettings",
    ],
    GetRecordStatus: [
    ],
    ToggleRecord: [
    ],
    StartRecord: [
    ],
    StopRecord: [
    ],
    ToggleRecordPause: [
    ],
    PauseRecord: [
    ],
    ResumeRecord: [
    ],
    SplitRecordFile: [
    ],
    CreateRecordChapter: [
        "chapterName",
    ],
    GetSceneItemList: [
        "sceneIdentifier",
    ],
    GetGroupSceneItemList: [
        "sceneIdentifier",
    ],
    GetSceneItemId: [
        "sceneIdentifier",
        "sourceName",
        "searchOffset",
    ],
    GetSceneItemSource: [
        "sceneIdentifier",
        "sceneItemId",
    ],
    CreateSceneItem: [
        "sourceIdentifier",
        "sceneIdentifier",
        "sceneItemEnabled",
    ],
    RemoveSceneItem: [
        "sceneIdentifier",
        "sceneItemId",
    ],
    DuplicateSceneItem: [
        "destinationSceneIdentifier",
        "sceneIdentifier",
        "sceneItemId",
    ],
    GetSceneItemTransform: [
        "sceneIdentifier",
        "sceneItemId",
    ],
    SetSceneItemTransform: [
        "sceneIdentifier",
        "sceneItemId",
        "sceneItemTransform",
    ],
    GetSceneItemEnabled: [
        "sceneIdentifier",
        "sceneItemId",
    ],
    SetSceneItemEnabled: [
        "sceneIdentifier",
        "sceneItemId",
        "sceneItemEnabled",
    ],
    GetSceneItemLocked: [
        "sceneIdentifier",
        "sceneItemId",
    ],
    SetSceneItemLocked: [
        "sceneIdentifier",
        "sceneItemId",
        "sceneItemLocked",
    ],
    GetSceneItemIndex: [
        "sceneIdentifier",
        "sceneItemId",
    ],
    SetSceneItemIndex: [
        "sceneIdentifier",
        "sceneItemId",
        "sceneItemIndex",
    ],
    GetSceneItemBlendMode: [
        "sceneIdentifier",
        "sceneItemId",
    ],
    SetSceneItemBlendMode: [
        "sceneIdentifier",
        "sceneItemId",
        "sceneItemBlendMode",
    ],
    GetSceneList: [
    ],
    GetGroupList: [
    ],
    GetCurrentProgramScene: [
    ],
    SetCurrentProgramScene: [
        "sceneIdentifier",
    ],
    GetCurrentPreviewScene: [
    ],
    SetCurrentPreviewScene: [
        "sceneIdentifier",
    ],
    CreateScene: [
        "sceneName",
    ],
    RemoveScene: [
        "sceneIdentifier",
    ],
    SetSceneName: [
        "sceneIdentifier",
        "newSceneName",
    ],
    GetSceneSceneTransitionOverride: [
        "sceneIdentifier",
    ],
    SetSceneSceneTransitionOverride: [
        "sceneIdentifier",
        "transitionName",
        "transitionDuration",
    ],
    GetSourceActive: [
        "sourceIdentifier",
    ],
    GetSourceScreenshot: [
        "sourceIdentifier",
        "imageFormat",
        "imageWidth",
        "imageHeight",
        "imageCompressionQuality",
    ],
    SaveSourceScreenshot: [
        "sourceIdentifier",
        "imageFormat",
        "imageFilePath",
        "imageWidth",
        "imageHeight",
        "imageCompressionQuality",
    ],
    GetStreamStatus: [
    ],
    ToggleStream: [
    ],
    StartStream: [
    ],
    StopStream: [
    ],
    SendStreamCaption: [
        "captionText",
    ],
    GetTransitionKindList: [
    ],
    GetSceneTransitionList: [
    ],
    GetCurrentSceneTransition: [
    ],
    SetCurrentSceneTransition: [
        "transitionName",
    ],
    SetCurrentSceneTransitionDuration: [
        "transitionDuration",
    ],
    SetCurrentSceneTransitionSettings: [
        "transitionSettings",
        "overlay",
    ],
    GetCurrentSceneTransitionCursor: [
    ],
    TriggerStudioModeTransition: [
    ],
    SetTBarPosition: [
        "position",
        "release",
    ],
    GetStudioModeEnabled: [
    ],
    SetStudioModeEnabled: [
        "studioModeEnabled",
    ],
    OpenInputPropertiesDialog: [
        "inputIdentifier",
    ],
    OpenInputFiltersDialog: [
        "inputIdentifier",
    ],
    OpenInputInteractDialog: [
        "inputIdentifier",
    ],
    GetMonitorList: [
    ],
    OpenVideoMixProjector: [
        "videoMixType",
        "monitorIndex",
        "projectorGeometry",
    ],
    OpenSourceProjector: [
        "sourceIdentifier",
        "monitorIndex",
        "projectorGeometry",
    ],
}
