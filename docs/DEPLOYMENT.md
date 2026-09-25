# Static hosting

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

The build excludes the personal `public/books/` folder. Do not upload the source checkout, `data/raw/`, local configuration, or purchased PDFs. Book page citations remain available in the published application.

## Hostinger

Create a subdomain in hPanel and use the exact document-root folder displayed there. Enable its SSL certificate and HTTPS redirect. Keep the main website's document root separate.

Upload with SFTP/SSH or hPanel File Manager. Stage and check a complete build before switching the subdomain to it. Keep a backup of the previous release outside the public document root. For subsequent releases, retain the previous hashed assets long enough for already-open browser tabs to finish loading their study tools.

The included `.htaccess` configures text compression where supported, long-lived immutable caching for content-hashed assets, and revalidation for stable URLs. `index.html` and `sw.js` must remain revalidated so returning readers receive new releases. Confirm the actual response headers after each hosting configuration change.

## Checks after publishing

- HTTPS loads without certificate warnings and HTTP redirects to HTTPS.
- A fresh visit requests chapter metadata and only the selected surah.
- Choosing a different surah loads that surah and preserves its complete text and meanings.
- Word study, all chart tabs, and the 500-verb library work when opened.
- An already-visited surah remains readable offline; an unvisited one gives a recoverable error.
- Stable data URLs return usable cache validators; hashed assets use immutable caching; text responses are compressed.
- Mobile reading and study panels fit the viewport.
- Personal PDFs are absent from the deployed directory.

Saved words and reading preferences remain in each browser's local storage. Hosting does not add accounts or cross-device synchronization.

## Loading measurements

Production-build comparison on September 25, 2026 (Vite output, decimal kB):

| Initial JavaScript | Before | After |
| --- | ---: | ---: |
| Uncompressed | 3,374.14 kB | 246.05 kB |
| Gzip | 370.42 kB | 77.07 kB |

The initial compressed JavaScript is 79.2% smaller. These are file-size measurements, not a promise of a specific loading time on every connection. The 500-verb library remains a separate 95.16 kB gzip download when opened. The 943 root files retain all 19,352 source verb occurrences, including the 54 gender-unmarked dual occurrences.

The production preview was checked for selected-surah network requests, all 286 Al-Baqara ayahs, verb charts, library search and alternate readings, and a 390-pixel mobile viewport. A server-stop test verified cached reading, a recoverable error for an unopened surah, and successful retry after the server returned. The automated suite contains 45 frontend/build/service-worker tests and four source-data tests.
