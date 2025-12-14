"use client";

import React, { useState } from "react";
import { FiShare2 } from "react-icons/fi";
import ShareModal from "@/components/Hack/ShareModal";

interface HackShareButtonProps {
  title: string;
  url: string;
  author: string | null;
}

export default function HackShareButton({ title, url, author }: HackShareButtonProps) {
  const [showShareModal, setShowShareModal] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setShowShareModal(true)}
        aria-label="Share hack"
        title="Share"
        className="group inline-flex px-3 md:px-2 h-8 items-center justify-center rounded-md ring-1 ring-[var(--border)] bg-[var(--surface-2)] text-foreground/80 hover:bg-[var(--surface-3)] hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border)]"
      >
        <FiShare2 size={18} />
        <span className="ml-2 font-semibold text-sm">Share</span>
      </button>
      {showShareModal && (
        <ShareModal title={title} url={url} author={author} onClose={() => setShowShareModal(false)} />
      )}
    </>
  );
}
