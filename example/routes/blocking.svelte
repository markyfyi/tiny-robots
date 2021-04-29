<script context="module">
  export const metadata = {
    name: "Blocking",
    desc: "Demo of a fetch that blocks on the client.",
  };

  export async function prefetch() {
    return new Promise((n) =>
      setTimeout(() => n({ wasStaticPrefetched: true }), 300)
    );
  }

  export async function clientFetch() {
    return new Promise((n) =>
      setTimeout(() => n({ wasClientPrefetched: true }), 1000)
    );
  }
</script>

<script>
  export let wasStaticPrefetched;
  export let wasClientPrefetched;
  export let fetching = false;
</script>

<h3>blocking prefetch</h3>

<p>This page <strong>will</strong> block when navigated to on the client.</p>

<p>
  Was statically prefetched: {wasStaticPrefetched}
</p>

<p>
  Was client prefetched: {#if fetching}
    (fetching...)
  {:else}
    {wasClientPrefetched}
  {/if}
</p>
