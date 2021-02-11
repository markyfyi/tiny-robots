<script context="module">
  export async function prefetch() {
    return new Promise((n) =>
      setTimeout(() => n({ wasPrefetched: true }), 200)
    );
  }
</script>

<script>
  export let wasPrefetched;
</script>

<h3>prefetch</h3>
<strong>Was prefetched?</strong>
<small>
  <em>
    {wasPrefetched}
  </em>
</small>
