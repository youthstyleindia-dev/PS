import React, { useState, useEffect, useCallback } from 'react';
import { MentorService, MentorProfile, MentorshipRequestItem, MentorshipMessageItem } from '../services/mentor.service';
import { useAuth } from '../context/AuthContext';

const SKILL_FILTERS = [
  'All',
  'Machine Learning',
  'PyTorch',
  'Deep Learning',
  'Natural Language Processing',
  'Data Science',
  'DSA & Algorithms',
  'Distributed Systems',
  'Cloud Architecture',
  'Web Development'
];

export const MentorDirectoryPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'discover' | 'my-mentorship'>('discover');

  // Directory state
  const [mentors, setMentors] = useState<MentorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('All');
  const [availableOnly, setAvailableOnly] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Request Modal state
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [targetMentor, setTargetMentor] = useState<MentorProfile | null>(null);
  const [requestTopic, setRequestTopic] = useState('');
  const [requestSlot, setRequestSlot] = useState('');
  const [requestNotes, setRequestNotes] = useState('');
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [requestSuccessMsg, setRequestSuccessMsg] = useState<string | null>(null);
  const [requestErrorMsg, setRequestErrorMsg] = useState<string | null>(null);

  // My Mentorship state
  const [sentRequests, setSentRequests] = useState<MentorshipRequestItem[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<MentorshipRequestItem[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);

  // Chat conversation modal state
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [activeConversationPartner, setActiveConversationPartner] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<MentorshipMessageItem[]>([]);
  const [newMessageText, setNewMessageText] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);

  const fetchMentors = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await MentorService.getMentors({
        query: searchQuery.trim() || undefined,
        skills: selectedSkill !== 'All' ? selectedSkill : undefined,
        available_only: availableOnly || undefined
      });
      setMentors(data.mentors || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load mentors');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedSkill, availableOnly]);

  const fetchRequests = useCallback(async () => {
    setRequestsLoading(true);
    try {
      const data = await MentorService.getRequests();
      setSentRequests(data.sent || []);
      setReceivedRequests(data.received || []);
    } catch (err: any) {
      console.error('Failed to load mentorship requests', err);
    } finally {
      setRequestsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMentors();
  }, [fetchMentors]);

  useEffect(() => {
    if (activeTab === 'my-mentorship') {
      fetchRequests();
    }
  }, [activeTab, fetchRequests]);

  const handleOpenRequestModal = (mentor: MentorProfile) => {
    setTargetMentor(mentor);
    setRequestTopic(mentor.topics?.[0] || 'Machine Learning Guidance');
    setRequestSlot(mentor.availableSlots?.[0] || 'Tuesday 17:00 - 18:00');
    setRequestNotes('');
    setRequestSuccessMsg(null);
    setRequestErrorMsg(null);
    setRequestModalOpen(true);
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetMentor) return;
    setSubmittingRequest(true);
    setRequestErrorMsg(null);
    try {
      await MentorService.createRequest({
        mentor_id: targetMentor.id,
        topic: requestTopic,
        preferred_slot: requestSlot,
        notes: requestNotes
      });
      setRequestSuccessMsg('Guidance request successfully submitted to mentor enclave.');
      setTimeout(() => {
        setRequestModalOpen(false);
        fetchMentors();
      }, 1500);
    } catch (err: any) {
      setRequestErrorMsg(err?.message || 'Failed to submit mentorship request');
    } finally {
      setSubmittingRequest(false);
    }
  };

  const handleUpdateRequestStatus = async (requestId: string, status: 'accepted' | 'rejected') => {
    try {
      await MentorService.updateRequestStatus(requestId, status);
      fetchRequests();
    } catch (err: any) {
      alert(err?.message || 'Failed to update request');
    }
  };

  const handleOpenConversation = async (conversationId: string, partnerName: string) => {
    setActiveConversationId(conversationId);
    setActiveConversationPartner(partnerName);
    setChatLoading(true);
    try {
      const data = await MentorService.getConversation(conversationId);
      setChatMessages(data.messages || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setChatLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConversationId || !newMessageText.trim() || sendingMessage) return;
    setSendingMessage(true);
    try {
      const msg = await MentorService.sendMessage(activeConversationId, newMessageText.trim());
      setChatMessages((prev) => [...prev, msg]);
      setNewMessageText('');
    } catch (err: any) {
      alert(err?.message || 'Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  return (
    <div className="flex flex-col w-full font-body-md text-on-surface gap-6">
      {/* Editorial Identification Bar */}
      <section className="w-full bg-surface-container-low px-4 py-2 border border-outline-variant">
        <div className="w-full flex flex-wrap items-center justify-between gap-2 font-label-sm text-label-sm font-mono">
          <div className="flex items-center gap-2">
            <span className="bg-primary text-on-primary px-2 py-0.5 tracking-widest uppercase font-bold">
              PEER_ENCLAVE_02
            </span>
            <span className="text-on-surface font-semibold tracking-wide uppercase">
              SENIOR MENTORSHIP &amp; APPLIED INTELLIGENCE NETWORK
            </span>
          </div>
          <div className="flex items-center gap-4 text-on-surface-variant">
            <span className="flex items-center gap-1.5 text-secondary font-medium">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
              EXPLAINABLE PEER MATCHING ACTIVE
            </span>
            <span className="hidden md:inline bg-surface-container-high px-2 py-0.5 text-on-surface-variant font-mono">
              ROLE: SENIOR SCHOLARS &amp; ALUMNI
            </span>
            <span className="hidden lg:inline text-outline font-mono">VERIFIED SKILLS ONLY</span>
          </div>
        </div>
      </section>

      {/* Hero Banner */}
      <section className="w-full bg-surface-container-lowest p-6 md:p-8 border border-outline-variant shadow-sm">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex flex-col gap-2 max-w-3xl">
            <div className="flex items-center gap-2 text-secondary font-label-md text-label-md uppercase tracking-wider font-mono font-bold">
              <span className="material-symbols-outlined text-[18px]">psychology</span>
              <span>Direct Senior Guidance</span>
            </div>
            <h1 className="font-headline-xl text-headline-xl text-primary tracking-tight font-extrabold">
              Learn from seniors who walked the path.
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
              Connect with senior students and alumni specializing in Machine Learning, Distributed Systems,
              Placement Prep, and Research. Get honest portfolio reviews, mock interviews, and research guidance.
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="flex border border-outline-variant bg-surface-container p-1 font-mono text-xs">
            <button
              onClick={() => setActiveTab('discover')}
              className={`px-4 py-2 font-bold uppercase transition-colors flex items-center gap-2 ${
                activeTab === 'discover'
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">search</span>
              <span>Find Seniors ({mentors.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('my-mentorship')}
              className={`px-4 py-2 font-bold uppercase transition-colors flex items-center gap-2 ${
                activeTab === 'my-mentorship'
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">forum</span>
              <span>My Mentorship ({sentRequests.length + receivedRequests.length})</span>
            </button>
          </div>
        </div>

        {/* Filter & Search Bar (Discover Tab) */}
        {activeTab === 'discover' && (
          <div className="mt-6 pt-6 border-t border-outline-variant flex flex-col gap-4">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">
                  search
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="What guidance are you seeking? (e.g. Machine Learning, PyTorch, Google intern, DSA mock...)"
                  className="w-full pl-10 pr-4 py-2.5 bg-surface border border-outline-variant focus:border-secondary focus:outline-none text-sm font-sans"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-outline hover:text-on-surface"
                  >
                    CLEAR
                  </button>
                )}
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-mono text-on-surface-variant select-none">
                  <input
                    type="checkbox"
                    checked={availableOnly}
                    onChange={(e) => setAvailableOnly(e.target.checked)}
                    className="accent-secondary w-4 h-4"
                  />
                  <span>Available slots only</span>
                </label>
              </div>
            </div>

            {/* Quick Skill Chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-xs font-mono text-outline uppercase mr-1">Skills:</span>
              {SKILL_FILTERS.map((s) => (
                <button
                  key={s}
                  onClick={() => setSelectedSkill(s)}
                  className={`px-2.5 py-1 text-xs font-mono border transition-all ${
                    selectedSkill === s
                      ? 'bg-secondary text-on-secondary border-secondary font-bold shadow-xs'
                      : 'bg-surface-container border-outline-variant text-on-surface-variant hover:border-outline hover:text-on-surface'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Main Tab Content */}
      {activeTab === 'discover' ? (
        <div className="flex flex-col gap-4">
          {error && (
            <div className="p-4 bg-error-container text-on-error-container font-mono text-xs border border-error">
              {error}
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="p-6 bg-surface-container-lowest border border-outline-variant animate-pulse h-72"></div>
              ))}
            </div>
          ) : mentors.length === 0 ? (
            <div className="p-12 text-center bg-surface-container-lowest border border-outline-variant flex flex-col items-center gap-3">
              <span className="material-symbols-outlined text-4xl text-outline">person_search</span>
              <p className="font-headline-sm text-primary font-bold">No mentors found matching criteria</p>
              <p className="text-sm text-on-surface-variant max-w-md">
                Try searching for broader skills like &quot;Machine Learning&quot;, &quot;PyTorch&quot;, or clear your filters.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedSkill('All');
                  setAvailableOnly(false);
                }}
                className="mt-2 px-4 py-2 bg-primary text-on-primary font-mono text-xs uppercase font-bold"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mentors.map((mentor) => {
                const isMlSpecialist = mentor.skills.some((s) =>
                  ['Machine Learning', 'PyTorch', 'Deep Learning', 'NLP', 'Data Science'].some((k) =>
                    s.toLowerCase().includes(k.toLowerCase())
                  )
                );

                return (
                  <div
                    key={mentor.id}
                    className="flex flex-col justify-between bg-surface-container-lowest border border-outline-variant hover:border-outline transition-all p-6 shadow-xs relative"
                  >
                    {/* Top Identity Row */}
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={mentor.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${mentor.userId}`}
                            alt={mentor.name}
                            className="w-12 h-12 rounded-full border border-outline-variant bg-surface-container object-cover"
                          />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h3 className="font-title-md text-title-md font-bold text-primary">
                                {mentor.name}
                              </h3>
                              {mentor.isDemo && (
                                <span className="text-[10px] font-mono px-1.5 py-0.2 bg-surface-container-high text-on-surface-variant uppercase">
                                  Demo
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-on-surface-variant font-mono">
                              Year {mentor.yearOfStudy} • Class of {mentor.graduationYear}
                            </p>
                          </div>
                        </div>

                        {/* Match Score Badge */}
                        <div
                          className="flex flex-col items-end"
                          title={mentor.matchReason || 'Explainable match rating based on query relevance and peer signals'}
                        >
                          <span className="px-2 py-0.5 bg-secondary/10 text-secondary border border-secondary/20 font-mono text-xs font-bold">
                            {mentor.matchScore}% MATCH
                          </span>
                          {mentor.matchedSkills && mentor.matchedSkills.length > 0 && (
                            <span className="text-[10px] font-mono text-on-surface-variant mt-0.5">
                              via {mentor.matchedSkills[0]}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Placement / Career Tag */}
                      {mentor.companyOffer && (
                        <div className="mt-3 flex items-center gap-1.5 px-2.5 py-1 bg-surface-container font-mono text-xs text-primary border-l-2 border-primary">
                          <span className="material-symbols-outlined text-[14px] text-secondary">verified</span>
                          <span className="font-semibold">{mentor.companyOffer}</span>
                        </div>
                      )}

                      {/* Bio */}
                      <p className="mt-3 text-xs text-on-surface leading-relaxed line-clamp-3">
                        {mentor.bio}
                      </p>

                      {/* Verified Skills */}
                      <div className="mt-3 flex flex-wrap gap-1">
                        {mentor.skills.map((skill) => (
                          <span
                            key={skill}
                            className={`px-2 py-0.5 text-[11px] font-mono border ${
                              skill.toLowerCase().includes('machine learning') || skill.toLowerCase().includes('pytorch')
                                ? 'bg-secondary-fixed/30 text-primary border-secondary font-bold'
                                : 'bg-surface-container-low text-on-surface-variant border-outline-variant'
                            }`}
                          >
                            {skill}
                          </span>
                        ))}
                      </div>

                      {/* Featured Projects */}
                      {mentor.projects && mentor.projects.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-outline-variant">
                          <span className="text-[10px] font-mono text-outline uppercase block mb-1">
                            Key Projects &amp; Repos:
                          </span>
                          <ul className="text-xs text-on-surface-variant space-y-1">
                            {mentor.projects.slice(0, 2).map((proj, idx) => (
                              <li key={idx} className="flex items-center gap-1 truncate">
                                <span className="material-symbols-outlined text-[12px] text-secondary">terminal</span>
                                <span className="font-mono truncate">{proj.title}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="mt-6 pt-4 border-t border-outline-variant flex items-center justify-between gap-3">
                      <div className="flex flex-col font-mono text-[11px]">
                        <span className={mentor.isAvailable ? 'text-secondary font-bold' : 'text-outline'}>
                          {mentor.isAvailable ? '● Slots Open' : '○ Full Roster'}
                        </span>
                        <span className="text-on-surface-variant text-[10px] capitalize">
                          Format: {mentor.preferredFormat?.replace('_', ' ')}
                        </span>
                      </div>

                      <button
                        onClick={() => handleOpenRequestModal(mentor)}
                        disabled={!mentor.isAvailable && user?.id === mentor.userId}
                        className="px-4 py-2 bg-primary text-on-primary hover:bg-secondary font-mono text-xs uppercase font-bold transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-40"
                      >
                        <span>Request Advice</span>
                        <span className="material-symbols-outlined text-[14px]">send</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* My Mentorship Tab (Sent & Received Requests + Chat Conversations) */
        <div className="flex flex-col gap-8">
          {requestsLoading ? (
            <div className="p-8 text-center font-mono text-xs text-outline">Loading your mentorship ledger...</div>
          ) : (
            <>
              {/* Incoming Requests for Mentors */}
              {receivedRequests.length > 0 && (
                <section className="bg-surface-container-lowest border border-outline-variant p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-secondary">inbox</span>
                      <h2 className="font-headline-sm text-primary font-bold">
                        Incoming Guidance Requests ({receivedRequests.length})
                      </h2>
                    </div>
                    <span className="text-xs font-mono text-outline">Awaiting your response</span>
                  </div>

                  <div className="divide-y divide-outline-variant border border-outline-variant">
                    {receivedRequests.map((req) => (
                      <div key={req.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <img
                            src={req.mentee?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${req.menteeId}`}
                            alt={req.mentee?.name || 'Mentee'}
                            className="w-10 h-10 rounded-full border border-outline-variant bg-surface-container"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-primary">{req.mentee?.name || 'Student'}</span>
                              <span className="text-xs font-mono text-outline">Year {req.mentee?.year || 1} • {req.mentee?.department}</span>
                            </div>
                            <p className="text-xs font-semibold text-on-surface mt-1">Topic: {req.topic}</p>
                            {req.notes && <p className="text-xs text-on-surface-variant italic mt-0.5">&ldquo;{req.notes}&rdquo;</p>}
                            <span className="text-[10px] font-mono text-outline mt-1 block">Preferred slot: {req.preferredSlot}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {req.status === 'pending' ? (
                            <>
                              <button
                                onClick={() => handleUpdateRequestStatus(req.id, 'accepted')}
                                className="px-3 py-1.5 bg-secondary text-on-secondary font-mono text-xs uppercase font-bold hover:bg-secondary/90 transition-colors"
                              >
                                Accept &amp; Open Chat
                              </button>
                              <button
                                onClick={() => handleUpdateRequestStatus(req.id, 'rejected')}
                                className="px-3 py-1.5 bg-surface-container border border-outline-variant font-mono text-xs uppercase font-bold hover:bg-surface-container-high transition-colors"
                              >
                                Decline
                              </button>
                            </>
                          ) : (
                            <span className="px-2.5 py-1 text-xs font-mono uppercase bg-surface-container font-bold">
                              Status: {req.status}
                            </span>
                          )}

                          {req.conversationId && (
                            <button
                              onClick={() => handleOpenConversation(req.conversationId!, req.mentee?.name || 'Mentee')}
                              className="px-3 py-1.5 bg-primary text-on-primary font-mono text-xs uppercase font-bold hover:bg-secondary transition-colors flex items-center gap-1"
                            >
                              <span className="material-symbols-outlined text-[14px]">chat</span>
                              <span>Chat</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Outgoing Requests Sent by User */}
              <section className="bg-surface-container-lowest border border-outline-variant p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary">outbox</span>
                    <h2 className="font-headline-sm text-primary font-bold">
                      Your Sent Guidance Requests ({sentRequests.length})
                    </h2>
                  </div>
                  <span className="text-xs font-mono text-outline">Track response status</span>
                </div>

                {sentRequests.length === 0 ? (
                  <p className="text-xs text-on-surface-variant font-mono p-4 text-center border border-dashed border-outline-variant">
                    You have not requested guidance from any seniors yet. Browse the Discover tab above to find senior mentors.
                  </p>
                ) : (
                  <div className="divide-y divide-outline-variant border border-outline-variant">
                    {sentRequests.map((req) => (
                      <div key={req.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <img
                            src={req.mentor?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${req.mentorId}`}
                            alt={req.mentor?.name || 'Mentor'}
                            className="w-10 h-10 rounded-full border border-outline-variant bg-surface-container"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-primary">{req.mentor?.name || 'Senior Mentor'}</span>
                              <span className="text-xs font-mono text-outline">{req.mentor?.department}</span>
                              {req.mentor?.company && (
                                <span className="text-[10px] font-mono px-1.5 py-0.2 bg-surface-container-high text-primary">
                                  {req.mentor.company}
                                </span>
                              )}
                            </div>
                            <p className="text-xs font-semibold text-on-surface mt-1">Topic: {req.topic}</p>
                            {req.notes && <p className="text-xs text-on-surface-variant italic mt-0.5">&ldquo;{req.notes}&rdquo;</p>}
                            <span className="text-[10px] font-mono text-outline mt-1 block">Preferred slot: {req.preferredSlot}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span
                            className={`px-2.5 py-1 text-xs font-mono uppercase font-bold ${
                              req.status === 'accepted'
                                ? 'bg-secondary/20 text-secondary border border-secondary/30'
                                : req.status === 'rejected'
                                ? 'bg-error-container text-on-error-container'
                                : 'bg-surface-container text-on-surface-variant border border-outline-variant'
                            }`}
                          >
                            {req.status}
                          </span>

                          {req.conversationId && req.status === 'accepted' && (
                            <button
                              onClick={() => handleOpenConversation(req.conversationId!, req.mentor?.name || 'Mentor')}
                              className="px-3 py-1.5 bg-primary text-on-primary font-mono text-xs uppercase font-bold hover:bg-secondary transition-colors flex items-center gap-1 shadow-xs"
                            >
                              <span className="material-symbols-outlined text-[14px]">chat</span>
                              <span>Open Discussion</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      )}

      {/* Modal: Request Mentorship Guidance */}
      {requestModalOpen && targetMentor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/40 backdrop-blur-xs">
          <div className="bg-surface-container-lowest border border-outline max-w-lg w-full p-6 shadow-xl relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setRequestModalOpen(false)}
              className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface material-symbols-outlined"
            >
              close
            </button>

            <div className="flex items-center gap-3 border-b border-outline-variant pb-4 mb-4">
              <img
                src={targetMentor.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${targetMentor.userId}`}
                alt={targetMentor.name}
                className="w-12 h-12 rounded-full border border-outline-variant"
              />
              <div>
                <h3 className="font-headline-sm text-primary font-bold">Request Guidance</h3>
                <p className="text-xs font-mono text-on-surface-variant">
                  {targetMentor.name} • {targetMentor.companyOffer || targetMentor.domain}
                </p>
              </div>
            </div>

            {requestSuccessMsg ? (
              <div className="p-4 bg-secondary/15 border border-secondary text-primary font-mono text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">check_circle</span>
                <span>{requestSuccessMsg}</span>
              </div>
            ) : (
              <form onSubmit={handleSubmitRequest} className="flex flex-col gap-4 text-sm font-sans">
                {requestErrorMsg && (
                  <div className="p-3 bg-error-container text-on-error-container font-mono text-xs border border-error">
                    {requestErrorMsg}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-mono font-bold uppercase text-on-surface-variant mb-1">
                    Guidance Topic / Field *
                  </label>
                  <select
                    value={requestTopic}
                    onChange={(e) => setRequestTopic(e.target.value)}
                    className="w-full p-2.5 bg-surface border border-outline-variant font-mono text-xs focus:outline-none focus:border-secondary"
                    required
                  >
                    {targetMentor.topics?.map((top) => (
                      <option key={top} value={top}>
                        {top}
                      </option>
                    ))}
                    <option value="Machine Learning Internship Prep">Machine Learning Internship Prep</option>
                    <option value="PyTorch Architecture Code Review">PyTorch Architecture Code Review</option>
                    <option value="DSA & Algorithm Mock Interview">DSA &amp; Algorithm Mock Interview</option>
                    <option value="Research Paper / Thesis Guidance">Research Paper / Thesis Guidance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold uppercase text-on-surface-variant mb-1">
                    Preferred Time Slot *
                  </label>
                  <select
                    value={requestSlot}
                    onChange={(e) => setRequestSlot(e.target.value)}
                    className="w-full p-2.5 bg-surface border border-outline-variant font-mono text-xs focus:outline-none focus:border-secondary"
                    required
                  >
                    {targetMentor.availableSlots?.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                    <option value="Flexible / Asynchronous Chat">Flexible / Asynchronous Chat</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold uppercase text-on-surface-variant mb-1">
                    Context &amp; Specific Questions
                  </label>
                  <textarea
                    rows={4}
                    value={requestNotes}
                    onChange={(e) => setRequestNotes(e.target.value)}
                    placeholder="Briefly state your current background, what you are preparing for, or link your GitHub repo..."
                    className="w-full p-2.5 bg-surface border border-outline-variant font-sans text-xs focus:outline-none focus:border-secondary"
                  />
                  <p className="text-[11px] font-mono text-outline mt-1">
                    All mentorship exchanges are peer-verified, transparent, and private between mentee and mentor.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-outline-variant font-mono text-xs">
                  <button
                    type="button"
                    onClick={() => setRequestModalOpen(false)}
                    className="px-4 py-2 border border-outline-variant text-on-surface hover:bg-surface-container"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingRequest}
                    className="px-5 py-2 bg-primary text-on-primary uppercase font-bold hover:bg-secondary transition-all disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {submittingRequest ? 'Submitting...' : 'Send Request'}
                    <span className="material-symbols-outlined text-[14px]">send</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Modal: Private Mentorship Conversation Chat */}
      {activeConversationId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/40 backdrop-blur-xs">
          <div className="bg-surface-container-lowest border border-outline max-w-2xl w-full h-[600px] flex flex-col shadow-2xl relative">
            {/* Chat Header */}
            <div className="p-4 border-b border-outline-variant flex items-center justify-between bg-surface-container">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">forum</span>
                <span className="font-bold text-sm text-primary">
                  Mentorship Discussion with {activeConversationPartner}
                </span>
              </div>
              <button
                onClick={() => setActiveConversationId(null)}
                className="material-symbols-outlined text-on-surface-variant hover:text-on-surface"
              >
                close
              </button>
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-surface">
              {chatLoading ? (
                <div className="text-center font-mono text-xs text-outline py-8">Loading message history...</div>
              ) : chatMessages.length === 0 ? (
                <div className="text-center font-mono text-xs text-outline py-12">
                  No messages yet. Send an opening note to start your mentorship discussion!
                </div>
              ) : (
                chatMessages.map((msg) => {
                  const isMine = msg.senderId === user?.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 font-mono text-[10px] text-outline">
                        <span>{msg.sender?.name || (isMine ? 'You' : 'Mentor')}</span>
                        <span>•</span>
                        <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div
                        className={`max-w-[80%] p-3 text-xs leading-relaxed ${
                          isMine
                            ? 'bg-primary text-on-primary rounded-tl-sm rounded-tr-sm rounded-bl-sm'
                            : 'bg-surface-container-high text-on-surface rounded-tl-sm rounded-tr-sm rounded-br-sm border border-outline-variant'
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-outline-variant bg-surface-container-low flex gap-2">
              <input
                type="text"
                value={newMessageText}
                onChange={(e) => setNewMessageText(e.target.value)}
                placeholder="Type your reply or discussion note..."
                className="flex-1 px-3 py-2 bg-surface border border-outline-variant text-xs focus:outline-none focus:border-secondary"
              />
              <button
                type="submit"
                disabled={sendingMessage || !newMessageText.trim()}
                className="px-4 py-2 bg-secondary text-on-secondary font-mono text-xs uppercase font-bold hover:bg-secondary/90 disabled:opacity-40 flex items-center gap-1"
              >
                <span>Send</span>
                <span className="material-symbols-outlined text-[14px]">send</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MentorDirectoryPage;
