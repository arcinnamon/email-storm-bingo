import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Home from "@/app/page";

const phrases = Array.from({ length: 30 }, (_, index) => `Phrase ${index + 1}`);
const config = { version: 1, phrases };

describe("Home", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("loads a fresh board and keeps the free center marked", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify(config), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }));

    render(<Home />);

    await waitFor(() => expect(screen.getByRole("grid", { name: "Bingo board" })).toBeInTheDocument());
    const cells = screen.getAllByRole("gridcell");
    expect(cells).toHaveLength(25);
    expect(screen.getByRole("gridcell", { name: "Toggle square 13: FREE SPACE" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText(/Build a row, column, or diagonal to win/i)).toBeVisible();
  });

  it("places instructions above a full-width board with square cells", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify(config), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }));

    render(<Home />);

    const instructions = await screen.findByRole("complementary");
    const grid = await screen.findByRole("grid", { name: "Bingo board" });

    expect(instructions.compareDocumentPosition(grid) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(grid.closest("section")).toHaveClass("flex-col");
    expect(grid).toHaveClass("w-full");
    expect(grid).not.toHaveClass("max-w-[22rem]");
    expect(screen.getAllByRole("gridcell")[0]).toHaveClass("aspect-square");
    expect(screen.getAllByRole("gridcell")[0].querySelector("span")).toHaveClass("line-clamp-4");
  });

  it("shows an error with retry when the phrase API fails and recovers after retry", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.mocked(fetch) as ReturnType<typeof vi.fn>;
    fetchMock
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce(new Response(JSON.stringify(config), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }));

    render(<Home />);

    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent(/Phrase list is unavailable/i));
    expect(screen.queryByRole("grid", { name: "Bingo board" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Retry" }));

    await waitFor(() => expect(screen.getByRole("grid", { name: "Bingo board" })).toBeInTheDocument());
    expect(screen.getByRole("alert")).not.toHaveTextContent(/Phrase list is unavailable/i);
  });

  it("toggles squares and then clears the board without unmarking the free center", async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify(config), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }));

    render(<Home />);

    await waitFor(() => expect(screen.getByRole("grid", { name: "Bingo board" })).toBeInTheDocument());

    const target = screen.getAllByRole("gridcell").find((cell) => cell.getAttribute("aria-label") !== "Toggle square 13: FREE SPACE");
    expect(target).toBeDefined();

    await user.click(target!);
    expect(target).toHaveAttribute("aria-pressed", "true");

    await user.click(target!);
    expect(target).toHaveAttribute("aria-pressed", "false");

    const freeCell = screen.getByRole("gridcell", { name: "Toggle square 13: FREE SPACE" });
    await user.click(freeCell);
    expect(freeCell).toHaveAttribute("aria-pressed", "true");

    await user.click(screen.getByRole("button", { name: "Clear" }));
    expect(freeCell).toHaveAttribute("aria-pressed", "true");
    expect(screen.getAllByRole("gridcell").filter((cell) => cell.getAttribute("aria-pressed") === "true")).toHaveLength(1);
  });
});
