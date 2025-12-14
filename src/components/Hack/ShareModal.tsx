"use client";

import React, { useEffect, useState } from "react";
import { FiX, FiCheck, FiCopy, FiMail, FiShare2, FiArrowLeft } from "react-icons/fi";
import { FaXTwitter, FaReddit, FaFacebook } from "react-icons/fa6";
import { FaInfoCircle } from "react-icons/fa";
import { PiBracketsSquareBold, PiBracketsAngleBold } from "react-icons/pi";

const BANNER_IMAGE_URL = "/img/badge-dark.png";
const BANNER_IMAGE_WIDTH = 190;
const BANNER_IMAGE_HEIGHT = 60;
const BANNER_IMAGE_FULL_URL = `${process.env.NEXT_PUBLIC_SITE_URL}/img/badge-dark.png`;

interface ShareModalProps {
  title: string;
  url: string;
  author: string | null;
  onClose: () => void;
}

const ShareModal: React.FC<ShareModalProps> = ({ title, url, author, onClose }) => {
  const [urlCopied, setUrlCopied] = useState(false);
  const [codePreview, setCodePreview] = useState<{ type: string; code: string; label: string } | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);
  const hasNavigatorShare = typeof navigator !== "undefined" && navigator.share;

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

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setUrlCopied(true);
      setTimeout(() => setUrlCopied(false), 2000);
    } catch (e) {
      console.error("Failed to copy URL:", e);
    }
  };

  const copyCode = async () => {
    if (!codePreview) return;
    try {
      await navigator.clipboard.writeText(codePreview.code);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    } catch (e) {
      console.error("Failed to copy code:", e);
    }
  };

  const getCodePreview = (type: string): { code: string; label: string } | null => {
    switch (type) {
      case "bbcode":
        return { code: `[url=${url}][img width=${BANNER_IMAGE_WIDTH} height=${BANNER_IMAGE_HEIGHT}]${BANNER_IMAGE_FULL_URL}[/img][/url]`, label: "BBCode" };
      case "html":
        return { code: `<a href="${url}"><img width="${BANNER_IMAGE_WIDTH}" height="${BANNER_IMAGE_HEIGHT}" src="${BANNER_IMAGE_FULL_URL}" alt="Download now at hackdex.app" /></a>`, label: "HTML" };
      default:
        return null;
    }
  };

  const handleShare = async (type: string) => {
    // Show preview for code formats
    if (type === "bbcode" || type === "html") {
      const preview = getCodePreview(type);
      if (preview) {
        setCodePreview({ type, ...preview });
        return;
      }
    }

    const socialTitle = author ? `Romhack: ${title} by ${author}` : `Romhack: ${title}`;

    switch (type) {
      case "other": {
        try {
          await navigator.share({
            title: socialTitle,
            url,
          });
        } catch (e) {
          // Ignore if user cancels share
          if (!(e instanceof Error) || e.name !== "AbortError") {
            console.error(e);
          }
        }
        break;
      }
      case "reddit": {
        const redditUrl = `https://www.reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(socialTitle)}`;
        window.open(redditUrl, "_blank", "width=1024,height=768");
        break;
      }
      case "twitter": {
        const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(socialTitle)}`;
        window.open(twitterUrl, "_blank", "width=1024,height=768");
        break;
      }
      case "email": {
        const subject = encodeURIComponent(`Check out ${title}`);
        const body = encodeURIComponent(`I found this ROM hack that you might like: ${url}`);
        window.location.href = `mailto:?subject=${subject}&body=${body}`;
        break;
      }
      case "facebook": {
        const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        window.open(facebookUrl, "_blank", "width=1024,height=768");
        break;
      }
    }
  };

  const SocialIconButton = ({
    type,
    icon: Icon,
    label,
  }: {
    type: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    label: string;
  }) => {
    return (
      <button
        type="button"
        onClick={() => handleShare(type)}
        className="flex flex-col items-center gap-1.5 min-w-18 p-3 rounded-lg ring-1 ring-[var(--border)] bg-[var(--surface-2)] hover:bg-black/5 dark:hover:bg-white/10"
        title={label}
      >
        <div className="w-12 h-12 rounded-full flex items-center justify-center bg-[var(--surface-1)] text-foreground/80">
          <Icon size={26} />
        </div>
        <span className="text-xs font-medium text-foreground/70">
          {label}
        </span>
      </button>
    );
  };


  // Show code preview modal if codePreview is set
  if (codePreview) {
    return (
      <div className="fixed left-0 right-0 top-0 bottom-0 z-[100] flex items-center justify-center p-4">
        <div
          className="absolute inset-0 bg-black/50 dark:bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${codePreview.label} code preview`}
          className="relative z-[101] card backdrop-blur-lg dark:!bg-black/70 p-6 max-w-lg max-h-[90vh] overflow-y-auto w-full rounded-lg"
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="Close code preview"
            className="absolute top-4 right-4 p-1.5 rounded-md text-foreground/60 hover:text-foreground hover:bg-[var(--surface-2)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          >
            <FiX size={20} />
          </button>

          <div className="flex flex-col gap-6">
            {/* Header */}
            <div>
              <button
                type="button"
                onClick={() => setCodePreview(null)}
                className="inline-flex items-center gap-2 text-sm text-foreground/70 hover:text-foreground mb-3"
                aria-label="Back to share options"
              >
                <FiArrowLeft size={16} />
                <span>Back</span>
              </button>
              <h2 className="text-xl font-semibold">{codePreview.label} Code</h2>
              <p className="mt-1 text-sm text-foreground/70">
                Copy the code below to share this hack with the badge.
              </p>
            </div>

            {/* Badge Preview */}
            <div className="flex flex-col gap-2">
              <p className="text-xs text-foreground/60 font-medium">Preview:</p>
              <div className="flex justify-center p-3 rounded-md bg-[var(--surface-1)] border border-[var(--border)]">
                <img
                  src={BANNER_IMAGE_URL}
                  width={BANNER_IMAGE_WIDTH}
                  height={BANNER_IMAGE_HEIGHT}
                  alt="Download now at hackdex.app"
                  className="max-w-full h-auto rounded"
                />
              </div>
            </div>

            {/* Code Section */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground/90">Code</p>
              </div>
              <div className="flex flex-col gap-2">
                <textarea
                  readOnly
                  value={codePreview.code}
                  rows={3}
                  className="flex-1 px-3 py-2.5 rounded-md border border-[var(--border)] bg-[var(--surface-1)] text-sm text-foreground/80 font-mono resize-none focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                />
                <button
                  type="button"
                  onClick={copyCode}
                  className="inline-flex items-center gap-1.5 self-end mr-1 text-sm text-foreground/70 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-[var(--accent)] rounded"
                  title="Copy to clipboard"
                  aria-label="Copy code to clipboard"
                >
                  {codeCopied ? (
                    <>
                      <FiCheck size={16} className="text-green-500" />
                      <span className="text-green-500">Copied</span>
                    </>
                  ) : (
                    <>
                      <FiCopy size={16} />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed left-0 right-0 top-0 bottom-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 dark:bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Share hack"
        className="relative z-[101] card backdrop-blur-lg dark:!bg-black/70 p-6 max-w-lg max-h-[90vh] overflow-y-auto w-full rounded-lg"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close share modal"
          className="absolute top-4 right-4 p-1.5 rounded-md text-foreground/60 hover:text-foreground hover:bg-[var(--surface-2)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
        >
          <FiX size={20} />
        </button>

        <div className="flex flex-col gap-6">
          {/* Header */}
          <div>
            <h2 className="text-xl font-semibold">Share Hack</h2>
            <p className="mt-1 text-sm text-foreground/70">
              Choose how you want to share this hack.
            </p>
          </div>

          {/* Share Directly Section */}
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-foreground/90">Share Directly</h3>

            {/* Share Icons Row */}
            <div className="flex items-center gap-3 overflow-x-auto p-1 pb-2 scroll-smooth scrollbar-thin scrollbar-color-muted"
              style={{ scrollbarWidth: 'thin' }}
            >
              <SocialIconButton
                type="facebook"
                icon={FaFacebook}
                label="Facebook"
              />
              <SocialIconButton
                type="reddit"
                icon={FaReddit}
                label="Reddit"
              />
              <SocialIconButton
                type="twitter"
                icon={FaXTwitter}
                label="Twitter/X"
              />
              <SocialIconButton
                type="email"
                icon={FiMail}
                label="Email"
              />
              {hasNavigatorShare && (
                <SocialIconButton
                  type="other"
                  icon={FiShare2}
                  label="Other"
                />
              )}
            </div>
          </div>

          {/* Share as Badge Section */}
          <div className="flex flex-col gap-4 pt-4 border-t border-[var(--border)]">
            <h3 className="text-sm font-semibold text-foreground/90">Share as Badge</h3>

            {/* Badge Preview */}
            <div className="flex flex-col gap-2">
              <p className="text-xs text-foreground/60 font-medium">Preview:</p>
              <div className="flex justify-center p-3 rounded-md bg-[var(--surface-1)] border border-[var(--border)]">
                <img
                  src={BANNER_IMAGE_URL}
                  width={BANNER_IMAGE_WIDTH}
                  height={BANNER_IMAGE_HEIGHT}
                  alt="Download now at hackdex.app"
                  className="max-w-full h-auto rounded"
                />
              </div>
            </div>

            {/* SEO Tip */}
            <div className="flex items-start justify-center gap-2 rounded-md border border-[var(--border)]/70 bg-[var(--surface-2)]/20 px-3 py-2.5">
              <FaInfoCircle size={13} className="text-foreground/80 shrink-0 self-center" />
              <p className="text-xs text-foreground/60 leading-relaxed">
                <span className="font-semibold text-foreground/80">Creator Tip:</span> Sharing your hack on other platforms helps boost this page&apos;s SEO to potentially outrank unauthorized mirror sites.
              </p>
            </div>

            {/* Badge Share Buttons */}
            <div className="flex items-center gap-3 overflow-x-auto p-1 pb-2 scroll-smooth scrollbar-thin scrollbar-color-muted"
              style={{ scrollbarWidth: 'thin' }}
            >
              <SocialIconButton
                type="bbcode"
                icon={PiBracketsSquareBold}
                label="BBCode"
              />
              <SocialIconButton
                type="html"
                icon={PiBracketsAngleBold}
                label="HTML"
              />
            </div>
          </div>

          {/* URL Copy Section */}
          <div className="pt-4 border-t border-[var(--border)]">
            <div className="flex flex-col gap-2">
              <p className="text-xs text-foreground/60 font-medium mb-1">Or share with link</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={url}
                  className="flex-1 px-3 py-2.5 rounded-md border border-[var(--border)] bg-[var(--surface-1)] text-sm text-foreground/80 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <button
                  type="button"
                  onClick={copyUrl}
                  className="inline-flex items-center justify-center w-10 h-10 rounded-md ring-1 ring-[var(--border)] bg-[var(--surface-2)] hover:bg-[var(--surface-3)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  title="Copy to clipboard"
                  aria-label="Copy URL to clipboard"
                >
                  {urlCopied ? (
                    <FiCheck size={18} className="text-green-500" />
                  ) : (
                    <FiCopy size={18} className="text-foreground/80" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
