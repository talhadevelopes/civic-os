import AssistantClient from "@/app/_components/common/AssistantClient";

const SUGGESTED_PROMPTS = [
  "What are the top unresolved issues in Kukatpally right now?",
  "Which MLA has the worst pothole resolution rate this month?",
  "How many drainage issues were reported in Secunderabad?",
  "What is the current civic health score?",
  "Which ward has the most reopened issues?",
];

export default function AssistantPage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <div className="mx-auto flex max-w-3xl flex-col px-4 py-10 sm:px-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold" style={{ color: "var(--text-heading)" }}>
            Civic AI Assistant
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-body)" }}>
            Ask questions about Hyderabad&apos;s civic issues. Answers are grounded in live platform data.
          </p>
        </div>
        <AssistantClient suggestedPrompts={SUGGESTED_PROMPTS} />
      </div>
    </div>
  );
}
