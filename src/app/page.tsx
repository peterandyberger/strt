"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Message {
  id: string;
  content: string;
  created_at: string;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function fetchMessages() {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setError("Nem sikerült betölteni az üzeneteket.");
      return;
    }
    setMessages(data ?? []);
  }

  async function handleSave() {
    const trimmed = newMessage.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);

    const { error } = await supabase
      .from("messages")
      .insert({ content: trimmed });

    if (error) {
      setError("Nem sikerült menteni az üzenetet.");
      setLoading(false);
      return;
    }

    setNewMessage("");
    await fetchMessages();
    setLoading(false);
  }

  async function handleDelete(id: string) {
    setError(null);

    const { error } = await supabase
      .from("messages")
      .delete()
      .eq("id", id);

    if (error) {
      setError("Nem sikerült törölni az üzenetet.");
      return;
    }

    await fetchMessages();
  }

  useEffect(() => {
    fetchMessages();
  }, []);

  return (
    <div className="flex flex-col items-center min-h-screen py-12 px-4">
      <h1 className="text-3xl font-bold mb-8">Üzenőfal</h1>

      <div className="w-full max-w-xl mb-8">
        <textarea
          className="w-full border border-gray-300 rounded-lg p-3 text-base resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
          placeholder="Írd ide az üzeneted..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
        />
        <button
          className="mt-2 w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          onClick={handleSave}
          disabled={loading || !newMessage.trim()}
        >
          {loading ? "Mentés..." : "Mentés"}
        </button>
      </div>

      {error && (
        <p className="text-red-500 mb-4">{error}</p>
      )}

      <div className="w-full max-w-xl space-y-4">
        {messages.length === 0 && (
          <p className="text-gray-500 text-center">Még nincsenek üzenetek.</p>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className="border border-gray-200 rounded-lg p-4 flex justify-between items-start gap-4"
          >
            <div className="flex-1">
              <p className="text-base whitespace-pre-wrap">{msg.content}</p>
              <p className="text-sm text-gray-400 mt-1">
                {new Date(msg.created_at).toLocaleString("hu-HU")}
              </p>
            </div>
            <button
              className="text-red-500 hover:text-red-700 text-sm font-medium shrink-0 transition-colors"
              onClick={() => handleDelete(msg.id)}
            >
              Törlés
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
