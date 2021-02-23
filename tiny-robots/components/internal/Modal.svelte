<!-- COPIED FROM https://svelte.dev/examples#modal -->
<script>
  import { createEventDispatcher, onDestroy, onMount } from "svelte";
  import { fade, fly } from "svelte/transition";

  export let closeText;
  let modalElem;

  const dispatch = createEventDispatcher();
  const close = () => dispatch("close");

  const handle_keydown = (e) => {
    if (e.key === "Escape") {
      close();
      return;
    }

    if (e.key === "Tab") {
      // trap focus
      const nodes = modalElem.querySelectorAll("*");
      const tabbable = Array.from(nodes).filter((n) => n.tabIndex >= 0);

      let index = tabbable.indexOf(document.activeElement);
      if (index === -1 && e.shiftKey) index = 0;

      index += tabbable.length + (e.shiftKey ? -1 : 1);
      index %= tabbable.length;

      tabbable[index].focus();
      e.preventDefault();
    }
  };

  const previouslyFocusedElem =
    typeof document !== "undefined" && document.activeElement;

  onMount(() => {
    // document.body.style.overflow = "hidden";
  });

  onDestroy(() => {
    // document.body.style.overflow = "scroll";
    if (previouslyFocusedElem) {
      previouslyFocusedElem.focus();
    }
  });
</script>

<svelte:window on:keydown="{handle_keydown}" />

<div class="tr-modal-background" in:fade out:fade on:click="{close}"></div>

<div
  class="tr-modal"
  role="dialog"
  aria-modal="true"
  in:fly="{{ y: -100, duration: 400 }}"
  out:fly="{{ y: 500, duration: 400 }}"
  bind:this="{modalElem}"
>
  <slot />
  <!-- svelte-ignore a11y-autofocus -->
  <button class="tr-modal-close-button" autofocus on:click="{close}"
    >{"×"}</button
  >
</div>

<style>
  .tr-modal-close-button {
    position: absolute;
    top: 0px;
    right: 6px;
    border: none;
    background: none;
    font-size: 24px;
    cursor: pointer;
  }

  .tr-modal-background {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
  }

  .tr-modal {
    position: fixed;
    left: 50%;
    top: 50%;
    overflow: auto;
    transform: translate(-50%, -50%);
    border-radius: 4px;
    backdrop-filter: blur(20px) saturate(3);
    -webkit-backdrop-filter: blur(20px) saturate(3);
    background-color: #ecececa6;
    z-index: 2;
  }
</style>
