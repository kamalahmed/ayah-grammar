# Static hosting

For a self-contained, illustrated walkthrough, see [How to deploy automatically to Hostinger](how-to-deploy-automatically-to-hostinger.html).

Ayah Grammar runs as a static website. The production build contains the Quran chapters and study data needed by the application; it does not need a running Node.js, Python, MySQL, or SQLite server.

Live site: [ayah.kamalahmed.me](https://ayah.kamalahmed.me/), hosted on Hostinger with HTTPS. The initial production release is `eb430fe`, published September 25, 2026. Its document root is the `public_html/ayah` folder beneath the `kamalahmed.me` hosting domain.

All 1,091 deployed files were verified against the build using SHA-256. Live browser checks confirmed selected-surah loading, all 286 Al-Baqara ayahs, word-study charts, library search and alternate readings, and a 390-pixel mobile layout. Hostinger serves text with Brotli compression, immutable caching for hashed assets, and revalidation for chapter data. Offline behavior was verified separately against the local production preview.

## Build and verify

```sh
npm ci
npm test
npm run build
npm run preview
```

Publish the contents of `dist/`, including its hidden `.htaccess` file, at the root of a dedicated HTTPS subdomain. The app uses root-relative URLs and a root-scoped service worker. A subfolder installation needs separate configuration.

The build excludes the personal `public/books/` folder. Do not upload the source checkout, `data/raw/`, local configuration, or purchased PDFs. Book page citations remain available in the published application. The build also writes `offline-manifest.json`, a list of the public files that the optional offline download must save.

## Automatic Hostinger deployment

The [GitHub Actions workflow](../.github/workflows/deploy-hostinger.yml) runs after pushes to `main` and can also be started manually. It uses the same process as the verified September 25 release: run tests and build; upload `dist/` to a release directory over SSH; compare SHA-256 hashes there; upload files incrementally to the existing `public_html/ayah` document root; verify them; and atomically replace the live `index.html` last. It does not delete old content-hashed assets, which may still be needed by open tabs. A failed build or staging verification leaves the current entry page in place.

The workflow reads the current Node major from [`.nvmrc`](../.nvmrc), requests its latest patch, and uses current `actions/checkout` and `actions/setup-node` releases. Node is used for testing and building on GitHub's runner; the published static site does not run Node on Hostinger.

The Ayah subdomain is separate from the main domain's GitHub deployment. Do not enter the source repository into the subdomain's hPanel **Create a New Repository** form: this site serves the built `dist/` output, and that form requires an empty target directory.

### One-time access setup

Use a dedicated SSH key for this workflow. Keep the private key outside the checkout. Add only its public key to the Hostinger account's `~/.ssh/authorized_keys`, and test that the dedicated key can log in. In Hostinger hPanel, use **SSH Access** to confirm the host, port, user, and the subdomain's actual document root. Verify the server host-key fingerprint using an existing trusted SSH connection before saving its `known_hosts` entry; do not turn off SSH host-key checking.

In the repository's **Settings → Secrets and variables → Actions**, set these repository **secrets**:

| Secret | Value |
| --- | --- |
| `HOSTINGER_DEPLOY_KEY` | The dedicated SSH private key, including its BEGIN/END lines |
| `HOSTINGER_KNOWN_HOSTS` | The verified `known_hosts` line(s) for the SSH host and port |

Set these repository **variables** using the values displayed by Hostinger:

| Variable | Value |
| --- | --- |
| `HOSTINGER_DEPLOY_HOST` | SSH server hostname or IP |
| `HOSTINGER_DEPLOY_USER` | SSH username |
| `HOSTINGER_DEPLOY_PORT` | SSH port |
| `HOSTINGER_DEPLOY_ROOT` | Absolute document root ending in `/domains/<domain>/public_html/ayah` |

GitHub Actions has a `production` environment for this job. If required reviewers are enabled for that environment, deployments wait for review; leave that protection unset when every successful `main` push should publish automatically. Secrets stay in GitHub Actions' encrypted secret store, not in commits, workflow logs, the README, or Hostinger's public web directory. Treat anyone who can edit workflows on `main` as able to use deployment access. Rotate the dedicated key by replacing its server public key and the matching Actions secret.

After setup, push a tested commit to `main` and inspect **Actions → Deploy Ayah Grammar to Hostinger**. For a deliberate repeat without a new commit, use **Run workflow** on that page or `gh workflow run deploy-hostinger.yml -R kamalahmed/ayah-grammar`. Check the run's final `Published and verified <commit>` message, then open the live URL and check a surah and verb study. GitHub's commit being present alone is not proof of a successful deployment.

If a release needs to be rolled back, run the same build and deployment script from the earlier verified commit after reviewing the content changes. Keep release directories outside the web root until no longer needed. A failure after stable chapter files have begun transferring can leave those files newer than the old `index.html`; review data-format changes before releasing them and check the live site after any interrupted publish.

## Hostinger layout and manual fallback

Create a subdomain in hPanel and use the exact document-root folder displayed there. Enable its SSL certificate and HTTPS redirect. Keep the main website's document root separate.

Upload with SFTP/SSH or hPanel File Manager. Stage and check a complete build before switching the subdomain to it. Keep a backup of the previous release outside the public document root. For subsequent releases, retain the previous hashed assets long enough for already-open browser tabs to finish loading their study tools.

The included `.htaccess` configures text compression where supported, long-lived immutable caching for content-hashed assets, and revalidation for stable URLs. `index.html` and `sw.js` must remain revalidated so returning readers receive new releases. Confirm the actual response headers after each hosting configuration change.

## Checks after publishing

- HTTPS loads without certificate warnings and HTTP redirects to HTTPS.
- A fresh visit requests chapter metadata and only the selected surah.
- Choosing a different surah loads that surah and preserves its complete text and meanings.
- Word study, all chart tabs, and the 500-verb library work when opened.
- Before the optional full download, an already-visited surah remains readable offline; an unvisited one gives a recoverable error.
- After **Save for offline use** reports completion, disconnect the network and open an unvisited surah, its word study, the full chart, and the 500-verb library.
- Stable data URLs return usable cache validators; hashed assets use immutable caching; text responses are compressed.
- Mobile reading and study panels fit the viewport.
- Personal PDFs are absent from the deployed directory.

Saved words and reading preferences remain in each browser's local storage. Hosting does not add accounts or cross-device synchronization.

## Offline storage on mobile

There is no live database request. The app loads static chapter JSON, root-specific verb JSON, and deferred interface files only when needed to keep normal visits fast. The service worker saves the shell and content as it is visited. **Display → Offline reading → Save for offline use** explicitly downloads the complete public build into a separate versioned browser cache; the button reports ready only after every file is present. An interrupted download can be resumed, and the previous complete pack is kept until the replacement finishes. Recitation, word audio, external source links, and locally owned book PDFs remain online or local-only features.

The complete build currently needs roughly 45 MB plus browser storage overhead. Keep the PWA open during the download and use a connection you are comfortable using for that amount of data. Browser storage can be cleared or evicted under storage pressure; the app checks the saved files when opened and offers to save them again. On iPhone, a Home Screen web app has storage separate from the Safari tab, so save the pack inside the installed app if that is where it will be used. See [WebKit's storage policy](https://webkit.org/blog/14403/updates-to-storage-policy/) and [Home Screen web app storage behavior](https://webkit.org/blog/14787/webkit-features-in-safari-17-2/).

## Loading measurements

Production-build comparison on September 25, 2026 (Vite output, decimal kB):

| Initial JavaScript | Before | After |
| --- | ---: | ---: |
| Uncompressed | 3,374.14 kB | 246.05 kB |
| Gzip | 370.42 kB | 77.07 kB |

The initial compressed JavaScript is 79.2% smaller. These are file-size measurements, not a promise of a specific loading time on every connection. The 500-verb library remains a separate 95.16 kB gzip download when opened. The 943 root files retain all 19,352 source verb occurrences, including the 54 gender-unmarked dual occurrences.

The production preview was checked for selected-surah network requests, all 286 Al-Baqara ayahs, verb charts, library search and alternate readings, and a 390-pixel mobile viewport. A server-stop test verified cached reading, a recoverable error for an unopened surah, and successful retry after the server returned. The automated suite contains 45 frontend/build/service-worker tests and four source-data tests.
