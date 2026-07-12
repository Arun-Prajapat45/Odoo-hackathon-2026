'use client';

import { useState, useEffect, useRef } from 'react';
import { Sparkles, Send, Bot, User, Copy, Check, Trash2, RefreshCw, Wrench, Truck, Calendar, Flame, BarChart3, DollarSign, AlertCircle } from 'lucide-react';

const QUICK_PROMPTS = [
  { id: 'maint', text: 'Which vehicles are under maintenance?', icon: Wrench, badge: 'Fleet Safety' },
  { id: 'drivers', text: 'Show available drivers right now.', icon: Truck, badge: 'Dispatch' },
  { id: 'licenses', text: 'Which driver licenses expire within 45 days?', icon: Calendar, badge: 'Compliance' },
  { id: 'fuel', text: 'What is our highest fuel-consuming vehicle?', icon: Flame, badge: 'Efficiency' },
  { id: 'util', text: 'Give me a fleet utilization and status summary.', icon: BarChart3, badge: 'Analytics' },
  { id: 'costs', text: 'Show an operational cost and revenue breakdown.', icon: DollarSign, badge: 'Finance' }
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
      const res = await fetch('/api/ai/history');
      const data = await res.json();
      if (data.success && data.history) {
        setMessages(data.history);
      } else if (data.error) {
        setError(data.error);
      }
    } catch {
      setError('Failed to load past chat logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadHistory(); }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const sendQuestion = async (questionText) => {
    const q = (questionText || input).trim();
    if (!q || sending) return;

    if (!questionText) setInput('');
    setError(null);

    const tempUserMsgId = `temp-u-${Date.now()}`;
    const newMessages = [...messages, { id: tempUserMsgId, role: 'user', content: q, timestamp: new Date().toISOString() }];
    setMessages(newMessages);
    setSending(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q, history: newMessages }),
      });
      const data = await res.json();

      if (data.success && data.response) {
        setMessages([...newMessages, { id: `temp-a-${Date.now()}`, role: 'assistant', content: data.response, timestamp: data.timestamp }]);
      } else {
        setError(data.error || 'Failed to get response from AI Assistant.');
      }
    } catch {
      setError('Network connection error while talking to AI Assistant.');
    } finally {
      setSending(false);
    }
  };

  const clearHistory = async () => {
    if (!confirm('Are you sure you want to clear your AI conversation history?')) return;
    try {
      await fetch('/api/ai/history', { method: 'DELETE' });
      setMessages([]);
    } catch {
      alert('Failed to clear history');
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Simple clean markdown-like bullet formatting helper for chat bubbles
  const renderFormattedContent = (content) => {
    return content.split('\n').map((line, i) => {
      // Check for table divider lines like |---|---|
      if (line.trim().startsWith('|') && line.includes('---')) return null;
      
      let styledLine = line;
      // Convert bold **text** to <strong>
      const parts = styledLine.split(/(\*\*.*?\*\*)/g);
      const renderedParts = parts.map((part, idx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={idx} style={{ color: 'var(--text)', fontWeight: 600 }}>{part.slice(2, -2)}</strong>;
        }
        return part;
      });

      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        return (
          <div key={i} style={{ display: 'flex', gap: 8, marginTop: 4, marginLeft: 8 }}>
            <span style={{ color: 'var(--accent)', fontWeight: 'bold' }}>•</span>
            <div style={{ flex: 1 }}>{renderedParts.map((p, idx) => typeof p === 'string' && idx === 0 ? p.replace(/^[\-\*]\s+/, '') : p)}</div>
          </div>
        );
      }

      return <div key={i} style={{ minHeight: line.trim() === '' ? 10 : 'auto', marginTop: line.trim() === '' ? 0 : 4 }}>{renderedParts}</div>;
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px)', gap: 16 }}>
      {/* Top Header */}
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div className="page-header-row">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'linear-gradient(135deg, var(--accent) 0%, #8b5cf6 100%)',
                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(139, 92, 246, 0.25)'
              }}>
                <Sparkles size={20} />
              </div>
              <div>
                <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  TransitOps AI Assistant
                  <span className="badge badge-purple" style={{ fontSize: 10, textTransform: 'uppercase' }}>Llama 3.3 70B + Live Telemetry</span>
                </h1>
                <p className="page-subtitle">Real-time operational intelligence injected with live database queries</p>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost" onClick={loadHistory} title="Refresh chat logs" disabled={loading}>
              <RefreshCw size={14} className={loading ? 'spinner' : ''} /> Refresh
            </button>
            {messages.length > 0 && (
              <button className="btn btn-ghost" onClick={clearHistory} style={{ color: 'var(--red)' }}>
                <Trash2 size={14} /> Clear History
              </button>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-error" style={{ margin: 0 }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Main Chat Container */}
      <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Messages Scroll Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {loading ? (
            <div className="loading-center" style={{ height: '100%' }}>
              <div className="spinner" /> Loading telemetry intelligence...
            </div>
          ) : messages.length === 0 ? (
            <div className="empty-state" style={{ margin: 'auto', maxWidth: 520 }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%', background: 'var(--bg-2)', color: 'var(--accent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px'
              }}>
                <Bot size={28} />
              </div>
              <div className="empty-state-title">Ask anything about your fleet operations</div>
              <div className="empty-state-text" style={{ marginBottom: 24 }}>
                I am connected to your live SQLite/MySQL database right now. Ask any question below or click a quick operational prompt to get instant, exact calculations without any dummy data.
              </div>
              
              {/* Quick Prompt Cards inside empty state */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10, textAlign: 'left', width: '100%' }}>
                {QUICK_PROMPTS.map(qp => {
                  const Icon = qp.icon;
                  return (
                    <button
                      key={qp.id}
                      onClick={() => sendQuestion(qp.text)}
                      className="card"
                      style={{
                        padding: '12px 14px', cursor: 'pointer', border: '1px solid var(--border)',
                        background: 'var(--bg-1)', transition: 'all 0.15s ease', textAlign: 'left',
                        display: 'flex', flexDirection: 'column', gap: 6
                      }}
                      onMouseOver={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                      onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border)'}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Icon size={16} style={{ color: 'var(--accent)' }} />
                        <span className="badge badge-gray" style={{ fontSize: 9 }}>{qp.badge}</span>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{qp.text}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <>
              {messages.map((m, idx) => (
                <div
                  key={m.id || idx}
                  style={{
                    display: 'flex', gap: 12,
                    alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '85%'
                  }}
                >
                  {m.role === 'assistant' && (
                    <div style={{
                      width: 32, height: 32, borderRadius: 8, background: 'var(--accent)', color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                    }}>
                      <Bot size={16} />
                    </div>
                  )}
                  <div style={{
                    background: m.role === 'user' ? 'var(--accent)' : 'var(--bg-2)',
                    color: m.role === 'user' ? '#fff' : 'var(--text-2)',
                    padding: '12px 16px',
                    borderRadius: m.role === 'user' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                    border: m.role === 'assistant' ? '1px solid var(--border)' : 'none',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                    fontSize: 14,
                    lineHeight: 1.6,
                    position: 'relative'
                  }}>
                    {m.role === 'assistant' ? (
                      <div>
                        {renderFormattedContent(m.content)}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingTop: 8, borderTop: '1px solid var(--border)', fontSize: 11, color: 'var(--text-3)' }}>
                          <span>Exact telemetry verified • {m.timestamp ? new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}</span>
                          <button
                            className="btn-icon"
                            style={{ width: 22, height: 22, border: 'none' }}
                            onClick={() => copyToClipboard(m.content, m.id || idx)}
                            title="Copy analysis"
                          >
                            {copiedId === (m.id || idx) ? <Check size={13} style={{ color: 'var(--green)' }} /> : <Copy size={13} />}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        {m.content}
                      </div>
                    )}
                  </div>
                  {m.role === 'user' && (
                    <div style={{
                      width: 32, height: 32, borderRadius: 8, background: 'var(--bg-2)', color: 'var(--text)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      border: '1px solid var(--border)'
                    }}>
                      <User size={16} />
                    </div>
                  )}
                </div>
              ))}

              {sending && (
                <div style={{ display: 'flex', gap: 12, alignSelf: 'flex-start', maxWidth: '80%' }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, background: 'var(--accent)', color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                  }}>
                    <Bot size={16} />
                  </div>
                  <div style={{
                    background: 'var(--bg-2)', border: '1px solid var(--border)', padding: '12px 16px',
                    borderRadius: '14px 14px 14px 2px', display: 'flex', alignItems: 'center', gap: 10,
                    color: 'var(--text-2)', fontSize: 13
                  }}>
                    <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                    <span>Analyzing live database records & running Groq Llama 3.3 70B telemetry inference...</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </>
          )}
        </div>

        {/* Bottom Quick Pills bar (when conversation is active) */}
        {messages.length > 0 && !loading && (
          <div style={{ padding: '8px 16px', background: 'var(--bg-1)', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none' }}>
            {QUICK_PROMPTS.map(qp => (
              <button
                key={qp.id}
                onClick={() => sendQuestion(qp.text)}
                disabled={sending}
                className="btn btn-ghost btn-sm"
                style={{
                  whiteSpace: 'nowrap', fontSize: 12, padding: '4px 10px',
                  background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 20
                }}
              >
                {qp.text}
              </button>
            ))}
          </div>
        )}

        {/* Input Bar */}
        <form
          onSubmit={e => { e.preventDefault(); sendQuestion(); }}
          style={{ padding: 16, background: 'var(--bg-1)', borderTop: '1px solid var(--border)', display: 'flex', gap: 12 }}
        >
          <input
            className="form-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask AI Assistant about vehicles, drivers, fuel costs, licenses, or fleet metrics..."
            disabled={sending || loading}
            style={{ flex: 1, borderRadius: 10, padding: '10px 14px' }}
          />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!input.trim() || sending || loading}
            style={{ borderRadius: 10, padding: '0 20px' }}
          >
            {sending ? <div className="spinner" style={{ width: 16, height: 16, borderColor: '#fff' }} /> : <><Send size={15} /> Send</>}
          </button>
        </form>
      </div>
    </div>
  );
}
