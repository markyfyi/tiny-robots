<script>
  export let appLayoutComponent;
  export let layoutComponent;
  export let pageComponent;
  export let pageProps;
  export let pageId;
  export let fetching;
</script>

{#if appLayoutComponent && layoutComponent}
  <svelte:component
    this="{appLayoutComponent}"
    fetching="{fetching}"
    pageId="{pageId}"
  >
    {#if layoutComponent}
      <svelte:component
        this="{layoutComponent}"
        fetching="{fetching}"
        pageId="{pageId}"
      >
        <svelte:component
          this="{pageComponent}"
          {...pageProps}
          fetching="{fetching}"
          pageId="{pageId}"
        />
      </svelte:component>
    {:else}
      <svelte:component
        this="{pageComponent}"
        fetching="{fetching}"
        pageId="{pageId}"
      />
    {/if}
  </svelte:component>
{:else if appLayoutComponent && !layoutComponent}
  <svelte:component
    this="{appLayoutComponent}"
    fetching="{fetching}"
    pageId="{pageId}"
  >
    <svelte:component
      this="{pageComponent}"
      {...pageProps}
      fetching="{fetching}"
      pageId="{pageId}"
    />
  </svelte:component>
{:else if layoutComponent && !appLayoutComponent}
  <svelte:component
    this="{layoutComponent}"
    fetching="{fetching}"
    pageId="{pageId}"
  >
    <svelte:component
      this="{pageComponent}"
      {...pageProps}
      fetching="{fetching}"
      pageId="{pageId}"
    />
  </svelte:component>
{:else}
  <svelte:component
    this="{pageComponent}"
    {...pageProps}
    fetching="{fetching}"
    pageId="{pageId}"
  />
{/if}
