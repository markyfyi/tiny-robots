// TODO: handle errors

const manifestUrl = "/assets/manifest.json";
const devAppRoute = "/routes/_app.svelte.js";

let cachedManifest;
async function manifest() {
  if (cachedManifest) return cachedManifest;
  cachedManifest = await (await fetch(manifestUrl)).json();
  return cachedManifest;
}

export function start({ root, dev }) {
  async function navigate(url, push) {
    const pathname =
      url.pathname !== "/" && url.pathname[url.pathname.length - 1] === "/"
        ? url.pathname.slice(0, -1)
        : url.pathname;

    if (!dev) {
      if (push) history.pushState({}, undefined, pathname);
      const entry = (await manifest())[pathname];
      if (entry) {
        const m = await import(entry.js);
        const { routeProps, page: pageModule } = m;

        // if (push) {
        //   history.replaceState({ prefetchedProps }, undefined, pathname);
        // }

        update(root, pageModule, routeProps());
        return true;
      }
    } else {
      await devNavigate({ root, pathname, push });

      return true;
    }
  }

  addEventListener("popstate", (e) => {
    navigate(new URL(document.location));
  });

  addEventListener("click", async (e) => {
    // TODO: check if click came from an A tag somehow
    if (!e.target.href) return;
    const url = new URL(e.target.href);
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

async function devNavigate({ root, pathname, push }) {
  if (push) history.pushState({}, undefined, pathname);
  const pathdir = pathname.split("/").slice(0, -1).join("/");

  root.$set({
    loading: true,
  });

  const [pageModule, layoutModule, appModule] = await Promise.all([
    await import("/routes" + (pathname || "/index") + ".svelte.js"),
    await import(
      "/routes" + pathdir + "/" + "_layout" + ".svelte.js"
    ).catch(() => {}),
    await import(devAppRoute).catch(() => {}),
  ]);

  const Page = pageModule.default;

  const componentProps = {
    pageComponent: Page,
    layoutComponent: layoutModule ? layoutModule.default : undefined,
    appComponent: appModule ? appModule.default : undefined,
  };

  update(root, pageModule, componentProps);
}

async function update(root, { eager, prefetch }, componentProps) {
  if (eager) {
    root.$set({
      ...(eager ? componentProps : {}),
      fetching: true,
    });
  }

  let prefetchedProps = {};
  if (prefetch) {
    prefetchedProps = await prefetch();
  }

  // if (push) history.replaceState({ prefetchedProps }, undefined, pathname);
  root.$set({
    ...(eager ? {} : componentProps),
    fetching: false,
    pageProps: prefetchedProps,
  });
}
