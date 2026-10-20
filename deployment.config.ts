/**
 * Everything that depends on who owns and hosts the site, in one place.
 *
 * The defaults are for the temporary setup on Bent's GitHub account. When the
 * site moves to the scouts' GitHub organization, change the defaults here (or
 * set the matching environment variables in the deploy workflow). See
 * docs/TECHNISCH.md, "Verhuis naar de organisatie".
 */

const env = (name: string): string | undefined => {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
};

export const deployment = {
  /** GitHub repository (`owner/repo`) that the CMS reads from and commits to. */
  repo: env('CMS_REPO') ?? 'BentJ-01/scoutsvosselaar',
  /** Branch the CMS commits to and the site is built from. */
  branch: env('CMS_BRANCH') ?? 'main',
  /** Public origin of the site, without trailing slash. */
  siteUrl: env('SITE_URL') ?? 'https://bentj-01.github.io',
  /**
   * Path the site lives under. `/scoutsvosselaar` on `<user>.github.io`,
   * `/` once the own domain is connected.
   */
  basePath: env('BASE_PATH') ?? '/scoutsvosselaar',
  /**
   * URL of the `sveltia-cms-auth` Cloudflare Worker that handles the GitHub
   * login. Leave empty until the Worker exists: the CMS then only offers
   * signing in with a personal access token and, on localhost, working with a
   * local repository.
   */
  cmsAuthUrl: env('CMS_AUTH_URL') ?? '',
} as const;

export type Deployment = typeof deployment;
