"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function Generate() {
  const [topic, setTopic] = useState("");
  const [author, setAuthor] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    if (!topic.trim() || !author.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await axios.post(`${API}/api/generate`, { topic, author });
      router.push(`/episode/${res.data._id}`);
    } catch (err) {
      setError("Something went wrong. Try again.");
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 560, margin: "0 auto", padding: "64px 24px" }}>
      <Link
        href="/"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          color: "var(--color-ink-subtle)",
          fontSize: 14,
          marginBottom: 32,
        }}
      >
        ← Home
      </Link>

      <h1
        style={{
          fontSize: 28,
          fontWeight: 600,
          letterSpacing: "-0.6px",
          marginBottom: 8,
        }}
      >
        Generate a Podcast
      </h1>
      <p style={{ color: "var(--color-ink-subtle)", marginBottom: 32 }}>
        Pick a topic. Two AI hosts will discuss it for about 5 minutes.
      </p>

      <form onSubmit={handleSubmit}>
        <label
          htmlFor="topic"
          style={{ display: "block", fontSize: 14, marginBottom: 6 }}
        >
          Topic
        </label>
        <input
          id="topic"
          name="topic"
          type="text"
          autoComplete="off"
          placeholder="e.g. Why sleep matters for productivity…"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          disabled={loading}
          style={{
            width: "100%",
            background: "var(--color-surface-1)",
            border: "1px solid var(--color-hairline)",
            borderRadius: 8,
            padding: "10px 12px",
            color: "var(--color-ink)",
            fontSize: 15,
            marginBottom: 20,
          }}
        />

        <label
          htmlFor="author"
          style={{ display: "block", fontSize: 14, marginBottom: 6 }}
        >
          Your Name
        </label>
        <input
          id="author"
          name="author"
          type="text"
          autoComplete="name"
          placeholder="e.g. Rajdeep"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          disabled={loading}
          style={{
            width: "100%",
            background: "var(--color-surface-1)",
            border: "1px solid var(--color-hairline)",
            borderRadius: 8,
            padding: "10px 12px",
            color: "var(--color-ink)",
            fontSize: 15,
            marginBottom: 24,
          }}
        />

        {error && (
          <p
            role="alert"
            aria-live="polite"
            style={{ color: "#ff6b6b", fontSize: 14, marginBottom: 16 }}
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            background: "var(--color-primary)",
            color: "white",
            border: "none",
            borderRadius: 8,
            padding: "10px 20px",
            fontSize: 14,
            fontWeight: 500,
            width: "100%",
          }}
        >
          {loading ? "Generating… (~1-2 min)" : "Generate Podcast"}
        </button>
      </form>
    </main>
  );
}