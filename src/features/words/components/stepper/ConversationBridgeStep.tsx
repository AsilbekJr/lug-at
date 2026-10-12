import * as React from 'react';
import { useAddWordStepperStore } from '@/features/words/store/useAddWordStepper';
import { Textarea } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, MessageSquare, CheckCircle2, AlertTriangle, Send } from 'lucide-react';

export const ConversationBridgeStep: React.FC = () => {
  const {
    cardData,
    sentenceFeedback,
    conversationReply,
    setConversationReply,
    isCheckingReply,
    replyFeedback,
    submitReplyForCheck,
    error,
  } = useAddWordStepperStore();

  if (!cardData) return null;

  const targetQuestion =
    sentenceFeedback?.follow_up_question ||
    `How do you usually demonstrate ${cardData.word} in challenging moments?`;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      if (!isCheckingReply && conversationReply.trim()) {
        submitReplyForCheck();
      }
    }
  };

  return (
    <div className="space-y-5 text-left animate-fadeIn">
      {/* Dialogue Bridge Box */}
      <div className="p-4 rounded-lg bg-[var(--color-surface-subtle)] border border-[var(--color-border)] space-y-2">
        <div className="flex items-center gap-1.5 text-xs text-[var(--color-accent)] font-medium">
          <MessageSquare className="w-3.5 h-3.5" strokeWidth={1.5} />
          <span>4-qadam: Muloqot ko‘prigi (Conversation Bridge)</span>
        </div>
        <p className="font-serif text-base sm:text-lg font-medium text-[var(--color-text)]">
          "{targetQuestion}"
        </p>
        <p className="text-xs text-[var(--color-text-muted)]">
          Muhim qoida: Javobingizda maqsadli <strong className="text-[var(--color-accent)] font-semibold font-mono">"{cardData.word}"</strong> so‘zini albatta qayta qo‘llang.
        </p>
      </div>

      {/* User Reply input */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-[var(--color-text)]">
            Sizning javobingiz:
          </label>
          <span className="text-[11px] font-mono text-[var(--color-text-muted)]">
            [Ctrl+Enter] yuborish
          </span>
        </div>

        <Textarea
          value={conversationReply}
          onChange={(e) => setConversationReply(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={3}
          placeholder={`Ingliz tilida "${cardData.word}" so‘zini ishlatgan holda javob bering...`}
          className="font-serif text-sm sm:text-base leading-relaxed"
          autoFocus
        />

        {error && (
          <p className="text-xs text-rose-600 dark:text-rose-400">
            {error}
          </p>
        )}

        <div className="flex justify-end pt-1">
          <Button
            type="button"
            variant="accent"
            size="sm"
            onClick={submitReplyForCheck}
            disabled={isCheckingReply || !conversationReply.trim()}
          >
            {isCheckingReply ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" strokeWidth={1.5} />
                Murabbiy tekshirmoqda...
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5 mr-1.5" strokeWidth={1.5} />
                Javobni tekshirish
              </>
            )}
          </Button>
        </div>
      </div>

      {/* AI Reply Feedback */}
      {replyFeedback && (
        <div className="p-4 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] space-y-3 animate-fadeIn">
          {/* Target word status */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--color-text)]">
              Maqsadli so‘z qo‘llanilishi:
            </span>
            {replyFeedback.used_target_word ? (
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2} />
                Muvaffaqiyatli qo‘llandi
              </span>
            ) : (
              <span className="text-xs font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" strokeWidth={2} />
                So‘z ishlatilmadi
              </span>
            )}
          </div>

          {/* Corrected version */}
          <div className="space-y-1">
            <span className="text-xs text-[var(--color-text-muted)]">
              Tuzatilgan shakli:
            </span>
            <div className="p-2.5 rounded bg-[var(--color-surface-subtle)] border border-[var(--color-border)] font-serif text-sm text-[var(--color-text)]">
              {replyFeedback.corrected}
            </div>
          </div>

          {/* Uzbek feedback */}
          <div
            className={`p-3 rounded text-xs leading-relaxed border-l-2 ${
              replyFeedback.used_target_word
                ? 'bg-emerald-500/5 border-l-emerald-600 text-[var(--color-text)]'
                : 'bg-amber-500/5 border-l-amber-600 text-[var(--color-text)]'
            }`}
          >
            <p className="font-medium mb-0.5">
              {replyFeedback.used_target_word ? '🎉 Barakalla!' : '💡 Eslatma:'}
            </p>
            <p>{replyFeedback.feedback_uz}</p>
          </div>
        </div>
      )}
    </div>
  );
};
