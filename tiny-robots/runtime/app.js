// TODO: handle errors

const manifestUrl = "/assets/manifest.json";

let pendingIdCtr = 0;
let lastPendingId = pendingIdCtr;

/** @type {{ paths: {[name: string]: { js: string, data: any }} }} */
let cachedManifest;
async function manifest(refetch = false) {
  if (!refetch && cachedManifest) return cachedManifest;
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
        linkEl.href = match.data;
        linkEl.rel = "preload";
        linkEl.as = "fetch";
        linkEl.type = "application/json";
        document.head.appendChild(linkEl);
      }
    }
  }
};

export function start({ root, dev, page, pageProps }) {
  async function onURLChange(url, push) {
    const pathname =
      (url.pathname[url.pathname.length - 1] === "/"
        ? url.pathname.slice(0, -1)
        : url.pathname) || "/";

    const params = parseParams(url.search);

    const id = pendingIdCtr++;
    lastPendingId = id;

    if (push) history.pushState({ id }, undefined, url.href);

    if (dev) {
      await __dev__navigate({ root, pathname, id, params, url });
    } else {
      await navigate({ root, pathname, id, params, url });
    }
  }

  addEventListener("popstate", (e) => {
    onURLChange(new URL(document.location));
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
      const nagvigated = onURLChange(url, true);
      if (nagvigated) {
        e.preventDefault();
      }
    }
  });

  if (!dev) {
    manifest();
  }

  setTimeout(preLoad, 200);

  bootstrap({ root, dev, page, pageProps, id: pendingIdCtr });
}

function scroll(url) {
  return; // todo...
  const urlHashNode = url.hash && document.getElementById(url.hash.slice(1));
  let scrollY = 0;
  if (urlHashNode) {
    scrollY = urlHashNode.getBoundingClientRect().top + scrollY;
  }
  scrollTo(0, scrollY);
}

async function update(
  pageId,
  pathname,
  root,
  { eager, clientFetch },
  componentProps,
  id,
  params,
  data,
  url
) {
  if (eager) {
    root.$set({
      ...(eager ? componentProps : {}),
      pathname,
      pageId,
      fetching: true,
      pageProps: { ...data },
    });
    scroll(url);
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

  if (!eager) {
    scroll(url);
  }

  setTimeout(preLoad, 200);
}

async function navigate({ root, pathname, id, params, url }) {
  const entry = (await manifest()).paths[pathname];

  if (lastPendingId !== id) {
    return;
  }

  if (entry) {
    const [{ routeProps, page: pageModule }, data] = await Promise.all([
      import(/* @vite-ignore */ entry.js),
      // get preloaded
      entry.data
        ? fetch(entry.data, {
            method: "GET",
            credentials: "include",
            mode: "no-cors",
          }).then((r) => r.json())
        : null,
    ]);

    if (lastPendingId !== id) {
      return;
    }

    const componentProps = routeProps();

    await update(
      entry.pageId,
      pathname,
      root,
      pageModule,
      componentProps,
      id,
      params,
      data,
      url
    );

    return true;
  }
}

async function __dev__navigate({ root, pathname, id, params, url }) {
  const entries = await manifest(true);
  const entry = entries.paths[pathname];
  if (lastPendingId !== id) {
    return;
  }

  if (entry) {
    const [
      pageModule,
      layoutModule,
      appLayoutModule,
      prefetchedProps,
    ] = await Promise.all([
      import(/* @vite-ignore */ entry.js),
      entry.__dev__layoutJs
        ? import(/* @vite-ignore */ entry.__dev__layoutJs)
        : null,
      entries.__dev__appLayoutUrl
        ? import(/* @vite-ignore */ entries.__dev__appLayoutUrl)
        : null,
      fetch(`/_dev_prefetch${pathname}`).then(
        (res) => (res.ok ? res.json() : {}),
        () => ({})
      ),
    ]);
    const componentProps = {
      pageComponent: pageModule.default,
      layoutComponent: layoutModule ? layoutModule.default : undefined,
      appLayoutComponent: appLayoutModule ? appLayoutModule.default : undefined,
    };

    if (lastPendingId !== id) {
      return;
    }

    await update(
      entry.pageId,
      pathname,
      root,
      pageModule,
      componentProps,
      id,
      params,
      prefetchedProps,
      url
    );

    return true;
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
