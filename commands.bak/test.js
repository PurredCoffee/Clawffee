const { twitch } = require('#helpers');
const { autoSavedJSON } = require('../plugins/builtin/files');

const katzenID = 150712142;
const ffoxesID = 23425107;

twitch.connectedUser.listener.onChannelChatMessage(ffoxesID, katzenID, (data) => {
    console.log("listener event");
    /*for(badge in data.badges) {
        console.log(data.getBadgeInfo(badge));
    }
    //console.log(data);*/
});

function meow() {
    console.log(meow.caller.arguments);
    console.log(meow.caller)
}

meow();
console.log("this is a string:", "meow")
console.log("this is a number:", 234234234)
console.log("this is an object:", {"bark": "meow"});
console.log("this is a function:", meow.caller);
console.log("this is an error:", new Error("barkbarkbark"));

twitch.connectedUser.chat.onMessage((channel, user, message, msg) => {
    
});
