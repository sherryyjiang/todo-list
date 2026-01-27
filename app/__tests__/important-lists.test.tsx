import { render, screen, fireEvent } from "@testing-library/react";
import ImportantLists from "../components/ImportantLists";

describe("ImportantLists", () => {
  test("renders the Important Lists section with the SF List and initial people", () => {
    render(<ImportantLists />);

    expect(screen.getByRole("heading", { name: /important lists/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /sf list/i })).toBeInTheDocument();

    [
      "Conor McLaughlin",
      "Sara Hooker",
      "Robin Guo",
      "Hubert",
      "Ben South",
      "Ben Hylak",
      "Fayza",
      "Guiellermo Rauch",
      "Don (orangedao)",
    ].forEach((name) => {
      expect(screen.getByText(name)).toBeInTheDocument();
    });
  });

  test("allows adding a new list column", () => {
    render(<ImportantLists />);

    fireEvent.change(screen.getByLabelText(/new list name/i), {
      target: { value: "LA List" },
    });
    fireEvent.click(screen.getByRole("button", { name: /add list/i }));

    expect(screen.getByRole("heading", { name: /la list/i })).toBeInTheDocument();
  });

  test("allows adding a person to an existing list", () => {
    render(<ImportantLists />);

    fireEvent.change(screen.getByLabelText(/item for sf list/i), {
      target: { value: "Jane Doe" },
    });
    fireEvent.click(screen.getByRole("button", { name: /add item to sf list/i }));

    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
  });
});
