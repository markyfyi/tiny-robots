<script>
  export let layoutComponent;
  export let pageComponent;
</script>

{#if layoutComponent}
  <svelte:component this="{layoutComponent}">
    <svelte:component this="{pageComponent}" />
  </svelte:component>
{:else}
  <svelte:component this="{pageComponent}" />
{/if}
