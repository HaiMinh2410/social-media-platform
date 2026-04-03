'use client';

import React from 'react';
import type { AISuggestionDTO } from '@/domain/types/inbox';
import { Copy, Check } from 'lucide-react';

type SuggestionCardProps = {
  suggestion: AISuggestionDTO;
  onUse: (content: string) => void;
};

export function SuggestionCard({ suggestion, onUse }: SuggestionCardProps) {
  const [copied, setCopied] = React.useState(false);

  const handleUse = () => {
    onUse(suggestion.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group p-4 rounded-xl bg-white border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 cursor-pointer" onClick={handleUse}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
          Suggested Reply
        </span>
        <div className="text-slate-400 group-hover:text-blue-500 transition-colors">
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </div>
      </div>
      <p className="text-sm text-slate-700 leading-relaxed line-clamp-4">
        {suggestion.content}
      </p>
      <div className="mt-3 flex items-center justify-end">
        <span className="text-[11px] font-medium text-slate-400 group-hover:text-blue-600 transition-colors">
          Click to use
        </span>
      </div>
    </div>
  );
}
