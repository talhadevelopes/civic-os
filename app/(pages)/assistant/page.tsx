import AssistantClient from "@/app/_components/common/AssistantClient";
import { PageShell } from "@/app/_components/global/AppSidebar";
import { Brain, MessageSquare, Zap, Sparkles, Bell, Plus } from "lucide-react";
import Link from "next/link";

const SUGGESTED_PROMPTS = [
  "What are the top unresolved issues in Kukatpally right now?",
  "Which MLA has the worst pothole resolution rate this month?",
  "How many drainage issues were reported in Secunderabad?",
  "What is the current civic health score?",
  "Which ward has the most reopened issues?",
];

export default function AssistantPage() {
  return (
    <PageShell>
      {/* Header */}
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-1.5">Civic AI Assistant</h1>
          <p className="text-gray-500 text-sm font-medium">Ask anything about Hyderabad&apos;s civic issues. Answers are grounded in live platform data.</p>
        </div>

        <div className="space-y-10">
          {/* Chat Area - Full Width at Top */}
          <div className="w-full">
            <div className="bg-white border-y border-gray-100 shadow-2xl overflow-hidden flex flex-col min-h-[550px] -mx-8">
              <div className="px-8 py-6 border-b border-gray-100 flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center">
                  <Brain size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Civic AI Chat</h3>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Live Data Connected</span>
                  </div>
                </div>
              </div>
              <div className="flex-1 flex flex-col p-5">
                <AssistantClient suggestedPrompts={SUGGESTED_PROMPTS} />
              </div>
            </div>
          </div>

          {/* Lower Section: Intelligence Panel & Suggested Questions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Intelligence Panel */}
            <div className="relative overflow-hidden bg-gray-900 p-8 rounded-3xl text-white group">
              <div className="absolute -bottom-10 -right-10 opacity-10 group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                <Brain size={200} />
              </div>
              <div className="relative z-10">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-6 border border-white/10">
                  <Zap size={24} />
                </div>
                <h3 className="text-xl font-bold mb-2.5 tracking-tight">Intelligence Hub</h3>
                <p className="text-white/70 text-xs leading-relaxed mb-6 font-medium">
                  Ask questions about live civic data — issue counts, MLA rankings, ward performance, category breakdowns, and more.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    "Live issue database querying",
                    "MLA performance analysis",
                    "Ward-by-ward breakdown",
                    "Category trend detection",
                    "Escalation pattern alerts",
                  ].map((cap) => (
                    <div key={cap} className="flex items-center gap-2.5">
                      <div className="w-4 h-4 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Sparkles size={8} />
                      </div>
                      <span className="text-[10px] font-bold text-white/70">{cap}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Suggested Questions */}
            <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-9 h-9 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
                  <MessageSquare size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Suggested Questions</h3>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Click to ask</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SUGGESTED_PROMPTS.map((prompt, i) => (
                  <div key={i} className="relative overflow-hidden group/prompt cursor-pointer p-4 rounded-xl bg-green-50 border border-green-100 hover:border-green-400 hover:bg-green-600 transition-all duration-300">
                    <div className="absolute top-2.5 right-2.5 opacity-0 group-hover/prompt:opacity-100 transition-opacity">
                      <Sparkles size={12} className="text-white" />
                    </div>
                    <p className="text-[10px] font-bold text-green-700 group-hover/prompt:text-white transition-colors leading-relaxed pr-3">
                      {prompt}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
