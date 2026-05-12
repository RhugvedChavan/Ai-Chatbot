import { useState, useRef } from "react";
import {
  Search, Bot, Building, GraduationCap,
  Briefcase, BarChart2, Star, Loader2
} from "lucide-react";

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_URL = your url;

const SYSTEM_INSTRUCTION = `You are AI Chatbot, a smart placement assistant for India.
Answer questions about companies, institutes, hiring, placements, and career recommendations.
Keep answers under 250 words. Use numbered lists for multiple items.
Focus on Indian companies, colleges, and cities.`;

const INTENT_STYLES = {
  company:        { icon: Building,      label: "Companies",       cls: "bg-blue-50 text-blue-700 border-blue-200" },
  institute:      { icon: GraduationCap, label: "Institutes",      cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  hiring:         { icon: Briefcase,     label: "Hiring",          cls: "bg-rose-50 text-rose-700 border-rose-200" },
  placement:      { icon: BarChart2,     label: "Placements",      cls: "bg-amber-50 text-amber-700 border-amber-200" },
  recommendation: { icon: Star,          label: "Recommendations", cls: "bg-violet-50 text-violet-700 border-violet-200" },
  general:        { icon: Bot,           label: "AI Answer",       cls: "bg-gray-50 text-gray-700 border-gray-200" },
};

const INTENT_KEYWORDS = {
  company:        ["company","companies","firm","startup","mnc","corporate","it company"],
  institute:      ["college","institute","university","iit","nit","iim","school","campus"],
  hiring:         ["hiring","job","recruit","opening","vacancy","apply","fresher"],
  placement:      ["placement","package","salary","lpa","ctc","placed","offer"],
  recommendation: ["recommend","suggest","best for","which","should i","advice"],
};

function detectIntent(text) {
  const lower = text.toLowerCase();
  for (const [key, keywords] of Object.entries(INTENT_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) return key;
  }
  return "general";
}

const SUGGESTIONS = [
  "Top IT companies in Mumbai",
  "Best engineering colleges in Gujarat",
  "Engineering colleges in Bangalore",
  "IT companies with 100+ employees",
  "Medical institutes in Maharashtra",
  "Fresher jobs in Hyderabad 2025",
  "IIM placement packages 2024",
  "Recommend companies for MBA graduate",
];

export default function SearchPage() {
  const [query, setQuery]     = useState("");
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const inputRef = useRef(null);

  async function handleSearch(q) {
    const text = (q ?? query).trim();
    if (!text) return;
    setQuery(text);
    setLoading(true);
    setResult(null);
    setError("");

    if (!GROQ_API_KEY) {
      setError("Groq API key missing. Please add VITE_GROQ_API_KEY in your .env file.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(GROQ_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.1-70b-versatile",
          messages: [
            { role: "system", content: SYSTEM_INSTRUCTION },
            { role: "user", content: text },
          ],
          temperature: 0.7,
          max_tokens: 600,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err?.error?.message || `API Error ${res.status}`);
      }

      const data = await res.json();
      const answer = data?.choices?.[0]?.message?.content || "No response.";
      setResult({ intent: detectIntent(text), answer });
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    }

    setLoading(false);
  }

  const intentMeta = result ? (INTENT_STYLES[result.intent] || INTENT_STYLES.general) : null;
  const IntentIcon = intentMeta?.icon;

  return (
    <div className="min-h-screen bg-[#f8f9fc] flex flex-col items-center px-4 py-16">

      {/* Badge */}
      <div className="mb-5 px-4 py-1.5 rounded-full bg-violet-100 text-violet-600 text-sm font-semibold flex items-center gap-2">
        <Bot className="w-4 h-4" />
        AI-Powered Search · Groq
      </div>

      {/* Heading */}
      <h1 className="text-4xl md:text-5xl font-semibold text-gray-800 text-center leading-tight">
        Find Anything, Instantly
      </h1>
      <p className="text-gray-500 mt-3 text-center max-w-xl text-base">
        Ask in plain English — companies, institutes, hiring, placements, recommendations
      </p>

      {/* Search bar */}
      <div className="w-full max-w-3xl mt-8">
        <div className="flex items-center bg-white border-2 border-gray-200 rounded-2xl px-4 py-3 shadow-sm focus-within:border-violet-400 transition-colors">
          <Search className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="e.g. Top IT companies in Mumbai or Best engineering colleges in Gujarat"
            className="flex-1 outline-none text-gray-700 text-sm bg-transparent"
          />
          <button
            onClick={() => handleSearch()}
            disabled={loading || !query.trim()}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-500 text-white text-sm font-medium disabled:opacity-50 flex items-center gap-2 transition-all hover:shadow-md"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Search
          </button>
        </div>
      </div>

      {/* Suggestion chips */}
      <div className="flex flex-wrap justify-center gap-2.5 mt-5 max-w-3xl">
        {SUGGESTIONS.map((item, i) => (
          <button
            key={i}
            onClick={() => handleSearch(item)}
            className="px-3.5 py-1.5 rounded-full bg-white border border-gray-200 text-sm text-gray-600 hover:bg-violet-50 hover:border-violet-300 hover:text-violet-700 transition-colors shadow-sm"
          >
            {item}
          </button>
        ))}
      </div>

      {/* AI Result card */}
      {result && intentMeta && IntentIcon && (
        <div className="w-full max-w-3xl mt-8 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className={`px-5 py-3 border-b flex items-center gap-2 ${intentMeta.cls}`}>
            <IntentIcon className="w-4 h-4" />
            <span className="text-sm font-semibold">{intentMeta.label}</span>
            <span className="ml-auto text-xs opacity-50 truncate max-w-[200px]">"{query}"</span>
          </div>
          <div className="p-6 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
            {result.answer}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="w-full max-w-3xl mt-6 px-5 py-4 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-700">
          ⚠️ {error}
        </div>
      )}
    </div>
  );
}
