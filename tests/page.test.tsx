import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "@/app/page";

describe("Home", () => {
  it("introduces the game and explains that it is coming soon", () => {
    render(<Home />);

    expect(screen.getByRole("heading", { level: 1, name: "Email storm bingo" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Your next reply-all deserves a bingo card." })).toBeVisible();
    expect(screen.getByText("The game is coming soon. Check back for your first card.")).toBeVisible();
  });
});
