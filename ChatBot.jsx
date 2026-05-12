import { useState, useRef, useEffect, useCallback } from "react";
import {
  MessageCircle,X,Send,Bot,User,Building,GraduationCap,
  Briefcase,Star,BarChart2,Minimize2,Trash2,Loader2,
} from "lucide-react";

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_URL = your URL ";

const INTENTS = [
  {
    key: "company",
    keywords: ["company", "companies", "firm", "startup", "mnc", "business"],
    icon: Building,
    label: "Companies",
    color: "bg-blue-100 text-blue-700",
  },
  {
    key: "institute",
    keywords: ["college", "institute", "university", "iit", "nit", "iim"],
    icon: GraduationCap,
    label: "Institutes",
    color: "bg-emerald-100 text-emerald-700",
  },
  {
    key: "hiring",
    keywords: ["hiring", "job", "recruit", "opening", "vacancy", "apply"],
    icon: Briefcase,
    label: "Hiring",
    color: "bg-rose-100 text-rose-700",
  },
  {
    key: "placement",
    keywords: ["placement", "package", "salary", "lpa", "ctc", "offer"],
    icon: BarChart2,
    label: "Placements",
    color: "bg-amber-100 text-amber-700",
  },
  {
    key: "recommendation",
    keywords: ["recommend", "suggest", "best", "which", "advice"],
    icon: Star,
    label: "Recommendation",
    color: "bg-violet-100 text-violet-700",
  },
];

function detectIntent(text) {
  const lower = text.toLowerCase();
  for (const intent of INTENTS) {
    if (intent.keywords.some((kw) => lower.includes(kw))) return intent;
  }
  return null;
}

const SYSTEM_INSTRUCTION = `You are AI Chatbot, a smart assistant for India.

Rules:
- Always respond in English
- Keep answers concise (under 200 words)
- Use numbered lists when listing multiple items
- Focus on Indian context
- Be friendly and helpful`;

const QUICK_CHIPS = [
  { label: "🏢 IT companies in Mumbai", text: "Show IT companies in Mumbai" },
  {
    label: "🎓 Engineering colleges Gujarat",
    text: "Best engineering colleges in Gujarat",
  },
  {
    label: "💼 Fresher jobs 2025",
    text: "Top hiring companies for freshers in 2025",
  },
  {
    label: "📊 NIT Surat placements",
    text: "Placement records and packages at NIT Surat",
  },
];

const getTime = () =>
  new Date().toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

async function callGroq(userText, history) {
  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "openai/gpt-oss-20b",
      messages: [
        { role: "system", content: SYSTEM_INSTRUCTION },
        ...history,
        { role: "user", content: userText },
      ],
      temperature: 0.7,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.error?.message || "Groq API Error");
  }

  return data.choices[0].message.content;
}

function Bubble({ msg }) {
  const isUser = msg.role === "user";
  const intent = msg.intent || null;
  const IntentIcon = intent?.icon;

  return (
    <div className={`flex gap-2 ${isUser ? "flex-row-reverse" : "flex-row"} items-end`}>
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${
          isUser
            ? "bg-gradient-to-br from-violet-500 to-purple-600 text-white"
            : "bg-gradient-to-br from-indigo-400 to-blue-500 text-white"
        }`}
      >
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      <div className={`max-w-[80%] flex flex-col gap-1 ${isUser ? "items-end" : "items-start"}`}>
        {intent && IntentIcon && !isUser && (
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-semibold flex items-center gap-1 w-fit border ${intent.color}`}
          >
            <IntentIcon className="w-2.5 h-2.5" />
            {intent.label}
          </span>
        )}

        <div
          className={`px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${
            isUser
              ? "bg-gradient-to-br from-violet-600 to-purple-600 text-white rounded-2xl rounded-tr-sm"
              : "bg-white text-gray-800 rounded-2xl rounded-tl-sm border border-gray-100"
          }`}
        >
          {msg.content}
        </div>

        <span className="text-[10px] text-gray-400">{msg.time}</span>
      </div>
    </div>
  );
}

function Typing() {
  return (
    <div className="flex gap-2 items-end">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-blue-500 flex items-center justify-center flex-shrink-0">
        <Bot className="w-4 h-4 text-white" />
      </div>
      <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1.5 items-center shadow-sm">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-2 h-2 bg-violet-400 rounded-full animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [history, setHistory] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (open) {
      setUnreadCount(0);
      setTimeout(() => inputRef.current?.focus(), 150);

      if (messages.length === 0) {
        setMessages([
          {
            role: "assistant",
            content: "Namaste! 🙏 I'm AI Chatbot . How can I help you.",
            intent: null,
            time: getTime(),
          },
        ]);
      }
    }
  }, [open]);

  const send = useCallback(
    async (overrideText) => {
      const text = (overrideText ?? input).trim();
      if (!text || loading) return;

      if (!GROQ_API_KEY) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "⚠️ GROQ API key missing. Add VITE_GROQ_API_KEY in .env file.",
            intent: null,
            time: getTime(),
          },
        ]);
        return;
      }

      setInput("");
      const intent = detectIntent(text);

      setMessages((prev) => [
        ...prev,
        { role: "user", content: text, intent: null, time: getTime() },
      ]);

      setLoading(true);

      try {
        const reply = await callGroq(text, history);

        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: reply, intent, time: getTime() },
        ]);

        setHistory((prev) => [
          ...prev,
          { role: "user", content: text },
          { role: "assistant", content: reply },
        ]);

        if (!open) setUnreadCount((n) => n + 1);
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `⚠️ Error: ${err.message}`,
            intent: null,
            time: getTime(),
          },
        ]);
      }

      setLoading(false);
    },
    [input, loading, history, open]
  );

  const clearChat = useCallback(() => {
    setMessages([]);
    setHistory([]);
    setTimeout(() => {
      setMessages([
        {
          role: "assistant",
          content: "Chat cleared! How can I help you? 😊",
          intent: null,
          time: getTime(),
        },
      ]);
    }, 100);
  }, []);

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-violet-600 to-purple-600 text-white shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-200"
        title="Saarthi AI Assistant"
      >
        {open ? (
          <X className="w-6 h-6" />
        ) : (
          <>
            <MessageCircle className="w-6 h-6" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </>
        )}
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[385px] h-[580px] bg-[#f8f9fc] rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
          <div className="bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-3 flex items-center gap-3 flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center border border-white/30">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm">Saarthi AI</p>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <p className="text-violet-200 text-[11px]">
                  {loading ? "Thinking..." : "Online · Ask me anything"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={clearChat}
                className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                title="Clear chat"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                title="Close"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 scroll-smooth">
            {messages.map((msg, i) => (
              <Bubble key={i} msg={msg} />
            ))}

            {loading && <Typing />}

            {messages.length === 1 && !loading && (
              <div className="mt-1">
                <p className="text-[11px] text-gray-400 mb-2 font-medium">Try asking:</p>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_CHIPS.map((chip, i) => (
                    <button
                      key={i}
                      onClick={() => send(chip.text)}
                      className="text-[11px] px-2.5 py-1.5 rounded-full bg-white border border-violet-200 text-violet-700 hover:bg-violet-50 hover:border-violet-400 transition-colors shadow-sm"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          <div className="px-3 pb-3 pt-2 border-t border-gray-200 bg-white flex-shrink-0">
            <div className="flex gap-2 items-end bg-gray-50 rounded-xl border border-gray-200 px-3 py-2 focus-within:border-violet-400 focus-within:ring-1 focus-within:ring-violet-100 transition-all">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Ask about companies, colleges, jobs..."
                rows={1}
                disabled={loading}
                className="flex-1 bg-transparent outline-none text-sm text-gray-700 resize-none max-h-24 placeholder-gray-400 disabled:opacity-60"
                style={{ lineHeight: "1.5" }}
              />

              <button
                onClick={() => send()}
                disabled={!input.trim() || loading}
                className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-purple-600 text-white flex items-center justify-center disabled:opacity-40 hover:opacity-90 active:scale-95 transition-all flex-shrink-0"
                title="Send (Enter)"
              >
                {loading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            <p className="text-[10px] text-gray-400 text-center mt-1.5">
              Powered by Groq API · Press Enter to send · Shift+Enter for new line
            </p>
          </div>
        </div>
      )}
    </>
  );
}
