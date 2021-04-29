<script context="module">
  import fs from "fs";
  import path from "path";

  export async function prefetch() {
    const dir = path.dirname(import.meta.url);
    const base = path.basename(import.meta.url);

    // get all svelte files in that dir
    const files = fs
      .readdirSync(dir, { withFileTypes: true })
      .filter(
        (e) =>
          (!e.isDirectory() && e.name !== base && e.name.endsWith(".svelte")) ||
          e.name.endsWith(".svx")
      )
      .map((e) => path.join(dir, e.name));

    // dynamically import all the files !! the *svelte* files !!
    const modules = await Promise.all(
      files.map(async (url) => ({
        url: path.relative(dir, url),
        module: await import(/* @vite-ignore */ url),
      }))
    );

    const pages = modules
      .filter((m) => m.module.metadata)
      .map((m) => ({
        url: m.url,
        metadata: m.module.metadata,
      }));

    return { pages };
  }
</script>

<script>
  export let pages;
</script>

<h3>A dynamic index page</h3>
<p><em>With metadata extraction that works with Svelte and SVX files!</em></p>
{#each pages as page}
  <strong>{page.url}</strong>
  <pre>{JSON.stringify(page.metadata, null, '  ')}</pre>
{/each}

<style>
  pre {
    padding: 12px;
  }
</style>
