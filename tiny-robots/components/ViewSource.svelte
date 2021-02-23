<script>
  import { onMount } from "svelte";
  import Modal from "./internal/Modal.svelte";

  /** @type string | undefined */
  export let pageId;

  const isBrowser = typeof window !== "undefined";

  /** @type string | undefined */
  let openPageId = undefined;
  let selectedTab = "main";

  /** @type {{
   *  [pageId: string]: {
   *    fetching?: boolean;
   *    error?: boolean,
   *    source?: {
   *      main: string,
   *      compiled: string,
   *      entry: string
   *    }
   *  }
   * }} */
  const sources = {};

  /** @param pageId {string | undefined} */
  async function fetchSource(pageId) {
    if (!pageId) {
      return;
    }

    if (sources[pageId] && !sources[pageId].error) {
      return;
    }

    sources[pageId] = { fetching: true };

    try {
      const source = await (
        await fetch("/view-source/entries/" + pageId + ".json")
      ).json();
      sources[pageId] = { source, fetching: false };
    } catch (error) {
      sources[pageId] = { fetching: false, error: true };
    }
  }

  function selectTab(tab) {
    selectedTab = tab;
  }

  function resetModal() {
    openPageId = undefined;
    selectedTab = "main";
  }

  onMount(() => fetchSource(pageId));

  $: isBrowser && fetchSource(pageId);
</script>

{#if openPageId}
  <Modal on:close="{resetModal}">
    <div class="tr-view-source-container">
      <div class="tr-view-source-info">
        <h3 class="tr-view-source-heading">
          Source code for route: <em>/{pageId}</em>
        </h3>
        <div>
          <em>
            <small
              >This site was built with <a
                class="tr-view-source-link"
                href="https://tinyrobots.mksh.io/">Tiny Robots</a
              ></small
            >
          </em>
          🤖 <em><small>#bringbackviewsource</small></em>
        </div>
      </div>
      {#if sources[openPageId] && sources[openPageId].source}
        <div>
          {#if sources[openPageId].source.main}
            <button
              class="tr-view-source-pill-button"
              class:selected="{selectedTab === 'main'}"
              on:click="{() => selectTab('main')}">Route</button
            >
          {/if}
          {#if sources[openPageId].source.entry}
            <button
              class="tr-view-source-pill-button"
              class:selected="{selectedTab === 'entry'}"
              on:click="{() => selectTab('entry')}">Entry (Generated)</button
            >
          {/if}
          {#if sources[openPageId].source.compiled}
            <button
              class="tr-view-source-pill-button"
              class:selected="{selectedTab === 'compiled'}"
              on:click="{() => selectTab('compiled')}">Compiled</button
            >
          {/if}
        </div>
        {#if sources[openPageId].source[selectedTab]}
          <pre
            class="tr-view-source-code">{sources[openPageId].source[selectedTab]}</pre>
        {/if}
      {:else if sources[openPageId] && sources[openPageId].fetching}
        <em>Fetching...</em>
      {:else if sources[openPageId] && sources[openPageId].error}
        <em>Oops! Failed to fetch source code.</em>
      {:else}
        <em>Invalid page</em>
      {/if}
    </div>
  </Modal>
{:else}
  <button
    class="tr-view-source-open-button"
    on:click="{() => (openPageId = pageId)}">{"<view source>"}</button
  >
{/if}

<style>
  :global(.tr-modal) {
    width: calc(100vw - 2em);
    max-width: 52em;
    height: calc(100vh - 2em);
  }

  .tr-view-source-link {
    color: #175de2;
    text-decoration: none;
    font-weight: 700;
  }

  .tr-view-source-heading {
    font-weight: bold;
    font-size: 1.2rem;
    margin: 0;
  }

  .tr-view-source-info {
    margin-bottom: 12px;
  }

  .tr-view-source-container {
    color: #222;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen,
      Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 12px;
    box-sizing: border-box;
  }

  .tr-view-source-open-button {
    position: fixed;
    bottom: 24px;
    right: 24px;
    background: #ffffff88;
    color: #222;
    backdrop-filter: blur(15px) saturate(2);
    -webkit-backdrop-filter: blur(15px) saturate(2);
    border-radius: 4px;
    padding: 6px;
    font-weight: 900;
    font-size: 0.7em;
    border: none;
    cursor: pointer;
    font-family: Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace;
    transition: background 200ms;
  }

  .tr-view-source-open-button:hover {
    background: #ffffffaa;
  }

  .tr-view-source-pill-button {
    background: none;
    border: none;
    padding: 6px 12px;
    border-radius: 4px;
    cursor: pointer;
    transition: color 200ms, background-color 200ms;
  }

  .tr-view-source-pill-button.selected {
    background-color: #222;
    color: #fff;
  }

  .tr-view-source-code {
    text-transform: none;
    background-color: #222;
    border-radius: 4px;
    padding: 24px;
    color: #fff;
    overflow: scroll;
    white-space: pre-wrap;
    font-size: 1rem;
    flex: 1;
  }
</style>
