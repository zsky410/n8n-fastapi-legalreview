import { SendHorizonal } from "lucide-react";
import { useState } from "react";

import Button from "../ui/Button.jsx";
import Input from "../ui/Input.jsx";
import Spinner from "../ui/Spinner.jsx";
import ChatBubble from "./ChatBubble.jsx";

export default function ChatPanel({
  disabled = false,
  error,
  hint,
  isSending = false,
  messages = [],
  onSubmit,
  placeholder = "Đặt câu hỏi theo hồ sơ này...",
}) {
  const [draft, setDraft] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    if (!draft.trim() || !onSubmit) {
      return;
    }

    const currentDraft = draft;
    setDraft("");
    await onSubmit(currentDraft);
  }

  return (
    <div className="space-y-4">
      <div className="space-y-4 rounded-card-md border border-slate-200/80 bg-[#f5f7fb] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
        {messages.length ? (
          messages.map((message) => <ChatBubble key={message.id} message={message} />)
        ) : (
          <div className="rounded-card-md border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-[15px] text-muted">
            Chưa có hội đáp nào cho hồ sơ này.
          </div>
        )}
        {isSending ? (
          <div className="flex items-center gap-3 rounded-card border border-slate-200 bg-white px-4 py-3 text-[15px] text-muted shadow-[0_12px_24px_rgba(15,23,42,0.05)]">
            <Spinner />
            Đang chuẩn bị câu trả lời...
          </div>
        ) : null}
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <Input
          multiline
          value={draft}
          disabled={disabled || isSending}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={placeholder}
          hint={hint}
        />
        {error ? <p className="text-sm text-wise-danger">{error}</p> : null}
        <div className="flex justify-end">
          <Button type="submit" disabled={disabled || isSending || !draft.trim()}>
            <SendHorizonal className="h-4 w-4" />
            Gửi câu hỏi
          </Button>
        </div>
      </form>
    </div>
  );
}
