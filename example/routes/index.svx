Tiny Robots is a frontend build system and microframework for [Svelte](https://svelte.dev/) designed for developer joy.

_Check out the code for this site [here](https://github.com/mkshio/tiny-robots/tree/master/example)._

### 🌈 Features

- 🔥 Ultrafast hot module replacement. Tiny Robots runs on [Snowpack](https://www.snowpack.dev/) in development, so hot updates stay fast no matter how large your app gets.
- Hightly configurable universal data fetching. Routes can be eager or deferred.
- Static site generation with dynaic data loading. Just do `yarn run tr export`.
- Client side routing.
- Filesystem-based routing, with directory-based layouts and global app layout.
- Global CSS/JS support. Just create a `global` directory and it's contents will by inlined into every page.
- Markdown in your Svelte with [mdsvex](https://mdsvex.com/).

### 📦 1. Setup

```shell
yarn add tiny-robots # or npm install tiny-robots
mkdir routes && touch routes/index.svelte # your first route

mkdir static # optional - static assets (images, fonts) go here
touch index.html # optional - an HTML shell
mkdir global # optional - global css/js files go here; they'll automatically be inlined
```

### 👩🏽‍💻 2. Develop

```shell
yarn run tr
```

Runs your app with [Snowpack](https://www.snowpack.dev/).

### 🚀 3. Ship

```shell
yarn run tr export
```

Generates an `./export` directory containing production-ready static HTML pages and JS bundles using [Rollup](https://rollupjs.org/guide/en/).

Adding `--dev` will produce a build for diagnostics. Presently, it generates an unminified bundle, but more features may be added under this flag in the future.

### 🛠 WIP

#### Pending

- Error pages and catch screens.
- Plain 'ol js pages.
  - With jsdom support for prerendering.
- Remove console warnings.

#### Coming soon

- Live-reload on global CSS and JS changes.
- TypeScript.
- More HTML features.
  - Partials.
  - Merge head/body with template/layouts.
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
- Route asset preloads on page transition.
  - Look at hrefs to other pages.
- PWA/service worker.
- Per-component rehydration opt-out (i.e. server-only components).
- SSR mode.
  - Vercel runtime integration.
  - Server hooks.
- Better CSS extraction.
- Support for React pages.
