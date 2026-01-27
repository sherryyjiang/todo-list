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

  test("allows editing an existing person in a list", () => {
    render(<ImportantLists />);

    fireEvent.click(screen.getByRole("button", { name: /edit item hubert/i }));
    fireEvent.change(screen.getByRole("textbox", { name: /edit item hubert/i }), {
      target: { value: "Hubert Chang" },
    });
    fireEvent.click(screen.getByRole("button", { name: /save item hubert/i }));

    expect(screen.getByText("Hubert Chang")).toBeInTheDocument();
    expect(screen.queryByText("Hubert")).not.toBeInTheDocument();
  });

  test("allows deleting a person from a list", () => {
    render(<ImportantLists />);

    fireEvent.click(screen.getByRole("button", { name: /delete item robin guo/i }));

    expect(screen.queryByText("Robin Guo")).not.toBeInTheDocument();
  });

  test("allows editing a list title", () => {
    render(<ImportantLists />);

    fireEvent.click(screen.getByRole("button", { name: /edit list title sf list/i }));
    fireEvent.change(screen.getByLabelText(/edit list title sf list/i), {
      target: { value: "SF Favorites" },
    });
    fireEvent.click(screen.getByRole("button", { name: /save list title sf list/i }));

    expect(screen.getByRole("heading", { name: /sf favorites/i })).toBeInTheDocument();
  });

  test("allows deleting a list column", () => {
    render(<ImportantLists />);

    fireEvent.click(screen.getByRole("button", { name: /delete list sf list/i }));

    expect(screen.queryByRole("heading", { name: /sf list/i })).not.toBeInTheDocument();
  });
});
