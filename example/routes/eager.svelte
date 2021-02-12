<script context="module">
  export const eager = true;
  export async function prefetch() {
    return new Promise((n) =>
      setTimeout(() => n({ wasPrefetched: true }), 1000)
    );
  }
</script>

<script>
  export let wasPrefetched;
  export let fetching = false;
</script>

<h3>eager prefetch</h3>
<p>
  <em>
    {#if fetching}
      (fetching...)
    {:else}
      wasPrefetched: {wasPrefetched}
    {/if}
  </em>
</p>

<a href="/">index</a>
