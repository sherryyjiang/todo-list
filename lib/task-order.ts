export function reorderIds(ids: string[], activeId: string, overId: string) {
  const activeIndex = ids.indexOf(activeId);
  const overIndex = ids.indexOf(overId);

  if (activeIndex === -1 || overIndex === -1 || activeIndex === overIndex) return ids;

  const next = ids.slice();
  const [moved] = next.splice(activeIndex, 1);
  next.splice(overIndex, 0, moved);
  return next;
}

export function mergeOrderIds(current: string[], next: string[]) {
  const nextSet = new Set(next);
  const preserved = current.filter((id) => nextSet.has(id));
  const preservedSet = new Set(preserved);
  const appended = next.filter((id) => !preservedSet.has(id));

  return [...preserved, ...appended];
}
