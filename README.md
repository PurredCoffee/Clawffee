# ![Clawffee Logo](https://raw.githubusercontent.com/PurredCoffee/Clawffee/refs/heads/master/assets/clawffee96.png) Clawffee

A simple Twitch bot tool for streamers!


## Download

1. Download the latest release from [here](https://github.com/PurredCoffee/Clawffee/releases).

2. Extract the zip and run `clawffee.exe` (Windows) or `clawffee` (Linux/Mac) to start the bot.

3. Use the dashboard (at `html/dashboard.html`) to authenticate your account for use with clawffee.

4. Write your first script in the `commands` directory. 
    1. For example, create a file named `hello.js` with the following content:
        ```javascript
        console.log("hello");
        ```
        save the file and you will notice a hello pop up in the console!

    2. From here you can play around and see what happens. e.g. if we do
        ```javascript
        setTimeout(() => {
            console.log("hello");
        }, 5000);
        ```
        and save the file we will be able to see "hello" show up after 5 seconds (5000 miliseconds)

    3. With a slight adjustment
        ```javascript
        setInterval(() => {
            console.log("hello");
        }, 5000);
        ``` 
        "hello" is shown every 5 seconds!

    4. If you have an account tied to clawffee you can use
        ```javascript
        const { twitch } = require('#helpers');
        ```
        to get access to twitch related commands 

        you would use them like this:
        ```javascript
        const { twitch } = require('#helpers');

        twitch.connectedUser.chat.onMessage((channel, user, text, message) => {
            if(text == '!hello') {
                twitch.connectedUser.say(channel, `Hello, ${user}!`);
            }
        });
        ```

Check the `commands/examples` directory for more examples of how to create commands and scripts.


## Features

- **Custom Scripts**: Write your own scripts to create and extend functionality.
- **User-Friendly**: Designed to be easy to use for both streamers and viewers. As long as you understand basic JavaScript, you can create custom commands and scripts with no extra thought.
- **Real-Time Updates**: Changes take effect immediately without needing to restart the bot.
- **Dashboard**: A web-based dashboard for managing the bot and viewing logs.
- **Cross-Platform**: Works on any platform that supports Node.js.
- **Multi-Channel Support**: Manage multiple Twitch channels from a single instance.
- **Integration**: Connect with other services like Discord, Twitter, etc.
- **API Access**: Create bot features accessible via a REST API.


## Usage

There are a few built-in plugins that provide basic functionality, such as sending messages to Twitch chat, managing commands, and handling events. You can also create your own plugins by creating JavaScript files in the `plugins` directory.

Built-in plugins include:

- **Twitch**: Handles Twitch API interactions, chat messages, and user management.
    ```javascript
    const { twitch } = require('#helpers');
    twitch.connectedUser.chat.onMessage((channel, user, text, message) => {
        if(text === '!hello') {
            twitch.connectedUser.say(channel, `Hello, ${user}!`);
        }
    });

    setInterval(() => {
        // Send a message to the channel every 5 minutes
        twitch.connectedUser.say('#your_channel', 'This is a scheduled message!');
    }, 5 * 60 * 1000);
    ```

- **OBS**: Provides OBS WebSocket integration for controlling OBS Studio.
    ```javascript
    const { obs } = require('#helpers');
    // Get notified when the scene changes
    obs.connectedUser.on('SceneChanged', (sceneName) => {
        console.log(`Switched to scene: ${sceneName}`);
    });
    // Change the current scene in OBS
    obs.connectedUser.setCurrentScene('MyScene');
    ```

- **Files**: Provides file system utilities for reading and writing files.
    ```javascript
    const { files } = require('#helpers');

    let data = files.autoSavedJSON('data.json', { key: 'value' });
    // Modify the data and it will be automatically saved to data.json
    data.key = 'new value';
    // same approach for INI files
    let iniData = files.autoSavedINI('config.ini', { section: { key: 'value' } });
    ```

- **Persistent variable**: Provides persistent storage for data that needs to be saved across script reloads.
    ```javascript
    const x = persistent.counter;
    console.log(`this code has been reloaded ${x} time${x != 1 ? "s" : ""}!`)
    // Increment the counter and save it
    persistent.counter = x + 1;
    ```

- **Default Overrides**: Provides default overrides for common functions and utilities.
    ```javascript
    console.log('This is overriden to also print to the dashboard!');

    let circularReference = {};
    circularReference.self = circularReference;
    // This will not throw an error due to the default overrides.
    JSON.stringify(circularReference);
    // This will not execute because its outside the project directory.
    require('node:fs').rmSync('C://system32/');
    // !!! This does not mean that you cannot delete system32 !!!
    //        you just cannot do it with common functions!
    ```

- **Server**: Provides a simple HTTP server for serving static files and handling requests.
    ```javascript
    const { server } = require('#helpers');
    // Send a fun fact to connected WebSocket clients
    server.sharedServerData.funFact = "Did you know that Clawffee is a play on words combining 'claw' and 'coffee'? It just sounded cute!";
    // Register a REST API to get the fun fact
    server.setFunction('/getFunFact', (searchParams, res) => res.write(sharedServerData.funFact)); 
    ```

### Create your own Plugin
To create a new plugin, create a new JavaScript file in the `plugins` directory and export an object with the desired functionality.

To reload plugins that depend on your plugin, you can use the `reloadPlugin` function from the `builtin/internal/ClawCallbacks` plugin. This allows you to dynamically reload commands once your plugin is ready. Here's an example of how to do this in your script:
```javascript
const { clawCallbacks: { reloadPlugin } } = require('../internal/internal);
// Reload all plugins and scripts
reloadPlugin(__filename);
```


## Dependencies

- [Node.js](https://nodejs.org/) (v16.0.0 or higher)
- [Twurple](https://twurple.js.org/) - Twitch API library
- [obs-websocket-js](https://npmjs.com/package/obs-websocket-js) - OBS WebSocket library
- [ini](https://npmjs.com/package/ini) - INI file parser


## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/PurredCoffee/Clawffee.git
   cd Clawffee
    ```

2. Install dependencies:
    ```bash
    bun install
    ```

3. Start the bot:
    ```bash
    bun index.js
    ```

4. (Optional) Open the dashboard by opening `html/dashboard.html` in your web browser to authenticate a bot account.