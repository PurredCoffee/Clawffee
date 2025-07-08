const { twitch } = require("#helpers");

// a set will only contain every element *once*
let entreelist = new Set();

twitch.connectedUser.chat.onMessage((channel, user, text, msg) => {
    // check if we are privileged
    if(msg.userInfo.isMod || msg.userInfo.isBroadcaster) {
        // if a mod sends !raffle the raffle should be spun
        if(text == "!raffle") {

            // get a list of people who joined the raffle (Set() doesnt let us pick a random person easily)
            let entrees = new Array(entreelist.keys());
            let winner = entrees[Math.trunc(Math.random() * entrees.length)];

            // say who won the raffle
            twitch.connectedUser.say(channel, `${winner} wins the raffle!`)
        }
        // if a mod sends !startraffle the raffle is cleared
        if(text == "!startraffle") {
            entreelist = new Set();
        }
    }
    if(text == "!join") {
        entreelist.add(user);
    }
})