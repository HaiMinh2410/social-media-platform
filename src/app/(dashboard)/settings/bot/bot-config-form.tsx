"use client";

import { useState } from "react";
import { updateBotConfigAction } from "@/application/bot/bot.actions";
import { toast } from "sonner";
import { Bot, Settings2, Play, Pause, Tags, ShieldCheck, Zap } from "lucide-react";

interface BotConfigFormProps {
  account: any;
}

export function BotConfigForm({ account }: BotConfigFormProps) {
  const config = account.botConfiguration || {};
  const [isActive, setIsActive] = useState(config.isActive ?? false);
  const [labels, setLabels] = useState<string[]>(config.triggerLabels ?? []);
  const [inputLabel, setInputLabel] = useState("");
  const [confidence, setConfidence] = useState(config.confidenceThreshold ?? 0.75);
  const [autoSend, setAutoSend] = useState(config.autoSend ?? false);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleToggleActive = async () => {
    setIsUpdating(true);
    const newActive = !isActive;
    const result = await updateBotConfigAction(account.id, { is_active: newActive });
    
    if (result.error) {
      toast.error(result.error);
    } else {
      setIsActive(newActive);
      toast.success(`Bot ${newActive ? "enabled" : "disabled"} for ${account.platformUserName}`);
    }
    setIsUpdating(false);
  };

  const handleUpdateSettings = async () => {
    setIsUpdating(true);
    const result = await updateBotConfigAction(account.id, {
      trigger_labels: labels,
      confidence_threshold: confidence,
      auto_send: autoSend,
    });

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Settings saved successfully");
    }
    setIsUpdating(false);
  };

  const addLabel = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && inputLabel.trim()) {
      e.preventDefault();
      if (!labels.includes(inputLabel.trim())) {
        setLabels([...labels, inputLabel.trim()]);
      }
      setInputLabel("");
    }
  };

  const removeLabel = (label: string) => {
    setLabels(labels.filter((l) => l !== label));
  };

  return (
    <div className="bg-white rounded-3xl border shadow-sm overflow-hidden group hover:shadow-md transition-all duration-300">
      <div className="p-6 border-b bg-gray-50/50 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-2xl ${isActive ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-400'}`}>
            <Bot size={24} />
          </div>
          <div>
            <h3 className="font-semibold text-lg">{account.platformUserName}</h3>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium uppercase tracking-wider text-gray-500">{account.platform}</span>
              <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span className="text-xs text-gray-400">{isActive ? 'Autonomous' : 'Off'}</span>
            </div>
          </div>
        </div>
        
        <button
          onClick={handleToggleActive}
          disabled={isUpdating}
          className={`px-6 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 ${
            isActive 
            ? 'bg-red-50 text-red-600 hover:bg-red-100' 
            : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200'
          }`}
        >
          {isActive ? <Pause size={18} /> : <Play size={18} />}
          {isActive ? "Disable Bot" : "Enable Bot"}
        </button>
      </div>

      <div className={`p-8 space-y-8 transition-all duration-500 ${!isActive ? 'opacity-40 grayscale pointer-events-none select-none' : ''}`}>
        {/* Trigger Labels */}
        <div className="space-y-4">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <Tags size={16} />
            Auto-reply Trigger Labels
          </label>
          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 min-h-[100px] flex flex-wrap gap-2 items-start focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
            {labels.map((label) => (
              <span key={label} className="bg-white border text-indigo-600 px-3 py-1.5 rounded-xl text-sm font-medium flex items-center gap-2 shadow-sm animate-in zoom-in-95 duration-200">
                {label}
                <button onClick={() => removeLabel(label)} className="hover:text-red-500 transition-colors text-indigo-300 font-bold">×</button>
              </span>
            ))}
            <input
              type="text"
              value={inputLabel}
              onChange={(e) => setInputLabel(e.target.value)}
              onKeyDown={addLabel}
              placeholder="Type label and press Enter..."
              className="bg-transparent border-none focus:ring-0 text-sm flex-1 min-w-[200px] py-1.5"
            />
          </div>
          <p className="text-xs text-gray-500 px-1">
            Bot will only respond to messages classified with these labels.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Confidence */}
          <div className="space-y-4">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <ShieldCheck size={16} />
              AI Confidence Threshold
            </label>
            <div className="pt-2 px-1">
              <input
                type="range"
                min="0.5"
                max="1"
                step="0.05"
                value={confidence}
                onChange={(e) => setConfidence(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <div className="flex justify-between text-[10px] mt-2 font-bold text-gray-400 uppercase tracking-widest">
                <span>Safe (0.5)</span>
                <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded text-xs">{Math.round(confidence * 100)}%</span>
                <span>Strict (1.0)</span>
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Minimum AI certainty required before the bot takes action.
            </p>
          </div>

          {/* Auto-send */}
          <div className="p-6 bg-indigo-50/30 rounded-3xl border border-indigo-100/50 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-xl text-indigo-600 shadow-sm border border-indigo-100">
                  <Zap size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-800">Direct Send</h4>
                  <p className="text-[11px] text-indigo-500 font-medium uppercase">Fully Autonomous</p>
                </div>
              </div>
              <button
                onClick={() => setAutoSend(!autoSend)}
                className={`w-14 h-8 rounded-full relative transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-200 ${
                  autoSend ? 'bg-indigo-600' : 'bg-gray-200'
                }`}
              >
                <div className={`absolute top-1 left-1 bg-white w-6 h-6 rounded-full shadow-md transition-transform duration-200 ${
                  autoSend ? 'translate-x-6' : 'translate-x-0'
                }`} />
              </button>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              If enabled, bot will send replies directly. If disabled, it will only generate suggestions for you to review.
            </p>
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button
            onClick={handleUpdateSettings}
            disabled={isUpdating}
            className="px-8 py-3 bg-gray-900 text-white rounded-2xl font-bold text-sm hover:bg-black transition-all active:scale-95 flex items-center gap-2 shadow-xl shadow-gray-200 disabled:opacity-50"
          >
            <Settings2 size={18} />
            {isUpdating ? "Saving..." : "Save Configuration"}
          </button>
        </div>
      </div>
    </div>
  );
}
