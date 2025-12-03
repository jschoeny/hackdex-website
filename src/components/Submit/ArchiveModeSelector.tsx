"use client";

import React, { useEffect } from "react";

type ArchiveModeSelectorProps = {
  onSelect: (isArchive: boolean) => void;
};

const ArchiveModeSelector: React.FC<ArchiveModeSelectorProps> = ({ onSelect }) => {
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const previousHtmlOverflow = html.style.overflow;
    const previousBodyOverflow = body.style.overflow;
    const previousBodyPaddingRight = body.style.paddingRight;
    const scrollBarWidth = window.innerWidth - html.clientWidth;

    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    if (scrollBarWidth > 0) {
      body.style.paddingRight = `${scrollBarWidth}px`;
    }

    return () => {
      html.style.overflow = previousHtmlOverflow;
      body.style.overflow = previousBodyOverflow;
      body.style.paddingRight = previousBodyPaddingRight;
    };
  }, []);

  return (
    <div className="fixed left-0 right-0 top-16 bottom-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 dark:bg-black/60 backdrop-blur-sm" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Select hack type"
        className="relative z-[101] mb-16 card backdrop-blur-lg dark:!bg-white/6 p-6 max-w-md w-full rounded-lg"
      >
        <div className="flex flex-col gap-8 sm:gap-4">
          <div>
            <div className="text-xl font-semibold">What would you like to create?</div>
            <p className="mt-1 text-sm text-foreground/80">
              Choose whether you&apos;re creating a new hack for yourself or archiving an existing hack for preservation purposes.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => onSelect(false)}
              className="shine-wrap btn-premium h-14 sm:h-11 w-full text-sm font-semibold rounded-md text-[var(--accent-foreground)]"
            >
              <span>Create new hack</span>
            </button>
            <button
              type="button"
              onClick={() => onSelect(true)}
              className="inline-flex h-14 sm:h-11 w-full items-center justify-center rounded-md px-4 text-sm font-semibold ring-1 ring-[var(--border)] hover:bg-[var(--surface-2)]"
            >
              Create Archive hack
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArchiveModeSelector;
