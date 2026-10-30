import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  AssistantService,
  AssistantConversationSummary,
  AssistantMessageItem,
  GroundedSourceRef,
  ProposedActionRef
} from '../services/assistant.service';

const QUICK_PROMPTS = [
  'Who are the senior mentors in Machine Learning and PyTorch?',
  'Are there any AI workshops or hackathons this week?',
  'Can you find a carpool to Tech Park tomorrow morning?',
  'How should I structure my preparation for an ML engineering placement?',
  'What are the campus sustainability policies and cluster power limits?'
];

export const CampusCopilotPage: React.FC = () => {
  const [conversations, setConversations] = useState<AssistantConversationSummary[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AssistantMessageItem[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [creatingSession, setCreatingSession] = useState(false);
  const [actionConfirming, setActionConfirming] = useState<string | null>(null);
  const [actionResults, setActionResults] = useState<Record<string, string>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = useCallback(async () => {
    try {
      const list = await AssistantService.getConversations();
      setConversations(list);
      if (list.length > 0 && !activeConversationId) {
        setActiveConversationId(list[0].id);
      } else if (list.length === 0 && !activeConversationId) {
        // Create initial conversation
        handleNewSession();
      }
    } catch (err) {
      console.error('Failed to load conversations', err);
    }
  }, [activeConversationId]);

  const loadMessages = useCallback(async (convId: string) => {
    try {
      const data = await AssistantService.getConversation(convId);
      setMessages(data.messages || []);
    } catch (err) {
      console.error('Failed to load conversation messages', err);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (activeConversationId) {
      loadMessages(activeConversationId);
    }
  }, [activeConversationId, loadMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleNewSession = async () => {
    if (creatingSession) return;
    setCreatingSession(true);
    try {
      const newConv = await AssistantService.createConversation('Campus Guidance Query');
      setConversations((prev) => [newConv, ...prev]);
      setActiveConversationId(newConv.id);
      setMessages([
        {
          role: 'assistant',
          content: 'Hello! I am your UniVerse Campus Copilot. I can help you discover senior mentors in Machine Learning and Systems, find carpools, explore campus events and announcements, and plan your academic preparation.\n\nAll recommendations are grounded directly in institutional records. How can I assist you today?',
          sources: []
        }
      ]);
    } catch (err) {
      console.error(err);
    } finally {
      setCreatingSession(false);
    }
  };

  const handleDeleteSession = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await AssistantService.deleteConversation(convId);
      const remaining = conversations.filter((c) => c.id !== convId);
      setConversations(remaining);
      if (activeConversationId === convId) {
        if (remaining.length > 0) {
          setActiveConversationId(remaining[0].id);
        } else {
          setActiveConversationId(null);
          setMessages([]);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || loading) return;

    let convId = activeConversationId;
    if (!convId) {
      try {
        const newConv = await AssistantService.createConversation(text.slice(0, 30));
        setConversations((prev) => [newConv, ...prev]);
        convId = newConv.id;
        setActiveConversationId(convId);
      } catch (err) {
        console.error(err);
        return;
      }
    }

    const userMsg: AssistantMessageItem = {
      role: 'user',
      content: text,
      createdAt: new Date().toISOString()
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    try {
      const response = await AssistantService.sendMessage(convId, text);
      const assistantMsg: AssistantMessageItem = {
        role: 'assistant',
        content: response.content,
        sources: response.sources,
        proposedAction: response.proposedAction,
        isLiveCloud: response.isLiveCloud,
        providerNote: response.providerNote
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Error contacting campus retrieval copilot: ${err?.message || 'Server timeout'}`
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAction = async (actionId: string) => {
    setActionConfirming(actionId);
    try {
      const result = await AssistantService.confirmAction(actionId);
      setActionResults((prev) => ({
        ...prev,
        [actionId]: result?.message || 'Action executed successfully in institutional records.'
      }));
    } catch (err: any) {
      setActionResults((prev) => ({
        ...prev,
        [actionId]: `Failed: ${err?.message || 'Execution error'}`
      }));
    } finally {
      setActionConfirming(null);
    }
  };

  return (
    <div className="flex flex-col w-full h-[calc(100vh-8rem)] font-body-md text-on-surface">
      {/* Top Technical Bar */}
      <section className="w-full bg-surface-container-low px-4 py-2 border border-outline-variant shrink-0">
        <div className="w-full flex flex-wrap items-center justify-between gap-2 font-label-sm text-label-sm font-mono">
          <div className="flex items-center gap-2">
            <span className="bg-primary text-on-primary px-2 py-0.5 tracking-widest uppercase font-bold">
              AI_COPILOT_04
            </span>
            <span className="text-on-surface font-semibold tracking-wide uppercase">
              GROUNDED CAMPUS ASSISTANT &amp; RETRIEVAL ENGINE
            </span>
          </div>
          <div className="flex items-center gap-4 text-on-surface-variant">
            <span className="flex items-center gap-1.5 text-secondary font-medium">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
              GROUNDING: VERIFIED CAMPUS SQLITE LEDGER
            </span>
            <span className="hidden md:inline bg-surface-container-high px-2 py-0.5 text-on-surface-variant font-mono">
              SENSITIVE ACTIONS: MANDATORY USER CONFIRMATION
            </span>
          </div>
        </div>
      </section>

      {/* Main Copilot Shell */}
      <div className="flex-1 flex border border-outline-variant bg-surface-container-lowest overflow-hidden shadow-sm mt-3">
        {/* Left Sidebar: Session History */}
        <aside className="w-64 border-r border-outline-variant bg-surface-container flex flex-col shrink-0">
          <div className="p-3 border-b border-outline-variant">
            <button
              onClick={handleNewSession}
              disabled={creatingSession}
              className="w-full py-2 px-3 bg-primary text-on-primary hover:bg-secondary font-mono text-xs uppercase font-bold transition-all flex items-center justify-center gap-2 shadow-xs"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              <span>New Conversation</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            <span className="text-[10px] font-mono uppercase text-outline px-2 block py-1">
              Active Sessions ({conversations.length})
            </span>
            {conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => setActiveConversationId(conv.id)}
                className={`group flex items-center justify-between p-2.5 text-xs font-mono cursor-pointer border transition-colors ${
                  activeConversationId === conv.id
                    ? 'bg-surface-container-lowest border-secondary text-primary font-bold shadow-xs'
                    : 'bg-transparent border-transparent text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="material-symbols-outlined text-[16px] text-outline">chat_bubble</span>
                  <span className="truncate">{conv.title || 'Campus Query'}</span>
                </div>
                <button
                  onClick={(e) => handleDeleteSession(conv.id, e)}
                  title="Delete session"
                  className="opacity-0 group-hover:opacity-100 hover:text-error transition-opacity material-symbols-outlined text-[14px]"
                >
                  delete
                </button>
              </div>
            ))}
          </div>

          {/* Model Status Footnote */}
          <div className="p-3 border-t border-outline-variant bg-surface-container-low font-mono text-[10px] text-on-surface-variant flex flex-col gap-1">
            <span className="font-bold text-primary flex items-center gap-1">
              <span className="material-symbols-outlined text-[12px] text-secondary">verified_user</span>
              <span>Privacy &amp; Safety Enclave</span>
            </span>
            <span>No institutional secrets or private user data are used for model training.</span>
          </div>
        </aside>

        {/* Right Chat Panel */}
        <section className="flex-1 flex flex-col min-w-0 bg-surface">
          {/* Active Header */}
          <div className="px-6 py-3 border-b border-outline-variant bg-surface-container-low flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center text-secondary">
                <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
              </span>
              <div>
                <h2 className="font-title-sm text-primary font-bold">UniVerse Campus Copilot</h2>
                <p className="text-[11px] font-mono text-on-surface-variant">
                  Grounded in senior mentors, rides, events, and campus directory
                </p>
              </div>
            </div>

            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 bg-surface-container font-mono text-xs text-on-surface border border-outline-variant">
              <span className="w-2 h-2 rounded-full bg-secondary"></span>
              <span>Autonomous Assistant</span>
            </span>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 max-w-lg mx-auto">
                <span className="material-symbols-outlined text-5xl text-secondary mb-3">psychology_alt</span>
                <h3 className="font-headline-sm text-primary font-bold">Ask anything about campus</h3>
                <p className="text-xs text-on-surface-variant mt-2 leading-relaxed">
                  Search senior mentors in Machine Learning, find carpools to Tech Park, inspect upcoming academic workshops,
                  or ask for interview preparation guidance.
                </p>

                {/* Quick Prompt Cards */}
                <div className="w-full mt-6 flex flex-col gap-2">
                  <span className="text-[11px] font-mono text-outline uppercase self-start">Suggested questions:</span>
                  {QUICK_PROMPTS.slice(0, 3).map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(prompt)}
                      className="text-left p-3 text-xs font-mono bg-surface-container-low border border-outline-variant hover:border-secondary hover:bg-surface-container transition-all flex items-center justify-between group"
                    >
                      <span>{prompt}</span>
                      <span className="material-symbols-outlined text-[16px] text-outline group-hover:text-secondary group-hover:translate-x-1 transition-all">
                        arrow_forward
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg, index) => {
                const isUser = msg.role === 'user';
                return (
                  <div
                    key={index}
                    className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-4xl mx-auto`}
                  >
                    <div className="flex items-center gap-2 mb-1.5 font-mono text-[11px] text-outline">
                      <span className="font-bold text-primary">{isUser ? 'You' : 'Campus Copilot'}</span>
                      {msg.isLiveCloud !== undefined && (
                        <span
                          className={`px-1.5 py-0.2 text-[10px] uppercase font-bold border ${
                            msg.isLiveCloud
                              ? 'bg-secondary/15 text-secondary border-secondary/30'
                              : 'bg-surface-container-high text-on-surface-variant border-outline-variant'
                          }`}
                        >
                          {msg.isLiveCloud ? 'Gemini 2.5 Flash' : 'Local Offline Grounding'}
                        </span>
                      )}
                    </div>

                    {/* Message Bubble */}
                    <div
                      className={`p-4 text-xs md:text-sm leading-relaxed ${
                        isUser
                          ? 'bg-primary text-on-primary rounded-xs max-w-2xl'
                          : 'bg-surface-container-lowest text-on-surface border border-outline-variant rounded-xs w-full shadow-xs'
                      }`}
                    >
                      <div className="whitespace-pre-wrap font-sans">{msg.content}</div>

                      {/* Grounded Sources Card */}
                      {!isUser && msg.sources && msg.sources.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-outline-variant">
                          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-primary mb-2">
                            <span className="material-symbols-outlined text-[16px] text-secondary">database</span>
                            <span>Grounded Campus Sources ({msg.sources.length})</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {msg.sources.map((src, sIdx) => (
                              <div
                                key={sIdx}
                                className="p-2.5 bg-surface-container-low border border-outline-variant text-xs flex flex-col justify-between"
                              >
                                <div>
                                  <div className="flex items-center justify-between gap-2 mb-1">
                                    <span className="font-mono text-[10px] uppercase px-1.5 py-0.5 bg-surface-container-high text-primary font-bold">
                                      {src.sourceType}
                                    </span>
                                  </div>
                                  <p className="font-semibold text-primary text-xs truncate">{src.title}</p>
                                  <p className="text-[11px] text-on-surface-variant line-clamp-2 mt-0.5">
                                    {src.snippet}
                                  </p>
                                </div>
                                {src.urlOrRoute && (
                                  <a
                                    href={src.urlOrRoute}
                                    className="mt-2 text-[11px] font-mono text-secondary hover:underline flex items-center gap-1"
                                  >
                                    <span>View Record</span>
                                    <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Mutating Action Proposal Card */}
                      {!isUser && msg.proposedAction && (
                        <div className="mt-4 p-4 bg-secondary/5 border-2 border-secondary/40 text-on-surface">
                          <div className="flex items-center gap-2 mb-2 font-mono text-xs font-bold text-secondary uppercase">
                            <span className="material-symbols-outlined text-[18px]">approval_delegation</span>
                            <span>Action Proposal: Explicit Confirmation Required</span>
                          </div>
                          <p className="text-xs text-on-surface font-semibold mb-3">
                            {msg.proposedAction.summary}
                          </p>

                          {msg.proposedAction.actionId && actionResults[msg.proposedAction.actionId] ? (
                            <div className="p-2.5 bg-surface-container font-mono text-xs border border-secondary text-primary flex items-center gap-2">
                              <span className="material-symbols-outlined text-secondary text-[16px]">check_circle</span>
                              <span>{actionResults[msg.proposedAction.actionId]}</span>
                            </div>
                          ) : msg.proposedAction.actionId ? (
                            <div className="flex items-center gap-3 font-mono text-xs">
                              <button
                                onClick={() => handleConfirmAction(msg.proposedAction!.actionId!)}
                                disabled={actionConfirming === msg.proposedAction.actionId}
                                className="px-4 py-2 bg-secondary text-on-secondary font-bold hover:bg-secondary/90 transition-all flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                              >
                                {actionConfirming === msg.proposedAction.actionId ? (
                                  'Executing Action...'
                                ) : (
                                  <>
                                    <span>Confirm &amp; Execute</span>
                                    <span className="material-symbols-outlined text-[14px]">check</span>
                                  </>
                                )}
                              </button>
                              <span className="text-[11px] text-outline">No action is executed without your click</span>
                            </div>
                          ) : null}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {loading && (
              <div className="flex items-center gap-3 p-4 bg-surface-container-lowest border border-outline-variant max-w-sm">
                <span className="w-4 h-4 border-2 border-secondary border-t-transparent rounded-full animate-spin"></span>
                <span className="font-mono text-xs text-on-surface-variant">
                  Retrieving grounded campus knowledge...
                </span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Prompt Chips Bar */}
          <div className="px-6 py-2 border-t border-outline-variant bg-surface-container-low flex items-center gap-2 overflow-x-auto">
            <span className="text-[10px] font-mono text-outline uppercase whitespace-nowrap">Try asking:</span>
            {QUICK_PROMPTS.map((q, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(q)}
                className="px-2.5 py-1 text-[11px] font-mono bg-surface border border-outline-variant text-on-surface-variant hover:text-on-surface hover:border-secondary whitespace-nowrap transition-colors"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input Composer */}
          <div className="p-4 border-t border-outline-variant bg-surface-container-lowest">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-3 max-w-4xl mx-auto"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ask about ML seniors, upcoming events, rides, or academic policies..."
                className="flex-1 px-4 py-3 bg-surface border border-outline-variant focus:border-secondary focus:outline-none text-sm font-sans"
              />
              <button
                type="submit"
                disabled={loading || !inputText.trim()}
                className="px-6 py-3 bg-primary text-on-primary hover:bg-secondary font-mono text-xs uppercase font-bold transition-all disabled:opacity-40 flex items-center gap-2 shadow-xs"
              >
                <span>Ask</span>
                <span className="material-symbols-outlined text-[16px]">send</span>
              </button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
};

export default CampusCopilotPage;
