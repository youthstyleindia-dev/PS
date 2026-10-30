import { Router, Request, Response } from 'express';
import { getDb } from '../db/connection.js';
import { requireAuth } from '../middleware/auth.middleware.js';

export const feedRouter = Router();

// Feed posts valid types
export const VALID_POST_TYPES = [
  'discussion',
  'question',
  'project_update',
  'opportunity',
  'event',
  'announcement',
  'resource_share',
  'ride_share',
  'poll'
] as const;

export type FeedPostType = typeof VALID_POST_TYPES[number];

/**
 * GET /api/feed
 * Retrieve campus feed posts with filters, search, tabs, and pagination.
 */
feedRouter.get('/', requireAuth, (req: Request, res: Response): void => {
  try {
    const db = getDb();
    const userId = req.user?.sub;
    const {
      tab = 'for_you',
      post_type,
      tag,
      query,
      sort = 'recent',
      limit = '30',
      offset = '0'
    } = req.query as Record<string, string>;

    const numLimit = Math.min(Math.max(parseInt(limit, 10) || 30, 1), 100);
    const numOffset = Math.max(parseInt(offset, 10) || 0, 0);

    const conditions: string[] = ["p.status = 'published'"];
    const params: any[] = [];

    // Tab filtering
    if (tab === 'questions') {
      conditions.push("p.post_type = 'question'");
    } else if (tab === 'projects') {
      conditions.push("p.post_type = 'project_update'");
    } else if (tab === 'opportunities') {
      conditions.push("p.post_type = 'opportunity'");
    } else if (tab === 'events') {
      conditions.push("p.post_type = 'event'");
    } else if (tab === 'announcements') {
      conditions.push("p.post_type = 'announcement'");
    } else if (tab === 'resources') {
      conditions.push("p.post_type = 'resource_share'");
    } else if (tab === 'rides') {
      conditions.push("p.post_type = 'ride_share'");
    } else if (tab === 'following' && userId) {
      conditions.push(`p.author_id IN (
        SELECT target_id FROM feed_follows WHERE follower_id = ? AND target_type = 'user'
      )`);
      params.push(userId);
    }

    // Direct post_type filter if provided
    if (post_type && VALID_POST_TYPES.includes(post_type as FeedPostType)) {
      conditions.push('p.post_type = ?');
      params.push(post_type);
    }

    // Tag filter
    if (tag) {
      conditions.push("p.tags LIKE ?");
      params.push(`%"${tag}"%`);
    }

    // Full text search in title or body
    if (query && query.trim()) {
      conditions.push('(p.title LIKE ? OR p.body LIKE ?)');
      const wild = `%${query.trim()}%`;
      params.push(wild, wild);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const orderBy = sort === 'top'
      ? 'ORDER BY (p.likes_count + p.comments_count * 2) DESC, p.created_at DESC'
      : 'ORDER BY p.created_at DESC';

    const sql = `
      SELECT 
        p.id, p.author_id, p.campus_id, p.post_type, p.title, p.body, p.tags,
        p.visibility, p.attachment_metadata, p.status, p.likes_count, p.comments_count,
        p.bookmarks_count, p.is_demo, p.created_at, p.updated_at,
        u.name as author_name, u.email as author_email, u.avatar as author_avatar,
        u.role as author_role, u.department as author_department,
        (SELECT COUNT(1) FROM feed_reactions r WHERE r.post_id = p.id AND r.user_id = ?) as has_liked,
        (SELECT COUNT(1) FROM feed_bookmarks b WHERE b.post_id = p.id AND b.user_id = ?) as has_bookmarked
      FROM feed_posts p
      JOIN users u ON p.author_id = u.id
      ${whereClause}
      ${orderBy}
      LIMIT ? OFFSET ?
    `;

    const queryParams = [userId || '', userId || '', ...params, numLimit, numOffset];
    const rows = db.prepare(sql).all(...queryParams) as any[];

    const posts = rows.map((r) => ({
      id: r.id,
      authorId: r.author_id,
      campusId: r.campus_id,
      postType: r.post_type,
      title: r.title,
      body: r.body,
      tags: JSON.parse(r.tags || '[]'),
      visibility: r.visibility,
      attachmentMetadata: JSON.parse(r.attachment_metadata || '{}'),
      status: r.status,
      likesCount: r.likes_count,
      commentsCount: r.comments_count,
      bookmarksCount: r.bookmarks_count,
      isDemo: Boolean(r.is_demo),
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      author: {
        id: r.author_id,
        name: r.author_name,
        email: r.author_email,
        avatar: r.author_avatar,
        role: r.author_role,
        department: r.author_department
      },
      hasLiked: Boolean(r.has_liked),
      hasBookmarked: Boolean(r.has_bookmarked)
    }));

    // Count total for pagination
    const countSql = `
      SELECT COUNT(1) as total
      FROM feed_posts p
      ${whereClause}
    `;
    const countRow = db.prepare(countSql).get(...params) as { total: number };

    res.json({
      success: true,
      data: {
        posts,
        total: countRow?.total || 0,
        limit: numLimit,
        offset: numOffset
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message || 'Failed to fetch feed' } });
  }
});

/**
 * POST /api/feed/posts
 * Publish a new campus post.
 */
feedRouter.post('/posts', requireAuth, (req: Request, res: Response): void => {
  try {
    const db = getDb();
    const userId = req.user?.sub;
    const userRole = req.user?.role;
    const userRoles = req.user?.roles || (userRole ? [userRole] : []);

    const { post_type, title, body, tags = [], visibility = 'campus', attachment_metadata = {} } = req.body;

    if (!body || typeof body !== 'string' || body.trim().length < 3) {
      res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Body must be at least 3 characters long' } });
      return;
    }

    if (!post_type || !VALID_POST_TYPES.includes(post_type)) {
      res.status(400).json({ error: { code: 'BAD_REQUEST', message: `Invalid post_type: must be one of ${VALID_POST_TYPES.join(', ')}` } });
      return;
    }

    // Role-specific authorization check: Only faculty, warden, or admin can publish official announcements
    if (post_type === 'announcement') {
      const isAuthorized = userRoles.some((r: string) => ['ta_faculty', 'warden', 'admin'].includes(r));
      if (!isAuthorized) {
        res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'Only authorized faculty, wardens, or administrators can publish official campus announcements.'
          }
        });
        return;
      }
    }

    const postId = `post_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const sanitizedTitle = title ? String(title).trim().slice(0, 200) : null;
    const sanitizedBody = String(body).trim().slice(0, 10000);
    const tagsJson = JSON.stringify(Array.isArray(tags) ? tags.map(t => String(t).trim().toLowerCase()).filter(Boolean) : []);
    const attachJson = JSON.stringify(typeof attachment_metadata === 'object' && attachment_metadata !== null ? attachment_metadata : {});

    db.prepare(`
      INSERT INTO feed_posts (id, author_id, campus_id, post_type, title, body, tags, visibility, attachment_metadata, status, is_demo)
      VALUES (?, ?, 'main_campus', ?, ?, ?, ?, ?, ?, 'published', 0)
    `).run(postId, userId, post_type, sanitizedTitle, sanitizedBody, tagsJson, visibility, attachJson);

    // Activity log entry
    db.prepare(`
      INSERT INTO activity_log (id, user_id, module, action, details)
      VALUES (?, ?, 'hub', 'feed_post_created', ?)
    `).run(`act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`, userId, JSON.stringify({ postId, postType: post_type }));

    // Fetch and return the newly created post
    const post = db.prepare(`
      SELECT p.*, u.name as author_name, u.email as author_email, u.avatar as author_avatar, u.role as author_role, u.department as author_department
      FROM feed_posts p
      JOIN users u ON p.author_id = u.id
      WHERE p.id = ?
    `).get(postId) as any;

    res.status(201).json({
      success: true,
      data: {
        id: post.id,
        authorId: post.author_id,
        campusId: post.campus_id,
        postType: post.post_type,
        title: post.title,
        body: post.body,
        tags: JSON.parse(post.tags || '[]'),
        visibility: post.visibility,
        attachmentMetadata: JSON.parse(post.attachment_metadata || '{}'),
        status: post.status,
        likesCount: post.likes_count,
        commentsCount: post.comments_count,
        bookmarksCount: post.bookmarks_count,
        isDemo: Boolean(post.is_demo),
        createdAt: post.created_at,
        updatedAt: post.updated_at,
        author: {
          id: post.author_id,
          name: post.author_name,
          email: post.author_email,
          avatar: post.author_avatar,
          role: post.author_role,
          department: post.author_department
        },
        hasLiked: false,
        hasBookmarked: false
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message || 'Failed to create post' } });
  }
});

/**
 * GET /api/feed/posts/:postId
 * Retrieve single post with its comment thread.
 */
feedRouter.get('/posts/:postId', requireAuth, (req: Request, res: Response): void => {
  try {
    const db = getDb();
    const userId = req.user?.sub;
    const { postId } = req.params;

    const post = db.prepare(`
      SELECT 
        p.*, u.name as author_name, u.email as author_email, u.avatar as author_avatar, u.role as author_role, u.department as author_department,
        (SELECT COUNT(1) FROM feed_reactions r WHERE r.post_id = p.id AND r.user_id = ?) as has_liked,
        (SELECT COUNT(1) FROM feed_bookmarks b WHERE b.post_id = p.id AND b.user_id = ?) as has_bookmarked
      FROM feed_posts p
      JOIN users u ON p.author_id = u.id
      WHERE p.id = ? AND p.status != 'removed'
    `).get(userId || '', userId || '', postId) as any;

    if (!post) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Post not found or has been removed' } });
      return;
    }

    const comments = db.prepare(`
      SELECT c.*, u.name as author_name, u.avatar as author_avatar, u.role as author_role
      FROM feed_comments c
      JOIN users u ON c.author_id = u.id
      WHERE c.post_id = ?
      ORDER BY c.created_at ASC
    `).all(postId) as any[];

    res.json({
      success: true,
      data: {
        post: {
          id: post.id,
          authorId: post.author_id,
          campusId: post.campus_id,
          postType: post.post_type,
          title: post.title,
          body: post.body,
          tags: JSON.parse(post.tags || '[]'),
          visibility: post.visibility,
          attachmentMetadata: JSON.parse(post.attachment_metadata || '{}'),
          status: post.status,
          likesCount: post.likes_count,
          commentsCount: post.comments_count,
          bookmarksCount: post.bookmarks_count,
          isDemo: Boolean(post.is_demo),
          createdAt: post.created_at,
          updatedAt: post.updated_at,
          author: {
            id: post.author_id,
            name: post.author_name,
            email: post.author_email,
            avatar: post.author_avatar,
            role: post.author_role,
            department: post.author_department
          },
          hasLiked: Boolean(post.has_liked),
          hasBookmarked: Boolean(post.has_bookmarked)
        },
        comments: comments.map(c => ({
          id: c.id,
          postId: c.post_id,
          authorId: c.author_id,
          parentId: c.parent_id,
          content: c.content,
          isDemo: Boolean(c.is_demo),
          createdAt: c.created_at,
          author: {
            id: c.author_id,
            name: c.author_name,
            avatar: c.author_avatar,
            role: c.author_role
          }
        }))
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message || 'Failed to fetch post' } });
  }
});

/**
 * PATCH /api/feed/posts/:postId
 * Edit own post.
 */
feedRouter.patch('/posts/:postId', requireAuth, (req: Request, res: Response): void => {
  try {
    const db = getDb();
    const userId = req.user?.sub;
    const userRole = req.user?.role;
    const { postId } = req.params;
    const { title, body, tags, visibility } = req.body;

    const post = db.prepare('SELECT author_id, status FROM feed_posts WHERE id = ?').get(postId) as any;
    if (!post) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Post not found' } });
      return;
    }

    if (post.author_id !== userId && userRole !== 'admin') {
      res.status(403).json({ error: { code: 'FORBIDDEN', message: 'You can only edit your own posts.' } });
      return;
    }

    const updates: string[] = ["updated_at = CURRENT_TIMESTAMP"];
    const params: any[] = [];

    if (title !== undefined) {
      updates.push("title = ?");
      params.push(title ? String(title).trim().slice(0, 200) : null);
    }
    if (body !== undefined) {
      updates.push("body = ?");
      params.push(String(body).trim().slice(0, 10000));
    }
    if (tags !== undefined && Array.isArray(tags)) {
      updates.push("tags = ?");
      params.push(JSON.stringify(tags.map(t => String(t).trim().toLowerCase())));
    }
    if (visibility !== undefined) {
      updates.push("visibility = ?");
      params.push(visibility);
    }

    params.push(postId);
    db.prepare(`UPDATE feed_posts SET ${updates.join(', ')} WHERE id = ?`).run(...params);

    res.json({ success: true, message: 'Post updated successfully' });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message || 'Failed to update post' } });
  }
});

/**
 * DELETE /api/feed/posts/:postId
 * Delete own post or administer moderation removal.
 */
feedRouter.delete('/posts/:postId', requireAuth, (req: Request, res: Response): void => {
  try {
    const db = getDb();
    const userId = req.user?.sub;
    const userRole = req.user?.role;
    const { postId } = req.params;

    const post = db.prepare('SELECT author_id FROM feed_posts WHERE id = ?').get(postId) as any;
    if (!post) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Post not found' } });
      return;
    }

    if (post.author_id !== userId && userRole !== 'admin') {
      res.status(403).json({ error: { code: 'FORBIDDEN', message: 'You can only delete your own posts.' } });
      return;
    }

    db.prepare("DELETE FROM feed_posts WHERE id = ?").run(postId);
    res.json({ success: true, message: 'Post deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message || 'Failed to delete post' } });
  }
});

/**
 * POST /api/feed/posts/:postId/reactions
 * Toggle like/reaction on post.
 */
feedRouter.post('/posts/:postId/reactions', requireAuth, (req: Request, res: Response): void => {
  try {
    const db = getDb();
    const userId = req.user?.sub;
    const { postId } = req.params;
    const { reaction_type = 'like' } = req.body;

    const post = db.prepare('SELECT id, likes_count, author_id FROM feed_posts WHERE id = ?').get(postId) as any;
    if (!post) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Post not found' } });
      return;
    }

    const existing = db.prepare('SELECT id FROM feed_reactions WHERE post_id = ? AND user_id = ? AND reaction_type = ?')
      .get(postId, userId, reaction_type) as any;

    let reacted = false;
    let newLikes = post.likes_count;

    if (existing) {
      // Remove reaction
      db.prepare('DELETE FROM feed_reactions WHERE id = ?').run(existing.id);
      db.prepare('UPDATE feed_posts SET likes_count = MAX(0, likes_count - 1) WHERE id = ?').run(postId);
      newLikes = Math.max(0, post.likes_count - 1);
      reacted = false;
    } else {
      // Add reaction
      const rxId = `rx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      db.prepare('INSERT INTO feed_reactions (id, post_id, user_id, reaction_type) VALUES (?, ?, ?, ?)').run(rxId, postId, userId, reaction_type);
      db.prepare('UPDATE feed_posts SET likes_count = likes_count + 1 WHERE id = ?').run(postId);
      newLikes = post.likes_count + 1;
      reacted = true;

      // Notify post author if not self
      if (post.author_id !== userId) {
        db.prepare(`
          INSERT INTO notifications (id, user_id, title, message, module, type, link_url)
          VALUES (?, ?, 'New Post Reaction', 'A scholar reacted to your campus post.', 'hub', 'info', ?)
        `).run(`notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`, post.author_id, `/feed`);
      }
    }

    res.json({ success: true, data: { reacted, likesCount: newLikes } });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message || 'Failed to toggle reaction' } });
  }
});

/**
 * POST /api/feed/posts/:postId/comments
 * Add a comment or reply to post.
 */
feedRouter.post('/posts/:postId/comments', requireAuth, (req: Request, res: Response): void => {
  try {
    const db = getDb();
    const userId = req.user?.sub;
    const { postId } = req.params;
    const { content, parent_id } = req.body;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Comment content cannot be empty' } });
      return;
    }

    const post = db.prepare('SELECT id, author_id FROM feed_posts WHERE id = ?').get(postId) as any;
    if (!post) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Post not found' } });
      return;
    }

    const commentId = `cm_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const sanitizedContent = String(content).trim().slice(0, 3000);

    db.prepare(`
      INSERT INTO feed_comments (id, post_id, author_id, parent_id, content, is_demo)
      VALUES (?, ?, ?, ?, ?, 0)
    `).run(commentId, postId, userId, parent_id || null, sanitizedContent);

    db.prepare('UPDATE feed_posts SET comments_count = comments_count + 1 WHERE id = ?').run(postId);

    // Notify author if comment is from another student
    if (post.author_id !== userId) {
      db.prepare(`
        INSERT INTO notifications (id, user_id, title, message, module, type, link_url)
        VALUES (?, ?, 'New Comment on Post', 'A peer commented on your campus post.', 'hub', 'info', ?)
      `).run(`notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`, post.author_id, `/feed`);
    }

    const comment = db.prepare(`
      SELECT c.*, u.name as author_name, u.avatar as author_avatar, u.role as author_role
      FROM feed_comments c
      JOIN users u ON c.author_id = u.id
      WHERE c.id = ?
    `).get(commentId) as any;

    res.status(201).json({
      success: true,
      data: {
        id: comment.id,
        postId: comment.post_id,
        authorId: comment.author_id,
        parentId: comment.parent_id,
        content: comment.content,
        isDemo: Boolean(comment.is_demo),
        createdAt: comment.created_at,
        author: {
          id: comment.author_id,
          name: comment.author_name,
          avatar: comment.author_avatar,
          role: comment.author_role
        }
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message || 'Failed to add comment' } });
  }
});

/**
 * POST /api/feed/posts/:postId/bookmarks
 * Toggle bookmark on post.
 */
feedRouter.post('/posts/:postId/bookmarks', requireAuth, (req: Request, res: Response): void => {
  try {
    const db = getDb();
    const userId = req.user?.sub;
    const { postId } = req.params;

    const post = db.prepare('SELECT id, bookmarks_count FROM feed_posts WHERE id = ?').get(postId) as any;
    if (!post) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Post not found' } });
      return;
    }

    const existing = db.prepare('SELECT id FROM feed_bookmarks WHERE post_id = ? AND user_id = ?').get(postId, userId) as any;

    let bookmarked = false;
    if (existing) {
      db.prepare('DELETE FROM feed_bookmarks WHERE id = ?').run(existing.id);
      db.prepare('UPDATE feed_posts SET bookmarks_count = MAX(0, bookmarks_count - 1) WHERE id = ?').run(postId);
      bookmarked = false;
    } else {
      const bmId = `bm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      db.prepare('INSERT INTO feed_bookmarks (id, post_id, user_id) VALUES (?, ?, ?)').run(bmId, postId, userId);
      db.prepare('UPDATE feed_posts SET bookmarks_count = bookmarks_count + 1 WHERE id = ?').run(postId);
      bookmarked = true;
    }

    res.json({ success: true, data: { bookmarked } });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message || 'Failed to toggle bookmark' } });
  }
});

/**
 * POST /api/feed/posts/:postId/reports
 * Report content for moderation.
 */
feedRouter.post('/posts/:postId/reports', requireAuth, (req: Request, res: Response): void => {
  try {
    const db = getDb();
    const userId = req.user?.sub;
    const { postId } = req.params;
    const { reason } = req.body;

    if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
      res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Report reason is required' } });
      return;
    }

    const rptId = `rpt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    db.prepare(`
      INSERT INTO feed_reports (id, post_id, reporter_id, reason, status)
      VALUES (?, ?, ?, ?, 'pending')
    `).run(rptId, postId, userId, String(reason).trim().slice(0, 1000));

    res.status(201).json({ success: true, message: 'Post reported to moderators. Thank you for keeping our campus safe.' });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message || 'Failed to report post' } });
  }
});
