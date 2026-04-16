import { SendHorizonal } from "lucide-react";
import { useState } from "react";

import Button from "../ui/Button.jsx";
import Input from "../ui/Input.jsx";
import Spinner from "../ui/Spinner.jsx";
import ChatBubble from "./ChatBubble.jsx";

export default function ChatPanel({
  disabled = false,
  error,
  hint = "Đặt câu hỏi theo hồ sơ này để nhận giải thích ngắn gọn và trích dẫn mẫu.",
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
      <div className="space-y-4 rounded-card-md border border-line bg-surface p-4 shadow-ring">
        {messages.length ? (
          messages.map((message) => <ChatBubble key={message.id} message={message} />)
        ) : (
          <div className="rounded-card border border-dashed border-line bg-[#fffefa] px-4 py-8 text-center text-lg text-muted">
            Chưa có hội đáp nào cho hồ sơ này.
          </div>
        )}
        {isSending ? (
          <div className="flex items-center gap-3 rounded-card border border-line bg-[#fffefa] px-4 py-3 text-lg text-muted shadow-ring">
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
