import React, { useState, useEffect, useMemo } from 'react';
import {
  GraduationCap,
  Users,
  Inbox,
  BookOpen,
  Search,
  CheckCircle2,
  Circle,
  Star,
  Download,
  Send,
  Sparkles,
  Briefcase,
  Clock,
  RotateCcw
} from 'lucide-react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer
} from 'recharts';
import { hubService } from '../services/hub.service';
import {
  StudentProfile,
  PlacementMilestone,
  PeerMentor,
  MentorshipRequest,
  AcademicResource,
  ResourceCategory,
  UserRole
} from '../types';
import { ProvenanceBadge } from '../components/ProvenanceBadge';

interface AcademicHubProps {
  currentRole?: UserRole;
}

type HubTab = 'readiness' | 'mentors' | 'requests' | 'resources';

export const AcademicHub: React.FC<AcademicHubProps> = ({ currentRole = 'student' }) => {
  const [activeTab, setActiveTab] = useState<HubTab>('readiness');

  // Module A State
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [milestones, setMilestones] = useState<PlacementMilestone[]>([]);
  const [mentors, setMentors] = useState<PeerMentor[]>([]);
  const [mentorSkillFilter, setMentorSkillFilter] = useState('');
  const [mentorCompanyFilter, setMentorCompanyFilter] = useState('');
  const [selectedMentor, setSelectedMentor] = useState<PeerMentor | null>(null);
  const [requestTopic, setRequestTopic] = useState('');
  const [requestSlot, setRequestSlot] = useState('');
  const [requestNotes, setRequestNotes] = useState('');
  const [isSubmittingReq, setIsSubmittingReq] = useState(false);

  const [requests, setRequests] = useState<MentorshipRequest[]>([]);
  const [resources, setResources] = useState<AcademicResource[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load Data
  useEffect(() => {
    hubService.getStudentProfile().then(setProfile);
    hubService.getPlacementMilestones().then(setMilestones);
    hubService.getMentors().then(setMentors);
    hubService.getUserRequests().then(setRequests);
    hubService.getResources().then(setResources);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Milestone Toggle
  const handleToggleMilestone = async (id: string) => {
    const res = await hubService.toggleMilestone(profile?.userId || 'usr_student_1', id);
    setMilestones((prev) =>
      prev.map((m) => (m.id === id ? { ...m, completed: res.completed } : m))
    );
    if (profile) {
      setProfile({ ...profile, readinessScore: res.readinessScore });
    }
    showToast('Milestone status updated');
  };

  // Mentorship Filter
  const handleFilterMentors = async (skill: string, company: string) => {
    setMentorSkillFilter(skill);
    setMentorCompanyFilter(company);
    const data = await hubService.getMentors({ skill, company });
    setMentors(data);
  };

  // Submit Mentorship Request
  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMentor || !requestTopic || !requestSlot) return;
    setIsSubmittingReq(true);
    try {
      const newReq = await hubService.submitMentorshipRequest({
        mentorId: selectedMentor.id,
        topic: requestTopic,
        preferredSlot: requestSlot,
        notes: requestNotes
      });
      setRequests((prev) => [newReq, ...prev]);
      setSelectedMentor(null);
      setRequestTopic('');
      setRequestSlot('');
      setRequestNotes('');
      showToast(`Mentorship request submitted to ${selectedMentor.name || selectedMentor.user?.name}`);
    } finally {
      setIsSubmittingReq(false);
    }
  };

  // Update Request Status (Accept/Reject)
  const handleUpdateStatus = async (requestId: string, status: 'accepted' | 'rejected') => {
    await hubService.updateRequestStatus(requestId, status, 'Reviewed by senior mentor.');
    setRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status } : r))
    );
    showToast(`Request marked as ${status}`);
  };

  // Resource Search/Filter
  const handleFilterResources = async (query: string, course: string, cat: string) => {
    setSearchQuery(query);
    setSelectedCourse(course);
    setSelectedCategory(cat);
    const list = await hubService.getResources({
      query,
      courseCode: course,
      category: cat
    });
    setResources(list);
  };

  // Star Rating
  const handleRateResource = async (id: string, star: number) => {
    const res = await hubService.rateResource(id, star);
    setResources((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, rating: res.averageRating, ratingsCount: res.totalRatings, userRated: star } : r
      )
    );
    showToast(`Rated ${star} stars!`);
  };

  // Dynamically compute the 5 competency categories from actual placement milestones
  const radarData = useMemo(() => {
    const categories: { key: string; subject: string; fallback: number }[] = [
      { key: 'DSA', subject: 'DSA & Graphs', fallback: 50 },
      { key: 'SystemDesign', subject: 'System Design', fallback: 40 },
      { key: 'SoftSkills', subject: 'Soft Skills', fallback: 60 },
      { key: 'Resume', subject: 'Resume', fallback: 50 },
      { key: 'MockInterview', subject: 'Mock Interview', fallback: 30 }
    ];

    return categories.map(({ key, subject, fallback }) => {
      const catMilestones = milestones.filter(
        (m) =>
          m.category.toLowerCase().replace(/[^a-z]/g, '') ===
          key.toLowerCase().replace(/[^a-z]/g, '')
      );
      const total = catMilestones.length;
      const completed = catMilestones.filter((m) => m.completed).length;
      const score = total > 0 ? Math.round((completed / total) * 100) : fallback;
      return {
        subject,
        score,
        fullMark: 100
      };
    });
  }, [milestones]);

  const coursesList = ['All', 'CS301', 'CS302', 'CS303', 'CS304'];
  const categoriesList: (ResourceCategory | 'All')[] = ['All', 'Notes', 'PYQ', 'Guide', 'Cheatsheet'];

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-card border border-accent/40 text-accent px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-semibold glow-accent animate-in fade-in slide-in-from-bottom-2">
          <Sparkles className="w-4 h-4 text-accent" />
          {toastMessage}
        </div>
      )}

      {/* Module Title Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-card border border-border-subtle relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-mono uppercase tracking-widest text-accent font-bold">Module A</span>
            <ProvenanceBadge type="ESTIMATED_METRIC" label="Readiness Index" size="sm" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-fg-primary">
            Student Intelligence & Academic Hub
          </h1>
          <p className="text-xs text-fg-muted mt-1 max-w-2xl">
            Integrated career placement readiness, peer mentorship network, and open academic repository.
          </p>
        </div>

        {/* Global Hub Metric Counter */}
        <div className="flex items-center gap-4 relative z-10">
          <div className="px-4 py-2.5 rounded-xl bg-surface/80 border border-border-subtle text-right">
            <div className="text-[10px] font-mono text-fg-muted uppercase">Placement Readiness</div>
            <div className="text-2xl font-black text-accent">{profile?.readinessScore ?? 81}%</div>
          </div>
        </div>
      </div>

      {/* Role Perspective Simulation Banner */}
      {currentRole !== 'student' && (
        <div className="p-3.5 rounded-xl bg-surface/80 border border-border-subtle flex items-center justify-between text-xs text-fg-muted">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span>
              Simulating <strong className="text-fg-primary capitalize">{currentRole}</strong> perspective. You are previewing student placement milestones and mentorship services.
            </span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-card border border-border-subtle text-accent font-semibold">
            Role: {currentRole.toUpperCase()}
          </span>
        </div>
      )}

      {/* Hub Tabs Navigation */}
      <div className="flex border-b border-border-subtle space-x-2">
        <button
          onClick={() => setActiveTab('readiness')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold transition-all border-b-2 cursor-pointer ${
            activeTab === 'readiness'
              ? 'border-accent text-accent'
              : 'border-transparent text-fg-muted hover:text-fg-primary'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          Readiness Dashboard
        </button>

        <button
          onClick={() => setActiveTab('mentors')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold transition-all border-b-2 cursor-pointer ${
            activeTab === 'mentors'
              ? 'border-accent text-accent'
              : 'border-transparent text-fg-muted hover:text-fg-primary'
          }`}
        >
          <Users className="w-4 h-4" />
          Peer Mentorship Discovery
        </button>

        <button
          onClick={() => setActiveTab('requests')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold transition-all border-b-2 cursor-pointer ${
            activeTab === 'requests'
              ? 'border-accent text-accent'
              : 'border-transparent text-fg-muted hover:text-fg-primary'
          }`}
        >
          <Inbox className="w-4 h-4" />
          Mentorship Requests ({requests.length})
        </button>

        <button
          onClick={() => setActiveTab('resources')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold transition-all border-b-2 cursor-pointer ${
            activeTab === 'resources'
              ? 'border-accent text-accent'
              : 'border-transparent text-fg-muted hover:text-fg-primary'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Academic Resource Library
        </button>
      </div>

      {/* TAB 1: READINESS DASHBOARD */}
      {activeTab === 'readiness' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Profile & Skill Radar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Student Profile Overview */}
            <div className="p-5 rounded-2xl bg-card border border-border-subtle space-y-4">
              <div className="flex items-center gap-3">
                <img
                  src={profile?.avatar || profile?.user?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aarav'}
                  alt={profile?.name || profile?.user?.name || 'Aarav Sharma'}
                  className="w-12 h-12 rounded-xl object-cover border border-accent/40"
                />
                <div>
                  <h3 className="text-sm font-bold text-fg-primary">{profile?.name || profile?.user?.name || 'Aarav Sharma'}</h3>
                  <p className="text-xs text-fg-muted">{profile?.department || profile?.user?.department || 'Computer Science & Engineering'}</p>
                  <p className="text-[10px] font-mono text-accent">GPA: {profile?.gpa ?? 8.85} / 10</p>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-surface/50 border border-border-subtle text-xs">
                <span className="text-[10px] font-mono text-fg-muted uppercase block mb-1">Target Career Role</span>
                <span className="font-semibold text-fg-primary flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-accent" />
                  {profile?.targetRole || 'Full Stack Software Engineer'}
                </span>
              </div>
            </div>

            {/* Radar Chart */}
            <div className="p-5 rounded-2xl bg-card border border-border-subtle">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-fg-muted font-mono">
                  Competency Vector
                </h3>
                <ProvenanceBadge type="ESTIMATED_METRIC" label="Radar" size="sm" />
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData} outerRadius="75%">
                    <PolarGrid stroke="#253343" />
                    <PolarAngleAxis dataKey="subject" stroke="#98A8B8" tick={{ fill: '#98A8B8', fontSize: 10 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#253343" tick={{ fill: '#98A8B8', fontSize: 9 }} />
                    <Radar name="Readiness" dataKey="score" stroke="#39F59A" fill="#39F59A" fillOpacity={0.3} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Verified Skills Cloud */}
            <div className="p-5 rounded-2xl bg-card border border-border-subtle">
              <h3 className="text-xs font-bold uppercase tracking-wider text-fg-muted font-mono mb-3">
                Verified Skill Tags
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {profile?.skills.map((skill, i) => {
                  const skillName = typeof skill === 'string' ? skill : skill.name;
                  return (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium border border-border-subtle bg-surface/60 text-fg-primary flex items-center gap-1.5"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                      {skillName}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Placement Milestones Checklist */}
          <div className="lg:col-span-2 space-y-6">
            <div className="p-6 rounded-2xl bg-card border border-border-subtle space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-fg-primary">Placement Preparation Milestones</h2>
                  <p className="text-xs text-fg-muted mt-0.5">
                    Click items to toggle verification. Readiness score dynamically recalibrates.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-accent font-bold">
                    {milestones.filter((m) => m.completed).length} / {milestones.length} Completed
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-surface h-2 rounded-full overflow-hidden border border-border-subtle">
                <div
                  className="bg-accent h-full transition-all duration-300"
                  style={{
                    width: `${Math.round(
                      (milestones.filter((m) => m.completed).length / (milestones.length || 1)) * 100
                    )}%`
                  }}
                />
              </div>

              {/* Milestone List */}
              <div className="space-y-2.5 pt-2">
                {milestones.map((milestone) => (
                  <div
                    key={milestone.id}
                    onClick={() => handleToggleMilestone(milestone.id)}
                    className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                      milestone.completed
                        ? 'border-accent/40 bg-accent-dim/30 text-fg-primary'
                        : 'border-border-subtle bg-surface/40 hover:bg-surface text-fg-muted'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {milestone.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-accent shrink-0" />
                      ) : (
                        <Circle className="w-5 h-5 text-fg-muted shrink-0" />
                      )}
                      <div>
                        <span className={`text-xs font-medium ${milestone.completed ? 'line-through text-fg-muted' : 'text-fg-primary'}`}>
                          {milestone.title}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold tracking-wider bg-card border border-border-subtle text-fg-muted">
                      {milestone.category}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PEER MENTORSHIP DISCOVERY */}
      {activeTab === 'mentors' && (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl bg-card border border-border-subtle">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-fg-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filter by skill (e.g. System Design, Graph Algorithms)..."
                value={mentorSkillFilter}
                onChange={(e) => handleFilterMentors(e.target.value, mentorCompanyFilter)}
                className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-border-subtle bg-surface/60 text-xs text-fg-primary placeholder:text-fg-muted focus:outline-none focus:border-accent"
              />
            </div>

            <div className="relative w-48">
              <input
                type="text"
                placeholder="Company (Google, Microsoft)..."
                value={mentorCompanyFilter}
                onChange={(e) => handleFilterMentors(mentorSkillFilter, e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-border-subtle bg-surface/60 text-xs text-fg-primary placeholder:text-fg-muted focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          {/* Mentors Cards Grid or Empty State */}
          {mentors.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-card border border-border-subtle flex flex-col items-center justify-center space-y-3">
              <div className="w-12 h-12 rounded-xl bg-surface flex items-center justify-center text-fg-muted border border-border-subtle">
                <Users className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-fg-primary">No peer mentors found</h4>
                <p className="text-xs text-fg-muted max-w-sm">
                  No mentors match your skill or company filter criteria. Try adjusting your search query or clear filters.
                </p>
              </div>
              {(mentorSkillFilter || mentorCompanyFilter) && (
                <button
                  onClick={() => handleFilterMentors('', '')}
                  className="px-3.5 py-1.5 rounded-lg bg-surface hover:bg-surface/80 border border-border-subtle text-xs font-semibold text-accent transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mentors.map((mentor) => (
                <div
                  key={mentor.id}
                  className="p-5 rounded-2xl bg-card border border-border-subtle flex flex-col justify-between hover:border-accent/40 transition-all glow-card"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={mentor.avatar || mentor.user?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mentor'}
                          alt={mentor.name || mentor.user?.name || 'Mentor'}
                          className="w-12 h-12 rounded-xl object-cover border border-border-subtle"
                        />
                        <div>
                          <h4 className="text-sm font-bold text-fg-primary">{mentor.name || mentor.user?.name}</h4>
                          <span className="text-[11px] font-mono font-semibold text-accent block">
                            {mentor.companyOffer}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs font-bold text-warning font-mono bg-warning/10 px-2 py-0.5 rounded-md border border-warning/20">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        {mentor.rating}
                      </div>
                    </div>

                    <p className="text-xs text-fg-muted line-clamp-2 mb-3 leading-relaxed">
                      {mentor.bio}
                    </p>

                    {/* Skills Chips */}
                    <div className="flex flex-wrap gap-1 mb-4">
                      {mentor.skills.slice(0, 3).map((s, i) => (
                        <span
                          key={i}
                          className="text-[10px] px-2 py-0.5 rounded bg-surface border border-border-subtle text-fg-muted font-medium"
                        >
                          {s}
                        </span>
                      ))}
                    </div>

                    {/* Open Slots */}
                    <div className="p-2.5 rounded-lg bg-surface/50 border border-border-subtle text-xs text-fg-muted space-y-1 mb-4">
                      <span className="text-[10px] font-mono uppercase text-fg-muted/80 block font-semibold">
                        Upcoming Available Slots
                      </span>
                      {mentor.availableSlots.slice(0, 2).map((slot, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-[11px] text-fg-primary font-mono">
                          <Clock className="w-3 h-3 text-accent" />
                          {slot}
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedMentor(mentor);
                      setRequestSlot(mentor.availableSlots[0] || '');
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-accent text-canvas font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-accent-hover transition-colors shadow-lg cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Request Mentorship
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Mentorship Request Modal */}
          {selectedMentor && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-canvas/70 backdrop-blur-sm p-4">
              <div className="w-full max-w-md bg-card border border-border-strong rounded-2xl p-6 shadow-2xl space-y-4 glow-card">
                <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-fg-primary">Request Mentorship</h3>
                    <p className="text-xs text-fg-muted">With {selectedMentor.name || selectedMentor.user?.name} ({selectedMentor.companyOffer})</p>
                  </div>
                  <button
                    onClick={() => setSelectedMentor(null)}
                    className="text-fg-muted hover:text-fg-primary text-sm font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSubmitRequest} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block text-fg-muted font-medium mb-1">Topic / Discussion Goal</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. System Design Mock: URL Shortener / Ride Dispatch"
                      value={requestTopic}
                      onChange={(e) => setRequestTopic(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-border-subtle bg-surface text-fg-primary focus:outline-none focus:border-accent"
                    />
                  </div>

                  <div>
                    <label className="block text-fg-muted font-medium mb-1">Select Available Time Slot</label>
                    <select
                      value={requestSlot}
                      onChange={(e) => setRequestSlot(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-border-subtle bg-surface text-fg-primary focus:outline-none focus:border-accent"
                    >
                      {selectedMentor.availableSlots.map((slot, i) => (
                        <option key={i} value={slot}>{slot}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-fg-muted font-medium mb-1">Preparation Notes / Questions</label>
                    <textarea
                      rows={3}
                      placeholder="Share your resume link or specific architecture questions..."
                      value={requestNotes}
                      onChange={(e) => setRequestNotes(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-border-subtle bg-surface text-fg-primary focus:outline-none focus:border-accent"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setSelectedMentor(null)}
                      className="px-4 py-2 rounded-lg border border-border-subtle text-fg-muted hover:text-fg-primary cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingReq}
                      className="px-4 py-2 rounded-lg bg-accent text-canvas font-bold hover:bg-accent-hover transition-colors cursor-pointer"
                    >
                      {isSubmittingReq ? 'Submitting...' : 'Send Request'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: MENTORSHIP REQUESTS MANAGER */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-card border border-border-subtle flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-fg-primary">Mentorship Requests Track</h3>
              <p className="text-xs text-fg-muted">Inspect outbound requests and incoming reviews</p>
            </div>
            <span className="text-xs font-mono text-accent font-semibold">Total: {requests.length}</span>
          </div>

          {requests.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-card border border-border-subtle flex flex-col items-center justify-center space-y-3">
              <div className="w-12 h-12 rounded-xl bg-surface flex items-center justify-center text-fg-muted border border-border-subtle">
                <Inbox className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-fg-primary">No mentorship requests</h4>
                <p className="text-xs text-fg-muted max-w-sm">
                  You have not sent or received any mentorship requests yet. Discover peer mentors in the Discovery tab to schedule a mock interview or resume review.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('mentors')}
                className="px-4 py-2 rounded-xl bg-accent text-canvas text-xs font-bold hover:bg-accent-hover transition-colors cursor-pointer flex items-center gap-1.5 shadow-lg"
              >
                <Users className="w-3.5 h-3.5" />
                Find a Mentor
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((req) => (
                <div
                  key={req.id}
                  className="p-4 rounded-xl bg-card border border-border-subtle flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-fg-primary">{req.topic}</span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                          req.status === 'accepted'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : req.status === 'rejected'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {req.status}
                      </span>
                    </div>
                    <div className="text-xs text-fg-muted flex items-center gap-3">
                      <span>Mentor: <strong className="text-fg-primary">{req.mentor?.name || req.mentor?.user?.name || 'Diya Patel'}</strong> ({req.mentor?.companyOffer || 'Microsoft SDE'})</span>
                      <span>•</span>
                      <span className="font-mono text-[11px]">{req.preferredSlot}</span>
                    </div>
                    {req.notes && (
                      <p className="text-xs text-fg-muted/80 italic pt-1">
                        Note: "{req.notes}"
                      </p>
                    )}
                    {req.mentorNotes && (
                      <p className="text-xs text-accent/80 italic pt-0.5">
                        Mentor Response: "{req.mentorNotes}"
                      </p>
                    )}
                  </div>

                  {/* Simulated Mentor Accept/Reject Controls */}
                  <div className="flex items-center gap-2 shrink-0">
                    {req.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(req.id, 'accepted')}
                          className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-400 text-xs font-semibold cursor-pointer"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(req.id, 'rejected')}
                          className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-400 text-xs font-semibold cursor-pointer"
                        >
                          Decline
                        </button>
                      </>
                    )}
                    {req.status === 'accepted' && (
                      <span className="text-xs font-mono text-emerald-400 font-semibold">
                        Session Scheduled ✓
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: ACADEMIC RESOURCE LIBRARY */}
      {activeTab === 'resources' && (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="p-4 rounded-xl bg-card border border-border-subtle flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4 h-4 text-fg-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search resources, topics, course codes..."
                value={searchQuery}
                onChange={(e) => handleFilterResources(e.target.value, selectedCourse, selectedCategory)}
                className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-border-subtle bg-surface/60 text-xs text-fg-primary placeholder:text-fg-muted focus:outline-none focus:border-accent"
              />
            </div>

            {/* Course Filter */}
            <div className="flex items-center gap-1 text-xs">
              <span className="text-fg-muted mr-1">Course:</span>
              {coursesList.map((c) => (
                <button
                  key={c}
                  onClick={() => handleFilterResources(searchQuery, c, selectedCategory)}
                  className={`px-2.5 py-1 rounded-md font-mono text-[11px] font-semibold transition-all cursor-pointer ${
                    selectedCourse === c
                      ? 'bg-accent text-canvas font-bold'
                      : 'bg-surface border border-border-subtle text-fg-muted hover:text-fg-primary'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-1 text-xs">
              <span className="text-fg-muted mr-1">Type:</span>
              {categoriesList.map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleFilterResources(searchQuery, selectedCourse, cat)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-accent text-canvas font-bold'
                      : 'bg-surface border border-border-subtle text-fg-muted hover:text-fg-primary'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Resources Cards or Empty State */}
          {resources.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-card border border-border-subtle flex flex-col items-center justify-center space-y-3">
              <div className="w-12 h-12 rounded-xl bg-surface flex items-center justify-center text-fg-muted border border-border-subtle">
                <BookOpen className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-fg-primary">No resources found</h4>
                <p className="text-xs text-fg-muted max-w-sm">
                  No academic materials or past papers match your current search query or course filter.
                </p>
              </div>
              {(searchQuery || selectedCourse !== 'All' || selectedCategory !== 'All') && (
                <button
                  onClick={() => handleFilterResources('', 'All', 'All')}
                  className="px-3.5 py-1.5 rounded-lg bg-surface hover:bg-surface/80 border border-border-subtle text-xs font-semibold text-accent transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset Filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {resources.map((res) => (
                <div
                  key={res.id}
                  className="p-5 rounded-2xl bg-card border border-border-subtle flex flex-col justify-between hover:border-accent/40 transition-all glow-card"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-surface border border-border-subtle text-accent">
                        {res.courseCode}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface/80 text-fg-muted border border-border-subtle uppercase">
                        {res.category}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-fg-primary mb-1 leading-snug">
                      {res.title}
                    </h4>
                    <p className="text-[11px] text-fg-muted mb-3 font-mono">
                      {res.courseName} • Uploaded by {res.uploaderName}
                    </p>

                    <div className="flex flex-wrap gap-1 mb-4">
                      {res.tags.map((t, i) => (
                        <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-surface text-fg-muted border border-border-subtle">
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border-subtle flex items-center justify-between text-xs">
                    {/* Star Rating Control */}
                    <div className="flex items-center gap-1">
                      <div className="flex items-center text-warning">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => handleRateResource(res.id, star)}
                            className="hover:scale-125 transition-transform p-0.5 cursor-pointer"
                            title={`Rate ${star} star`}
                          >
                            <Star
                              className={`w-3.5 h-3.5 ${
                                (res.userRated || res.rating) >= star
                                  ? 'fill-warning text-warning'
                                  : 'text-fg-muted/40'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                      <span className="font-mono text-xs font-bold text-fg-primary ml-1">
                        {res.rating}
                      </span>
                      <span className="text-[10px] text-fg-muted font-mono">
                        ({res.ratingsCount || res.ratingCount || 0})
                      </span>
                    </div>

                    {/* Download Action */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-fg-muted">
                        {res.downloadsCount} dl • {res.fileSize || '2.0 MB'}
                      </span>
                      <button
                        onClick={() => {
                          showToast(`Initiating download for ${res.title}`);
                        }}
                        className="p-1.5 rounded-lg bg-surface hover:bg-accent-dim text-fg-muted hover:text-accent border border-border-subtle transition-colors cursor-pointer"
                        title="Download resource"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
