"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function CommentInput({
  onPost,
  disabled,
  placeholder,
}: {
  onPost: (text: string) => Promise<void>;
  disabled?: boolean;
  placeholder?: string;
}) {
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);

  return (
    <div className="flex gap-2">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder ?? "Write a comment..."}
        className="flex-1 rounded-md border px-3 py-2 bg-input"
        onKeyDown={async (e) => {
          if (e.key === "Enter" && !posting && text.trim()) {
            setPosting(true);
            try {
              await onPost(text.trim());
              setText("");
            } finally {
              setPosting(false);
            }
          }
        }}
        disabled={disabled}
      />
      <Button
        size="sm"
        onClick={async () => {
          if (!text.trim() || posting) return;
          setPosting(true);
          try {
            await onPost(text.trim());
            setText("");
          } finally {
            setPosting(false);
          }
        }}
        disabled={disabled}
      >
        {posting ? "Posting…" : "Post"}
      </Button>
    </div>
  );
}