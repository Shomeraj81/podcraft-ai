"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import axios from "axios";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function EpisodeDetail() {
  const { id } = useParams();
  const [episode, setEpisode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [commentName, setCommentName] = useState("");
  const [commentText, setCommentText] = useState("");
  const [liking, setLiking] = useState(false);

  function load() {
    axios
      .get(`${API}/api/episodes/${id}`)
      .then((res) => setEpisode(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, [id]);

  async function handleLike() {
    setLiking(true);
    try {
      const res = await axios.post(`${API}/api/episodes/${id}/like`);
      setEpisode(res.data);
    } finally {
      setLiking(false);
    }
  }

  async function handleComment(e) {
    e.preventDefault();
    if (!commentName.trim() || !commentText.trim()) return;
    const res = await axios.post(`${API}/api/episodes/${id}/comment`, {
      name: commentName,
      text: commentText,
    });
    setEpisode(res.data);
    setCommentText("");
  }

  const HomeLink = (
    <Link
      href="/"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        color: "var(--color-ink-subtle)",
        fontSize: 14,
        marginBottom: 24,
      }}
    >
      ← Home
    </Link>
  );

  if (loading) {
    return (
      <main style={{ maxWidth: 720, margin: "0 auto", padding: 24 }}>
        {HomeLink}
        <p style={{ color: "var(--color-ink-subtle)" }}>Loading…</p>
      </main>
    );
  }

  if (!episode) {
    return (
      <main style={{ maxWidth: 720, margin: "0 auto", padding: 24 }}>
        {HomeLink}
        <p>Episode not found.</p>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "32px 24px" }}>
      {HomeLink}

      <img
        src={episode.thumbnailUrl}
        alt={episode.title}
        width={720}
        height={720}
        style={{
          width: "100%",
          aspectRatio: "1/1",
          objectFit: "cover",
          borderRadius: 12,
          marginBottom: 24,
        }}
      />

      <h1
        style={{
          fontSize: 28,
          fontWeight: 600,
          letterSpacing: "-0.6px",
          margin: "0 0 4px",
        }}
      >
        {episode.title}
      </h1>
      <p style={{ color: "var(--color-ink-subtle)", marginBottom: 20 }}>
        by {episode.author}
      </p>

      <audio
        controls
        src={episode.audioUrl}
        style={{ width: "100%", marginBottom: 20 }}
      >
        <track kind="captions" />
      </audio>

      <button
        onClick={handleLike}
        disabled={liking}
        aria-label={`Like this podcast, currently ${episode.likes} likes`}
        style={{
          background: "var(--color-surface-1)",
          border: "1px solid var(--color-hairline)",
          color: "var(--color-ink)",
          borderRadius: 8,
          padding: "8px 16px",
          fontSize: 14,
          marginBottom: 32,
        }}
      >
        ♥ {episode.likes} {episode.likes === 1 ? "Like" : "Likes"}
      </button>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, fontWeight: 500, marginBottom: 12 }}>
          Transcript
        </h2>
        <div
          style={{
            background: "var(--color-surface-1)",
            border: "1px solid var(--color-hairline)",
            borderRadius: 12,
            padding: 20,
            maxHeight: 300,
            overflowY: "auto",
          }}
        >
          {episode.script.map((line, i) => (
            <p key={i} style={{ fontSize: 14, lineHeight: 1.6, margin: "0 0 10px" }}>
              <strong style={{ color: "var(--color-primary)" }}>
                {line.speaker}:
              </strong>{" "}
              {line.line}
            </p>
          ))}
        </div>
      </section>

      <section>
        <h2 style={{ fontSize: 18, fontWeight: 500, marginBottom: 12 }}>
          Comments ({episode.comments.length})
        </h2>

        <form onSubmit={handleComment} style={{ marginBottom: 24 }}>
          <label htmlFor="cname" style={{ display: "block", fontSize: 13, marginBottom: 4 }}>
            Name
          </label>
          <input
            id="cname"
            name="cname"
            type="text"
            autoComplete="off"
            value={commentName}
            onChange={(e) => setCommentName(e.target.value)}
            placeholder="Anonymous"
            style={{
              width: "100%",
              background: "var(--color-surface-1)",
              border: "1px solid var(--color-hairline)",
              borderRadius: 8,
              padding: "8px 12px",
              color: "var(--color-ink)",
              fontSize: 14,
              marginBottom: 10,
            }}
          />
          <label htmlFor="ctext" style={{ display: "block", fontSize: 13, marginBottom: 4 }}>
            Comment
          </label>
          <textarea
            id="ctext"
            name="ctext"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Say something…"
            rows={3}
            style={{
              width: "100%",
              background: "var(--color-surface-1)",
              border: "1px solid var(--color-hairline)",
              borderRadius: 8,
              padding: "8px 12px",
              color: "var(--color-ink)",
              fontSize: 14,
              marginBottom: 10,
              resize: "vertical",
            }}
          />
          <button
            type="submit"
            style={{
              background: "var(--color-primary)",
              color: "white",
              border: "none",
              borderRadius: 8,
              padding: "8px 16px",
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            Post Comment
          </button>
        </form>

        <div aria-live="polite">
          {episode.comments.length === 0 && (
            <p style={{ color: "var(--color-ink-subtle)", fontSize: 14 }}>
              No comments yet.
            </p>
          )}
          {episode.comments
            .slice()
            .reverse()
            .map((c, i) => (
              <div
                key={i}
                style={{
                  borderBottom: "1px solid var(--color-hairline)",
                  padding: "12px 0",
                }}
              >
                <p style={{ fontSize: 14, fontWeight: 500, margin: "0 0 4px" }}>
                  {c.name}
                </p>
                <p style={{ fontSize: 14, color: "var(--color-ink-muted)", margin: 0 }}>
                  {c.text}
                </p>
              </div>
            ))}
        </div>
      </section>
    </main>
  );
}