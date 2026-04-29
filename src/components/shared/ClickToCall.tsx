import React, { useState } from 'react';
import { Phone, Copy, Check } from 'lucide-react';

interface ClickToCallProps {
  phoneNumber: string | null | undefined;
  className?: string;
  showCopy?: boolean;
}

export function ClickToCall({ phoneNumber, className = '', showCopy = true }: ClickToCallProps) {
  const [copied, setCopied] = useState(false);

  if (!phoneNumber) {
    return <span className="text-slate-500 text-sm">No phone</span>;
  }

  const normalizePhoneNumber = (phone: string): string => {
    const digits = phone.replace(/\D/g, '');

    if (digits.length === 10) {
      return `+1${digits}`;
    } else if (digits.length === 11 && digits.startsWith('1')) {
      return `+${digits}`;
    } else if (digits.startsWith('1')) {
      return `+${digits}`;
    }

    return `+${digits}`;
  };

  const formatPhoneDisplay = (phone: string): string => {
    const digits = phone.replace(/\D/g, '');

    if (digits.length === 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    } else if (digits.length === 11 && digits.startsWith('1')) {
      return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
    }

    return phone;
  };

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      await navigator.clipboard.writeText(phoneNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const telLink = normalizePhoneNumber(phoneNumber);
  const displayNumber = formatPhoneDisplay(phoneNumber);

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <a
        href={`tel:${telLink}`}
        className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 hover:text-blue-800 rounded-lg transition-all border border-blue-200 hover:border-blue-300 group"
        title="Click to call"
      >
        <Phone className="w-3.5 h-3.5 group-hover:scale-110 transition-transform flex-shrink-0" />
        <span className="text-sm font-medium">{displayNumber}</span>
      </a>

      {showCopy && (
        <button
          onClick={handleCopy}
          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 rounded-lg transition-all border border-slate-200"
          title="Copy to clipboard"
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-emerald-600" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </button>
      )}
    </div>
  );
}
