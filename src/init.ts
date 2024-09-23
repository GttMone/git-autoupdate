import { ignoredResources, directoryPath, remoteOrgUrl } from '../config.json'
import { resolve, join } from 'node:path'
import { exec } from 'node:child_process'
import fs from 'node:fs/promises'

const GIT_DIR = resolve(directoryPath);

if (process.argv.includes('--confirm')) {
    console.error('WARNING: Any changes to your resources will be lost. You can abort in the next 5 seconds.');
    setTimeout(initGitRepos, 5000);
} else {
    console.error('WARNING: This script will delete all resources in the directory and replace them with a fresh clone from GitHub. Any changes made will be lost.');
    console.log('To confirm you want to run this script, add the `--confirm` flag');
}

async function initGitRepos() {
    console.log('Initializing all repositories located in', GIT_DIR);
    
    const resources = await fs.readdir(GIT_DIR);
    for (const resource of resources) {
        if (ignoredResources.includes(resource)) continue;

        const resourcePath = join(GIT_DIR, resource);
        if (await hasGitRepo(resourcePath)) continue;

        await fs.rm(resourcePath, { recursive: true, force: true });
        await fs.mkdir(resourcePath);
        await linkResourceRepo(resource, resourcePath);
    }
    
    console.log('Done!');
}

function linkResourceRepo(resource: string, resourcePath: string): Promise<void> {
    return new Promise((res, rej) => {
        console.log(`Linking repo for resource ${resource}...`);
        exec(`cd ${resourcePath} && git clone ${remoteOrgUrl}/${resource} .`, (error, stdout, stderr) => {
            if (error) {
                console.error(`Failed to link repo. Error: ${error}`, true);
                return rej(error);
            }

            console.log(stderr + stdout);
            console.log('Repo linked!');
            res();
        });
    })
};

async function hasGitRepo(resourcePath: string) {
    try {
        const gitFolderPath = join(resourcePath, '.git');
        await fs.access(gitFolderPath);
        return true;
    } catch (error) {
        return false;
    }
}