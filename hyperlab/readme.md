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

### WIP

- TypeScript and markdown support.
- Data-fetching hooks.

### Coming soon

- Slugs/catchall routes.
- An SPA router.

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
