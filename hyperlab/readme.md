# hyperlab

🏗 WIP

A frontend build system and microframework for [Svelte](https://svelte.dev/) designed for developer joy and velocity.

### Features

- 🔥 Ultrafast hot module replacement.
- Static site generation.
- Filesystem-based routing.
  - Nested routes.
  - Directory-based layout pages.
  - Global app layout.
- Inlined global/critical CSS.
- Data-fetching hooks.
- HTML rendering.

## Install

```shell
yarn add hyperlab # or npm
```

## Develop

```shell
yarn run hyperlab
```

Runs your app with [Snowpack](https://www.snowpack.dev/).

## Ship

```shell
yarn run hyperlab export
```

Generates static HTML pages and a client JS bundle with [Rollup](https://rollupjs.org/guide/en/).

### Roadmap

#### WIP

- TypeScript and markdown support.
- Error pages.

#### Coming soon

- An SPA router.
  - Flag to render before/after data fetch.
  - Slugs/catchall routes.
- SSR mode.
  - Vercel runtime integration.
  - Server hooks.
- Better CSS extraction.
- HTML features.
  - Layout and partials.
  - Inject global scripts and styles.
  - Different preprocessors.
- URL rewrite generation for Vercel and Netlify.
