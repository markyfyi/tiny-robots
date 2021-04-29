// TODO: handle errors

const manifestUrl = "/assets/manifest.json";

let pendingIdCtr = 0;
let lastPendingId = pendingIdCtr;

/** @type {{ paths: {[name: string]: { js: string, data: any }} }} */
let cachedManifest;
async function manifest() {
  if (cachedManifest) return cachedManifest;
  cachedManifest = await (await fetch(manifestUrl)).json();
  return cachedManifest;
}

async function bootstrap({ dev, root, page, pageProps, id }) {
  if (page.clientFetch) {
    root.$set({
      fetching: true,
    });

    try {
      const params = parseParams(new URL(document.location).search);
      const clientProps = await page.clientFetch({ params });

      if (lastPendingId !== id) {
        return;
      }

      root.$set({
        fetching: false,
        pageProps: { ...pageProps, ...clientProps },
      });
    } catch (error) {
      console.error(error);
      root.$set({
        fetching: false,
        clientFetchError: true,
        pageProps: { ...pageProps },
      });
    }
  }
}

const preLoaded = new Set();
const preLoad = async () => {
  const links = Array.from(document.querySelectorAll("a"));

  for (const link of links) {
    if (
      link.origin !== document.location.origin ||
      link.pathname === document.location.pathname
    ) {
      continue;
    }

    const match = (await manifest()).paths[link.pathname];
    if (match && !preLoaded.has(link.pathname)) {
      preLoaded.add(link.pathname);

      const linkEl = document.createElement("link");
      linkEl.rel = "modulepreload";
      linkEl.href = match.js;
      document.head.appendChild(linkEl);

      if (match.data) {
        const linkEl = document.createElement("link");
        linkEl.rel = "preload";
        linkEl.as = "fetch";
        linkEl.href = match.data;
        document.head.appendChild(linkEl);
      }
    }
  }
};
export function start({ root, dev, page, pageProps }) {
  async function navigate(url, push) {
    const pathname =
      (url.pathname[url.pathname.length - 1] === "/"
        ? url.pathname.slice(0, -1)
        : url.pathname) || "/";

    const params = parseParams(url.search);

    const id = pendingIdCtr++;
    lastPendingId = id;

    if (push) history.pushState({ id }, undefined, url.href);

    if (dev) {
      await __dev__navigate({ root, pathname, id, params });
      return true;
    } else {
      const entry = (await manifest()).paths[pathname];

      if (lastPendingId !== id) {
        return;
      }

      if (entry) {
        const [m, data] = await Promise.all([
          import(/* @vite-ignore */ entry.js),
          entry.data ? fetch(entry.data).then((r) => r.json()) : null,
        ]);

        if (lastPendingId !== id) {
          return;
        }

        const { routeProps, page: pageModule } = m;

        const props = routeProps();

        await update(
          entry.pageId,
          pathname,
          root,
          pageModule,
          props,
          id,
          params,
          data
        );

        setTimeout(preLoad, 1000);

        return true;
      }
    }
  }

  addEventListener("popstate", (e) => {
    navigate(new URL(document.location));
  });

  addEventListener("click", async (e) => {
    // TODO: check if click came from an A tag somehow
    if (!e.target.href) return;
    const url = new URL(e.target.href);

    if (
      url.origin === document.location.origin &&
      url.pathname === document.location.pathname
    ) {
      return;
    }

    if (url.origin === document.location.origin) {
      const nagvigated = navigate(url, true);
      if (nagvigated) {
        e.preventDefault();
      }
    }
  });

  if (!dev) {
    manifest();
    setTimeout(preLoad, 1000);
  }

  bootstrap({ root, dev, page, pageProps, id: pendingIdCtr });
}

async function update(
  pageId,
  pathname,
  root,
  { eager, clientFetch },
  componentProps,
  id,
  params,
  data
) {
  if (eager) {
    root.$set({
      ...(eager ? componentProps : {}),
      pathname,
      pageId,
      fetching: true,
      pageProps: { ...data },
    });
  }

  let clientProps = {};

  if (clientFetch) {
    clientProps = await clientFetch({ params });
  }

  if (lastPendingId !== id) {
    return;
  }

  const props = {
    ...(eager ? {} : componentProps),
    pathname,
    pageId,
    fetching: false,
    pageProps: { ...data, ...clientProps },
  };

  root.$set(props);
}

async function __dev__navigate({ root, pathname, id, params }) {
  const manifest = await (await fetch(manifestUrl)).json();
  const entry = manifest.paths[pathname];
  if (lastPendingId !== id) {
    return;
  }

  if (entry) {
    const [pageModule, layoutModule, appLayoutModule] = await Promise.all([
      import(/* @vite-ignore */ entry.js),
      entry.__dev__layoutJs
        ? import(/* @vite-ignore */ entry.__dev__layoutJs)
        : null,
      manifest.__dev__appLayoutUrl
        ? import(/* @vite-ignore */ manifest.__dev__appLayoutUrl)
        : null,
    ]);

    let prefetchedProps;
    if (pageModule.prefetch) {
      prefetchedProps = await (await fetch("/_dev_prefetch" + pathname)).json();
    }

    if (lastPendingId !== id) {
      return;
    }

    const componentProps = {
      pageComponent: pageModule.default,
      layoutComponent: layoutModule ? layoutModule.default : undefined,
      appLayoutComponent: appLayoutModule ? appLayoutModule.default : undefined,
    };

    await update(
      entry.pageId,
      pathname,
      root,
      pageModule,
      componentProps,
      id,
      params,
      prefetchedProps
    );
  }
}

function parseParams(querystring = "") {
  // parse query string
  const params = new URLSearchParams(querystring);

  const obj = {};

  // iterate over all keys
  for (const key of params.keys()) {
    if (params.getAll(key).length > 1) {
      obj[key] = params.getAll(key);
    } else {
      obj[key] = params.get(key);
    }
  }

  return obj;
}
