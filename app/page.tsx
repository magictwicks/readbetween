import Game from "./components/Game";

export default function HomePage() {
  return (
    <main>
      <section>
        <h1>Read Between</h1>
        <p className="metadata">
          A minimalist book guessing game. Start with a sentence, escalate to a
          paragraph, and then a longer excerpt. Ask for hints if you need them.
        </p>
      </section>
      <Game />
      <section className="footer">
        <p>
          Source texts and metadata from Project Gutenberg via the Gutendex API.
        </p>
      </section>
    </main>
  );
}
