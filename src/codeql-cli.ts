import * as semver from 'semver';

const RELEASE_BUNDLE_REGEX = /codeql-bundle-v(.*)/;
const RELEASE_BUNDLE_VARIANT_REGEX = /codeql-bundle-(linux|win|osx)(64).tar.gz/;
const RELEASE_BUNDLE_ALL_REGEX = /codeql-bundle.tar.gz/;

export type ReleaseVersion = {
  version: string,
  prerelease: boolean
}

export async function fetchBundleVersions(apiClient: any): Promise<Release []> {
  const allReleases = await apiClient.paginate({
    method: 'GET',
    url: '/repos/{owner}/{repo}/releases',
    owner: 'github',
    repo: 'codeql-action'
  });

  // We only want the latest release bundles that are now versioned as semver with the leading 'v'
  const filteredReleases = allReleases.filter((release) => {
    return release.tag_name.match(RELEASE_BUNDLE_REGEX);
  });

  return filteredReleases.map((release) => {
    return new Release(release);
  });
}

export async function matchBundleVersion(apiClient: any, version: string): Promise<Release | undefined> {
  const releases = await fetchBundleVersions(apiClient);

  const matchedRelease = releases.find((release) => {
    return release.getVersion() === version;
  });

  return matchedRelease;
}

export async function fetchAllVersions(apiClient: any, allowPrerelease: boolean = false): Promise<ReleaseVersion[]> {
  const releases = await fetchBundleVersions(apiClient);

  const allVersions: ReleaseVersion[] = releases.reduce((versions: ReleaseVersion[], release: Release) => {
    const version = release.getVersion();
    if (version) {
      if (allowPrerelease) {
        versions.push({
          version: version,
          prerelease: release.isPreRelease()
        });
      } else if (!release.isPreRelease()) {
        versions.push({
          version: version,
          prerelease: false
        });
      }
    }
    return versions;
  }, []);

  return allVersions;
}

export async function getLatestVersion(apiClient: any, allowPrerelease: boolean = false) {
  const allVersions = await fetchAllVersions(apiClient, allowPrerelease);
  const allVersionNumbers = allVersions.map((version) => {return version?.version});
  return semver.maxSatisfying(allVersionNumbers, '*');
}


class Release {
  private _data: any;

  constructor(release) {
    this._data = release;
  }

  getTag(): string {
    return this._data.tag_name;
  }

  getVersion(): string | null {
    const matched = RELEASE_BUNDLE_REGEX.exec(this.getTag());
    return matched ? matched[1] : null;
  }

  getOperatingSystemBundle(os: string, platform: string = '64'): string | undefined {
    const matchedAsset = this._data.assets.find((asset) => {
      const matched = RELEASE_BUNDLE_VARIANT_REGEX.exec(asset.name);
      return matched && matched[1] === os && matched[2] === platform;
    });
    return matchedAsset.browser_download_url;
  }

  getAllBundle(): string | undefined {
    const matchedAsset = this._data.assets.find((asset) => {
      const matched = RELEASE_BUNDLE_ALL_REGEX.exec(asset.name);
      return matched;
    });
    return matchedAsset.browser_download_url;
  }

  isPreRelease(): boolean {
    return this._data.prerelease;
  }
}