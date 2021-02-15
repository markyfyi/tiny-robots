<main>
  <h1><a href="/">tiny robots demo app</a></h1>

  <nav>
    <ul>
      <li><a href="/prefetch">prefetch</a></li>
      <li><a href="/eager">eager prefetch</a></li>
      <li><a href="/path/">path</a></li>
      <li><a href="/secondary">secondary</a></li>
      <li><a href="/path/secondary">path secondary</a></li>
    </ul>
  </nav>

  <slot />
</main>

<style>
  main {
    max-width: 640px;
    margin: 0 auto;
    padding: 0 12px;
  }

  ul {
    display: flex;
    justify-content: space-between;
    flex-wrap: wrap;
  }

  li {
    margin-right: 12px;
    margin-bottom: 12px;
    list-style-type: none;
  }
</style>
