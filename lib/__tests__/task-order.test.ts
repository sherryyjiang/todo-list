import { mergeOrderIds, reorderIds } from "../task-order";

describe("task order helpers", () => {
  test("reorderIds moves the active id to the over position", () => {
    const ids = ["a", "b", "c", "d"];
    const result = reorderIds(ids, "a", "c");

    expect(result).toEqual(["b", "c", "a", "d"]);
  });

  test("reorderIds returns original when ids are missing", () => {
    const ids = ["a", "b", "c"];
    const result = reorderIds(ids, "x", "b");

    expect(result).toEqual(ids);
  });

  test("mergeOrderIds preserves existing order and appends new ids", () => {
    const current = ["b", "a"];
    const next = ["a", "b", "c"];
    const result = mergeOrderIds(current, next);

    expect(result).toEqual(["b", "a", "c"]);
  });

  test("mergeOrderIds drops ids that are no longer present", () => {
    const current = ["a", "b", "c"];
    const next = ["c", "a"];
    const result = mergeOrderIds(current, next);

    expect(result).toEqual(["a", "c"]);
  });
});
