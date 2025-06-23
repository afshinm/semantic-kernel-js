import Chat from './Chat';

export default function Home() {
  return (
    <main className="container" style={{height: "100%"}}>
      <nav>
        <ul>
          <li>
            <strong>Semantic Kernel Chat</strong>
          </li>
        </ul>
        <ul>
          <li>
            <a href="#">GitHub</a>
          </li>
        </ul>
      </nav>

      <Chat />
    </main>
  );
}
