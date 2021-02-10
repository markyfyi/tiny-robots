#!/usr/bin/env node

const { join, parse, dirname } = require("path");
const { readFileSync, writeFileSync, readdirSync, existsSync } = require("fs");
const { createServer, Server } = require("http");

const mkdirp = require("mkdirp");
const { startServer, loadConfiguration } = require("snowpack");
const httpProxy = require("http-proxy");

const { rollup } = require("rollup");
const svelte = require("rollup-plugin-svelte");
const { terser } = require("rollup-plugin-terser");
const resolve = require("@rollup/plugin-node-resolve").default;
const commonjs = require("@rollup/plugin-commonjs");
const replace = require("@rollup/plugin-replace");
const postcss = require("rollup-plugin-postcss");
const copy = require("rollup-plugin-copy");
const virtual = require("@rollup/plugin-virtual");
// const styles = require("rollup-plugin-styles");

const assetsDirName = "assets";
const routesDirName = "routes";
const exportDirName = "export";
const htmlPath = "index.html";
const rollupVirtualFilePrefix = "\x00virtual:";
const routePath = "/_snowpack/pkg/hyperlab/runtime/Route.svelte.js";
const routeModulePath = "hyperlab/runtime/Route.svelte";
const resolvedRouteModulePath =
  "/node_modules/hyperlab/runtime/Route.svelte.js";

const appPath = process.cwd();
const [, , command, ...restArgs] = process.argv;

class Renderer {
  async init() {
    this.proxy = httpProxy.createServer({ target: "http://localhost:8081" });

    const config = await loadConfiguration(
      snowpackConfig({ proxyDest: (req, res) => this.proxy.web(req, res) })
    );

    const rollupPlugins = config.packageOptions.rollup.plugins;
    const rollupSveltePlugin = rollupPlugins.find((p) => p.name === "svelte");

    this.server = await startServer({
      config,
      lockfile: undefined,
    });

    this.runtime = this.server.getServerRuntime();
  }

  getUrl(path) {
    return this.server.getUrlForFile(join(appPath, "routes", path));
  }

  async renderPage(path, layoutPath, { src, code, css, preloads } = {}) {
    let script = "";
    if (preloads) {
      for (const preload of preloads) {
        script += `<link rel="modulepreload" href="${preload}">\n`;
      }
    }
    if (code) {
      script += `<script type="module">${code}</script>\n`;
    } else if (src) {
      script += `<script type="module" src="${src}"></script>\n`;
    }

    let layoutComponent;
    if (layoutPath) {
      const layoutUrl = this.server.getUrlForFile(
        join(appPath, "routes", layoutPath)
      );
      layoutComponent = (await this.runtime.importModule(layoutUrl)).exports
        .default;
    }

    const pageUrl = this.server.getUrlForFile(join(appPath, "routes", path));
    const pageComponent = (await this.runtime.importModule(pageUrl)).exports
      .default;

    const RouteComponent = (
      await this.runtime.importModule(resolvedRouteModulePath)
    ).exports.default;

    const {
      head: pageHead,
      css: pageCss,
      html: rootHtml,
    } = RouteComponent.render({
      pageComponent,
      layoutComponent,
      pageProps: {},
    });

    const headCode = pageHead;
    const cssCode = `<style type="text/css">${css ?? ""}\n${
      pageCss.code ?? ""
    }</style>`;

    const baseHtml = readFileSync(join(appPath, htmlPath)).toString();

    const page = baseHtml
      .replace("<!-- @HEAD -->", headCode)
      .replace("<!-- @CSS -->", cssCode)
      .replace("<!-- @HTML -->", rootHtml)
      .replace("<!-- @SCRIPT -->", script);

    return page;
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
    const [path] = req.url.split("?");
    const pagePath = (!path || path === "/" ? "/index" : path) + ".svelte";
    const layoutPath = join(dirname(pagePath), "_layout.svelte");
    const hasLayout = existsSync(layoutPath);

    const pageUrl = renderer.getUrl(pagePath);

    let layoutUrl;
    if (hasLayout) {
      layoutUrl = renderer.getUrl(layoutPath);
    }

    const code = /* js */ genEntry(pageUrl, layoutUrl, routePath);

    const page = await renderer.renderPage(pagePath, layoutPath, {
      code,
      src: undefined,
      css: undefined,
      preloads: undefined,
    });

    res.setHeader("Content-Type", "text/html");
    res.end(page);
  }).listen(8081);
}

function genEntry(pageUrl, layoutUrl, routeUrl) {
  return `
    import Route from "${routeUrl}";
    import Page from '${pageUrl}';
    
    ${layoutUrl ? `import Layout from '${layoutUrl}'` : `const Layout = null;`};


    let route = new Route({
      target: document.body,
      hydrate: true,
      props: {
        layoutComponent: Layout,
        pageComponent: Page,
        pageProps: {},
      }
    });
    `;
}

async function static({ dev } = {}) {
  const renderer = new Renderer();
  await renderer.init();

  const fileNames = readdirSync(join(appPath, routesDirName)).filter(
    (n) => n !== "_layout.svelte"
  );

  const { entries, virtualEntries, fileNamesEntries } = fileNamesToEntries(
    fileNames
  );
  console.log({ entries });
  mkdirp(join(appPath, exportDirName));

  const build = await rollup(
    rollupConfig({ fileNames: Object.keys(entries), dev, virtualEntries })
  );

  const bundle = await build.write({
    hoistTransitiveImports: false,
    entryFileNames: "entry-[hash].js",
    format: "es",
    dir: join(".", exportDirName, assetsDirName),
  });

  const indexedOutput = new Map(
    bundle.output
      .filter((o) => "facadeModuleId" in o && o.facadeModuleId)
      .map((o) => [o.facadeModuleId.replace(rollupVirtualFilePrefix, ""), o])
  );

  await Promise.all(
    fileNames.map(async function (fileName) {
      const { name, dir } = parse(fileName);

      const hasLayout = existsSync(
        join(appPath, routesDirName, dir, "_layout.svelte")
      );
      const layoutPath = hasLayout ? join(dir, "_layout.svelte") : null;
      const output = indexedOutput.get(fileNamesEntries[fileName]);

      const page = await renderer.renderPage(fileName, layoutPath, {
        src: join("/", assetsDirName, output.fileName),
        preloads: [
          ...(output?.imports ?? []).map((m) => join("/", assetsDirName, m)),
          join("/", assetsDirName, output.fileName),
        ],
        code: undefined,
        css: undefined,
        dev: false,
      });

      await mkdirp(join(".", exportDirName, dir));
      writeFileSync(join(".", exportDirName, dir, `${name}.html`), page);
    })
  );

  await build.close();
  await renderer.stop();
}

function fileNamesToEntries(fileNames) {
  const entries = {};
  const virtualEntries = {};
  const fileNamesEntries = {};
  for (const fileName of fileNames) {
    const { dir, name } = parse(fileName);
    const code = genEntry(
      `./routes/${fileName}`,
      `./routes/${join(dir, "_layout.svelte")}`,
      routeModulePath
    );

    entries[`${name}.js`] = fileName;
    virtualEntries[`${name}.js`] = code;
    fileNamesEntries[fileName] = `${name}.js`;
  }

  return {
    entries,
    virtualEntries,
    fileNamesEntries,
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
            src: join(appPath, "static"),
            dest: join(appPath, "export"),
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

async function main() {
  if (!command || command === "dev") {
    devServer();
  } else if (command === "export") {
    const dev = restArgs.includes("--dev");
    await static({ dev: dev });
    process.exit(0);
  } else {
    console.error("Unrecognized command.");
  }
}

main();
