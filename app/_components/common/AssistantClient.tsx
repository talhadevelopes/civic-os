"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User } from "lucide-react";

type Message = { role: "user" | "assistant"; content: string };

export default function AssistantClient({
  suggestedPrompts,
}: {
  suggestedPrompts: string[];
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(query: string) {
    const q = query.trim();
    if (!q || loading) return;

    setMessages((m) => [...m, { role: "user", content: q }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });
      const data = await res.json();
      const content = data.message ?? "Sorry, I couldn't process that.";
      setMessages((m) => [...m, { role: "assistant", content }]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Something went wrong. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="flex flex-1 flex-col rounded-2xl border"
      style={{ background: "var(--surface)", borderColor: "var(--border)", minHeight: "500px" }}
    >
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="space-y-4">
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Try one of these:
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestedPrompts.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => send(p)}
                  className="rounded-xl border px-4 py-2 text-left text-sm transition hover:border-green-300"
                  style={{ borderColor: "var(--border)" }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}
              >
                {msg.role === "assistant" && (
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                    style={{ background: "var(--primary-mint)", color: "var(--primary)" }}
                  >
                    <Bot className="h-4 w-4" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                    msg.role === "user"
                      ? "rounded-br-md"
                      : "rounded-bl-md"
                  }`}
                  style={{
                    background: msg.role === "user" ? "var(--primary)" : "var(--primary-light)",
                    color: msg.role === "user" ? "var(--text-on-primary)" : "var(--text-primary)",
                  }}
                >
                  {msg.role === "assistant" ? (
                    <div
                      className="whitespace-pre-wrap text-sm [&_a]:font-medium [&_a]:underline"
                      dangerouslySetInnerHTML={{
                        __html: msg.content.replace(
                          /\[([^\]]+)\]\(\/([^)]+)\)/g,
                          '<a href="/$2" style="color:var(--primary)" target="_blank" rel="noopener">$1</a>'
                        ),
                      }}
                    />
                  ) : (
                    <p className="text-sm">{msg.content}</p>
                  )}
                </div>
                {msg.role === "user" && (
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                    style={{ background: "var(--grey-200)", color: "var(--text-muted)" }}
                  >
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-3">
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                  style={{ background: "var(--primary-mint)", color: "var(--primary)" }}
                >
                  <Bot className="h-4 w-4" />
                </div>
                <div className="rounded-2xl rounded-bl-md px-4 py-3" style={{ background: "var(--primary-light)" }}>
                  <span className="animate-pulse text-sm">Thinking...</span>
                </div>
              </div>
            )}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex gap-2 border-t p-4"
        style={{ borderColor: "var(--border)" }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about civic issues..."
          className="flex-1 rounded-xl border px-4 py-3 text-sm outline-none"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="flex h-12 w-12 items-center justify-center rounded-xl disabled:opacity-50"
          style={{ background: "var(--primary)", color: "var(--text-on-primary)" }}
        >
          <Send className="h-5 w-5" />
        </button>
      </form>
    </div>
  );
}
