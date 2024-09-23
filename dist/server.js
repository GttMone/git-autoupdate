"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_json_1 = require("../config.json");
const node_path_1 = require("node:path");
const node_child_process_1 = require("node:child_process");
const promises_1 = __importDefault(require("node:fs/promises"));
const node_cron_1 = __importDefault(require("node-cron"));
const builders_1 = require("@discordjs/builders");
const axios_1 = __importDefault(require("axios"));
const LOG_FILE = (0, node_path_1.resolve)(config_json_1.logging.out.file);
const ERR_LOG_FILE = (0, node_path_1.resolve)(config_json_1.logging.error.file);
const GIT_DIR = (0, node_path_1.resolve)(config_json_1.directoryPath);
node_cron_1.default.schedule(config_json_1.schedule.cronExpression, updateResources, {
    name: 'gitAutoUpdate',
    runOnInit: config_json_1.updateOnStart,
    timezone: config_json_1.schedule.timezone
});
async function updateResources() {
    createLog('Updating all resources...', 'log', { consoleOutput: true, seperate: true });
    const resources = await promises_1.default.readdir(GIT_DIR);
    let updatedResources = 0;
    for (const resource of resources) {
        if (config_json_1.ignoredResources.includes(resource))
            continue;
        const resourcePath = (0, node_path_1.join)(GIT_DIR, resource);
        if (!await hasGitRepo(resourcePath))
            continue;
        try {
            createLog(`Syncing changes for ${resource}...`, 'log', { seperate: true });
            await syncResourceChanges(resourcePath);
            updatedResources++;
        }
        catch (error) {
            continue;
        }
    }
    ;
    createLog('Done!', 'log', { consoleOutput: true });
    if (config_json_1.logging.out.webhook.enabled) {
        try {
            await sendDiscordWebhook(config_json_1.logging.out.webhook.url, 'log', `Updated (${updatedResources}/${resources.length}) resources.`, config_json_1.logging.out.webhook.content);
        }
        catch (error) {
            createLog(`Failed posting to Discord webhook.\n${error}`, 'error', { consoleOutput: true });
        }
    }
    if (config_json_1.pushEndpoint) {
        try {
            axios_1.default.post(config_json_1.pushEndpoint);
        }
        catch (error) {
            createLog(`Failed posting to push endpoint.\n${error}`, 'error', { consoleOutput: true });
        }
    }
}
function syncResourceChanges(resourcePath) {
    return new Promise((res, rej) => {
        (0, node_child_process_1.exec)(`cd ${resourcePath} && git pull`, (error, stdout, stderr) => {
            if (error) {
                createLog(`Failed to sync changes.\n${error}`, 'error', { consoleOutput: true });
                return rej(error);
            }
            const log = stderr + stdout;
            const isError = log.includes('error:');
            if (isError) {
                createLog(log, 'error');
                rej(log);
                return;
            }
            createLog(log);
            createLog('Changes synced!');
            res();
        });
    });
}
async function createLog(log, type = 'log', options = {}) {
    const timestamp = getTimestamp();
    const formattedLog = `${options.seperate ? '\n\n\n' : ''}[${timestamp}] ${log}\n`;
    if (options.consoleOutput || !config_json_1.logging.enabled)
        console[type](formattedLog);
    if (!config_json_1.logging.enabled)
        return;
    try {
        promises_1.default.appendFile(LOG_FILE, formattedLog);
        if (type !== 'error')
            return;
        promises_1.default.appendFile(ERR_LOG_FILE, formattedLog);
        if (!config_json_1.logging.error.webhook.enabled)
            return;
        await sendDiscordWebhook(config_json_1.logging.error.webhook.url, 'error', log, config_json_1.logging.error.webhook.content);
    }
    catch (error) {
        console.error(timestamp, 'Failed writing log:', log);
    }
}
async function sendDiscordWebhook(url, type, log, content) {
    const embed = new builders_1.EmbedBuilder()
        .setAuthor({ name: 'git-autoupdate', url: 'https://github.com/GttMone/git-autoupdate' })
        .setTitle(`New ${type === 'error' ? 'error ' : ''}log`)
        .setDescription('```' + log + '```')
        .setColor(type === 'error' ? 0xE74C3C : 0x5DADE2)
        .setTimestamp()
        .setFooter({ text: 'Created by GitHub.com/GttMone', iconURL: 'https://avatars.githubusercontent.com/u/66485019' });
    await axios_1.default.post(url, { content, embeds: [embed.toJSON()] });
}
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
function getTimestamp() {
    return new Date().toLocaleString(undefined, { timeZone: config_json_1.schedule.timezone });
}
