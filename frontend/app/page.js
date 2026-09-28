"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function Home() {
  const [episodes, setEpisodes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`${API}/api/episodes`)
      .then((res) => setEpisodes(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 24px" }}>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 48,
        }}
      >
        <h1
          style={{
            fontSize: 28,
            fontWeight: 600,
            letterSpacing: "-0.6px",
            margin: 0,
          }}
        >
          AutoPod
        </h1>
        <Link
          href="/generate"
          style={{
            background: "var(--color-primary)",
            color: "white",
            padding: "8px 14px",
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          + Generate Podcast
        </Link>
      </header>

      {loading && (
        <p style={{ color: "var(--color-ink-subtle)" }}>Loading…</p>
      )}

      {!loading && episodes.length === 0 && (
        <p style={{ color: "var(--color-ink-subtle)" }}>
          No podcasts yet. Be the first to generate one.
        </p>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: 24,
        }}
      >
        {episodes.map((ep) => (
          <Link
            key={ep._id}
            href={`/episode/${ep._id}`}
            style={{
              background: "var(--color-surface-1)",
              border: "1px solid var(--color-hairline)",
              borderRadius: 12,
              overflow: "hidden",
              display: "block",
            }}
          >
            <img
              src={ep.thumbnailUrl}
              alt={ep.title}
              width={260}
              height={260}
              style={{ width: "100%", aspectRatio: "1/1", objectFit: "cover" }}
            />
            <div style={{ padding: 16 }}>
              <h3
                style={{
                  fontSize: 16,
                  fontWeight: 500,
                  margin: "0 0 4px",
                  lineHeight: 1.3,
                }}
              >
                {ep.title}
              </h3>
              <p
                style={{
                  fontSize: 13,
                  color: "var(--color-ink-subtle)",
                  margin: "0 0 8px",
                }}
              >
                by {ep.author}
              </p>
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  fontSize: 12,
                  color: "var(--color-ink-tertiary)",
                }}
              >
                <span>♥ {ep.likes}</span>
                <span>💬 {ep.comments?.length || 0}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}