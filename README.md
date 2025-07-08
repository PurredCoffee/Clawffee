# ![Clawffee Logo](https://raw.githubusercontent.com/PurredCoffee/Clawffee/refs/heads/master/assets/clawffee96.png) Clawffee

A simple Twitch bot tool for streamers!

## Download

1. Download the latest release from [here](https://github.com/PurredCoffee/Clawffee/releases).

2. Extract the zip and run `run.bat` (Windows) or `run.sh` (Linux/Mac) to start the bot.

3. Use the dashboard to authenticate a bot account.

4. Write your first script in the `commands` directory. For example, create a file named `hello.js` with the following content:
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
- **Cross-Platform**: Works on any platform that supports Node.js.
- **Multi-Channel Support**: Manage multiple Twitch channels from a single instance.
- **Integration**: Connect with other services like Discord, Twitter, etc.
- **API Access**: Create bot features accessible via a REST API.


## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/PurredCoffee/Clawffee.git
   cd Clawffee
    ```

2. Install dependencies:
    ```bash
    npm install
    ```

3. Start the bot:
    ```bash
    node index.js
    ```

4. (Optional) Open the dashboard by opening `html/dashboard.html` in your web browser to authenticate a bot account.