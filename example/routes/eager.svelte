<script context="module">
  export const eager = true;

  export const metadata = {
    name: "Eager",
    desc: "Demo of a fetch with a non-blocking, loading state..",
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

<h3>eager prefetch</h3>

<p>This page won't block when navigated to on the client.</p>

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
