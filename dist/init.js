"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_json_1 = require("../config.json");
const node_path_1 = require("node:path");
const node_child_process_1 = require("node:child_process");
const promises_1 = __importDefault(require("node:fs/promises"));
const GIT_DIR = (0, node_path_1.resolve)(config_json_1.directoryPath);
if (process.argv.includes('--confirm')) {
    console.error('WARNING: Any changes to your resources will be lost. You can abort in the next 5 seconds.');
    setTimeout(initGitRepos, 5000);
}
else {
    console.error('WARNING: This script will delete all resources in the directory and replace them with a fresh clone from GitHub. Any changes made will be lost.');
    console.log('To confirm you want to run this script, add the `--confirm` flag');
}
async function initGitRepos() {
    console.log('Initializing all repositories located in', GIT_DIR);
    const resources = await promises_1.default.readdir(GIT_DIR);
    for (const resource of resources) {
        if (config_json_1.ignoredResources.includes(resource))
            continue;
        const resourcePath = (0, node_path_1.join)(GIT_DIR, resource);
        if (await hasGitRepo(resourcePath))
            continue;
        await promises_1.default.rm(resourcePath, { recursive: true, force: true });
        await promises_1.default.mkdir(resourcePath);
        await linkResourceRepo(resource, resourcePath);
    }
    console.log('Done!');
}
function linkResourceRepo(resource, resourcePath) {
    return new Promise((res, rej) => {
        console.log(`Linking repo for resource ${resource}...`);
        (0, node_child_process_1.exec)(`cd ${resourcePath} && git clone ${config_json_1.remoteOrgUrl}/${resource} .`, (error, stdout, stderr) => {
            if (error) {
                console.error(`Failed to link repo. Error: ${error}`, true);
                return rej(error);
            }
            console.log(stderr + stdout);
            console.log('Repo linked!');
            res();
        });
    });
}
;
async function hasGitRepo(resourcePath) {
    try {
        const gitFolderPath = (0, node_path_1.join)(resourcePath, '.git');
        await promises_1.default.access(gitFolderPath);
        return true;
    }
    catch (error) {
        return false;
    }
}
