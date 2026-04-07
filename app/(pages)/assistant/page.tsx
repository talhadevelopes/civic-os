"use client";

import AssistantClient from "@/app/_components/common/AssistantClient";
import { PageShell } from "@/app/_components/global/AppSidebar";
import { Brain, MessageSquare, Zap, Sparkles } from "lucide-react";

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
          {/* Main Content Area */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Chat Area - Left 2/3 */}
            <div className="lg:col-span-2">
              <div className="bg-white border border-gray-100 rounded-3xl shadow-xl overflow-hidden flex flex-col min-h-[600px]">
                <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center">
                      <Brain size={20} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-gray-900">Live AI Chat</h3>
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Connected to CivicOS Data</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex-1 flex flex-col p-6">
                  <AssistantClient suggestedPrompts={SUGGESTED_PROMPTS} />
                </div>
              </div>
            </div>

            {/* Side Panels - Right 1/3 */}
            <div className="space-y-6">
              {/* Intelligence Hub */}
              <div className="relative overflow-hidden bg-gray-900 p-8 rounded-3xl text-white group">
                <div className="absolute -bottom-10 -right-10 opacity-10 group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                  <Brain size={180} />
                </div>
                <div className="relative z-10">
                  <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-6 border border-white/10">
                    <Zap size={24} />
                  </div>
                  <h3 className="text-xl font-bold mb-2.5 tracking-tight">Intelligence Hub</h3>
                  <p className="text-white/70 text-xs leading-relaxed mb-6 font-medium">
                    Analyze live civic data, MLA performance, and ward-level trends instantly.
                  </p>
                  <div className="space-y-3">
                    {[
                      "Live issue querying",
                      "MLA performance",
                      "Ward-by-ward data",
                      "Trend detection",
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
              <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-9 h-9 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
                    <MessageSquare size={18} />
                  </div>
                  <h3 className="text-sm font-bold text-gray-900">Try these questions</h3>
                </div>
                <div className="space-y-3">
                  {SUGGESTED_PROMPTS.slice(0, 3).map((prompt, i) => (
                    <div key={i} className="p-4 rounded-xl bg-green-50 border border-green-100 hover:border-green-400 cursor-pointer transition-all">
                      <p className="text-[10px] font-bold text-green-700 leading-relaxed">
                        {prompt}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
