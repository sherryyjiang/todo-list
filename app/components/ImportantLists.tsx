"use client";

import { useCallback, useState } from "react";

interface ImportantList {
  id: string;
  title: string;
  items: string[];
}

const INITIAL_LISTS: ImportantList[] = [
  {
    id: "sf-list",
    title: "SF List",
    items: [
      "Conor McLaughlin",
      "Sara Hooker",
      "Robin Guo",
      "Hubert",
      "Ben South",
      "Ben Hylak",
      "Fayza",
      "Guiellermo Rauch",
      "Don (orangedao)",
    ],
  },
];

function createListId() {
  return `list-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

export default function ImportantLists() {
  const [lists, setLists] = useState<ImportantList[]>(INITIAL_LISTS);
  const [newListTitle, setNewListTitle] = useState("");
  const [newItemByList, setNewItemByList] = useState<Record<string, string>>({});

  const handleAddList = useCallback((event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = newListTitle.trim();
    if (!trimmed) return;

    setLists((prev) => [
      ...prev,
      {
        id: createListId(),
        title: trimmed,
        items: [],
      },
    ]);
    setNewListTitle("");
  }, [newListTitle]);

  const handleAddItem = useCallback((listId: string) => (event: React.FormEvent) => {
    event.preventDefault();
    const value = (newItemByList[listId] ?? "").trim();
    if (!value) return;

    setLists((prev) =>
      prev.map((list) =>
        list.id === listId
          ? { ...list, items: [...list.items, value] }
          : list
      )
    );

    setNewItemByList((prev) => ({ ...prev, [listId]: "" }));
  }, [newItemByList]);

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-title text-[var(--color-text-primary)]">Important Lists</h2>
          <p className="text-caption text-[var(--color-text-muted)]">
            Personal columns for people, places, and reminders you want close by.
          </p>
        </div>

        <form onSubmit={handleAddList} className="flex items-center gap-2">
          <input
            type="text"
            value={newListTitle}
            onChange={(event) => setNewListTitle(event.target.value)}
            placeholder="New list name"
            aria-label="New list name"
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] px-3 py-2 text-body text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all"
          />
          <button
            type="submit"
            className="rounded-lg bg-[var(--color-primary)] px-3 py-2 text-body text-white font-medium hover:bg-[var(--color-primary-hover)] transition-all"
          >
            Add list
          </button>
        </form>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 kanban-scroll">
        {lists.map((list) => (
          <div
            key={list.id}
            className="kanban-column w-72 min-w-[260px] rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-sm"
          >
            <div className="border-b border-[var(--color-border-subtle)] p-4">
              <h3 className="text-heading text-[var(--color-text-primary)]">{list.title}</h3>
              <p className="text-caption text-[var(--color-text-muted)]">
                {list.items.length} {list.items.length === 1 ? "person" : "people"}
              </p>
            </div>
            <div className="flex flex-col gap-2 p-4">
              {list.items.length === 0 ? (
                <div className="rounded-lg border border-dashed border-[var(--color-border-subtle)] bg-[var(--color-bg-hover)] px-3 py-4 text-center text-caption text-[var(--color-text-muted)]">
                  Add your first entry.
                </div>
              ) : (
                list.items.map((item) => (
                  <div
                    key={item}
                    className="rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-hover)] px-3 py-2 text-body text-[var(--color-text-primary)]"
                  >
                    {item}
                  </div>
                ))
              )}

              <form onSubmit={handleAddItem(list.id)} className="mt-2 flex items-center gap-2">
                <input
                  type="text"
                  value={newItemByList[list.id] ?? ""}
                  onChange={(event) =>
                    setNewItemByList((prev) => ({
                      ...prev,
                      [list.id]: event.target.value,
                    }))
                  }
                  placeholder="Add person"
                  aria-label={`Item for ${list.title}`}
                  className="flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-main)] px-3 py-2 text-body text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all"
                />
                <button
                  type="submit"
                  aria-label={`Add item to ${list.title}`}
                  className="rounded-lg bg-[var(--color-bg-active)] px-3 py-2 text-caption text-[var(--color-text-primary)] hover:bg-[var(--color-primary-subtle)] hover:text-[var(--color-primary)] transition-all"
                >
                  Add
                </button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
