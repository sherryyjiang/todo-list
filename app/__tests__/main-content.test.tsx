import { render, screen } from "@testing-library/react";
import MainContent from "../components/MainContent";

const TasksPlaceholder = () => <div>Tasks board</div>;

describe("MainContent", () => {
  test("shows important lists when in lists mode", () => {
    render(
      <MainContent
        mode="lists"
        tasksContent={<TasksPlaceholder />}
      />
    );

    expect(screen.getByRole("heading", { name: /important lists/i })).toBeInTheDocument();
    expect(screen.queryByText(/tasks board/i)).not.toBeInTheDocument();
  });

  test("shows tasks content when in tasks mode", () => {
    render(
      <MainContent
        mode="tasks"
        tasksContent={<TasksPlaceholder />}
      />
    );

    expect(screen.getByText(/tasks board/i)).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /important lists/i })).not.toBeInTheDocument();
  });

  test("shows weekly summary content when in summary mode", () => {
    render(
      <MainContent
        mode="summary"
        tasksContent={<TasksPlaceholder />}
        tasks={[]}
      />
    );

    expect(screen.getByRole("heading", { name: /weekly summary/i })).toBeInTheDocument();
    expect(screen.queryByText(/tasks board/i)).not.toBeInTheDocument();
  });

  test("shows memory links content when in links mode", () => {
    render(
      <MainContent
        mode="links"
        tasksContent={<TasksPlaceholder />}
      />
    );

    expect(screen.getByRole("heading", { name: /memory links/i })).toBeInTheDocument();
    expect(screen.queryByText(/tasks board/i)).not.toBeInTheDocument();
  });
});
