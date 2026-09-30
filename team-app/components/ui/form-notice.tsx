"use client";

import { useRef, useState, type RefObject } from "react";

export type Notice = { tone: "success" | "error"; message: string };

/**
 * Result message state for a form. `showNotice` moves focus to the message so screen reader
 * and keyboard users hear it (CLAUDE.md: move focus when a UI swaps content).
 */
export function useFormNotice() {
  const noticeRef = useRef<HTMLParagraphElement>(null);
  const [notice, setNotice] = useState<Notice | null>(null);

  function showNotice(next: Notice) {
    setNotice(next);
    requestAnimationFrame(() => noticeRef.current?.focus());
  }

  return { notice, noticeRef, showNotice, clearNotice: () => setNotice(null) };
}

interface FormNoticeProps {
  notice: Notice | null;
  noticeRef: RefObject<HTMLParagraphElement | null>;
}

/** Success ("status") or error ("alert") message at the top of a form. */
export function FormNotice({ notice, noticeRef }: FormNoticeProps) {
  if (!notice) return null;
  return (
    <p
      ref={noticeRef}
      tabIndex={-1}
      role={notice.tone === "error" ? "alert" : "status"}
      className={
        "rounded-lg px-3 py-2 text-sm font-medium focus-visible:outline-none " +
        (notice.tone === "success" ? "bg-primary-soft text-primary" : "bg-danger-soft text-danger")
      }
    >
      {notice.message}
    </p>
  );
}
