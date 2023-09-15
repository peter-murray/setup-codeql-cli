import * as os from 'os';

import * as tc from '@actions/tool-cache';
import * as codeqlCli from './codeql-cli';

const TOOLCACHE_CODEQL_NAME = 'CodeQL';


export async function getCodeQLCachePath(apiClient: any, version: string, arch: string = 'x64') {
  let codeqlBundleVersion: string | undefined = undefined;

  if (version === 'latest') {
    // We need to find the latest version
    codeqlBundleVersion = await codeqlCli.getLatestVersion(apiClient);
  } else {
    codeqlBundleVersion = version;
  }

  if (codeqlBundleVersion === undefined) {
    throw new Error(`Failed to resolve a CodeQL bundle version for ${version}`);
  }

  let versionPath = tc.find(TOOLCACHE_CODEQL_NAME, codeqlBundleVersion, arch);
  if (!versionPath) {
    const release = await codeqlCli.matchBundleVersion(apiClient, codeqlBundleVersion);
    if (release === undefined) {
      throw new Error(`Unable to resolve a released CodeQL bundle for ${codeqlBundleVersion}`);
    }

    // ignore arch for now as it only support x64, but the versions use '64', so it would need extra processing on the arch if passed
    const url = release.getOperatingSystemBundle(os.platform());
    if (url === undefined) {
      throw new Error(`Unable to resolve a CodeQL bundle for ${codeqlBundleVersion} on ${os.platform()}`);
    }

    const codeqlBundlePath = await tc.downloadTool(url);
    const extractedBundleDirectory = await tc.extractTar(codeqlBundlePath);

    // Cache the bundle for future use
    const cachedBundleDirectory = await tc.cacheDir(extractedBundleDirectory, TOOLCACHE_CODEQL_NAME, codeqlBundleVersion, arch);

    versionPath = cachedBundleDirectory;
  }

  return versionPath;
}