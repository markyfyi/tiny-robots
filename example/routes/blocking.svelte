<script context="module">
  export async function prefetch() {
    return new Promise((n) =>
      setTimeout(() => n({ wasPrefetched: true }), 300)
    );
  }
</script>

<script>
  export let wasPrefetched;
  export let fetching;
</script>

<h3>blocking prefetch</h3>

<p>This page <strong>will</strong> block when navigated to on the client.</p>

<p>
  <em>
    {#if fetching}
      (fetching...)
    {:else}
      wasPrefetched: {wasPrefetched}
    {/if}
  </em>
</p>
