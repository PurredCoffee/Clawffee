const { twitch } = require('#helpers');

// this will be automatically cleaned up when the module is unloaded
twitch.connectedUser.chat.onMessage((channel, user, text, message) => {
    console.log(`${user} sent ${text} in ${channel}`);
    console.debug("verbose info: ", message);
});

// more verbose functions are found under listener
twitch.connectedUser.listener.onChannelAdBreakBegin(idFromUser('ludwig'), (data) => {
    console.log(`ludwig started yet another ad ${!data.isAutomatic?"he started it manuall":""}`);
});

// connectedBots contains your non main bots
twitch.connectedBots['ludwig']?.say(idFromUser('ludwig'), "WOW i am ludwig!");


/*
    For more information read:
    https://twurple.js.org/
*/