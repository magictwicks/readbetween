"use client";

import { useEffect, useState } from "react";

type BookPayload = {
  id: number;
  title: string;
  author: string;
  subjects: string[];
  bookshelves: string[];
  language: string;
  downloadCount: number;
  sentence: string;
  paragraph: string;
  section: string;
  options: string[];
};

type HintKey = "title" | "author" | "subjects" | "bookshelves" | "language";

const hintLabels: Record<HintKey, string> = {
  title: "Reveal title",
  author: "Reveal author",
  subjects: "Reveal subjects",
  bookshelves: "Reveal shelves",
  language: "Reveal language"
};

export default function Game() {
  const [book, setBook] = useState<BookPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [revealLevel, setRevealLevel] = useState(0);
  const [revealedHints, setRevealedHints] = useState<HintKey[]>([]);
  const [guess, setGuess] = useState("");

  const fetchBook = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/book", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Unable to fetch a book right now.");
      }
      const payload = (await response.json()) as BookPayload;
      setBook(payload);
      setRevealLevel(0);
      setRevealedHints([]);
      setGuess("");
    } catch (fetchError) {
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchBook();
  }, []);

  const revealSnippet = () => {
    setRevealLevel((level) => Math.min(level + 1, 2));
  };

  const revealHint = (hint: HintKey) => {
    setRevealedHints((current) =>
      current.includes(hint) ? current : [...current, hint]
    );
  };

  const snippet =
    revealLevel === 0
      ? book?.sentence
      : revealLevel === 1
      ? book?.paragraph
      : book?.section;

  return (
    <section className="section">
      <h2>Guess the book</h2>
      <p className="metadata">
        Each round picks a random Project Gutenberg title. Start with one
        sentence and ask for more only when you need it.
      </p>

      <div className="controls">
        <button onClick={fetchBook} disabled={loading}>
          {loading ? "Loading…" : "New book"}
        </button>
        <button onClick={revealSnippet} disabled={!book || revealLevel >= 2}>
          {revealLevel === 0
            ? "Reveal paragraph"
            : revealLevel === 1
            ? "Reveal longer section"
            : "Full section revealed"}
        </button>
      </div>

      {error && <p className="metadata">{error}</p>}

      <div className="snippet">
        {snippet ?? "Finding a book…"}
      </div>

      <div>
        <h3>Your guess</h3>
        <input
          list="book-options"
          value={guess}
          onChange={(event) => setGuess(event.target.value)}
          placeholder="Start typing a book title…"
          aria-label="Guess the book title"
        />
        <datalist id="book-options">
          {(book?.options ?? []).map((option) => (
            <option key={option} value={option} />
          ))}
        </datalist>
      </div>

      <div>
        <h3>Need a hint?</h3>
        <div className="controls">
          {(Object.keys(hintLabels) as HintKey[]).map((hint) => (
            <button
              key={hint}
              onClick={() => revealHint(hint)}
              disabled={!book || revealedHints.includes(hint)}
            >
              {hintLabels[hint]}
            </button>
          ))}
        </div>
      </div>

      <div className="hints">
        {revealedHints.includes("title") && (
          <p>
            <strong>Title:</strong> {book?.title}
          </p>
        )}
        {revealedHints.includes("author") && (
          <p>
            <strong>Author:</strong> {book?.author}
          </p>
        )}
        {revealedHints.includes("subjects") && (
          <p>
            <strong>Subjects:</strong> {book?.subjects.join(", ") || "None"}
          </p>
        )}
        {revealedHints.includes("bookshelves") && (
          <p>
            <strong>Bookshelves:</strong> {book?.bookshelves.join(", ") || "None"}
          </p>
        )}
        {revealedHints.includes("language") && (
          <p>
            <strong>Language:</strong> {book?.language}
          </p>
        )}
      </div>

      {book && (
        <p className="metadata">
          Download count: {book.downloadCount.toLocaleString()}
        </p>
      )}
    </section>
  );
}
