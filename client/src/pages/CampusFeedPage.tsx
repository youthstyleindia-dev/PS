import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { FeedService, FeedPost } from '../services/feed.service';
import { CampusService, CampusAnnouncement, CampusEvent } from '../services/campus.service';
import { MentorService, MentorProfile } from '../services/mentor.service';
import { useNavigate } from 'react-router-dom';

export const CampusFeedPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [announcements, setAnnouncements] = useState<CampusAnnouncement[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<CampusEvent[]>([]);
  const [suggestedMentors, setSuggestedMentors] = useState<MentorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<string>('for_you');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTag, setActiveTag] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'top'>('recent');

  // Composer State
  const [composerOpen, setComposerOpen] = useState(false);
  const [postType, setPostType] = useState<string>('question');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [composerError, setComposerError] = useState<string | null>(null);

  // Expanded comments state
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [postComments, setPostComments] = useState<any[]>([]);
  const [commentInput, setCommentInput] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);

  // Reporting State
  const [reportPostId, setReportPostId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [reportSuccess, setReportSuccess] = useState(false);

  const fetchFeed = async () => {
    setLoading(true);
    try {
      const data = await FeedService.getFeed({
        tab: selectedTab,
        query: searchQuery,
        tag: activeTag,
        sort: sortBy
      });
      setPosts(data.posts || []);
    } catch (err) {
      console.error('Failed to load feed:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRightRail = async () => {
    try {
      const [annRes, evtRes, mntRes] = await Promise.all([
        CampusService.getAnnouncements().catch(() => []),
        CampusService.getEvents().catch(() => ({ events: [] })),
        MentorService.getMentors({ query: 'Machine Learning', sort: 'relevance' }).catch(() => ({ mentors: [] }))
      ]);
      setAnnouncements(annRes || []);
      setUpcomingEvents(evtRes?.events?.slice(0, 3) || []);
      setSuggestedMentors(mntRes?.mentors?.slice(0, 3) || []);
    } catch (err) {
      console.warn('Right rail fetch error:', err);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, [selectedTab, sortBy, activeTag]);

  useEffect(() => {
    fetchRightRail();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchFeed();
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    setComposerError(null);
    if (!body.trim()) {
      setComposerError('Please write some content for your post.');
      return;
    }

    setSubmitting(true);
    try {
      const tags = tagsInput.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
      await FeedService.createPost({
        post_type: postType,
        title: title.trim() || undefined,
        body: body.trim(),
        tags
      });
      setTitle('');
      setBody('');
      setTagsInput('');
      setComposerOpen(false);
      fetchFeed();
    } catch (err: any) {
      setComposerError(err.message || 'Failed to publish post');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReaction = async (postId: string) => {
    try {
      const res = await FeedService.toggleReaction(postId);
      setPosts(prev => prev.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            hasLiked: res.reacted,
            likesCount: res.likesCount
          };
        }
        return p;
      }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleBookmark = async (postId: string) => {
    try {
      const res = await FeedService.toggleBookmark(postId);
      setPosts(prev => prev.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            hasBookmarked: res.bookmarked,
            bookmarksCount: res.bookmarked ? p.bookmarksCount + 1 : Math.max(0, p.bookmarksCount - 1)
          };
        }
        return p;
      }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    try {
      await FeedService.deletePost(postId);
      setPosts(prev => prev.filter(p => p.id !== postId));
    } catch (err: any) {
      alert(err.message || 'Failed to delete post');
    }
  };

  const toggleComments = async (postId: string) => {
    if (expandedPostId === postId) {
      setExpandedPostId(null);
      return;
    }
    setExpandedPostId(postId);
    setCommentLoading(true);
    try {
      const data = await FeedService.getPost(postId);
      setPostComments(data.comments || []);
    } catch (err) {
      console.error(err);
    } finally {
      setCommentLoading(false);
    }
  };

  const handleAddComment = async (postId: string) => {
    if (!commentInput.trim()) return;
    try {
      const newComment = await FeedService.addComment(postId, commentInput.trim());
      setPostComments(prev => [...prev, newComment]);
      setCommentInput('');
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, commentsCount: p.commentsCount + 1 } : p));
    } catch (err: any) {
      alert(err.message || 'Failed to submit comment');
    }
  };

  const handleReportSubmit = async () => {
    if (!reportPostId || !reportReason.trim()) return;
    try {
      await FeedService.reportPost(reportPostId, reportReason.trim());
      setReportSuccess(true);
      setTimeout(() => {
        setReportPostId(null);
        setReportReason('');
        setReportSuccess(false);
      }, 1500);
    } catch (err: any) {
      alert(err.message || 'Failed to report');
    }
  };

  const postTypeBadge: Record<string, { label: string; color: string }> = {
    question: { label: 'QUESTION', color: 'bg-amber-100 text-amber-900 border-amber-300' },
    project_update: { label: 'PROJECT', color: 'bg-emerald-100 text-emerald-900 border-emerald-300' },
    discussion: { label: 'DISCUSSION', color: 'bg-blue-100 text-blue-900 border-blue-300' },
    announcement: { label: 'OFFICIAL NOTICE', color: 'bg-red-100 text-red-900 border-red-300 font-bold' },
    opportunity: { label: 'OPPORTUNITY', color: 'bg-purple-100 text-purple-900 border-purple-300' },
    resource_share: { label: 'RESOURCE', color: 'bg-teal-100 text-teal-900 border-teal-300' },
    ride_share: { label: 'CARPOOL', color: 'bg-cyan-100 text-cyan-900 border-cyan-300' },
    event: { label: 'EVENT', color: 'bg-indigo-100 text-indigo-900 border-indigo-300' },
    poll: { label: 'POLL', color: 'bg-pink-100 text-pink-900 border-pink-300' }
  };

  const tabs = [
    { key: 'for_you', label: 'For You' },
    { key: 'following', label: 'Following' },
    { key: 'questions', label: 'Questions' },
    { key: 'projects', label: 'Projects' },
    { key: 'opportunities', label: 'Opportunities' },
    { key: 'events', label: 'Events' },
    { key: 'announcements', label: 'Announcements' },
    { key: 'resources', label: 'Resources' },
    { key: 'rides', label: 'Rides' }
  ];

  return (
    <div className="w-full flex flex-col gap-6 font-body-md text-on-surface">
      {/* Top Banner with Demo Data disclosure */}
      <div className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-surface-container border border-outline-variant gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-label-sm text-label-sm px-2 py-0.5 bg-primary text-on-primary font-mono uppercase font-bold tracking-wider">
              CAMPUS COMMUNITY FEED
            </span>
            <span className="font-label-sm text-label-sm px-2 py-0.5 border border-outline text-on-surface-variant font-mono uppercase font-bold">
              DEMO CAMPUS DATA ACTIVE
            </span>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
            Real interactive community mesh: ask questions, share research prototypes, find carpools, and connect with senior mentors.
          </p>
        </div>

        <button
          onClick={() => setComposerOpen(!composerOpen)}
          className="px-4 py-2 bg-primary text-on-primary hover:bg-secondary font-label-md text-label-md font-mono uppercase font-bold transition-all shadow-sm flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">
            {composerOpen ? 'close' : 'edit_square'}
          </span>
          <span>{composerOpen ? 'Close Composer' : 'Create Campus Post'}</span>
        </button>
      </div>

      {/* Post Composer Card */}
      {composerOpen && (
        <div className="p-6 bg-surface-container-low border border-outline-variant shadow-md flex flex-col gap-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-outline-variant pb-2">
            <span className="font-label-md text-label-md uppercase font-bold tracking-wider text-primary font-mono">
              Draft New Submission
            </span>
            <span className="font-label-sm text-label-sm text-on-surface-variant font-mono">
              Posting as: <strong className="text-primary">{user?.name}</strong> ({user?.role?.toUpperCase()})
            </span>
          </div>

          {composerError && (
            <div className="p-3 bg-error-container text-on-error-container text-xs font-mono border border-error">
              {composerError}
            </div>
          )}

          <form onSubmit={handleCreatePost} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono uppercase text-on-surface-variant mb-1">
                  Post Category
                </label>
                <select
                  value={postType}
                  onChange={e => setPostType(e.target.value)}
                  className="w-full p-2 bg-surface border border-outline text-xs font-mono focus:border-secondary outline-none"
                >
                  <option value="question">Question (Ask guidance or troubleshooting)</option>
                  <option value="project_update">Project Update (Showcase research / demo)</option>
                  <option value="discussion">Discussion (Academic / Engineering)</option>
                  <option value="opportunity">Opportunity (Research opening / Internship)</option>
                  <option value="resource_share">Resource Share (Notes, Cheatsheet, PYQs)</option>
                  <option value="ride_share">Ride Share (Carpool availability)</option>
                  <option value="poll">Poll (Community vote)</option>
                  {['ta_faculty', 'warden', 'admin'].includes(user?.role || '') && (
                    <option value="announcement">Official Announcement (Authorized)</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-on-surface-variant mb-1">
                  Post Title (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. How to get started with PyTorch vision models?"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full p-2 bg-surface border border-outline text-xs focus:border-secondary outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-on-surface-variant mb-1">
                Post Body / Description *
              </label>
              <textarea
                rows={4}
                required
                placeholder="Share your question, research update, or discussion topic..."
                value={body}
                onChange={e => setBody(e.target.value)}
                className="w-full p-3 bg-surface border border-outline text-sm focus:border-secondary outline-none resize-y"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-on-surface-variant mb-1">
                Tags (Comma-separated)
              </label>
              <input
                type="text"
                placeholder="e.g. machine-learning, python, deep-learning"
                value={tagsInput}
                onChange={e => setTagsInput(e.target.value)}
                className="w-full p-2 bg-surface border border-outline text-xs font-mono focus:border-secondary outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-outline-variant">
              <button
                type="button"
                onClick={() => setComposerOpen(false)}
                className="px-4 py-2 border border-outline text-xs font-mono uppercase hover:bg-surface-container"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-primary text-on-primary font-mono text-xs uppercase font-bold hover:bg-secondary transition-colors disabled:opacity-50"
              >
                {submitting ? 'Publishing...' : 'Publish Post'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main Grid: Feed Column (8 cols) + Right Rail (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Central Feed Column */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-outline-variant text-xs font-mono scrollbar-none">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setSelectedTab(tab.key)}
                className={`px-3 py-1.5 whitespace-nowrap transition-colors uppercase font-medium ${
                  selectedTab === tab.key
                    ? 'bg-primary text-on-primary font-bold shadow-sm'
                    : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search & Sort Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-surface-container-lowest border border-outline-variant">
            <form onSubmit={handleSearchSubmit} className="flex-1 w-full flex items-center gap-2">
              <span className="material-symbols-outlined text-outline text-[18px]">search</span>
              <input
                type="text"
                placeholder="Search posts by topic, skill (e.g. 'machine learning', 'pytorch')..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-xs outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => { setSearchQuery(''); fetchFeed(); }}
                  className="text-xs text-outline hover:text-primary font-mono"
                >
                  Clear
                </button>
              )}
            </form>

            <div className="flex items-center gap-2 shrink-0 text-xs font-mono">
              <span className="text-on-surface-variant uppercase text-[10px]">Sort:</span>
              <button
                onClick={() => setSortBy('recent')}
                className={`px-2 py-0.5 uppercase ${sortBy === 'recent' ? 'font-bold text-primary underline' : 'text-on-surface-variant'}`}
              >
                Recent
              </button>
              <button
                onClick={() => setSortBy('top')}
                className={`px-2 py-0.5 uppercase ${sortBy === 'top' ? 'font-bold text-primary underline' : 'text-on-surface-variant'}`}
              >
                Top Rated
              </button>
            </div>
          </div>

          {/* Active Tag Filter Indicator */}
          {activeTag && (
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-on-surface-variant">Filtering by tag:</span>
              <span className="px-2 py-0.5 bg-secondary-fixed text-on-secondary-fixed font-bold flex items-center gap-1">
                #{activeTag}
                <button onClick={() => setActiveTag('')} className="hover:text-red-700 ml-1">×</button>
              </span>
            </div>
          )}

          {/* Posts Stream */}
          {loading ? (
            <div className="p-12 text-center flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              <span className="font-mono text-xs uppercase text-on-surface-variant">Loading Campus Stream...</span>
            </div>
          ) : posts.length === 0 ? (
            <div className="p-12 text-center bg-surface-container-lowest border border-outline-variant flex flex-col items-center gap-2">
              <span className="material-symbols-outlined text-outline text-[36px]">forum</span>
              <h4 className="font-headline-sm text-headline-sm font-bold">No posts found</h4>
              <p className="text-xs text-on-surface-variant max-w-sm">
                No submissions match your active filter or search terms. Be the first to start a conversation!
              </p>
              <button
                onClick={() => setComposerOpen(true)}
                className="mt-3 px-4 py-2 bg-primary text-on-primary text-xs font-mono uppercase font-bold"
              >
                Create a Post
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {posts.map(post => {
                const badge = postTypeBadge[post.postType] || { label: post.postType.toUpperCase(), color: 'bg-surface-container' };
                const isAuthor = user?.id === post.authorId || user?.role === 'admin';

                return (
                  <article
                    key={post.id}
                    className="p-5 bg-surface border border-outline-variant shadow-sm hover:border-outline transition-colors flex flex-col gap-3"
                  >
                    {/* Header Row: Author info + Post Type Badge */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={post.author.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.author.name}`}
                          alt={post.author.name}
                          className="w-10 h-10 rounded-full border border-outline-variant object-cover bg-surface-container"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-body-sm font-bold text-on-surface">
                              {post.author.name}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.2 bg-surface-container text-on-surface-variant font-mono uppercase">
                              {post.author.role}
                            </span>
                            {post.isDemo && (
                              <span className="text-[9px] px-1 bg-surface-container-high text-outline font-mono uppercase">
                                DEMO
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-on-surface-variant font-mono">
                            {post.author.department || 'Campus Scholar'} • {new Date(post.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-mono px-2 py-0.5 border ${badge.color}`}>
                          {badge.label}
                        </span>
                        {isAuthor && (
                          <button
                            onClick={() => handleDeletePost(post.id)}
                            title="Delete Post"
                            className="text-outline hover:text-error transition-colors p-1"
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Post Content */}
                    <div className="flex flex-col gap-2">
                      {post.title && (
                        <h3 className="font-headline-sm text-headline-sm font-bold text-primary tracking-tight">
                          {post.title}
                        </h3>
                      )}
                      <p className="font-body-md text-on-surface leading-relaxed whitespace-pre-wrap">
                        {post.body}
                      </p>
                    </div>

                    {/* Tags */}
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        {post.tags.map(tag => (
                          <button
                            key={tag}
                            onClick={() => setActiveTag(tag)}
                            className="text-[10px] font-mono px-2 py-0.5 bg-surface-container hover:bg-secondary-fixed hover:text-on-secondary-fixed transition-colors"
                          >
                            #{tag}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Bottom Action Bar */}
                    <div className="flex items-center justify-between pt-3 border-t border-outline-variant text-xs font-mono text-on-surface-variant">
                      <div className="flex items-center gap-4">
                        {/* Like Button */}
                        <button
                          onClick={() => handleReaction(post.id)}
                          className={`flex items-center gap-1.5 transition-colors ${
                            post.hasLiked ? 'text-primary font-bold' : 'hover:text-primary'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            {post.hasLiked ? 'favorite' : 'favorite_border'}
                          </span>
                          <span>{post.likesCount}</span>
                        </button>

                        {/* Comments Toggle */}
                        <button
                          onClick={() => toggleComments(post.id)}
                          className="flex items-center gap-1.5 hover:text-primary transition-colors"
                        >
                          <span className="material-symbols-outlined text-[18px]">chat_bubble_outline</span>
                          <span>{post.commentsCount} comments</span>
                        </button>

                        {/* Bookmark Button */}
                        <button
                          onClick={() => handleBookmark(post.id)}
                          className={`flex items-center gap-1.5 transition-colors ${
                            post.hasBookmarked ? 'text-secondary font-bold' : 'hover:text-secondary'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            {post.hasBookmarked ? 'bookmark' : 'bookmark_border'}
                          </span>
                        </button>
                      </div>

                      <button
                        onClick={() => setReportPostId(post.id)}
                        className="text-[11px] text-outline hover:text-on-surface transition-colors uppercase"
                      >
                        Report
                      </button>
                    </div>

                    {/* Comment Thread Accordion */}
                    {expandedPostId === post.id && (
                      <div className="mt-3 pt-3 border-t border-outline-variant flex flex-col gap-3 bg-surface-container-lowest p-3">
                        <span className="text-xs font-mono uppercase font-bold text-primary">
                          Discussion Thread ({postComments.length})
                        </span>

                        {commentLoading ? (
                          <div className="text-xs font-mono text-outline py-2">Loading comments...</div>
                        ) : postComments.length === 0 ? (
                          <div className="text-xs text-outline py-2">No comments yet. Be the first to reply!</div>
                        ) : (
                          <div className="flex flex-col gap-2.5">
                            {postComments.map(c => (
                              <div key={c.id} className="p-2.5 bg-surface border border-outline-variant text-xs flex flex-col gap-1">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-on-surface">{c.author.name}</span>
                                    <span className="text-[10px] text-outline font-mono">({c.author.role})</span>
                                  </div>
                                  <span className="text-[10px] text-outline font-mono">
                                    {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                                <p className="text-on-surface leading-normal">{c.content}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Comment Input */}
                        <div className="flex items-center gap-2 pt-2">
                          <input
                            type="text"
                            placeholder="Add your peer perspective..."
                            value={commentInput}
                            onChange={e => setCommentInput(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') handleAddComment(post.id); }}
                            className="flex-1 p-2 bg-surface border border-outline text-xs outline-none focus:border-secondary"
                          />
                          <button
                            onClick={() => handleAddComment(post.id)}
                            className="px-4 py-2 bg-primary text-on-primary font-mono text-xs uppercase font-bold hover:bg-secondary"
                          >
                            Reply
                          </button>
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Rail: Announcements, Events & Suggested Mentors */}
        <aside className="lg:col-span-4 flex flex-col gap-6">
          {/* 1. Official Announcements */}
          <div className="p-5 bg-surface border border-outline-variant shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-outline-variant pb-2">
              <span className="font-label-md text-label-md uppercase font-bold tracking-wider text-primary font-mono flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px] text-red-600">campaign</span>
                Campus Notices
              </span>
              <span className="text-[10px] font-mono text-outline uppercase">Official</span>
            </div>

            {announcements.length === 0 ? (
              <span className="text-xs text-outline font-mono py-2">No active campus notices.</span>
            ) : (
              <div className="flex flex-col gap-3">
                {announcements.slice(0, 3).map(a => (
                  <div key={a.id} className="p-3 bg-surface-container-lowest border border-outline-variant flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] px-1.5 py-0.2 bg-red-100 text-red-800 font-mono uppercase font-bold">
                        {a.priority.toUpperCase()}
                      </span>
                      <span className="text-[10px] text-outline font-mono">
                        {a.author.name}
                      </span>
                    </div>
                    <h5 className="font-bold text-xs text-on-surface mt-1 leading-snug">{a.title}</h5>
                    <p className="text-[11px] text-on-surface-variant line-clamp-2">{a.body}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 2. Upcoming Workshops & Coding Sessions */}
          <div className="p-5 bg-surface border border-outline-variant shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-outline-variant pb-2">
              <span className="font-label-md text-label-md uppercase font-bold tracking-wider text-primary font-mono flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px] text-secondary">event</span>
                Upcoming Workshops
              </span>
              <button
                onClick={() => navigate('/events')}
                className="text-[10px] font-mono text-secondary hover:underline uppercase font-bold"
              >
                View All
              </button>
            </div>

            {upcomingEvents.length === 0 ? (
              <span className="text-xs text-outline font-mono py-2">No upcoming events.</span>
            ) : (
              <div className="flex flex-col gap-3">
                {upcomingEvents.map(e => (
                  <div key={e.id} className="p-3 bg-surface-container-lowest border border-outline-variant flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] px-1.5 py-0.2 bg-secondary-fixed text-on-secondary-fixed font-mono uppercase font-bold">
                        {e.category}
                      </span>
                      <span className="text-[10px] text-outline font-mono">
                        {e.rsvpCount}/{e.capacity} RSVPs
                      </span>
                    </div>
                    <h5 className="font-bold text-xs text-on-surface leading-snug">{e.title}</h5>
                    <div className="text-[10px] text-on-surface-variant font-mono">
                      📍 {e.venue} • {new Date(e.startTime).toLocaleDateString()}
                    </div>
                    <button
                      onClick={() => navigate('/events')}
                      className="mt-1 px-3 py-1 bg-surface-container hover:bg-surface-container-high border border-outline text-[11px] font-mono uppercase font-bold text-primary transition-colors text-center"
                    >
                      View Details &amp; RSVP
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 3. Recommended Senior Mentors (Machine Learning) */}
          <div className="p-5 bg-surface border border-outline-variant shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-outline-variant pb-2">
              <span className="font-label-md text-label-md uppercase font-bold tracking-wider text-primary font-mono flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px] text-primary">psychology</span>
                Senior ML Mentors
              </span>
              <button
                onClick={() => navigate('/mentors')}
                className="text-[10px] font-mono text-primary hover:underline uppercase font-bold"
              >
                Explore
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {suggestedMentors.map(m => (
                <div key={m.id} className="p-3 bg-surface-container-lowest border border-outline-variant flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <img
                      src={m.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.name}`}
                      alt={m.name}
                      className="w-8 h-8 rounded-full border border-outline-variant object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-xs text-on-surface truncate">{m.name}</div>
                      <div className="text-[10px] text-secondary font-mono truncate">{m.companyOffer}</div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {m.skills.slice(0, 3).map(s => (
                      <span key={s} className="text-[9px] px-1.5 py-0.2 bg-surface-container font-mono">
                        {s}
                      </span>
                    ))}
                  </div>
                  <button
                    onClick={() => navigate(`/mentors`)}
                    className="mt-1 px-2.5 py-1 bg-primary text-on-primary hover:bg-secondary font-mono text-[10px] uppercase font-bold transition-colors text-center"
                  >
                    Request Advice
                  </button>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* Report Modal */}
      {reportPostId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-surface border border-outline p-6 shadow-2xl flex flex-col gap-4">
            <h4 className="font-headline-sm text-headline-sm font-bold text-primary">Report Post to Moderators</h4>
            <p className="text-xs text-on-surface-variant">
              Help keep UniVerse safe. What is the issue with this submission?
            </p>

            {reportSuccess ? (
              <div className="p-3 bg-secondary-fixed text-on-secondary-fixed font-mono text-xs font-bold text-center">
                Report logged. Thank you for your vigilance.
              </div>
            ) : (
              <>
                <textarea
                  rows={3}
                  placeholder="e.g. Harassment, spam, or misleading institutional claims..."
                  value={reportReason}
                  onChange={e => setReportReason(e.target.value)}
                  className="w-full p-2 bg-surface-container border border-outline text-xs outline-none"
                />
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    onClick={() => setReportPostId(null)}
                    className="px-3 py-1.5 border border-outline text-xs font-mono uppercase"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReportSubmit}
                    className="px-4 py-1.5 bg-red-700 text-white font-mono text-xs uppercase font-bold"
                  >
                    Submit Report
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
