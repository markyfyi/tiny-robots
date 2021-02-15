Tiny Robots is a frontend build system and microframework for [Svelte](https://svelte.dev/) designed for developer joy.

_Check out the code for this site [here](https://github.com/mkshio/tiny-robots/tree/master/example)._

### Features

- 🔥 Ultrafast hot module replacement. Tiny Robots runs on [Snowpack](https://www.snowpack.dev/) in development, so hot updates stay fast no matter how large your app gets.
- Hightly configurable universal data fetching. Routes can be eager or deferred.
- Static site generation with dynaic data loading. Just do `yarn run tr export`.
- Client side routing.
- Filesystem-based routing, with directory-based layouts and global app layout.
- Global CSS/JS support. Just create a `global` directory and it's contents will by inlined into every page.
- Markdown in your Svelte with [mdsvex](https://mdsvex.com/).

## Install

```shell
yarn add tiny-robots # or npm install tiny-robots
mkdir routes # application routes go here
mkdir static # static assets go here
mkdir global # global css/js goes here
touch index.html # HTML shell goes here
```

## Develop

```shell
yarn run tr
```

Runs your app with [Snowpack](https://www.snowpack.dev/).

## Ship

```shell
yarn run tr export
```

Generates static HTML pages and a client JS bundle with [Rollup](https://rollupjs.org/guide/en/).

Adding `--dev` will produce a build for easier diagnostice, right now it just generates an unminified bundle, but more features may be added under the flag in the future.

## Developer zone 🛠

#### WIP

- HTML shell improvements.
  - Make the HTML shell optional (use a deafult one in the lib).
  - Make magic comments optional (just inject content in head/body).
- Error pages.
- Plain 'ol js pages.
  - With jsdom support for prerendering.

#### Coming soon

- Live-reload on global CSS and JS changes.
- TypeScript.
- Route asset preloads on page transition.
  - Look at hrefs to other pages.
- More HTML features.
  - Partials.
  - Merge head/body with template/layouts.
- Query params and other context in prefetch.
- Image preloads.
  - Add images to manifest.
- "Get static routes" capability.
- Generators for Netlify/Vercel/etc.
  - "Deploy on X" buttons.
  - Slugs, catchall routes and URL rewrites.
  - Abstraction for lambdas.
- SEO defaults.
  - Meta tags.
  - Social cards.
  - Sitemaps.
- PWA/service worker.
- Per-component rehydration opt-out (i.e. server-only components).
- SSR mode.
  - Vercel runtime integration.
  - Server hooks.
- Better CSS extraction.
- Support for React pages.
