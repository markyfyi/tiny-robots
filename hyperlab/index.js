#!/usr/bin/env node

const { join, dirname, extname } = require("path");
const {
  readFileSync,
  writeFileSync,
  readdirSync,
  existsSync,
  statSync,
} = require("fs");
const { createServer } = require("http");

const mkdirp = require("mkdirp");
const { startServer, loadConfiguration } = require("snowpack");
const httpProxy = require("http-proxy");
const htmlMinifier = require("html-minifier");

const { rollup } = require("rollup");
const svelte = require("rollup-plugin-svelte");
const { terser } = require("rollup-plugin-terser");
const resolve = require("@rollup/plugin-node-resolve").default;
const commonjs = require("@rollup/plugin-commonjs");
const replace = require("@rollup/plugin-replace");
const postcss = require("rollup-plugin-postcss");
const copy = require("rollup-plugin-copy");
const virtual = require("@rollup/plugin-virtual");

const assetsDirName = "assets";
const routesDirName = "routes";
const exportDirName = "export";
const htmlPath = "index.html";
const rollupVirtualFilePrefix = "\x00virtual:";
const globalAssetsPath = "global";
const appLayoutPath = "/_app.svelte";
const routePath = "/_snowpack/pkg/hyperlab/runtime/Route.svelte.js";
const routeModulePath = "hyperlab/runtime/Route.svelte";
const resolvedRouteModulePath =
  "/node_modules/hyperlab/runtime/Route.svelte.js";

const appPath = process.cwd();
const [, , command, ...restArgs] = process.argv;
const dev = restArgs.includes("--dev");

const minifyOptions = {
  collapseWhitespace: true,
  conservativeCollapse: true,
  minifyCSS: true,
};

class Renderer {
  async init() {
    this.proxy = httpProxy.createServer({ target: "http://localhost:8081" });

    const config = await loadConfiguration(
      snowpackConfig({ proxyDest: (req, res) => this.proxy.web(req, res) })
    );

    const rollupPlugins = config.packageOptions.rollup.plugins;
    // const rollupSveltePlugin = rollupPlugins.find((p) => p.name === "svelte");

    this.server = await startServer({
      config,
      lockfile: undefined,
    });

    this.runtime = this.server.getServerRuntime();
  }

  getUrl(path) {
    return this.server.getUrlForFile(apr(path));
  }

  async renderPage(
    path,
    { src, code, css, preloads, layoutPath, appLayoutPath } = {}
  ) {
    const pageUrl = this.server.getUrlForFile(apr(path));
    const { default: pageComponent, prefetch } = (
      await this.runtime.importModule(pageUrl)
    ).exports;

    let prefetchedProps = {};
    if (prefetch) {
      prefetchedProps = await prefetch();
    }

    let script = "";
    if (prefetchedProps) {
      script += `<script>__hyperlabPrefetchedProps = ${JSON.stringify(
        prefetchedProps
      )}</script>`;
    }
    if (preloads) {
      for (const preload of preloads) {
        script += `<link rel="modulepreload" href="${preload}">`;
      }
    }
    if (code) {
      script += `<script type="module">${code}</script>`;
    } else if (src) {
      script += `<script type="module" src="${src}"></script>`;
    }

    let layoutComponent;
    if (layoutPath) {
      const url = this.server.getUrlForFile(apr(layoutPath));
      layoutComponent = (await this.runtime.importModule(url)).exports.default;
    }

    let appLayoutComponent;
    if (appLayoutPath) {
      const url = this.server.getUrlForFile(apr(appLayoutPath));
      appLayoutComponent = (await this.runtime.importModule(url)).exports
        .default;
    }

    const RouteComponent = (
      await this.runtime.importModule(resolvedRouteModulePath)
    ).exports.default;

    const {
      head: pageHead,
      css: pageCss,
      html: rootHtml,
    } = RouteComponent.render({
      pageComponent,
      appLayoutComponent,
      layoutComponent,
      pageProps: { ...prefetchedProps },
    });

    const headCode = pageHead;

    // const cssCode = await (
    //   await Promise.all(
    //     [getGlobalCss(), css, pageCss.code]
    //       .filter((s) => s)
    //       .map((s) => cssnano.process(s))
    //   )
    // ).reduce((h, { css }) => h + `<style type="text/css">${css}</style>`, "");

    const cssCode = await [getGlobalCss(), css, pageCss.code]
      .filter((s) => s)
      .reduce((h, s) => h + `<style type="text/css">${s}</style>`, "");

    const baseHtml = readFileSync(ap(htmlPath)).toString();

    const page = baseHtml
      .replace("<!-- @HEAD -->", headCode)
      .replace("<!-- @CSS -->", cssCode)
      .replace("<!-- @HTML -->", rootHtml)
      .replace("<!-- @SCRIPT -->", script);

    const minifiedPage = htmlMinifier.minify(page, minifyOptions);

    return minifiedPage;
  }

  async stop() {
    this.proxy.close();
    await this.server.shutdown();
  }
}

async function devServer() {
  const renderer = new Renderer();

  await renderer.init();

  createServer(async (req, res) => {
    function error404() {
      res.statusCode = 404;
      res.setHeader("Content-Type", "text/plain");
      res.end("404: Not found");
    }

    const [path] = req.url.split("?");
    const segments = path.slice(1).split("/");
    const lastSegment = last(segments);

    if (["_app", "_layout"].includes(lastSegment)) {
      error404();
      return;
    }

    try {
      const filePath = apr(path);
      const isDir = existsSync(filePath) && statSync(filePath).isDirectory();
      let pagePathBase = path;
      if (!path || path === "/") {
        pagePathBase = "index";
      } else if (isDir) {
        pagePathBase = join(path, "index");
      } else if (last(path) === "/") {
        pagePathBase = path.slice(0, -1);
      }
      const pagePath = pagePathBase + ".svelte";

      if (!existsSync(apr(pagePath))) {
        const htmlPath = apr(pagePathBase + ".html");
        if (existsSync(htmlPath)) {
          res.setHeader("Content-Type", "text/html");
          res.statusCode = 200;
          res.end(readFileSync(htmlPath).toString());
          return;
        }

        error404();
        return;
      }

      const layoutPath = join(dirname(pagePath), "_layout.svelte");

      const pageUrl = renderer.getUrl(pagePath);

      let layoutUrl;
      const hasLayout = existsSync(apr(layoutPath));
      if (hasLayout) {
        layoutUrl = renderer.getUrl(layoutPath);
      }

      let appLayoutUrl;
      const hasAppLayout = existsSync(apr(appLayoutPath));
      if (hasAppLayout) {
        appLayoutUrl = renderer.getUrl(appLayoutPath);
      }

      const code = genEntry(pageUrl, layoutUrl, appLayoutUrl, routePath);

      const page = await renderer.renderPage(pagePath, {
        appLayoutPath,
        layoutPath,
        code,
        src: undefined,
        css: undefined,
        preloads: undefined,
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
  }).listen(8081);
}

function genEntry(pageUrl, layoutUrl, appLayoutUrl, routeUrl) {
  return `// @start: generated by hyperlab
import Route from "${routeUrl}";
import Page from '${pageUrl}';

${layoutUrl ? `import Layout from '${layoutUrl}'` : `const Layout = null;`};
${
  appLayoutUrl
    ? `import AppLayout from '${appLayoutUrl}'`
    : `const AppLayout = null;`
};


let route = new Route({
  target: document.body,
  hydrate: true,
  props: {
    appLayoutComponent: AppLayout,
    layoutComponent: Layout,
    pageComponent: Page,
    pageProps: __hyperlabPrefetchedProps
  }
});
// @end`;
}

async function static({ dev } = {}) {
  const renderer = new Renderer();
  await renderer.init();

  const pages = allPages(apr("."));

  const hasAppLayout = existsSync(apr("_app.svelte"));
  const { entries, virtualEntries, fileNamesToEntries } = pagesToEntries(
    pages,
    hasAppLayout
  );

  const build = await rollup(
    rollupConfig({ fileNames: Object.keys(entries), dev, virtualEntries })
  );

  mkdirp(ap(exportDirName));
  const bundle = await build.write({
    hoistTransitiveImports: false,
    compact: true,
    entryFileNames: "[name].js",
    format: "es",
    dir: join(".", exportDirName, assetsDirName),
  });

  const indexedOutput = new Map(
    bundle.output
      .filter((o) => "facadeModuleId" in o && o.facadeModuleId)
      .map((o) => [o.facadeModuleId.replace(rollupVirtualFilePrefix, ""), o])
  );

  await Promise.all(
    pages.map(async function ({ name, dir, hasLayout, filePath }) {
      const layoutPath = hasLayout ? join(dir, "_layout.svelte") : null;
      const output = indexedOutput.get(fileNamesToEntries[filePath]);

      let page;
      try {
        page = await renderer.renderPage(filePath, {
          layoutPath,
          appLayoutPath: hasAppLayout ? "_app.svelte" : null,
          src: join("/", assetsDirName, output.fileName),
          preloads: [
            ...(output?.imports ?? []).map((m) => join("/", assetsDirName, m)),
            join("/", assetsDirName, output.fileName),
          ],
          code: undefined,
          css: undefined,
          dev: false,
        });
      } catch (error) {
        console.error(`Export failed on page '${page}' with error:`, error);
        throw new Error("Export error");
      }

      await mkdirp(join(".", exportDirName, dir));
      writeFileSync(
        join(".", exportDirName, dir, name.replace(".svelte", ".html")),
        page
      );
    })
  );

  await build.close();
  await renderer.stop();
}

function pagesToEntries(pages, hasAppLayout) {
  const entries = {};
  const virtualEntries = {};
  const fileNamesToEntries = {};
  for (const { dir, filePath, hasLayout } of pages) {
    const code = genEntry(
      join(".", routesDirName, filePath),
      hasLayout ? join(".", routesDirName, dir, "_layout.svelte") : null,
      hasAppLayout ? join(".", routesDirName, "_app.svelte") : null,
      routeModulePath
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

function rollupConfig({ fileNames, dev, virtualEntries }) {
  return {
    input: fileNames,
    plugins: [
      replace({
        "process.browser": true,
        "process.env": JSON.stringify({
          NODE_ENV: dev ? "development" : "production",
        }),
      }),
      virtual(virtualEntries),
      svelte({
        emitCss: false,
        compilerOptions: {
          hydratable: true,
        },
      }),
      resolve({
        browser: true,
      }),
      commonjs(),
      // styles({ mode: "emit", namedExports: true, minimize: true }),
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
              return htmlMinifier.minify(html.toString(), minifyOptions);
            },
          },
        ],
      }),
      !dev && terser(),
    ],
  };
}

function snowpackConfig({ proxyDest }) {
  return {
    root: appPath,
    mount: {},
    plugins: [
      [
        "@snowpack/plugin-svelte",
        {
          compilerOptions: {
            hydratable: true,
          },
        },
      ],
    ],
    devOptions: {
      open: "none",
      output: "stream",
    },
    buildOptions: {},
    routes: [
      {
        match: "routes",
        src: ".*",
        dest: proxyDest,
      },
    ],
    packageOptions: {
      knownEntrypoints: [routeModulePath],
    },
  };
}

function allPages(root, dir = "") {
  let pages = [];
  const dirents = readdirSync(join(root, dir), { withFileTypes: true });
  const hasLayout = !!dirents.find(
    (dirent) => dirent.name === "_layout.svelte"
  );
  for (const dirent of dirents) {
    if (
      ["_layout.svelte", "_app.svelte"].includes(dirent.name) ||
      extname(dirent.name) !== ".svelte"
    ) {
      continue;
    } else if (dirent.isDirectory()) {
      for (const page of allPages(root, join(dir, dirent.name))) {
        pages.push(page);
      }
    } else {
      pages.push({
        dir,
        hasLayout,
        filePath: join(dir, dirent.name),
        name: dirent.name,
      });
    }
  }

  return pages;
}

function getGlobalCss() {
  let css = "";

  try {
    if (existsSync(ap(globalAssetsPath))) {
      for (const name of readdirSync(ap(globalAssetsPath))) {
        if (name.endsWith(".css")) {
          css += readFileSync(ap(globalAssetsPath, name));
        }
      }
    }
  } catch (error) {}

  return css;
}

function ap(...ps) {
  return join(appPath, ...ps);
}

function apr(...ps) {
  return join(appPath, routesDirName, ...ps);
}

function last(xs) {
  return xs[xs.length - 1];
}

async function main() {
  if (!command || command === "dev") {
    devServer();
  } else if (command === "export") {
    try {
      await static({ dev });
    } catch (error) {
      process.exit(1);
    }
    process.exit(0);
  } else {
    console.error("Unrecognized command.");
  }
}

main();
