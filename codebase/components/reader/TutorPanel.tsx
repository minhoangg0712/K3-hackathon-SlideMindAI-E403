"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bot, History, KeyRound, Plus, Send, ThumbsDown, ThumbsUp, X } from "lucide-react";
import { useCurrentUser, useI18n } from "@/components/providers";
import { confidenceLabel } from "@/lib/i18n";
import {
  askTutor,
  bumpQuota,
  clearConversation,
  rateAnswer,
  readQuota,
  TUTOR_DAILY_LIMIT,
} from "@/lib/tutor-client";
import type { ChatMessage, TutorScope } from "@/lib/types";

function newLocalId(): string {
  return typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `m-${Date.now()}-${Math.random()}`;
}

export function TutorPanel({
  scope,
  pageNumber,
  selectedText,
  onConsumeSelection,
}: {
  scope: TutorScope;
  pageNumber: number;
  selectedText: string;
  onConsumeSelection: () => void;
}) {
  const { dict } = useI18n();
  const user = useCurrentUser();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  // Số lượt đã dùng chỉ tăng khi ta gửi câu hỏi, nên đọc localStorage một lần
  // theo email hiện tại là đủ — không cần đồng bộ ngược trong effect.
  const [usedCount, setUsedCount] = useState<number | null>(null);
  const [byokOpen, setByokOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const quota = {
    usedCount: usedCount ?? (typeof window === "undefined" ? 0 : readQuota(user?.email).usedCount),
    maxLimit: TUTOR_DAILY_LIMIT,
  };

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // maxLimit 0 = tắt hạn mức (NEXT_PUBLIC_TUTOR_DAILY_LIMIT=0), dùng khi demo.
  const quotaReached = quota.maxLimit > 0 && quota.usedCount >= quota.maxLimit;

  const send = useCallback(async () => {
    const question = input.trim();
    if (!question || busy || quotaReached) return;

    const userMessage: ChatMessage = {
      id: newLocalId(),
      sender: "user",
      text: question,
      pageNumber,
      selectedText: selectedText || undefined,
    };
    const aiMessage: ChatMessage = {
      id: newLocalId(),
      sender: "ai",
      text: "",
      pageNumber,
      streaming: true,
    };

    setMessages((previous) => [...previous, userMessage, aiMessage]);
    setInput("");
    setBusy(true);
    onConsumeSelection();

    const patchAi = (patch: Partial<ChatMessage>) =>
      setMessages((previous) =>
        previous.map((message) => (message.id === aiMessage.id ? { ...message, ...patch } : message)),
      );

    await askTutor(
      {
        ...scope,
        page_number: pageNumber,
        user_question: question,
        selected_text: selectedText || undefined,
      },
      {
        onDelta: (delta) =>
          setMessages((previous) =>
            previous.map((message) =>
              message.id === aiMessage.id ? { ...message, text: message.text + delta } : message,
            ),
          ),
        onFinal: (final) => {
          patchAi({ streaming: false, text: final.answer, final });
          setUsedCount(bumpQuota(user?.email));
        },
        onError: (message) => patchAi({ streaming: false, error: message }),
      },
    );

    setBusy(false);
  }, [busy, input, onConsumeSelection, pageNumber, quotaReached, scope, selectedText, user?.email]);

  const startNewChat = useCallback(() => {
    clearConversation(scope);
    setMessages([]);
  }, [scope]);

  const rate = useCallback(async (message: ChatMessage, rating: "up" | "down") => {
    setMessages((previous) =>
      previous.map((item) => (item.id === message.id ? { ...item, rating } : item)),
    );
    if (message.final?.message_id) {
      await rateAnswer(message.final.message_id, rating).catch(() => {
        /* im lặng — không chặn luồng học */
      });
    }
  }, []);

  const quotaPercent =
    quota.maxLimit > 0 ? Math.min(100, (quota.usedCount / quota.maxLimit) * 100) : 0;

  return (
    <aside className="flex w-[320px] shrink-0 flex-col border-l border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <div className="flex items-start gap-2.5 border-b border-slate-100 px-4 py-3 dark:border-slate-800">
        <div className="mt-0.5 rounded-lg bg-[#134D8B]/10 p-1.5 text-[#134D8B] dark:bg-sky-950 dark:text-sky-300">
          <Bot className="h-4 w-4" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-extrabold text-slate-900 dark:text-white">
            {dict.readerChat.title}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {dict.readerChat.ragStatus}
          </p>
        </div>
        <button
          type="button"
          title={dict.readerChat.history}
          aria-label={dict.readerChat.historyAria}
          className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
        >
          <History className="h-4 w-4" aria-hidden />
        </button>
        <button
          type="button"
          onClick={startNewChat}
          title={dict.readerChat.newChat}
          aria-label={dict.readerChat.newChatAria}
          className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
        >
          <Plus className="h-4 w-4" aria-hidden />
        </button>
        <span className="mt-1 shrink-0 rounded-md border border-slate-200 px-1.5 py-0.5 text-[10px] font-bold text-slate-500 dark:border-slate-700 dark:text-slate-400">
          {dict.readerChat.slidePage(pageNumber)}
        </span>
      </div>

      <div className="border-b border-slate-100 px-4 py-2 dark:border-slate-800">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
            {dict.quota.label}
          </span>
          <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">
            {dict.quota.count(quota.usedCount, quota.maxLimit)}
          </span>
          <button
            type="button"
            onClick={() => setByokOpen(true)}
            title={dict.quota.byokInfo}
            className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-bold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
          >
            <KeyRound className="h-3 w-3 text-amber-500" aria-hidden />
            <span>BYOK</span>
          </button>
        </div>
        <div className="mt-1.5 h-1 rounded-full bg-slate-100 dark:bg-slate-800">
          <div
            className="h-full rounded-full bg-[#134D8B] transition-all dark:bg-sky-500"
            style={{ width: `${quotaPercent}%` }}
          />
        </div>
      </div>

      <div
        ref={scrollRef}
        className="scrollbar-thin-vlearn min-h-0 flex-1 space-y-4 overflow-y-auto overflow-x-hidden px-4 py-4"
      >
        {messages.length === 0 ? (
          <p className="rounded-xl bg-slate-50 px-3 py-2.5 text-xs leading-relaxed text-slate-600 dark:bg-slate-900 dark:text-slate-300">
            {dict.readerChat.welcome}
          </p>
        ) : null}

        {messages.map((message) =>
          message.sender === "user" ? (
            <div key={message.id} className="flex justify-end">
              <div className="max-w-[85%] break-words rounded-2xl rounded-br-sm bg-[#124f8c] px-3 py-2 text-xs font-bold leading-relaxed text-white">
                {message.text}
              </div>
            </div>
          ) : (
            <div key={message.id} className="space-y-1.5">
              {message.pageNumber ? (
                <p className="text-[10px] text-slate-400">
                  {dict.readerChat.contextPage(message.pageNumber)}
                </p>
              ) : null}

              <div className="rounded-2xl rounded-bl-sm border border-slate-200 bg-white px-3 py-2.5 dark:border-slate-800 dark:bg-slate-900">
                {message.error ? (
                  <p className="text-xs font-semibold text-red-600 dark:text-red-400">
                    {message.error}
                  </p>
                ) : (
                  <div className="space-y-2 text-xs leading-relaxed text-slate-700 dark:text-slate-200">
                    {message.text
                      .split(/\n{2,}/)
                      .filter(Boolean)
                      .map((paragraph, index) => (
                        // break-words để đường dẫn/token dài không kéo tràn panel.
                        <p key={index} className="whitespace-pre-wrap break-words">
                          {paragraph}
                        </p>
                      ))}
                    {message.streaming ? (
                      <span className="inline-block h-3 w-1.5 animate-pulse bg-[#134D8B] align-middle dark:bg-sky-400" />
                    ) : null}
                  </div>
                )}

                {message.final && !message.error ? (
                  <div className="mt-3 border-t border-slate-100 pt-2 dark:border-slate-800">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] text-slate-400">
                        {dict.aiMessage.helpfulPrompt}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => rate(message, "up")}
                          aria-label={dict.aiMessage.thumbsUp}
                          className={`rounded-md p-1 transition-colors ${
                            message.rating === "up"
                              ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300"
                              : "text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                          }`}
                        >
                          <ThumbsUp className="h-3.5 w-3.5" aria-hidden />
                        </button>
                        <button
                          type="button"
                          onClick={() => rate(message, "down")}
                          aria-label={dict.aiMessage.thumbsDown}
                          className={`rounded-md p-1 transition-colors ${
                            message.rating === "down"
                              ? "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-300"
                              : "text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                          }`}
                        >
                          <ThumbsDown className="h-3.5 w-3.5" aria-hidden />
                        </button>
                      </div>
                    </div>

                    {message.final.citations.length > 0 ? (
                      <p className="mt-1.5 text-[10px] text-slate-400">
                        {dict.aiMessage.sources(message.final.citations.length)} ·{" "}
                        {message.final.citations.map((citation) => `trang ${citation.page}`).join(", ")}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>

              {message.final && !message.error ? (
                <div className="flex items-center gap-2 px-1">
                  <div className="h-1 w-14 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className={`h-full rounded-full ${
                        message.final.confidence >= 0.75
                          ? "bg-emerald-500"
                          : message.final.confidence >= 0.5
                            ? "bg-amber-500"
                            : "bg-red-500"
                      }`}
                      style={{ width: `${Math.round(message.final.confidence * 100)}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                    {Math.round(message.final.confidence * 100)}% ·{" "}
                    {confidenceLabel(dict, message.final.confidence)}
                  </span>
                  <span className="ml-auto flex items-center gap-1.5">
                    {/* Nhãn provider: câu trả lời mock không được trình bày như AI thật. */}
                    {message.final.provider === "mock" ? (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black uppercase text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                        Mock
                      </span>
                    ) : (
                      <span className="rounded-full bg-[#134D8B]/10 px-2 py-0.5 text-[10px] font-black uppercase text-[#134D8B] dark:bg-sky-950 dark:text-sky-300">
                        Claude · live
                      </span>
                    )}
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        message.final.status === "answered"
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                          : "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                      }`}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                      {message.final.status === "answered"
                        ? dict.aiMessage.answered.toUpperCase()
                        : dict.aiMessage.notFound.toUpperCase()}
                    </span>
                  </span>
                </div>
              ) : null}
            </div>
          ),
        )}
      </div>

      {selectedText ? (
        <div className="mx-4 mb-2 flex items-start gap-2 rounded-lg border border-[#134D8B]/20 bg-[#134D8B]/5 px-2.5 py-2 dark:border-sky-900 dark:bg-sky-950/50">
          <p className="min-w-0 flex-1 text-[10px] leading-relaxed text-[#134D8B] dark:text-sky-200">
            <span className="line-clamp-2">{selectedText}</span>
          </p>
          <button
            type="button"
            onClick={onConsumeSelection}
            aria-label="Bỏ đoạn đã chọn"
            className="text-[#134D8B]/60 hover:text-[#134D8B] dark:text-sky-300"
          >
            <X className="h-3.5 w-3.5" aria-hidden />
          </button>
        </div>
      ) : null}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void send();
        }}
        className="flex items-end gap-2 border-t border-slate-100 px-3 py-3 dark:border-slate-800"
      >
        <textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void send();
            }
          }}
          rows={1}
          disabled={quotaReached}
          placeholder={
            quotaReached ? dict.readerChat.quotaPlaceholder : dict.readerChat.inputPlaceholder
          }
          className="scrollbar-thin-vlearn max-h-28 min-h-9 flex-1 resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-[#134D8B]/40 disabled:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:disabled:bg-slate-900"
        />
        <button
          type="submit"
          disabled={busy || quotaReached || input.trim().length === 0}
          aria-label={dict.readerChat.send}
          className="rounded-xl bg-[#124f8c] p-2 text-white transition-colors hover:bg-[#0b355f] disabled:bg-slate-200 disabled:text-slate-400 dark:disabled:bg-slate-800"
        >
          <Send className="h-4 w-4" aria-hidden />
        </button>
      </form>

      {byokOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm font-extrabold text-slate-900 dark:text-white">
              {dict.byok.title}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              {dict.byok.notReady}
            </p>
            <button
              type="button"
              onClick={() => setByokOpen(false)}
              className="mt-4 w-full rounded-xl bg-[#124f8c] px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-[#0b355f]"
            >
              {dict.byok.close}
            </button>
          </div>
        </div>
      ) : null}
    </aside>
  );
}
