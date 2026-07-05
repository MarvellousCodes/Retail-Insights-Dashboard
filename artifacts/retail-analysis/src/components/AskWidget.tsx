import { useState, useEffect, useRef, useCallback } from "react";
import { Sparkles, Send, Loader2, X, Plus, History, MessageSquare } from "lucide-react";
import { isLoggedIn } from "@/lib/api";
import { useAskHistory, useCurrentCid, runAsk, newConversation, setCurrentCid, groupConversations, askTimeAgo } from "@/lib/askStore";

const QUICK = [
  "Which 5 products am I losing money on?",
  "Top 3 departments by revenue?",
  "What is my busiest day of the week?",
];

export function AskWidget() {
  const [open, setOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const history = useAskHistory();
  const cid = useCurrentCid();
  const endRef = useRef<HTMLDivElement | null>(null);

  const turns = history.filter((t) => t.cid === cid).slice().reverse(); // chronological
  const conversations = groupConversations(history);

  useEffect(() => {
    if (open && !showHistory) endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns.length, open, busy, showHistory]);

  const submit = useCallback(
    async (question: string) => {
      const text = question.trim();
      if (!text || busy) return;
      setError("");
      setBusy(true);
      setQ("");
      const r = await runAsk(text);
      if (!r.ok) setError(r.error || "Something went wrong, please try again.");
      setBusy(false);
    },
    [busy]
  );

  if (!isLoggedIn()) return null;

  return (
    <>
      {open && (
        <div className="fixed bottom-24 right-4 z-50 flex flex-col w-[min(92vw,384px)] h-[min(72vh,580px)] rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-3 py-3 bg-violet-600 text-white shrink-0">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Sparkles className="w-4 h-4" /> Ask your shop
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setShowHistory((v) => !v)} title="Past conversations" className={`p-1.5 rounded-lg hover:bg-white/20 ${showHistory ? "bg-white/20" : ""}`}>
                <History className="w-4 h-4" />
              </button>
              <button onClick={() => { newConversation(); setShowHistory(false); setError(""); }} title="New chat" className="p-1.5 rounded-lg hover:bg-white/20">
                <Plus className="w-4 h-4" />
              </button>
              <button onClick={() => setOpen(false)} aria-label="Close" className="p-1.5 rounded-lg hover:bg-white/20">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {showHistory ? (
            <div className="flex-1 overflow-y-auto p-2">
              <p className="px-2 py-2 text-[11px] uppercase tracking-wide text-gray-400">Past conversations</p>
              {conversations.length === 0 && <p className="px-2 text-xs text-gray-400">No conversations yet.</p>}
              {conversations.map((c) => (
                <button
                  key={c.cid}
                  onClick={() => { setCurrentCid(c.cid); setShowHistory(false); }}
                  className={`w-full text-left px-2.5 py-2 rounded-lg hover:bg-violet-50 dark:hover:bg-violet-900/20 transition ${c.cid === cid ? "bg-violet-50 dark:bg-violet-900/20" : ""}`}
                >
                  <span className="flex items-center gap-1.5 text-xs text-gray-700 dark:text-gray-200">
                    <MessageSquare className="w-3 h-3 shrink-0 text-violet-500" />
                    <span className="truncate">{c.title}</span>
                  </span>
                  <span className="block text-[10px] text-gray-400 mt-0.5 pl-4">{c.turns.length} message{c.turns.length === 1 ? "" : "s"} · {askTimeAgo(c.updated)}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {turns.length === 0 && !busy && (
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  <p className="mb-3">Ask a plain-English question about your stock, margins, departments, sales or suppliers. It is read-only, so it can never change your data. If a question is unclear I will ask a quick follow-up.</p>
                  <div className="flex flex-col gap-2">
                    {QUICK.map((s) => (
                      <button key={s} onClick={() => submit(s)} className="text-left px-3 py-2 rounded-lg bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-900/50 transition">
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {turns.map((t) => (
                <div key={t.ts} className="space-y-1.5">
                  <div className="flex justify-end">
                    <div className="max-w-[85%] px-3 py-2 rounded-2xl rounded-br-sm bg-violet-600 text-white text-sm">{t.q}</div>
                  </div>
                  <div className="flex justify-start">
                    <div className={`max-w-[90%] px-3 py-2 rounded-2xl rounded-bl-sm text-sm whitespace-pre-wrap leading-relaxed ${t.clarify ? "bg-amber-50 dark:bg-amber-900/20 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-800" : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100"}`}>
                      {t.answer}
                      {t.clarify ? (
                        <div className="mt-1 text-[11px] text-amber-600 dark:text-amber-400">reply to continue</div>
                      ) : (
                        t.row_count > 0 && <div className="mt-1 text-[11px] text-gray-400">{t.row_count} row{t.row_count === 1 ? "" : "s"}</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {busy && (
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Thinking…
                </div>
              )}
              {error && <div className="text-xs text-amber-600 dark:text-amber-400">{error}</div>}
              <div ref={endRef} />
            </div>
          )}

          {!showHistory && (
            <div className="p-2.5 border-t border-gray-100 dark:border-gray-700 shrink-0">
              <div className="flex gap-2">
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") submit(q); }}
                  placeholder="Ask anything about your shop…"
                  className="flex-1 h-10 px-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
                <button onClick={() => submit(q)} disabled={!q.trim() || busy} aria-label="Send" className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-violet-600 text-white hover:bg-violet-700 transition disabled:opacity-50">
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <button onClick={() => setOpen((o) => !o)} aria-label="Ask your shop" className="fixed bottom-5 right-4 z-50 w-14 h-14 rounded-full bg-violet-600 hover:bg-violet-700 text-white shadow-xl flex items-center justify-center transition">
        {open ? <X className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
      </button>
    </>
  );
}
