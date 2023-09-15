import * as core from '@actions/core';
import { getOctokit } from '@actions/github';
import { getCodeQLCachePath } from './toolcache';

async function run(): Promise<void> {
  try {
    const token = getRequiredInputValue('token');
    const version = core.getInput('version') || 'latest';

    const apiClient = getOctokit(token);
    const path = await getCodeQLCachePath(apiClient, version);
    if (path) {
      core.addPath(path);
      core.setOutput('codeql_path', path);
    }
  } catch (err: any) {
    core.setFailed(err.message);
  }
}

run();

function getRequiredInputValue(key: string): string {
  return core.getInput(key, {required: true});
}