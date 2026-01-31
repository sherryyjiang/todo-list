import { render, screen, fireEvent } from "@testing-library/react";
import MemoryLinks from "../components/MemoryLinks";

describe("MemoryLinks", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test("renders the Memory Links section", () => {
    render(<MemoryLinks />);

    expect(screen.getByRole("heading", { name: /memory links/i })).toBeInTheDocument();
  });

  test("allows adding a new memory link", () => {
    render(<MemoryLinks />);

    fireEvent.change(screen.getByLabelText(/link title/i), {
      target: { value: "Insurance claims guide" },
    });
    fireEvent.change(screen.getByLabelText(/link url/i), {
      target: { value: "https://example.com/claims" },
    });
    fireEvent.click(screen.getByRole("button", { name: /add link/i }));

    const link = screen.getByRole("link", { name: /insurance claims guide/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "https://example.com/claims");
  });

  test("persists links across remounts", () => {
    const { unmount } = render(<MemoryLinks />);

    fireEvent.change(screen.getByLabelText(/link title/i), {
      target: { value: "Policy portal" },
    });
    fireEvent.change(screen.getByLabelText(/link url/i), {
      target: { value: "https://example.com/policies" },
    });
    fireEvent.click(screen.getByRole("button", { name: /add link/i }));

    expect(screen.getByRole("link", { name: /policy portal/i })).toBeInTheDocument();

    unmount();
    render(<MemoryLinks />);

    expect(screen.getByRole("link", { name: /policy portal/i })).toBeInTheDocument();
  });
});
