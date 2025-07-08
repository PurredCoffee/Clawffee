// persistent is a file scope variable and will be tied to the file and not reset when the file is reloaded
const x = persistent.counter;

console.log(`this code has been reloaded ${x} time${x != 1 ? "s" : ""}!`)

// setting x would not adjust persistent since we would just override our reference to persistent.counter
// instead of overriding persistent.counter!
persistent.counter = x + 1;

/*

// never do this! this will break persistent for all modules since you are modifying a global variable!
    
persistent = {}

*/