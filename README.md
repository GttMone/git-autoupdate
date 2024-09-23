# Automatically sync GitHub organization repositories changes to local machine.

## Installation
1. Download [Node.JS LTS](https://nodejs.org/)
2. Open a terminal and cd into your desired directory
3. Download a zip archive of the code or clone it using:
```bash
git clone https://github.com/GttMone/git-autoupdate .
```
4. To install dependencies, run the following command in the same directory:
```
npm i
```

## Initial Configuration
# WARNING: This script will remove all resources in the desired path and replace them with a fresh cloned version from GitHub.
### All changes will be lost, so please make a copy of anything you want to keep.

1. Run:
```
npm run init--confirm
```

## Program Configuration
- Navigate to config.json
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
                "content": "" // Content, outside of the embed. You can put make it ping a user/role using: <@ROLE-OR-USER-ID>
            }
        },
        "error": { // Error logs
            "file": "./error.log", // Can be relative or absolute path
            "webhook": { // Send logs to a Discord webhook
                "enabled": true,
                "url": "https://discord.com/api/webhooks/...", // Put the Discord webhook here https://support.discord.com/hc/en-us/articles/228383668-Intro-to-Webhooks
                "content": "<@1010110011001010010>" // Content, outside of the embed. You can put make it ping a user/role using: <@ROLE-OR-USER-ID>
            }
        }
    },
    "pushEndpoint": "http://localhost:3000/push" // When all resources are updated, sends a POST request to this endpoint with no body.
}
```