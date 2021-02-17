// TODO: handle errors

const manifestUrl = "/assets/manifest.json";
const devManifestUrl = "/assets/manifest";

let lastPendingId;
let pendingIdCtr = 0;

let cachedManifest;
async function manifest() {
  if (cachedManifest) return cachedManifest;
  cachedManifest = await (await fetch(manifestUrl)).json();
  return cachedManifest;
}

async function devManifest() {
  return await (await fetch(devManifestUrl)).json();
}

export function start({ root, dev }) {
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
        const m = await import(entry.js);
        if (lastPendingId !== id) {
          return;
        }

        const { routeProps, page: pageModule } = m;

        const props = routeProps();

        await update(root, pageModule, props, id, params);
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
  }
}

async function update(root, { eager, prefetch }, componentProps, id, params) {
  if (eager) {
    root.$set({
      ...(eager ? componentProps : {}),
      fetching: true,
    });
  }

  let prefetchedProps = {};

  if (prefetch) {
    prefetchedProps = await prefetch({ params });
  }

  if (lastPendingId !== id) {
    return;
  }

  const props = {
    ...(eager ? {} : componentProps),
    fetching: false,
    pageProps: prefetchedProps,
  };

  // if (push) history.replaceState({ prefetchedProps }, undefined, pathname);
  root.$set(props);
}

async function __dev__navigate({ root, pathname, id, params }) {
  const manifest = await devManifest();
  const entry = manifest.paths[pathname];
  if (lastPendingId !== id) {
    return;
  }

  if (entry) {
    const pageModule = await import(entry.js);

    let layoutModule;
    if (entry.__dev__layoutJs) {
      layoutModule = await import(entry.__dev__layoutJs);
    }

    let appLayoutModule;
    if (manifest.__dev__appLayoutUrl) {
      appLayoutModule = await import(manifest.__dev__appLayoutUrl);
    }

    if (lastPendingId !== id) {
      return;
    }

    const componentProps = {
      pageComponent: pageModule.default,
      layoutComponent: layoutModule ? layoutModule.default : undefined,
      appLayoutComponent: appLayoutModule ? appLayoutModule.default : undefined,
    };

    await update(root, pageModule, componentProps, id, params);
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
