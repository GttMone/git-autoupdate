import { ignoredResources, directoryPath, updateOnStart, logging, schedule, pushEndpoint } from '../config.json'
import { resolve, join } from 'node:path'
import { exec } from 'node:child_process'
import fs from 'node:fs/promises'
import cron from 'node-cron'
import { EmbedBuilder } from '@discordjs/builders'
import axios from 'axios'

const LOG_FILE = resolve(logging.out.file);
const ERR_LOG_FILE = resolve(logging.error.file);
const GIT_DIR = resolve(directoryPath);

cron.schedule(schedule.cronExpression, updateResources, {
    name: 'gitAutoUpdate',
    runOnInit: updateOnStart,
    timezone: schedule.timezone
});

async function updateResources() {
    createLog('Updating all resources...', 'log', { consoleOutput: true, seperate: true });

    const resources = await fs.readdir(GIT_DIR);
    let updatedResources = 0;

    for (const resource of resources) {
        if (ignoredResources.includes(resource)) continue;

        const resourcePath = join(GIT_DIR, resource);
        if (!await hasGitRepo(resourcePath)) continue;

        try {
            createLog(`Syncing changes for ${resource}...`, 'log', { seperate: true });
            await syncResourceChanges(resourcePath);
            updatedResources++;
        } catch (error) { continue }
    };

    createLog('Done!', 'log', { consoleOutput: true });

    if (logging.out.webhook.enabled) {
        try {
            await sendDiscordWebhook(logging.out.webhook.url, 'log', `Updated (${updatedResources}/${resources.length}) resources.`, logging.out.webhook.content);
        } catch (error) {
            createLog(`Failed posting to Discord webhook.\n${error}`, 'error', { consoleOutput: true });
        }
    }

    if (pushEndpoint) {
        try {
            axios.post(pushEndpoint);
        } catch (error) {
            createLog(`Failed posting to push endpoint.\n${error}`, 'error', { consoleOutput: true });
        }
    }
}

function syncResourceChanges(resourcePath: string): Promise<void> {
    return new Promise((res, rej) => {
        exec(`cd ${resourcePath} && git pull`, (error, stdout, stderr) => {
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
async function createLog(log: string, type: 'error' | 'log' = 'log', options: { consoleOutput?: boolean, seperate?: boolean } = {}) {
    const timestamp = getTimestamp();
    const formattedLog = `${options.seperate ? '\n\n\n' : ''}[${timestamp}] ${log}\n`

    if (options.consoleOutput) console[type](formattedLog);
    if (!logging.enabled) return;

    try {
        fs.appendFile(LOG_FILE, formattedLog);

        if (type !== 'error') return;
        fs.appendFile(ERR_LOG_FILE, formattedLog);

        if (!logging.error.webhook.enabled) return;
        await sendDiscordWebhook(logging.error.webhook.url, 'error', log, logging.error.webhook.content);
    } catch (error) {
        console.error(timestamp, 'Failed writing log:', log);
    }
}

async function sendDiscordWebhook(url: string, type: 'error' | 'log', log: string, content: string) {
    const embed = new EmbedBuilder()
        .setAuthor({ name: 'git-autoupdate', url: 'https://github.com/GttMone/git-autoupdate' })
        .setTitle(`New ${type === 'error' ? 'error ' : ''}log`)
        .setDescription('```' + log + '```')
        .setColor(type === 'error' ? 0xE74C3C : 0x5DADE2)
        .setTimestamp()
        .setFooter({ text: 'Created by GitHub.com/GttMone', iconURL: 'https://avatars.githubusercontent.com/u/66485019' });

    await axios.post(url, { content, embeds: [embed.toJSON()] });
}

async function hasGitRepo(resourcePath: string) {
    try {
        const gitFolderPath = join(resourcePath, '.git');
        await fs.access(gitFolderPath);
        return true;
    } catch (error) {
        return false;
    }
}

function getTimestamp() {
    return new Date().toLocaleString(undefined, { timeZone: schedule.timezone });
}
