"use client";

import { useState, useEffect, useRef } from "react";
import { X, Brain, MessageSquare, Sparkles, Zap, Bot, User, Send, Loader2 } from "lucide-react";

type Message = { role: "user" | "assistant"; content: string };

const SUGGESTED_PROMPTS = [
  "What are the top unresolved issues in Kukatpally right now?",
  "Which MLA has the worst pothole resolution rate this month?",
  "How many drainage issues were reported in Secunderabad?",
  "What is the current civic health score?",
  "Which ward has the most reopened issues?",
];

export function AssistantSidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

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
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/20 backdrop-blur-sm z-[100] transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Sidebar */}
      <aside className={`fixed top-0 right-0 h-full w-full sm:w-[500px] bg-white z-[110] shadow-2xl transition-transform duration-500 ease-in-out transform flex flex-col ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}>
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center">
              <Brain size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 tracking-tight">Civic AI Assistant</h3>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Live Platform Data</span>
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-gray-900"
          >
            <X size={20} />
          </button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/30">
          {messages.length === 0 ? (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-gray-900 rounded-[2rem] p-8 text-white relative overflow-hidden group">
                <div className="absolute -bottom-10 -right-10 opacity-10 group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                  <Brain size={150} />
                </div>
                <div className="relative z-10">
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center mb-6 border border-white/10">
                    <Zap size={20} />
                  </div>
                  <h3 className="text-lg font-bold mb-2 tracking-tight">Intelligence Hub</h3>
                  <p className="text-white/70 text-[11px] leading-relaxed mb-6 font-medium">
                    Ask questions about Hyderabad&apos;s live civic data — issue counts, MLA rankings, ward performance, and category trends.
                  </p>
                  <div className="space-y-2">
                    {[
                      "MLA performance analysis",
                      "Ward-by-ward breakdown",
                      "Category trend detection",
                    ].map((cap) => (
                      <div key={cap} className="flex items-center gap-2">
                        <div className="w-3.5 h-3.5 bg-green-600 rounded-md flex items-center justify-center">
                          <Sparkles size={7} />
                        </div>
                        <span className="text-[9px] font-bold text-white/70 uppercase tracking-wider">{cap}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <MessageSquare size={14} className="text-green-600" />
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Suggested Questions</p>
                </div>
                <div className="grid grid-cols-1 gap-2.5">
                  {SUGGESTED_PROMPTS.map((prompt, i) => (
                    <button
                      key={i}
                      onClick={() => send(prompt)}
                      className="text-left p-4 rounded-2xl bg-white border border-gray-100 hover:border-green-400 hover:shadow-md transition-all duration-300 group"
                    >
                      <p className="text-[11px] font-bold text-gray-600 group-hover:text-green-700 transition-colors leading-relaxed">
                        {prompt}
                      </p>
                    </button>
                  ))}
                </div>
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
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gray-900 text-white shadow-sm">
                      <Bot className="h-4 w-4" />
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] rounded-[1.5rem] px-4 py-3 shadow-sm border ${
                      msg.role === "user"
                        ? "bg-green-600 border-green-500 text-black rounded-tr-sm"
                        : "bg-white border-gray-100 text-black rounded-tl-sm"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      <div
                        className="whitespace-pre-wrap text-[13px] leading-relaxed [&_a]:font-bold [&_a]:text-green-600 [&_a]:underline"
                        style={{ color: "#000000" }}
                        dangerouslySetInnerHTML={{
                          __html: msg.content.replace(
                            /\[([^\]]+)\]\(\/([^)]+)\)/g,
                            '<a href="/$2" target="_blank" rel="noopener">$1</a>'
                          ),
                        }}
                      />
                    ) : (
                      <p className="text-[13px] leading-relaxed font-medium" style={{ color: "#000000" }}>{msg.content}</p>
                    )}
                  </div>
                  {msg.role === "user" && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-400 border border-gray-200 shadow-sm">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="flex gap-3 animate-pulse">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gray-900 text-white">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="bg-white border border-gray-100 rounded-[1.5rem] rounded-tl-sm px-5 py-3 shadow-sm">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" />
                      <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input Footer */}
        <div className="p-6 border-t border-gray-100 bg-white relative z-10">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="relative"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about Hyderabad civic issues..."
              className="w-full bg-gray-50 border border-gray-100 focus:border-green-400 focus:bg-white rounded-2xl pl-5 pr-14 py-4 text-[13px] font-medium text-black outline-none transition-all shadow-sm"
              style={{ color: "#000000" }}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-xl bg-gray-900 text-white shadow-lg hover:bg-black active:scale-95 transition-all disabled:opacity-40"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </form>
          <p className="text-[9px] text-center text-gray-400 font-bold uppercase tracking-widest mt-4">
            CivicOS AI Intelligence • Hyderabad Live Data
          </p>
        </div>
      </aside>
    </>
  );
}
