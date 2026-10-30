import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AssistantService, AssistantMessageItem } from '../services/assistant.service';

export const CampusCopilotWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AssistantMessageItem[]>([
    {
      role: 'assistant',
      content: 'Hi! Need help finding an ML senior mentor, checking an event, or finding a carpool? Ask me here!'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Don't render on the dedicated copilot page or public pages
  if (location.pathname === '/assistant' || location.pathname === '/' || location.pathname.startsWith('/login')) {
    return null;
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userText }]);
    setLoading(true);

    try {
      let convId = conversationId;
      if (!convId) {
        const conv = await AssistantService.createConversation('Quick Widget Query');
        convId = conv.id;
        setConversationId(convId);
      }

      const reply = await AssistantService.sendMessage(convId, userText);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: reply.content,
          sources: reply.sources,
          isLiveCloud: reply.isLiveCloud
        }
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Unable to retrieve campus information: ${err?.message || 'Network error'}`
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-40 font-body-md">
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2.5 px-4 py-3 bg-primary text-on-primary shadow-xl hover:bg-secondary transition-all hover:scale-105 font-mono text-xs uppercase font-bold border border-primary"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-secondary animate-pulse"></span>
          <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
          <span>Campus Copilot</span>
        </button>
      )}

      {/* Floating Chat Drawer */}
      {isOpen && (
        <div className="w-80 sm:w-96 h-[480px] bg-surface-container-lowest border border-outline shadow-2xl flex flex-col animate-in fade-in slide-in-from-bottom-6">
          {/* Header */}
          <div className="p-3 bg-surface-container border-b border-outline-variant flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-[20px]">psychology</span>
              <div>
                <h4 className="font-bold text-xs text-primary">UniVerse Campus Copilot</h4>
                <p className="text-[10px] font-mono text-on-surface-variant">Instant Grounded Answers</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate('/assistant');
                }}
                title="Expand full screen"
                className="p-1 text-on-surface-variant hover:text-primary material-symbols-outlined text-[16px]"
              >
                open_in_full
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Close drawer"
                className="p-1 text-on-surface-variant hover:text-primary material-symbols-outlined text-[18px]"
              >
                close
              </button>
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-surface">
            {messages.map((m, i) => {
              const isUser = m.role === 'user';
              return (
                <div key={i} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`p-2.5 text-xs leading-relaxed max-w-[85%] ${
                      isUser
                        ? 'bg-primary text-on-primary rounded-xs'
                        : 'bg-surface-container-high text-on-surface border border-outline-variant rounded-xs'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{m.content}</p>

                    {m.sources && m.sources.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-outline-variant text-[10px] font-mono">
                        <span className="text-outline uppercase block mb-1">Grounded Records:</span>
                        <div className="space-y-1">
                          {m.sources.slice(0, 2).map((s, idx) => (
                            <div key={idx} className="truncate text-secondary">
                              • {s.title} ({s.sourceType})
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex items-center gap-2 p-2 text-xs font-mono text-outline">
                <span className="w-3 h-3 border-2 border-secondary border-t-transparent rounded-full animate-spin"></span>
                <span>Searching campus records...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input Form */}
          <form onSubmit={handleSend} className="p-2 border-t border-outline-variant bg-surface-container-low flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about ML seniors, rides, events..."
              className="flex-1 px-3 py-1.5 bg-surface border border-outline-variant text-xs focus:outline-none focus:border-secondary"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-3 py-1.5 bg-secondary text-on-secondary font-mono text-xs uppercase font-bold disabled:opacity-40"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default CampusCopilotWidget;
