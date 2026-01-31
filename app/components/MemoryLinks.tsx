"use client";

import { useCallback, useEffect, useState } from "react";

interface MemoryLink {
  id: string;
  title: string;
  url: string;
}

const STORAGE_KEY = "memoryLinks:v1";

function createLinkId() {
  return `link-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

function isStoredLink(value: unknown): value is MemoryLink {
  if (!value || typeof value !== "object") return false;
  const link = value as MemoryLink;
  return (
    typeof link.id === "string" &&
    typeof link.title === "string" &&
    typeof link.url === "string"
  );
}

function loadLinksFromStorage(): MemoryLink[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isStoredLink);
  } catch {
    return [];
  }
}

function saveLinksToStorage(links: MemoryLink[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(links));
  } catch {
    // Ignore storage errors (quota, private mode)
  }
}

export default function MemoryLinks() {
  const [links, setLinks] = useState<MemoryLink[]>(() => loadLinksFromStorage());
  const [newTitle, setNewTitle] = useState("");
  const [newUrl, setNewUrl] = useState("");

  useEffect(() => {
    saveLinksToStorage(links);
  }, [links]);

  const handleAddLink = useCallback((event: React.FormEvent) => {
    event.preventDefault();
    const title = newTitle.trim();
    const url = newUrl.trim();
    if (!title || !url) return;

    setLinks((prev) => [
      ...prev,
      {
        id: createLinkId(),
        title,
        url,
      },
    ]);
    setNewTitle("");
    setNewUrl("");
  }, [newTitle, newUrl]);

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-title text-[var(--color-text-primary)]">Memory Links</h2>
          <p className="text-caption text-[var(--color-text-muted)]">
            Save guides and portals you often need but rarely remember.
          </p>
        </div>

        <form onSubmit={handleAddLink} className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={newTitle}
            onChange={(event) => setNewTitle(event.target.value)}
            placeholder="Link title"
            aria-label="Link title"
            className="w-48 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] px-3 py-2 text-body text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all"
          />
          <input
            type="url"
            value={newUrl}
            onChange={(event) => setNewUrl(event.target.value)}
            placeholder="https://"
            aria-label="Link URL"
            className="w-64 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] px-3 py-2 text-body text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all"
          />
          <button
            type="submit"
            className="rounded-lg bg-[var(--color-primary)] px-3 py-2 text-body text-white font-medium hover:bg-[var(--color-primary-hover)] transition-all"
          >
            Add link
          </button>
        </form>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {links.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[var(--color-border-subtle)] bg-[var(--color-bg-hover)] px-4 py-6 text-center text-caption text-[var(--color-text-muted)]">
            Add your first memory link.
          </div>
        ) : (
          links.map((link) => (
            <article
              key={link.id}
              className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-4 shadow-sm"
            >
              <a
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="text-heading text-[var(--color-text-primary)] hover:text-[var(--color-primary)] transition-colors"
              >
                {link.title}
              </a>
              <p className="mt-2 text-caption text-[var(--color-text-muted)] break-all">
                {link.url}
              </p>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
