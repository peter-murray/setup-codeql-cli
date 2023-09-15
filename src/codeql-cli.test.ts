import { describe, expect, test } from 'vitest';
import {
  fetchAllVersions,
  fetchBundleVersions,
  getLatestVersion,
  matchBundleVersion
} from './codeql-cli';
import * as github from '@actions/github';
import { fail } from 'assert';


describe('codeql-cli', () => {

  const apiClient = github.getOctokit(process.env.GHEC_TEST_TOKEN || '');

  describe('#fetchBundleVersions', () => {

    test('should obtain a list of versions', async () => {
      const versions = await fetchBundleVersions(apiClient);
      expect(versions.length).toBeGreaterThan(0);
    });
  });

  describe('#matchBundleVersion', () => {

    ['2.14.0', '2.13.5'].forEach((versionNumber) => {

      test(`should return a release when given a valid version ${versionNumber}`, async () => {
        const version = await matchBundleVersion(apiClient, versionNumber);
        expect(version).toBeDefined();
        expect(version?.getTag()).toBe(`codeql-bundle-v${versionNumber}`);
      });

    });

    test(`should fail a release when given an invalid version`, async () => {
      const version = await matchBundleVersion(apiClient, '1.0.6');
      expect(version).toBeUndefined();
    });
  });

  describe('#getOperatingSystemBundle', () => {

    test('should return a release variant for a valid version', async () => {
      const versionNumber = '2.14.0';

      const version = await matchBundleVersion(apiClient, versionNumber);
      expect(version).toBeDefined();
      expect(version?.getTag()).toBe(`codeql-bundle-v${versionNumber}`);

      const url = version?.getOperatingSystemBundle('linux');
      expect(url).toBe(`https://github.com/github/codeql-action/releases/download/codeql-bundle-v${versionNumber}/codeql-bundle-linux64.tar.gz`);
    });
  });

  describe('#getAllBundle', () => {

    test('should return a release variant for a valid version', async () => {
      const versionNumber = '2.14.1';

      const version = await matchBundleVersion(apiClient, versionNumber);
      expect(version).toBeDefined();
      expect(version?.getTag()).toBe(`codeql-bundle-v${versionNumber}`);

      const url = version?.getAllBundle();
      expect(url).toBe(`https://github.com/github/codeql-action/releases/download/codeql-bundle-v${versionNumber}/codeql-bundle.tar.gz`);
    });
  });

  describe('#fetchAllVersions', () => {

    test('should return a array of versions', async () => {
      const versions = await fetchAllVersions(apiClient);

      expect(versions).toBeDefined();
      expect(versions.length).toBeGreaterThan(4);

      expect(versions[0].version).toBeDefined();
      expect(versions[0].prerelease).toBeDefined();
    });
  });

  describe('#getLatestVersion', () => {

    // This is a dodgy test as there will always be more releases, but I need to validate this against the API for now - PM
    test('should return the latest version', async () => {
      const version = await getLatestVersion(apiClient);
      expect(version).toBe('2.14.5');
    });
  });
});