<script context="module">
  export async function prefetch() {
    return new Promise((n) =>
      setTimeout(() => n({ wasPrefetched: true }), 1000)
    );
  }
</script>

<script>
  export let wasPrefetched;
  export let fetching;
</script>

<h3>prefetch</h3>
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
