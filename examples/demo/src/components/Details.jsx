export default function Details() {
  return (
    <>
      <nav className="nav">
        <a href="https://github.com/low-orbit-io/bruin">Documentation</a>
        <a href="https://github.com/low-orbit-io/bruin">Github</a>
      </nav>
      <div className="bottom">
        <a
          href="https://github.com/low-orbit-io/bruin/tree/main/examples/demo"
          className="bottom-right"
        >
          {'<Source />'}
        </a>
        <a
          href="https://www.instagram.com/tina.henschel/"
          className="bottom-left"
        >
          Illustrations @ Tina Henschel
        </a>
      </div>
      <span className="header-left">Bruin</span>
    </>
  )
}
