<script>
  export let appLayoutComponent;
  export let layoutComponent;
  export let pageComponent;
  export let pageProps;
  export let loading;
  export let fetching;
</script>

{#if appLayoutComponent}
  <svelte:component
    this="{appLayoutComponent}"
    loading="{loading}"
    fetching="{fetching}"
  >
    {#if layoutComponent}
      <svelte:component
        this="{layoutComponent}"
        loading="{loading}"
        fetching="{fetching}"
      >
        <svelte:component
          this="{pageComponent}"
          {...pageProps}
          loading="{loading}"
          fetching="{fetching}"
        />
      </svelte:component>
    {:else}
      <svelte:component
        this="{pageComponent}"
        loading="{loading}"
        fetching="{fetching}"
      />
    {/if}
  </svelte:component>
{:else if layoutComponent}
  <svelte:component
    this="{layoutComponent}"
    loading="{loading}"
    fetching="{fetching}"
  >
    <svelte:component
      this="{pageComponent}"
      {...pageProps}
      loading="{loading}"
      fetching="{fetching}"
    />
  </svelte:component>
{:else}
  <svelte:component
    this="{pageComponent}"
    {...pageProps}
    loading="{loading}"
    fetching="{fetching}"
  />
{/if}
