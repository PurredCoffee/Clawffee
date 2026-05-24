# ![Clawffee Logo](https://raw.githubusercontent.com/PurredCoffee/Clawffee/refs/heads/master/assets/clawffee96.png) Clawffee
###### A simple Twitch bot tool for streamers!

## Download

1. Download the latest release from [here](https://github.com/Clawffee/Clawffee/releases).

2. Run `clawffee.exe` (Windows) or `clawffee` (Linux/Mac) in a *preferrably empty* directory.
    > This will create the following directories:
    > - `commands`: This is where you will write your custom scripts and commands.
    > - `plugins`: This is where the required plugins will be downloaded.
    > - `config`: This is where the configuration files will be stored.
    > - `log.txt`: This is the log file where the logs of the previous execution will be stored. **please send this file when reporting bugs!**
4. You will be prompted to download the latest version of required plugins. These will be downloaded to the `plugins` directory.
    > You can also create your own plugins by creating JavaScript files in subdirectories of the `plugins` directory.

    > Agreeing will execute code from the plugins! The default plugins are signed by me to ensure their authenticity
    >
    > Be careful when adding third-party plugins or creating your own plugins, as they execute arbitrary code on your machine.
5. Write your first script in the `commands` directory. By creating a `.js` file!
    > With great power comes great responsibility! Clawffee lets you do whatever you want. This includes causing harm to your machine, Twitch account, or OBS setup if you are not careful. While Clawffee has guard rails, the point is to give you freedom so all of them can be overcome by sheer will.
    >
    > **You are responsible for the code you run in Clawffee!**

## Getting started:

create an empty file called 'hello.js' in the `commands` directory.
> [!IMPORTANT]
> **Ensure that clawffee is running!**

You should see the following code in the file:
```javascript
const { 
    files, server, twurple, 
    twitch_data, obs, persistent, 
    selfClearing, extras 
} = require('../plugins/builtin/index');
console.log('Awoof!')
```
A message saying `Awoof!` should show up in the dashboard console. 
> This means that your script is immediately running!

From here you can play around and see what happens. e.g. if we do
```javascript
setTimeout(() => {
    console.log("Awoof after 5 seconds!");
}, 5000);
```
and save the file we will see the message in the console after 5 seconds.
> (5000 milliseconds = 5 seconds)

> [!TIP]
> alternatively, if we do
> ```javascript
> setInterval(() => {
>     console.log("Awoof every 5 seconds!");
> }, 5000);
> ``` 
> the message is shown every 5 seconds!


### Lets create a simple ping command.
If you want to interact with Twitch, you can use the `twurple` plugin, by default accessible via `twurple` in your scripts.
> [!NOTE]
> Ping command: A command that responds with "Pong!" when a user types "!ping" in Twitch chat.

> [!WARNING]
> After adding an account to clawffee via twurple you will need to edit the `config/twitch.json` file to add the channels you want the bot to connect to.
> **Also remember to restart clawffee after editing the config file!**

you would use it like this:
```javascript
const { twurple } = require('../plugins/builtin/index');
// This should already be at the top of your script but we will import it for clarity and convenience.

twurple.connectedUser.chat.onMessage((channel, user, text, message) => {
    if(text == '!ping') {
        twitch.connectedUser.say(channel, `Pong! ${user}`);
    }
});
```

## Default Features

### Hot-Reloading
> Any changes you make to the scripts in the `commands` directory will be automatically reloaded without needing to restart the bot or affecting the state of other commands.
### Interval and Callback Management
> All intervals and callbacks are automatically managed and will be cleared when the script is reloaded to prevent memory leaks and unintended behavior.

> **For plugin developers**: You are the one responsible for managing this in your plugin, the `internal` plugin provides helpers that will do this for you.
### Plugins
> | Name | Description|
> |-|-|
> |**`twurple`**| Twitch API integration using Twurple.|
> |**`server`**|A simple HTTP server for serving files with an extra object called `sharedServerData` that will automatically keep itself in sync with websites connected to the server, letting you easily send data to and from your website and your scripts.|
> |**`obs`**|OBS WebSocket integration for controlling OBS Studio.|
> |**`files`**|File system utilities for reading and writing files as JSON or INI.|
> |**`persistent`**|Provides persistent storage for data that needs to be saved across script reloads.|
> |**`selfClearing`**|Provides utilities for self-clearing timeouts and intervals.|
> |**`extras`**| Provides various utility functions and helpers.<br>E.g:<br> - `playSound`: A function to play sound files|
### JSON and INI Auto-Saving
> When you write to a JSON file that was read via `require`, it will automatically save the changes to the file. The same applies to INI files.
### Default Overrides
> Some functions and utilities are overridden by default to provide a streamlined experience and to prevent common mistakes, such as accidentally deleting important files or crashing the bot with circular references.
>- **`console`**: Overriden to provide more information about the state of the bot.
>- **`JSON.stringify`**: Overriden to handle circular references without throwing an error.
>- **`alert`**: Overriden to show a notification instead of blocking the terminal.
>- **`confirm`** & **`prompt`**: Overriden to show a popup window instead of blocking the terminal.
>- **loops**: All loops are automatically wrapped in a try-catch block to prevent infinite loops from crashing the bot. If an infinite loop is detected, it will be automatically stopped and a warning message will be logged. (default timeout is longer than the amount of inputs js can theoretically handle)

## Create your own Plugin
To Create your own plugin, create a folder in the `plugins` directory and create a JavaScript file in that folder. The plugin will be automatically loaded when clawffee launches and available for use in your scripts. More information will be available in the [Wiki](https://github.com/Clawffee/Clawffee/wiki)

## Dependencies

- [Bun](https://bun.com/) - JavaScript runtime used to build Clawffee
- [Twurple](https://twurple.js.org/) - Twitch API library
- [ini](https://npmjs.com/package/ini) - INI file parser
- [tar-stream](https://npmjs.com/package/tar-stream) - Tar file parser

## Manual Build Instructions

1. Clone the repository:
   ```bash
   git clone https://github.com/PurredCoffee/Clawffee.git
   cd Clawffee
    ```
2. Install dependencies:
    ```bash
    bun install --frozen-lockfile
    ```
3. *(Optionally)* Checkout clawffee plugins
    ```bash
    git submodule init
    git submodule update
    bun install --frozen-lockfile --cwd ./plugins/builtin
    bun install --frozen-lockfile --cwd ./plugins/internal
    bun install --frozen-lockfile --cwd ./plugins/twurple
    ```
3. Start the bot:
    ```bash
    # run in current directory (requires clawffee plugins)
    bun launch.js
    # run in default config directory
    bun launch.js -- --xdg
    ```

### Signing
To be able to build clawffee you will need to build the internal plugin.

4. Use the `hash.js` script to generate a hash of the plugin:
   ```bash
   bun hash.js -f internal
   ```
   You will then enter the hashing helper which should guide you through signing the plugin.
5. You can now run clawffee with hash verification enabled by running
    ```bash
    bun index.js
    ```
6. To build clawffee you can use bun's built-in packaging tool:
    ```bash
    bun build index.js --compile --outfile clawffee 
    ```

## Nix

This project is providing [a nix flake](https://nixos.wiki/wiki/flakes) for clawffee.

### Running Clawffee from GitHub

To run clawffee directly from this repository:

```bash
# show the usage
nix run github:Clawffee/Clawffee -- --help
# run in default config directory
nix run github:Clawffee/Clawffee -- --xdg
# run in current directory
nix run github:Clawffee/Clawffee
```

### Installation

To install clawffee by using a [flake based](https://nixos.wiki/wiki/flakes) NixOS or home-manager configuration:

Add the following to your `flake.nix` file:

```nix
inputs.clawffee.url = "github:Clawffee/Clawffee";
inputs.clawffee.inputs.nixpkgs.follows = "nixpkgs";
```

For a home-manager based nix flake add this to your home-manager modules:

```nix
{
    imports = [
        inputs.clawffee.homeModules.default
    ];

    programs.clawffee.enable = true;
}
```

For a NixOS based nix flake add this to your NixOS:

```nix
{
    imports = [
        inputs.clawffee.nixosModules.default
    ];

    programs.clawffee.enable = true;
}
```

You can also access the following directly:

- the overlay adding `clawffee` to you packages: `inputs.clawffee.overlays.default` (this uses your packages to build clawffee)
- the package itself: `inputs.clawffee.packages.${system}.default` (this uses the packages proxided by this flakes nixpkgs to build clawffee)

### Development

To run clawffee during development just run
```bash
nix develop
```
after step (1) and before step (2) of the [Manual Build Instructions](#manual-build-instructions).

This will setup your environment to include the `bun` runtime as well as other environment variables to both be able to develop and run a develop build.

Instead of `bun launch.js` you may use the `clawffee-dev` bash alias that is automatically set up for you.

Useful commands:
- `type clawffee-dev` - Show the bash alias.
- `clawffee-dev --help` - Show the usage of `clawffee-dev`.
- `clawffee-dev` - Run clawffee within the current working directory.
- `clawffee-dev --xdg` - Run clawffee within the default clawffee config directory. See the usage of `clawffee-dev`. for details. This is useful for testing the development build of the clawffee launcher together with the currently released clawffee plugins.
- `nix flake update --commit-lock-file` - Update the nix dependencies and commit the new `flake.lock` lock file.
- `nix fmt` - Format all `*.nix` files.
- `nix run .` - Run the production build of clawffee from the current source code. Note that all files need to be committed or staged into git for this to work correctly.

#### Update nix/bun.nix

The file `nix/bun.nix` contains all bun dependencies that are needed to build the nix package.
This file should be updated after `package.json` or `bun.lock` was changed.
To do so:
```
nix develop --command bun2nix -o nix/bun.nix
```
