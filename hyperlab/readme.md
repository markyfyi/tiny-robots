# Tiny Robots

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
- An SPA router.
  - Preloads data.
  - Passes loading/fetching flags to components.
  - Components can wait on data or render eagerly.

## Install

```shell
yarn add tiny-robots # or npm
```

## Develop

```shell
yarn run tiny-robots
```

Runs your app with [Snowpack](https://www.snowpack.dev/).

## Ship

```shell
yarn run tiny-robots export
```

Generates static HTML pages and a client JS bundle with [Rollup](https://rollupjs.org/guide/en/).

### Roadmap

#### WIP

- TypeScript
- markdown/MDsveX
- Error pages.
- Plain js pages.
  - With jsdom support for prerendering.
- More HTML features.
  - Partials.
  - Merge head/body with template/layouts.

#### Coming soon

- Route asset preloads on page transition.
  - Look at hrefs to other pages.
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
