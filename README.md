# Automatically sync GitHub organization repositories changes to local machine.

# Installation
1. Download [Node.JS LTS](https://nodejs.org/)
2. Open a terminal and cd into your desired directory
3. Download a zip archive of the code or clone it using:
```bash
git clone https://github.com/GttMone/git-autoupdate .
```
4. To install dependencies, run the following command in the same directory:
```bash
npm i
```

# Program Configuration
- Navigate to config.json
- All fields are required unless otherwise stated. You can leave optional fields an empty string ""
- Modify to your liking, here are the options explained:
```json
{
    "ignoredResources": ["my-resource"], // Put resources you'd like to be ignored.
    "directoryPath": "/root/FXServer/txData/QboxProject_...base/resources/[qbx]", // Put the parent directory of all the resources that shall be auto updated.
    "remoteOrgUrl": "https://github.com/Qbox-project", // Organization URL on GitHub, that all resource repos will be linked to. NOTE: DO NOT LEAVE A "/" AT THE END!
    "updateOnStart": true, // Whether all resources should be updated on program start/restart. (Recommended)
    "schedule": {
        "cronExpression": "0 * * * *", // How often the program should check for updates in the format of a CRON expression. (Default: every whole hour)
        "timezone": "" // Used for timestamps, use the following format: https://www.iana.org/time-zones
    },
    "logging": {
        "enabled": true, // Whether logging is enabled. If set to false, everything below is ignored.
        "out": { // Out/normal logs
            "file": "./out.log", // Can be relative or absolute path
            "webhook": { // Send logs to a Discord webhook
                "enabled": false,
                "url": "", // Put the Discord webhook here https://support.discord.com/hc/en-us/articles/228383668-Intro-to-Webhooks
                "content": "" // Content, outside of the embed. You can make it ping a user/role using: <@ROLE-OR-USER-ID> or @everyone (optional)
            }
        },
        "error": { // Error logs
            "file": "./error.log", // Can be relative or absolute path
            "webhook": { // Send logs to a Discord webhook
                "enabled": true,
                "url": "https://discord.com/api/webhooks/...", // Put the Discord webhook here https://support.discord.com/hc/en-us/articles/228383668-Intro-to-Webhooks
                "content": "<@1010110011001010010>" // Content, outside of the embed. You can make it ping a user/role using: <@ROLE-OR-USER-ID> or @everyone (optional)
            }
        }
    },
    "pushEndpoint": "http://localhost:3000/push" // When all resources are updated, sends a POST request to this endpoint with no body. (optional)
}
```

# Initial setup
## WARNING: This script will remove all resources in the configured path and replace them with a fresh cloned version from GitHub.
### All changes will be lost, so please make a copy of anything you want to keep.

1. Run:
```bash
npm run init--confirm
```


# Running the program
### After you've done all the steps above, you can use the following command to run the program:
```bash
npm start
```
### And if you'd like to keep the program running in the background and automatically restart, I suggest you download [PM2 - Process Manager For Node.JS](https://pm2.keymetrics.io/)
### After you've downloaded PM2, run in the same directory:
```bash
pm2 start dist/server.js --name git-autoupdate
```
