'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  User,
  Copy,
  Check,
  Trash2,
  RefreshCw,
  Wrench,
  Truck,
  Calendar,
  Flame,
  BarChart3,
  DollarSign,
  AlertCircle,
  HelpCircle
} from 'lucide-react';

const QUICK_PROMPTS = [
  { id: 'maint', text: 'Which vehicles are currently under active maintenance or in shop?', icon: Wrench, badge: 'Fleet Safety' },
  { id: 'drivers', text: 'Show all available drivers right now with their contact details and safety scores.', icon: Truck, badge: 'Dispatch' },
  { id: 'licenses', text: 'Which driver licenses expire within the next 45 days?', icon: Calendar, badge: 'Compliance' },
  { id: 'fuel', text: 'What are our top 5 highest fuel-consuming vehicles?', icon: Flame, badge: 'Efficiency' },
  { id: 'util', text: 'Give me a complete fleet utilization and operational status summary.', icon: BarChart3, badge: 'Analytics' },
  { id: 'costs', text: 'Show an operational cost, fuel expense, and total trip revenue breakdown.', icon: DollarSign, badge: 'Finance' }
];

export default function AiAssistantPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const chatEndRef = useRef(null);

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/ai/history');
      const data = await res.json();
      if (data.success && data.history) {
        setMessages(data.history);
      } else if (data.error) {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to load previous chat logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const sendQuestion = async (questionText) => {
    const q = (typeof questionText === 'string' ? questionText : input).trim();
    if (!q || sending) return;

    if (typeof questionText !== 'string') setInput('');
    setError(null);

    const tempUserMsgId = `temp-u-${Date.now()}`;
    const newMessages = [
      ...messages,
      { id: tempUserMsgId, role: 'user', content: q, timestamp: new Date().toISOString() }
    ];
    setMessages(newMessages);
    setSending(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q, history: newMessages })
      });
      const data = await res.json();

      if (data.success && data.response) {
        setMessages([
          ...newMessages,
          { id: `temp-a-${Date.now()}`, role: 'assistant', content: data.response, timestamp: data.timestamp }
        ]);
      } else {
        setError(data.error || 'Failed to get response from AI Assistant.');
      }
    } catch (err) {
      setError('Network connection error while communicating with AI Assistant.');
    } finally {
      setSending(false);
    }
  };

  const clearHistory = async () => {
    if (!confirm('Are you sure you want to clear your AI conversation history?')) return;
    try {
      await fetch('/api/ai/history', { method: 'DELETE' });
      setMessages([]);
    } catch (err) {
      alert('Failed to clear history');
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const renderFormattedText = (content) => {
    return content.split('\n').map((line, i) => {
      if (line.trim().startsWith('|') && line.includes('---')) return null;

      const parts = line.split(/(\*\*.*?\*\*)/g);
      const renderedParts = parts.map((part, idx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={idx} className="font-bold text-slate-900 dark:text-white">{part.slice(2, -2)}</strong>;
        }
        return part;
      });

      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        return (
          <div key={i} className="flex items-start gap-2 mt-1 ml-2">
            <span className="text-blue-500 font-bold mt-0.5">•</span>
            <div className="flex-1 text-sm leading-relaxed">
              {renderedParts.map((p, idx) =>
                typeof p === 'string' && idx === 0 ? p.replace(/^[\-\*]\s+/, '') : p
              )}
            </div>
          </div>
        );
      }

      return (
        <div key={i} className={`text-sm leading-relaxed ${line.trim() === '' ? 'h-3' : 'mt-1'}`}>
          {renderedParts}
        </div>
      );
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] gap-4">
      {/* Top Banner */}
      <div className="glass-card p-4 md:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-blue-900/10 via-indigo-900/10 to-purple-900/10 border-indigo-500/20">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
            <Sparkles size={24} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">Fleet Telemetry Copilot</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-xs font-bold uppercase tracking-wider">
                Llama 3.3 70B
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Real-time operational intelligence injected directly with live database queries and driver safety scores.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={loadHistory}
            disabled={loading}
            className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
            title="Refresh logs"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
          {messages.length > 0 && (
            <button
              onClick={clearHistory}
              className="btn-secondary text-xs py-1.5 px-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 border-red-200 dark:border-red-500/30 flex items-center gap-1.5"
              title="Clear chat history"
            >
              <Trash2 size={14} />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Quick Prompts Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 shrink-0">
        {QUICK_PROMPTS.map((qp) => {
          const Icon = qp.icon;
          return (
            <button
              key={qp.id}
              onClick={() => sendQuestion(qp.text)}
              disabled={sending}
              className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 hover:border-blue-500/60 dark:hover:border-blue-500/60 hover:shadow-md transition-all text-left group flex items-start gap-3"
            >
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors shrink-0">
                <Icon size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    {qp.badge}
                  </span>
                  <span className="text-xs text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                    Ask →
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5 line-clamp-2">
                  {qp.text}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Chat Box */}
      <div className="glass-card flex-1 flex flex-col overflow-hidden min-h-[300px]">
        {/* Chat Messages Feed */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 gap-3">
              <RefreshCw size={28} className="animate-spin text-blue-500" />
              <p className="text-sm font-semibold">Loading telemetry copilot session...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 max-w-md mx-auto">
              <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4 shadow-inner">
                <Bot size={32} />
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">How can I assist your fleet today?</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                Click any prompt chip above or type your question below. I have real-time read access to your vehicles, drivers, active trips, maintenance schedules, and fuel logs.
              </p>
            </div>
          ) : (
            messages.map((m) => {
              const isAssistant = m.role === 'assistant';
              return (
                <div
                  key={m.id}
                  className={`flex items-start gap-3.5 ${isAssistant ? 'justify-start' : 'justify-end'}`}
                >
                  {isAssistant && (
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-md">
                      <Bot size={16} />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] md:max-w-[75%] rounded-2xl p-4 shadow-sm ${
                      isAssistant
                        ? 'bg-slate-100/80 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 border border-slate-200/60 dark:border-slate-700/60 rounded-tl-sm'
                        : 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-tr-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4 mb-2 pb-1.5 border-b border-black/5 dark:border-white/10">
                      <span className="text-[11px] font-bold tracking-wide uppercase opacity-80">
                        {isAssistant ? 'TransitOps Telemetry AI' : 'You'}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] opacity-60">
                          {m.timestamp ? new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                        {isAssistant && (
                          <button
                            onClick={() => copyToClipboard(m.content, m.id)}
                            className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded transition-colors text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
                            title="Copy response"
                          >
                            {copiedId === m.id ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1">
                      {isAssistant ? renderFormattedText(m.content) : <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.content}</p>}
                    </div>
                  </div>

                  {!isAssistant && (
                    <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 shrink-0">
                      <User size={16} />
                    </div>
                  )}
                </div>
              );
            })
          )}

          {sending && (
            <div className="flex items-start gap-3.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-md animate-pulse">
                <Bot size={16} />
              </div>
              <div className="bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 rounded-2xl rounded-tl-sm p-4 flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Querying live fleet database...
                </span>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 text-xs font-semibold flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input Footer */}
        <div className="p-3 md:p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendQuestion(input);
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about vehicles, drivers, trips, maintenance costs, or fuel efficiency..."
              disabled={sending}
              className="flex-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="btn-primary px-4 py-2.5 shrink-0 disabled:opacity-50 disabled:pointer-events-none"
            >
              <Send size={16} />
              <span className="hidden sm:inline">Send</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
