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
    <div className="flex flex-col items-center min-h-screen py-10 px-4">
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-white">
          Üzenőfal
        </h1>
        <p className="mt-2 text-slate-400">Hagyj üzenetet az alábbi mezőben</p>
      </header>

      <div className="w-full max-w-xl mb-8">
        <textarea
          className="w-full bg-white border border-slate-300 rounded-xl p-4 text-gray-700 text-base resize-none shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-slate-400"
          rows={3}
          placeholder="Írd ide az üzeneted..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
        />
        <button
          className="mt-3 w-full bg-blue-600 text-white font-semibold py-2.5 px-4 rounded-xl shadow-sm hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          onClick={handleSave}
          disabled={loading || !newMessage.trim()}
        >
          {loading ? "Mentés..." : "Mentés"}
        </button>
      </div>

      {error && (
        <div className="w-full max-w-xl mb-6 bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <div className="w-full max-w-xl space-y-3">
        {messages.length === 0 && (
          <p className="text-slate-400 text-center py-8">
            Még nincsenek üzenetek.
          </p>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className="bg-slate-100 border border-slate-200 rounded-xl p-4 shadow-sm flex justify-between items-start gap-4"
          >
            <div className="flex-1 min-w-0">
              <p className="text-base text-gray-700 whitespace-pre-wrap break-words">
                {msg.content}
              </p>
              <p className="text-xs text-slate-400 mt-2">
                {new Date(msg.created_at).toLocaleString("hu-HU")}
              </p>
            </div>
            <button
              className="bg-red-500 text-white text-sm font-medium px-3 py-1 rounded-lg hover:bg-red-600 active:bg-red-700 shrink-0 transition-colors"
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
