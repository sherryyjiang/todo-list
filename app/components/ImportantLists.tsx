"use client";

import { useCallback, useState } from "react";

interface ImportantListItem {
  id: string;
  label: string;
}

interface ImportantList {
  id: string;
  title: string;
  items: ImportantListItem[];
}

function createListId() {
  return `list-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

function createItemId() {
  return `item-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
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
    ].map((name) => ({
      id: createItemId(),
      label: name,
    })),
  },
];

export default function ImportantLists() {
  const [lists, setLists] = useState<ImportantList[]>(INITIAL_LISTS);
  const [newListTitle, setNewListTitle] = useState("");
  const [newItemByList, setNewItemByList] = useState<Record<string, string>>({});
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [editingListTitle, setEditingListTitle] = useState("");
  const [editingItem, setEditingItem] = useState<{
    listId: string;
    itemId: string;
  } | null>(null);
  const [editingItemValue, setEditingItemValue] = useState("");

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
          ? { ...list, items: [...list.items, { id: createItemId(), label: value }] }
          : list
      )
    );

    setNewItemByList((prev) => ({ ...prev, [listId]: "" }));
  }, [newItemByList]);

  const handleStartEditList = useCallback((list: ImportantList) => {
    setEditingListId(list.id);
    setEditingListTitle(list.title);
  }, []);

  const handleSaveListTitle = useCallback((listId: string) => {
    const trimmed = editingListTitle.trim();
    if (!trimmed) return;

    setLists((prev) =>
      prev.map((list) => (list.id === listId ? { ...list, title: trimmed } : list))
    );
    setEditingListId(null);
  }, [editingListTitle]);

  const handleCancelEditList = useCallback(() => {
    setEditingListId(null);
  }, []);

  const handleDeleteList = useCallback((listId: string) => {
    setLists((prev) => prev.filter((list) => list.id !== listId));
    setNewItemByList((prev) => {
      const next = { ...prev };
      delete next[listId];
      return next;
    });
    setEditingListId((current) => (current === listId ? null : current));
    setEditingItem((current) => (current?.listId === listId ? null : current));
  }, []);

  const handleStartEditItem = useCallback((listId: string, item: ImportantListItem) => {
    setEditingItem({ listId, itemId: item.id });
    setEditingItemValue(item.label);
  }, []);

  const handleSaveItem = useCallback((listId: string, itemId: string) => {
    const trimmed = editingItemValue.trim();
    if (!trimmed) return;

    setLists((prev) =>
      prev.map((list) =>
        list.id === listId
          ? {
              ...list,
              items: list.items.map((item) =>
                item.id === itemId ? { ...item, label: trimmed } : item
              ),
            }
          : list
      )
    );
    setEditingItem(null);
  }, [editingItemValue]);

  const handleCancelEditItem = useCallback(() => {
    setEditingItem(null);
  }, []);

  const handleDeleteItem = useCallback((listId: string, itemId: string) => {
    setLists((prev) =>
      prev.map((list) =>
        list.id === listId
          ? { ...list, items: list.items.filter((item) => item.id !== itemId) }
          : list
      )
    );
    setEditingItem((current) => (current?.itemId === itemId ? null : current));
  }, []);

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
        {lists.map((list) => {
          const isEditingListTitle = editingListId === list.id;

          return (
            <div
              key={list.id}
              className="kanban-column w-72 min-w-[260px] rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-sm"
            >
              <div className="border-b border-[var(--color-border-subtle)] p-4">
                {isEditingListTitle ? (
                  <div className="flex flex-col gap-2">
                    <input
                      type="text"
                      value={editingListTitle}
                      onChange={(event) => setEditingListTitle(event.target.value)}
                      aria-label={`Edit list title ${list.title}`}
                      className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-main)] px-3 py-2 text-body text-[var(--color-text-primary)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        aria-label={`Save list title ${list.title}`}
                        onClick={() => handleSaveListTitle(list.id)}
                        className="rounded-lg bg-[var(--color-primary)] px-3 py-1 text-caption text-white font-medium hover:bg-[var(--color-primary-hover)] transition-all"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        aria-label={`Cancel list title edit ${list.title}`}
                        onClick={handleCancelEditList}
                        className="rounded-lg border border-[var(--color-border)] px-3 py-1 text-caption text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-heading text-[var(--color-text-primary)]">{list.title}</h3>
                      <p className="text-caption text-[var(--color-text-muted)]">
                        {list.items.length} {list.items.length === 1 ? "person" : "people"}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <button
                        type="button"
                        aria-label={`Edit list title ${list.title}`}
                        onClick={() => handleStartEditList(list)}
                        className="rounded-md border border-[var(--color-border)] px-2 py-1 text-caption text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] transition-all"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        aria-label={`Delete list ${list.title}`}
                        onClick={() => handleDeleteList(list.id)}
                        className="rounded-md border border-[var(--color-border)] px-2 py-1 text-caption text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] transition-all"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2 p-4">
                {list.items.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-[var(--color-border-subtle)] bg-[var(--color-bg-hover)] px-3 py-4 text-center text-caption text-[var(--color-text-muted)]">
                    Add your first entry.
                  </div>
                ) : (
                  list.items.map((item) => {
                    const isEditingItem =
                      editingItem?.listId === list.id && editingItem.itemId === item.id;

                    return (
                      <div
                        key={item.id}
                        className="rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg-hover)] px-3 py-2 text-body text-[var(--color-text-primary)]"
                      >
                        {isEditingItem ? (
                          <div className="flex flex-col gap-2">
                            <input
                              type="text"
                              value={editingItemValue}
                              onChange={(event) => setEditingItemValue(event.target.value)}
                              aria-label={`Edit item ${item.label}`}
                              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-main)] px-2 py-1 text-body text-[var(--color-text-primary)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all"
                            />
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                aria-label={`Save item ${item.label}`}
                                onClick={() => handleSaveItem(list.id, item.id)}
                                className="rounded-md bg-[var(--color-primary)] px-2 py-1 text-caption text-white font-medium hover:bg-[var(--color-primary-hover)] transition-all"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                aria-label={`Cancel edit item ${item.label}`}
                                onClick={handleCancelEditItem}
                                className="rounded-md border border-[var(--color-border)] px-2 py-1 text-caption text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] transition-all"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start justify-between gap-2">
                            <span>{item.label}</span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                aria-label={`Edit item ${item.label}`}
                                onClick={() => handleStartEditItem(list.id, item)}
                                className="rounded-md border border-[var(--color-border)] px-2 py-1 text-caption text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] transition-all"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                aria-label={`Delete item ${item.label}`}
                                onClick={() => handleDeleteItem(list.id, item.id)}
                                className="rounded-md border border-[var(--color-border)] px-2 py-1 text-caption text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] transition-all"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
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
          );
        })}
      </div>
    </section>
  );
}
