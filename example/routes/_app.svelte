<main>
  <h1>
    <a href="/">Tiny Robots</a>
  </h1>
  <center>
    <a href="https://github.com/mkshio/tiny-robots/tree/master/tiny-robots">
      <img
        class="icon"
        src="/static/github.svg"
        alt="An octocat"
        height="24px"
        width="24px"
      />
    </a>
    <a href="https://www.npmjs.com/package/tiny-robots">
      <img
        class="icon"
        src="/static/npm.svg"
        alt="npm's logo"
        height="24px"
        width="24px"
      />
    </a>
  </center>

  <slot />

  <hr />
  <h3>Sample pages</h3>
  <nav>
    <ul>
      <li><a href="/eager">eager pre-fetch</a></li>
      <li><a href="/blocking?arg=1">blocking pre-fetch</a></li>
      <li><a href="/path/">path</a></li>
      <li><a href="/secondary">secondary</a></li>
      <li><a href="/path/secondary">path secondary</a></li>
    </ul>
  </nav>
</main>

<style>
  h1 {
    text-align: center;
  }

  h1 a {
    color: unset;
    text-decoration: none;
  }

  main {
    max-width: 640px;
    margin: 0 auto;
    padding: 12px;
  }

  nav {
    margin-bottom: 12px;
  }

  ul {
    display: flex;
    justify-content: space-around;
    flex-wrap: wrap;
    padding: 0;
  }

  li {
    margin-right: 12px;
    margin-bottom: 12px;
    list-style-type: none;
  }

  .icon {
    padding: 0px 12px;
  }
</style>
