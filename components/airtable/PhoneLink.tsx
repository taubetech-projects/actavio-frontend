"use client";

import { useState } from "react";
import { Phone, Copy, Check } from "lucide-react";

interface PhoneLinkProps {
  phone: string;
}

export function PhoneLink({ phone }: PhoneLinkProps) {
  const [copied, setCopied] = useState(false);

  const normalized = phone.trim().replace(/(?!^\+)[\s\-().]/g, "");
  const href = `tel:${normalized}`;

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(phone);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // silently fail — clipboard API not available
    }
  };

  return (
    <span className="inline-flex items-center gap-1.5">
      <a
        href={href}
        className="text-green-700 font-medium hover:text-green-900 flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 rounded"
      >
        <Phone className="h-3.5 w-3.5 shrink-0" />
        <span>{phone}</span>
      </a>
      <button
        type="button"
        onClick={handleCopy}
        title={copied ? "Copied!" : "Copy to clipboard"}
        className="text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded p-0.5"
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-green-600" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
      </button>
    </span>
  );
}
