if(process.argv.includes('--verbose'))
    require('./internal/verbose');

// TEMP
globalThis.clawffee = {
    sharedServerData: {
        internal: {}
    },
    serverFunctions: {

    }
}
require('./internal/ConsoleOverrides');
require('./internal/pluginLoader');

// Global error handlers
process.on('uncaughtException', (err) => {
    console.error("Uncaught Error!", err);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error("Unhandled Rejection!", "reason:", reason);
});
process.on('uncaughtExceptionMonitor', (err, origin) => {
    console.error("Uncaught Exception!", err);
});
process.on('multipleResolves', (type, promise, reason) => {
    console.error("Multiple Resolves!", type, reason);
});

const {runCommands} = require('./internal/JSRunManager');
runCommands('./commands');