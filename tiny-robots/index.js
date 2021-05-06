#!/usr/bin/env node

/**
 * @typedef {Object} RenderOptions
 * @property {string} pageId
 * @property {string | null | undefined} src
 * @property {string | null | undefined} code
 * @property {string[] | null | undefined} preloads
 * @property {string | null | undefined} layoutPath
 * @property {string | null | undefined} appLayoutPath
 * @property {boolean} dev
 * @property {boolean} hot
 */

/**
 * @typedef PageRecord
 * @property {string} pageId
 * @property {string} path
 * @property {string} dir
 * @property {boolean} hasLayout
 * @property {string} filePath
 * @property {string} name
 */

const { join, dirname, extname, basename, parse } = require("path");
const {
  readFileSync,
  writeFileSync,
  readdirSync,
  existsSync,
  statSync,
} = require("fs");

const { sync: mkdirp } = require("mkdirp");
const htmlMinifier = require("html-minifier");
const { mdsvex } = require("mdsvex");
// const { typescript: svelteTypescript } = require("svelte-preprocess");

const express = require("express");
const vite = require("vite");
const { default: svelteVite } = require("@sveltejs/vite-plugin-svelte");

const { rollup } = require("rollup");
const svelteRollup = require("rollup-plugin-svelte");
const { terser } = require("rollup-plugin-terser");
const { nodeResolve } = require("@rollup/plugin-node-resolve");
const virtual = require("@rollup/plugin-virtual");
/** @type {import("@rollup/plugin-commonjs").default} */
// @ts-ignore
const commonjs = require("@rollup/plugin-commonjs");
/** @type {import("@rollup/plugin-replace").default} */
// @ts-ignore
const replace = require("@rollup/plugin-replace");
/** @type {import("rollup-plugin-postcss").default} */
// @ts-ignore
const postcss = require("rollup-plugin-postcss");
/** @type {import("rollup-plugin-copy").default} */
// @ts-ignore
const copy = require("rollup-plugin-copy");

// consts
const assetsDirName = "assets";
const routesDirName = "routes";
const exportDirName = "export";
const htmlPath = "index.html";
const rollupVirtualFilePrefix = "\x00virtual:";
const globalAssetsPath = "global";
const appLayoutModulePath = "/_app.svelte";
const routeModulePath = "./node_modules/tiny-robots/runtime/Route.svelte";
const appModulePath = "tiny-robots/runtime/app";
const devAppModulePath = "/node_modules/tiny-robots/runtime/app";
const devRouteModulePath = "/node_modules/tiny-robots/runtime/Route";
const isSPA = true;

// templates
const defaultHtmlLayout = /* html */ `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>app built by tiny robots</title>
    <meta
      name="viewport"
      content="width=device-width,initial-scale=1"
    />
  </head>
  <body></body>
</html>
`;

const indexTemplate = /* html */ `<div style="width: 640px; margin: 0 auto;">
  <h1 style="text-align: center;">tiny robots app 🤖</h1>
</div>
`;

// opts
const nodeResolveOptions = {
  dedupe: ["svelte"],
};

const sveltePluginOptions = {
  preprocess: mdsvex(),
  compilerOptions: {
    hydratable: true,
  },
};

const htmlMinifyOptions = {
  collapseWhitespace: true,
  conservativeCollapse: true,
  minifyCSS: true,
};

// env
const appPath = process.cwd();
const [, , command, ...restArgs] = process.argv;
const dev = restArgs.includes("--dev");
const viewSource = restArgs.includes("--view-source");
const appConfig = existsSync(ap("tinyrobots.config.js"))
  ? require(ap("tinyrobots.config.js"))
  : {};
const port = appConfig.port || 3000;

/**
 * @param {string[]} ps
 * @return {string}
 */
function ap(...ps) {
  return join(appPath, ...ps);
}

/**
 * @param {string[]} ps
 * @return {string}
 */
function apr(...ps) {
  return join(appPath, routesDirName, ...ps);
}

/**
 * @template T
 * @param {T[]} xs
 * @return {T}
 */
function last(xs) {
  return xs[xs.length - 1];
}

/**
 * @param {string} f
 */
function read(f) {
  return readFileSync(f, "utf-8");
}

/**
 * @param {string} path
 */
function resolveAppPaths(path) {
  const fsFilePath = apr(path);
  const isDir = existsSync(fsFilePath) && statSync(fsFilePath).isDirectory();
  let pagePathBase = path;
  let pageDirPath = dirname(fsFilePath);
  if (!path || path === "/") {
    pagePathBase = "/index";
    pageDirPath = fsFilePath;
  } else if (isDir) {
    pagePathBase = join(path, "index");
    pageDirPath = fsFilePath;
  } else if (path[path.length - 1] === "/") {
    pagePathBase = path.slice(0, -1);
  }

  const files = readdirSync(pageDirPath);
  const base = basename(pagePathBase);
  const fileName = files.find((f) => f.startsWith(base));

  if (!fileName) return null;

  const pageId = pagePathBase.slice(1);
  const ext = extname(fileName);
  const pagePath = `${pagePathBase}${ext}`;

  return {
    pageId,
    pagePathBase,
    pageDirPath,
    fileName,
    pagePath,
    ext,
  };
}

/**
 * @property {vite.ViteDevServer} server
 */
class Renderer {
  /**
   * @param {vite.ViteDevServer} server
   */
  constructor(server) {
    this.server = server;
  }

  /**
   * @param {string} path
   */
  async prefetchPath(path) {
    const { prefetch } = await this.server.ssrLoadModule(path);
    if (prefetch) {
      return prefetch({ static: true, params: {} });
    }
  }

  /**
   *
   * @param {string} path
   * @param {RenderOptions} renderOptions
   * @returns
   */
  async renderPage(
    path,
    { pageId, src, code, preloads, layoutPath, appLayoutPath, dev, hot }
  ) {
    const {
      default: pageComponent,
      prefetch,
    } = await this.server.ssrLoadModule(apr(path));

    let prefetchedProps;
    if (prefetch) {
      prefetchedProps = await prefetch({ static: true, params: {} });
    }
    const stringifiedProps = JSON.stringify(prefetchedProps ?? {});

    const globalFiles = getGlobalFiles();

    let script = "";
    if (preloads) {
      for (const preload of preloads) {
        script += `<link rel="modulepreload" href="${preload}">`;
      }
    }
    if (code) {
      script += `<script type="module">
${code}
start({ pageProps: ${stringifiedProps}, hydrate: true });
</script>`;
    } else if (src) {
      script += `
<script type="module">
import { start } from '${src}';
start({ pageProps: ${stringifiedProps}, hydrate: true });
</script>`;
    }

    for (const { code } of globalFiles.js) {
      script += `<script>${code}</script>`;
    }

    let layoutComponent;
    if (layoutPath) {
      layoutComponent = (await this.server.ssrLoadModule(apr(layoutPath)))
        .default;
    }

    let appLayoutComponent;
    if (appLayoutPath) {
      appLayoutComponent = (await this.server.ssrLoadModule(apr(appLayoutPath)))
        .default;
    }

    const RouteComponent = (await this.server.ssrLoadModule(devRouteModulePath))
      .default;

    const {
      head: pageHead,
      css: pageCss,
      html: rootHtml,
    } = RouteComponent.render({
      pageComponent,
      appLayoutComponent,
      layoutComponent,
      pageId,
      fetching: true,
      pageProps: { ...prefetchedProps },
    });

    const headCode = pageHead;

    const cssCode = [...globalFiles.css.map(({ code }) => code), pageCss.code]
      .filter((s) => s)
      .reduce(
        (h, s) =>
          h +
          `<style ${hot ? `data-style-dev ` : ""}type="text/css">${s}</style>`,
        ""
      );

    let devHotGlobalCss;
    if (hot) {
      const cssImports = globalFiles.css
        .map(({ path }) => `import "${path}";`)
        .join("\n");

      devHotGlobalCss = `<script type="module">
${cssImports}
document.querySelectorAll('[data-style-dev]').forEach(el => el.remove());
</script>`;
    }

    const baseHtml = existsSync(ap(htmlPath))
      ? read(ap(htmlPath))
      : defaultHtmlLayout;

    const page = baseHtml
      .replace(
        `</head>`,
        [cssCode, script, headCode, devHotGlobalCss].join("\n") + "</head>"
      )
      .replace(`<body>`, `<body>\n` + rootHtml);

    if (dev) {
      return { page, prefetchedProps };
    }

    const minifiedPage = htmlMinifier.minify(page, htmlMinifyOptions);

    return { page: minifiedPage, prefetchedProps };
  }

  async stop() {
    await this.server.close();
  }
}

function createViteServer() {
  return vite.createServer({
    // any valid user config options, plus `mode` and `configFile`
    root: appPath,
    server: {
      middlewareMode: true,
    },
    resolve: {
      extensions: [
        ".mjs",
        ".js",
        ".ts",
        ".jsx",
        ".tsx",
        ".json",
        ".svelte",
        ".svx",
      ],
    },
    plugins: [
      svelteVite({
        preprocess: [
          // @ts-ignore
          mdsvex(),
        ],
        extensions: [".svelte", ".svx"],
      }),
    ],
    clearScreen: false,
  });
}

async function devServer() {
  const viteServer = await createViteServer();
  const hostServer = express();
  const renderer = new Renderer(viteServer);

  hostServer.use(viteServer.middlewares);

  hostServer.use(async (req, res) => {
    function error404() {
      res.statusCode = 404;
      res.setHeader("Content-Type", "text/plain");
      res.end("404: Not found");
    }

    const path = req.path;
    const segments = path.slice(1).split("/");
    const lastSegment = last(segments);

    let appLayoutUrl;
    let appLayoutPath;
    const hasAppLayout = existsSync(apr(appLayoutModulePath));
    if (hasAppLayout) {
      appLayoutPath = appLayoutModulePath;
      appLayoutUrl = join("/", routesDirName, appLayoutModulePath);
    }

    if (
      ["_app", "_layout"].includes(lastSegment) ||
      path.startsWith("/view-source")
    ) {
      error404();
      return;
    }

    if (path === "/assets/manifest.json") {
      res.setHeader("Content-Type", "application/json");
      res.statusCode = 200;
      res.end(
        JSON.stringify({
          __dev__appLayoutUrl: appLayoutUrl,
          paths: genDevManifest(),
        })
      );
      return;
    }

    if (path.startsWith("/_dev_prefetch")) {
      const prefetchPath = path.replace("/_dev_prefetch", "");
      const pageAppPaths = resolveAppPaths(prefetchPath);
      if (!pageAppPaths) {
        error404();
        return;
      }

      res.setHeader("Content-Type", "application/json");
      res.statusCode = 200;
      const data = await renderer.prefetchPath(apr(pageAppPaths.pagePath));
      res.end(JSON.stringify(data ?? {}));
      return;
    }

    const pageAppPaths = resolveAppPaths(path);

    if (!pageAppPaths) {
      error404();
      return;
    }

    const {
      pageId,
      pagePathBase,
      pageDirPath,
      pagePath,
      fileName,
    } = pageAppPaths;

    try {
      if (fileName?.endsWith(".html")) {
        const htmlPath = apr(pagePathBase + ".html");
        res.setHeader("Content-Type", "text/html");
        res.statusCode = 200;
        res.end(read(htmlPath));
        return;
      }

      const pageUrl = join("/", routesDirName, pagePathBase);
      const maybeLayoutPath = join(pageDirPath, "_layout.svelte");

      let layoutUrl;
      let layoutPath;
      const hasLayout = existsSync(maybeLayoutPath);
      if (hasLayout) {
        layoutPath = join(dirname(pagePathBase), "_layout.svelte");
        layoutUrl = apr(layoutPath);
      }

      let indexUrl;
      const hasIndex = existsSync(ap("index.js"));
      if (hasIndex) {
        indexUrl = "/index.js";
      }

      const code = genEntry(
        pageId,
        indexUrl,
        pageUrl,
        layoutUrl,
        appLayoutUrl,
        devRouteModulePath,
        devAppModulePath,
        isSPA,
        true
      );

      const { page } = await renderer.renderPage(pagePath, {
        pageId: pageId,
        appLayoutPath,
        layoutPath,
        code,
        src: undefined,
        preloads: undefined,
        dev: true,
        hot: true,
      });

      res.setHeader("Content-Type", "text/html");
      res.statusCode = 200;
      res.end(page);
    } catch (error) {
      console.error(error);
      res.statusCode = 500;
      res.setHeader("Content-Type", "text/plain");
      res.write(`500: Oops, something broke!\n\n${error.stack}`);
      res.end();
      return;
    }
  });

  await new Promise((r) => hostServer.listen(port, () => r(undefined)));

  console.log(`🤖 🤖 🤖 listening on http://localhost:${port} 🤖 🤖 🤖`);
}

async function buildStatic({ dev } = { dev: false }) {
  const viteServer = await createViteServer();
  const renderer = new Renderer(viteServer);

  const pages = getAllPages(apr("."));

  const hasAppLayout = existsSync(apr("_app.svelte"));
  const hasAppIndex = existsSync(ap("index.js"));
  const {
    entries,
    virtualEntries: baseVirtualEntries,
    fileNamesToEntries,
  } = pagesToEntries(pages, hasAppLayout, hasAppIndex);

  const viewSourceCodeCache = new Map();

  const target = join(appPath, routesDirName, "/");

  const virtualEntries = {
    ...baseVirtualEntries,
    ...appConfig.virtualEntries,
  };

  const baseRollupConfig = getRollupConfig({
    fileNames: { ...entries, ...(appConfig.entries ?? {}) },
    dev,
    virtualEntries,
    onSvelteTransform: ({ id, output }) => {
      if (id.startsWith(target)) {
        const id_ = id.replace(target, "");

        viewSourceCodeCache.set(id_, output);
      }
    },
  });

  const finalRollupConfig = appConfig.rollup
    ? appConfig.rollup(baseRollupConfig)
    : baseRollupConfig;

  const build = await rollup(finalRollupConfig);

  mkdirp(ap(exportDirName));
  mkdirp(ap(exportDirName, "assets"));
  mkdirp(ap(exportDirName, "assets", "_data"));
  const bundle = await build.write({
    sourcemap: dev,
    hoistTransitiveImports: false,
    compact: true,
    entryFileNames: (chunkInfo) => {
      return chunkInfo.name.replace("_virtual:", "") + ".js";
    },
    format: "es",
    dir: join(".", exportDirName, assetsDirName),
  });

  const indexedOutput = new Map(
    bundle.output
      .filter((o) => "facadeModuleId" in o && o.facadeModuleId)
      .map((o) => [
        // @ts-ignore
        o.facadeModuleId.replace(rollupVirtualFilePrefix, ""),
        o,
      ])
  );

  const manifest = {};

  await Promise.all(
    pages.map(async function ({
      path,
      name,
      dir,
      hasLayout,
      filePath,
      pageId,
    }) {
      const { name: baseName, ext } = parse(name);
      const layoutPath = hasLayout ? join(dir, "_layout.svelte") : null;
      const output = indexedOutput.get(fileNamesToEntries[filePath]);
      const outputFilePath = join("/", assetsDirName, output.fileName);
      const dataPath = join(
        ".",
        assetsDirName,
        "_data",
        parse(output.fileName).name + ".json"
      );
      // const dataFilePath = join("/", assetsDirName, "_data", output.fileName);

      const preloadJs = (output?.imports ?? []).map((m) =>
        join("/", assetsDirName, m)
      );

      let page;
      let prefetchedProps;
      try {
        const result = await renderer.renderPage(filePath, {
          pageId,
          layoutPath,
          appLayoutPath: hasAppLayout ? "_app.svelte" : null,
          src: outputFilePath,
          preloads: [...preloadJs, outputFilePath],
          code: undefined,
          dev,
          hot: false,
        });
        page = result.page;
        prefetchedProps = result.prefetchedProps;
      } catch (error) {
        console.error(`Export failed on page '${page}' with error:`, error);
        throw new Error("Export error");
      }

      mkdirp(join(".", exportDirName, dir));
      if (prefetchedProps) {
        writeFileSync(
          join(".", exportDirName, dataPath),
          JSON.stringify(prefetchedProps, null, dev ? "\t" : undefined)
        );
      }
      writeFileSync(join(".", exportDirName, dir, baseName + ".html"), page);

      manifest[path] = {
        path,
        pageId,
        js: outputFilePath,
        preloadJs,
        data: prefetchedProps ? join("/", dataPath) : undefined,
      };

      const compiled = viewSourceCodeCache.get(filePath);

      if (viewSource) {
        const entryCode = virtualEntries[filePath];
        const sources = {
          ext,
          main: readFileSync(apr(filePath), "utf-8"),
          entry: entryCode,
          compiled,
        };

        mkdirp(join(".", exportDirName, "view-source", "entries", dir));
        writeFileSync(
          join(".", exportDirName, "view-source", "entries", pageId + ".json"),
          JSON.stringify(sources)
        );
      }
    })
  );

  writeFileSync(
    ap(exportDirName, assetsDirName, "manifest.json"),
    JSON.stringify({ paths: manifest }, null, dev ? "\t" : undefined)
  );

  await build.close();
  await renderer.stop();
}

function pagesToEntries(pages, hasAppLayout, hasAppIndex) {
  const entries = {};
  const virtualEntries = {};
  const fileNamesToEntries = {};
  for (const { dir, filePath, hasLayout, pageId } of pages) {
    const code = genEntry(
      pageId,
      hasAppIndex ? "./index" : null,
      join(".", routesDirName, filePath),
      hasLayout ? join(".", routesDirName, dir, "_layout.svelte") : null,
      hasAppLayout ? join(".", routesDirName, "_app.svelte") : null,
      routeModulePath,
      appModulePath,
      isSPA,
      false
    );

    entries[filePath] = filePath;
    virtualEntries[filePath] = code;
    fileNamesToEntries[filePath] = filePath;
  }

  return {
    entries,
    virtualEntries,
    fileNamesToEntries,
  };
}

function getRollupConfig({
  fileNames,
  dev,
  virtualEntries,
  onSvelteTransform,
}) {
  const sveltePlugin = svelteRollup({
    ...sveltePluginOptions,
    extensions: [".svelte", ".svx"],
    emitCss: false,
  });

  // HACK: I'm sorry
  const _transform = sveltePlugin.transform;
  sveltePlugin.transform = async function (code, id) {
    const result = await _transform.apply(this, [code, id]);

    onSvelteTransform &&
      onSvelteTransform({
        id,
        input: code,
        output: result ? result.code : null,
      });

    return result;
  };

  /** @type {import('rollup').RollupOptions} */
  const options = {
    input: fileNames,
    preserveSymlinks: true,
    plugins: [
      replace({
        "process.browser": true,
        "process.env": JSON.stringify({
          NODE_ENV: dev ? "development" : "production",
        }),
      }),
      virtual({
        ...virtualEntries,
        // HACK: use a plugin instead
        fs: "export default {}",
        path: "export default {}",
      }),
      sveltePlugin,
      nodeResolve({
        ...nodeResolveOptions,
        browser: true,
      }),
      commonjs(),
      postcss(),
      copy({
        targets: [
          {
            src: ap("static"),
            dest: ap("export"),
          },
          {
            src: ap("routes/**/*.html"),
            dest: ap("export"),
            flatten: false,
            transform: (html) => {
              return htmlMinifier.minify(html.toString(), htmlMinifyOptions);
            },
          },
        ],
      }),
      !dev && terser(),
    ],
  };

  return options;
}

/**
 * @param {string} root
 * @param {string} dir
 * @returns {PageRecord[]}
 */
function getAllPages(root, dir = "") {
  let pages = [];
  const dirents = readdirSync(join(root, dir), { withFileTypes: true });
  const hasLayout = !!dirents.find(
    (dirent) => dirent.name === "_layout.svelte"
  );
  for (const dirent of dirents) {
    const ext = extname(dirent.name);
    if (["_layout.svelte", "_app.svelte"].includes(dirent.name)) {
      continue;
    } else if (dirent.isDirectory()) {
      for (const page of getAllPages(root, join(dir, dirent.name))) {
        pages.push(page);
      }
    } else if ([".svelte", ".svx"].includes(ext)) {
      const baseName = parse(dirent.name).name;
      pages.push({
        pageId: join(dir, baseName),
        path: join("/", dir, baseName === "index" ? "." : baseName),
        dir,
        hasLayout,
        filePath: join(dir, dirent.name),
        name: dirent.name,
      });
    }
  }

  return pages;
}

/**
 * @param {string} pageId
 * @param {string | null | undefined} indexUrl
 * @param {string} pageUrl
 * @param {string | null | undefined} layoutUrl
 * @param {string | null | undefined} appLayoutUrl
 * @param {string} routeRuntimeUrl
 * @param {string} appRuntimeUrl
 * @param {boolean} isSPA
 * @param {boolean} isDev
 */
function genEntry(
  pageId,
  indexUrl,
  pageUrl,
  layoutUrl,
  appLayoutUrl,
  routeRuntimeUrl,
  appRuntimeUrl,
  isSPA,
  isDev
) {
  return `// generated by tiny robots
${indexUrl ? `import '${indexUrl}';` : ``}
import Route from "${routeRuntimeUrl}";
import * as page from '${pageUrl}';
${layoutUrl ? `import Layout from '${layoutUrl}';` : `const Layout = null;`}
${
  appLayoutUrl
    ? `import AppLayout from '${appLayoutUrl}';`
    : `const AppLayout = null;`
}

const start = ({ pageProps, hydrate }) => {
  const root = new Route({
    target: document.body,
    hydrate,
    props: {
      ...routeProps(),
      pageId: "${pageId}",
      fetching: true,
      pageProps
    }
  });

  ${
    isSPA
      ? `import("${appRuntimeUrl}")
    .then(m => m.start({ root, dev: ${!!isDev}, page, pageProps }));`
      : ""
  }
}

const routeProps = () => ({
  appLayoutComponent: AppLayout,
  layoutComponent: Layout,
  pageComponent: page.default,
})

export { page, start, routeProps };
`;
}

function genDevManifest() {
  const pages = getAllPages(apr("."));

  /** @type Record<string, object> */
  const manifest = {};

  for (const { path, filePath, hasLayout, dir, pageId } of pages) {
    manifest[path] = {
      pageId,
      path,
      js: join("/", routesDirName, filePath),
      __dev__layoutJs: hasLayout
        ? join("/", routesDirName, dir, "_layout.svelte")
        : null,
    };
  }

  return manifest;
}

function getGlobalFiles() {
  let css = [];
  let js = [];

  if (existsSync(ap(globalAssetsPath))) {
    for (const name of readdirSync(ap(globalAssetsPath))) {
      if (extname(name) === ".css") {
        css.push({
          code: read(ap(globalAssetsPath, name)),
          path: join("/", globalAssetsPath, name),
        });
      } else if (extname(name) === ".js") {
        js.push({
          code: read(ap(globalAssetsPath, name)),
          path: join("/", globalAssetsPath, name),
        });
      }
    }
  }

  return { css, js };
}

function init() {
  mkdirp(ap("static"));

  if (!existsSync(ap("global"))) {
    mkdirp(ap("global"));
    writeFileSync(
      ap("global/global.css"),
      `body {
  font-family: system-ui, sans;
}`
    );
  }

  if (!existsSync(ap("routes"))) {
    mkdirp(ap("routes"));
    writeFileSync(ap("routes/index.svelte"), indexTemplate);
  }

  if (!existsSync(ap("index.html"))) {
    writeFileSync(ap("index.html"), defaultHtmlLayout);
  }
}

async function main() {
  if (!command || command === "dev") {
    devServer();
  } else if (command === "init") {
    init();
  } else if (command === "export") {
    await buildStatic({ dev });
  } else {
    console.error("Unrecognized command.");
  }
}

main();
