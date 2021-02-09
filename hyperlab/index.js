#!/usr/bin/env node

const { join, parse } = require("path");
const { readFileSync, writeFileSync, readdirSync } = require("fs");
const { createServer } = require("http");

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
// const styles = require("rollup-plugin-styles");
// const virtual = require("@rollup/plugin-virtual");

const assetsDirName = "assets";
const routesDirName = "routes";
const exportDirName = "export";
const htmlPath = "index.html";
// const virtualFilePrefix = "\x00virtual:";
// const jsIndexPath = "index.js";

const appPath = process.cwd();
const [, , command, ...restArgs] = process.argv;

class Renderer {
  async init() {
    this.proxy = httpProxy.createServer({ target: "http://localhost:8081" });

    const config = await loadConfiguration(
      snowpackConfig({ proxyDest: (req, res) => this.proxy.web(req, res) })
    );

    this.server = await startServer({
      config,
      lockfile: undefined,
    });

    this.runtime = this.server.getServerRuntime();
  }

  getUrl(path) {
    return this.server.getUrlForFile(join(appPath, "routes", path));
  }

  async renderPage(path, { src, code, css } = {}) {
    const pageUrl = this.server.getUrlForFile(join(appPath, "routes", path));

    let script = "";
    if (code) {
      script = `<script type="module">${code}</script>`;
    } else if (src) {
      script = `<script type="module" src="${src}"></script>`;
    }

    const component = (await this.runtime.importModule(pageUrl)).exports
      .default;

    const { head: pageHead, css: pageCss, html: rootHtml } = component.render(
      {}
    );

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
    const resolvedPath = (!path || path === "/" ? "/index" : path) + ".svelte";

    const code = `
    import Page from '${renderer.getUrl(resolvedPath)}';
    new Page({
      target: document.body,
      hydrate: true,
    });`;

    const page = await renderer.renderPage(resolvedPath, {
      code,
      src: undefined,
      css: undefined,
    });

    res.setHeader("Content-Type", "text/html");
    res.end(page);
  }).listen(8081);
}

async function static({ dev } = {}) {
  const renderer = new Renderer();
  await renderer.init();

  const fileNames = readdirSync(join(appPath, routesDirName));
  // const { entries, virtualEntries } = fileNamesToEntries(fileNames);
  mkdirp(join(appPath, exportDirName));

  const build = await rollup(rollupConfig({ fileNames, dev }));

  const bundle = await build.write({
    hoistTransitiveImports: false,
    format: "es",
    dir: join(".", exportDirName, assetsDirName),
  });

  // const indexedOutput = new Map(
  //   bundle.output
  //     .filter((o) => "facadeModuleId" in o && o.facadeModuleId)
  //     .map((o) => [o.facadeModuleId, o])
  // );

  await Promise.all(
    fileNames.map(async function (fileName) {
      const { name, dir } = parse(fileName);
      await mkdirp(join(".", exportDirName, dir));
      // const jsFileName = indexedOutput.get(
      //   `${virtualFilePrefix}./${fileName}.js`
      // )?.fileName;
      const page = await renderer.renderPage(fileName, {
        // src: jsFileName ? join("/", assetsDirName, jsFileName) : undefined,
        src: undefined,
        code: `
        import Page from "${join("/", assetsDirName, `${name}.js`)}";
        new Page({
          target: document.body,
          hydrate: true,
        });
        `,
        css: undefined,
        dev: false,
      });

      writeFileSync(join(".", exportDirName, dir, `${name}.html`), page);
    })
  );

  await build.close();
  await renderer.stop();
}

function rollupConfig({ fileNames, dev }) {
  return {
    input: fileNames.map((n) => join(".", routesDirName, n)),
    plugins: [
      replace({
        "process.browser": true,
        "process.env": JSON.stringify({
          NODE_ENV: dev ? "development" : "production",
        }),
      }),
      // virtual(virtualEntries),
      svelte({
        emitCss: false,
        compilerOptions: {
          dev,
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

// function fileNamesToEntries(fileNames) {
//   const entries = {};
//   const virtualEntries = {};
//   for (const fileName of fileNames) {
//     const file = `./${fileName}.js`;
//     const code = `
// import Page from './${join(".", routesDirName, fileName)}';
// import { start } from "./index";
// start(Page);`;
//     entries[fileName] = file;
//     virtualEntries[file] = code;
//   }

//   return {
//     entries,
//     virtualEntries,
//   };
// }
