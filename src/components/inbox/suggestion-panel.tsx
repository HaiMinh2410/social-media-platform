'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { getAISuggestionsAction, regenerateSuggestionsAction } from '@/app/actions/inbox.action';
import type { AISuggestionDTO } from '@/domain/types/inbox';
import { SuggestionCard } from './suggestion-card';
import { Sparkles, RefreshCw, X, Loader2 } from 'lucide-react';

type SuggestionPanelProps = {
  messageId: string;
  onUseSuggestion: (content: string) => void;
  onClose: () => void;
};

export function SuggestionPanel({ messageId, onUseSuggestion, onClose }: SuggestionPanelProps) {
  const [suggestions, setSuggestions] = useState<AISuggestionDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRegenerating, startRegenerate] = useTransition();

  useEffect(() => {
    async function loadSuggestions() {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await getAISuggestionsAction(messageId);
      
      if (fetchError) {
        setError(fetchError);
        setLoading(false);
        return;
      }

      if (data && data.length > 0) {
        setSuggestions(data);
        setLoading(false);
      } else {
        // Automatically generate if none exist
        handleRegenerate();
      }
    }

    loadSuggestions();
  }, [messageId]);

  const handleRegenerate = () => {
    startRegenerate(async () => {
      setError(null);
      const { data, error: genError } = await regenerateSuggestionsAction(messageId);
      
      if (genError) {
        setError(genError);
        setLoading(false);
        return;
      }

      setSuggestions(data || []);
      setLoading(false);
    });
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 border-l border-slate-200 w-[300px] lg:w-[350px] shrink-0 animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-100 text-blue-600">
            <Sparkles className="h-4 w-4" />
          </div>
          <h3 className="font-semibold text-slate-800 text-sm">AI Suggestions</h3>
        </div>
        <button 
          onClick={onClose}
          className="p-1 px-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-all"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading || isRegenerating ? (
          <div className="flex flex-col items-center justify-center h-48 space-y-3">
            <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
            <p className="text-sm text-slate-500 font-medium">Brewing responses...</p>
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm text-center">
            {error}
            <button 
              onClick={handleRegenerate}
              className="mt-3 block w-full py-2 bg-red-100 hover:bg-red-200 rounded-lg font-medium transition-colors"
            >
              Try again
            </button>
          </div>
        ) : suggestions.length > 0 ? (
          <>
            {suggestions.map((s) => (
              <SuggestionCard key={s.id} suggestion={s} onUse={onUseSuggestion} />
            ))}
            <button 
              onClick={handleRegenerate}
              disabled={isRegenerating}
              className="flex items-center justify-center gap-2 w-full py-2.5 text-xs font-semibold text-slate-500 hover:text-blue-600 hover:bg-white border border-transparent hover:border-blue-200 rounded-lg transition-all"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
              More variants
            </button>
          </>
        ) : (
          <div className="text-center p-8 bg-white/50 rounded-2xl border-2 border-dashed border-slate-200">
             <p className="text-sm text-slate-400 italic">No suggestions generated yet.</p>
             <button 
              onClick={handleRegenerate}
              className="mt-4 text-xs font-bold text-blue-600 hover:underline"
            >
              Generate Now
            </button>
          </div>
        )}
      </div>

      {/* Footer / Tip */}
      <div className="p-4 bg-blue-600">
         <p className="text-[10px] text-blue-100 uppercase tracking-tighter font-bold mb-1 opacity-80">AI Pro Tip</p>
         <p className="text-xs text-white leading-relaxed font-medium">
           Quickly reply with a professional tone. You can edit the text after selecting it.
         </p>
      </div>
    </div>
  );
}
