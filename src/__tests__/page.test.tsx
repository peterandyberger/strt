import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Home from "@/app/page";
import { mocks } from "@/__mocks__/supabase";

jest.mock("@/lib/supabase", () => require("@/__mocks__/supabase"));

const mockMessages = [
  { id: "1", content: "Első üzenet", created_at: "2026-03-26T10:00:00Z" },
  { id: "2", content: "Második üzenet", created_at: "2026-03-26T09:00:00Z" },
];

beforeEach(() => {
  jest.clearAllMocks();
  mocks.order.mockResolvedValue({ data: mockMessages, error: null });
});

describe("Üzenőfal", () => {
  it("renders the title and input elements", async () => {
    render(<Home />);

    expect(screen.getByText("Üzenőfal")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Írd ide az üzeneted...")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Mentés" })).toBeInTheDocument();
  });

  it("loads and displays messages on mount", async () => {
    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText("Első üzenet")).toBeInTheDocument();
      expect(screen.getByText("Második üzenet")).toBeInTheDocument();
    });

    expect(mocks.from).toHaveBeenCalledWith("messages");
    expect(mocks.select).toHaveBeenCalledWith("*");
    expect(mocks.order).toHaveBeenCalledWith("created_at", { ascending: false });
  });

  it("shows empty state when no messages exist", async () => {
    mocks.order.mockResolvedValueOnce({ data: [], error: null });

    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText("Még nincsenek üzenetek.")).toBeInTheDocument();
    });
  });

  it("disables save button when input is empty", async () => {
    render(<Home />);

    const button = screen.getByRole("button", { name: "Mentés" });
    expect(button).toBeDisabled();
  });

  it("enables save button when input has text", async () => {
    render(<Home />);
    const user = userEvent.setup();

    const textarea = screen.getByPlaceholderText("Írd ide az üzeneted...");
    await user.type(textarea, "Teszt üzenet");

    const button = screen.getByRole("button", { name: "Mentés" });
    expect(button).toBeEnabled();
  });

  it("saves a new message and refreshes the list", async () => {
    mocks.insert.mockResolvedValueOnce({ error: null });

    render(<Home />);
    const user = userEvent.setup();

    await waitFor(() => {
      expect(screen.getByText("Első üzenet")).toBeInTheDocument();
    });

    const textarea = screen.getByPlaceholderText("Írd ide az üzeneted...");
    await user.type(textarea, "Új üzenet");
    await user.click(screen.getByRole("button", { name: "Mentés" }));

    await waitFor(() => {
      expect(mocks.insert).toHaveBeenCalledWith({ content: "Új üzenet" });
    });
  });

  it("shows error message when save fails", async () => {
    mocks.insert.mockResolvedValueOnce({
      error: { message: "insert error" },
    });

    render(<Home />);
    const user = userEvent.setup();

    await waitFor(() => {
      expect(screen.getByText("Első üzenet")).toBeInTheDocument();
    });

    const textarea = screen.getByPlaceholderText("Írd ide az üzeneted...");
    await user.type(textarea, "Hibás üzenet");
    await user.click(screen.getByRole("button", { name: "Mentés" }));

    await waitFor(() => {
      expect(screen.getByText("Nem sikerült menteni az üzenetet.")).toBeInTheDocument();
    });
  });

  it("deletes a message and refreshes the list", async () => {
    mocks.eq.mockResolvedValueOnce({ error: null });

    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText("Első üzenet")).toBeInTheDocument();
    });

    const user = userEvent.setup();
    const deleteButtons = screen.getAllByRole("button", { name: "Törlés" });
    await user.click(deleteButtons[0]);

    await waitFor(() => {
      expect(mocks.delete).toHaveBeenCalled();
      expect(mocks.eq).toHaveBeenCalledWith("id", "1");
    });
  });

  it("shows error message when delete fails", async () => {
    mocks.eq.mockResolvedValueOnce({
      error: { message: "delete error" },
    });

    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText("Első üzenet")).toBeInTheDocument();
    });

    const user = userEvent.setup();
    const deleteButtons = screen.getAllByRole("button", { name: "Törlés" });
    await user.click(deleteButtons[0]);

    await waitFor(() => {
      expect(screen.getByText("Nem sikerült törölni az üzenetet.")).toBeInTheDocument();
    });
  });

  it("shows error message when fetching messages fails", async () => {
    mocks.order.mockReset();
    mocks.order.mockResolvedValueOnce({
      data: null,
      error: { message: "fetch error" },
    });

    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText("Nem sikerült betölteni az üzeneteket.")).toBeInTheDocument();
    });
  });

  it("displays delete button for each message", async () => {
    render(<Home />);

    await waitFor(() => {
      const deleteButtons = screen.getAllByRole("button", { name: "Törlés" });
      expect(deleteButtons).toHaveLength(2);
    });
  });
});
