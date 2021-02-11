<script>
  export let appLayoutComponent;
  export let layoutComponent;
  export let pageComponent;
  export let pageProps;
</script>

{#if appLayoutComponent}
  <svelte:component this="{appLayoutComponent}">
    {#if layoutComponent}
      <svelte:component this="{layoutComponent}">
        <svelte:component this="{pageComponent}" {...pageProps} />
      </svelte:component>
    {:else}
      <svelte:component this="{pageComponent}" />
    {/if}
  </svelte:component>
{:else if layoutComponent}
  <svelte:component this="{layoutComponent}">
    <svelte:component this="{pageComponent}" {...pageProps} />
  </svelte:component>
{:else}
  <svelte:component this="{pageComponent}" {...pageProps} />
{/if}
