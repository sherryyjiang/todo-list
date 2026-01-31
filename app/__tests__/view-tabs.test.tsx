import { render, screen, fireEvent } from "@testing-library/react";
import ViewTabs, { type ViewMode } from "../components/ViewTabs";

const categories = [
  { id: "general", label: "General", icon: "📋" },
  { id: "health", label: "Health", icon: "🏥" },
];

describe("ViewTabs", () => {
  test("renders the Important Lists tab", () => {
    render(
      <ViewTabs
        mode="tasks"
        onModeChange={() => undefined}
        categories={categories}
        selectedCategory="general"
        onCategoryChange={() => undefined}
        tasks={[]}
      />
    );

    expect(screen.getByRole("button", { name: /important lists/i })).toBeInTheDocument();
  });

  test("renders the Weekly Summary tab", () => {
    render(
      <ViewTabs
        mode="tasks"
        onModeChange={() => undefined}
        categories={categories}
        selectedCategory="general"
        onCategoryChange={() => undefined}
        tasks={[]}
      />
    );

    expect(screen.getByRole("button", { name: /weekly summary/i })).toBeInTheDocument();
  });

  test("renders the Memory Links tab", () => {
    render(
      <ViewTabs
        mode="tasks"
        onModeChange={() => undefined}
        categories={categories}
        selectedCategory="general"
        onCategoryChange={() => undefined}
        tasks={[]}
      />
    );

    expect(screen.getByRole("button", { name: /memory links/i })).toBeInTheDocument();
  });

  test("switches to lists mode when Important Lists is clicked", () => {
    const onModeChange = jest.fn<(mode: ViewMode) => void>();

    render(
      <ViewTabs
        mode="tasks"
        onModeChange={onModeChange}
        categories={categories}
        selectedCategory="general"
        onCategoryChange={() => undefined}
        tasks={[]}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /important lists/i }));

    expect(onModeChange).toHaveBeenCalledWith("lists");
  });

  test("switches to summary mode when Weekly Summary is clicked", () => {
    const onModeChange = jest.fn<(mode: ViewMode) => void>();

    render(
      <ViewTabs
        mode="tasks"
        onModeChange={onModeChange}
        categories={categories}
        selectedCategory="general"
        onCategoryChange={() => undefined}
        tasks={[]}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /weekly summary/i }));

    expect(onModeChange).toHaveBeenCalledWith("summary");
  });

  test("switches to links mode when Memory Links is clicked", () => {
    const onModeChange = jest.fn<(mode: ViewMode) => void>();

    render(
      <ViewTabs
        mode="tasks"
        onModeChange={onModeChange}
        categories={categories}
        selectedCategory="general"
        onCategoryChange={() => undefined}
        tasks={[]}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /memory links/i }));

    expect(onModeChange).toHaveBeenCalledWith("links");
  });
});
