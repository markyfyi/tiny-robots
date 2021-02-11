<script>
  export let appLayoutComponent;
  export let layoutComponent;
  export let pageComponent;
</script>

{#if appLayoutComponent}
  <svelte:component this="{appLayoutComponent}">
    {#if layoutComponent}
      <svelte:component this="{layoutComponent}">
        <svelte:component this="{pageComponent}" />
      </svelte:component>
    {:else}
      <svelte:component this="{pageComponent}" />
    {/if}
  </svelte:component>
{:else if layoutComponent}
  <svelte:component this="{layoutComponent}">
    <svelte:component this="{pageComponent}" />
  </svelte:component>
{:else}
  <svelte:component this="{pageComponent}" />
{/if}
