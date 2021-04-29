# Tiny Robots

Tiny Robots is a frontend build system and anti-framework built on top of [Svelte](https://svelte.dev/blog/svelte-3-rethinking-reactivity#What_is_Svelte) designed help you ship ambitious web apps faster.

Please see [documentation here](https://tinyrobots.mksh.io).

## Features 🌈

- Fast dev mode, fast build step, fast runtime.
- A minimal surface area - less code you have to remember.
- 🔥 Ultrafast hot module replacement¹. 🔥 Seriously, we're talking really frickin' fast. Tiny Robots uses [Vite](https://www.vitejs.dev/) for module processing, so hot-reloads complete in the order of milliseconds and stay snappy no matter how large your app gets.
- Configurable universal data fetching. Routes can be loaded eagerly or wait until their data is loaded.
- Static site generation with dynamic data loading. Just run `yarn run tr export`.
- Client side routing with automatic data fetching.
- Filesystem-based routing, with directory-based layouts and global app layout.
- Global CSS/JS support for stuff like vendor code or analytics. Just create a `global` directory and all of it's contents will get inlined into every page.
- Markdown in your Svelte with [mdsvex](https://mdsvex.com/).

## Directory

This is a sort-of-monorepo containing two packages:

- `tiny-robots`, the installable library.
- `example`, a runnable, deployable app demonstrating what Tiny Robots can do for you.
