import { Router, Request, Response } from 'express';
import { getDb } from '../db/connection.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { GeminiService } from '../services/gemini.service.js';

export const assistantRouter = Router();

/**
 * GET /api/assistant/conversations
 * List user's conversations.
 */
assistantRouter.get('/conversations', requireAuth, (req: Request, res: Response): void => {
  try {
    const db = getDb();
    const userId = req.user?.sub;

    const convs = db.prepare(`
      SELECT c.*, 
        (SELECT content FROM assistant_messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_message_preview,
        (SELECT COUNT(1) FROM assistant_messages m WHERE m.conversation_id = c.id) as message_count
      FROM assistant_conversations c
      WHERE c.user_id = ?
      ORDER BY c.updated_at DESC
    `).all(userId) as any[];

    res.json({
      success: true,
      data: {
        conversations: convs.map(c => ({
          id: c.id,
          userId: c.user_id,
          title: c.title,
          model: c.model,
          messageCount: c.message_count,
          lastMessagePreview: c.last_message_preview ? c.last_message_preview.slice(0, 100) : '',
          isDemo: Boolean(c.is_demo),
          createdAt: c.created_at,
          updatedAt: c.updated_at
        }))
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message || 'Failed to fetch conversations' } });
  }
});

/**
 * POST /api/assistant/conversations
 * Start a new conversation.
 */
assistantRouter.post('/conversations', requireAuth, (req: Request, res: Response): void => {
  try {
    const db = getDb();
    const userId = req.user?.sub;
    const { title = 'Campus Guidance' } = req.body;

    const convId = `conv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

    db.prepare(`
      INSERT INTO assistant_conversations (id, user_id, title, model, is_demo)
      VALUES (?, ?, ?, ?, 0)
    `).run(convId, userId, String(title).slice(0, 100), model);

    res.status(201).json({
      success: true,
      data: {
        id: convId,
        userId,
        title,
        model,
        createdAt: new Date().toISOString()
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message || 'Failed to create conversation' } });
  }
});

/**
 * GET /api/assistant/conversations/:conversationId
 * Retrieve messages in a conversation.
 */
assistantRouter.get('/conversations/:conversationId', requireAuth, (req: Request, res: Response): void => {
  try {
    const db = getDb();
    const userId = req.user?.sub;
    const { conversationId } = req.params;

    const conv = db.prepare('SELECT * FROM assistant_conversations WHERE id = ?').get(conversationId) as any;
    if (!conv) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Conversation not found' } });
      return;
    }

    if (conv.user_id !== userId) {
      res.status(403).json({ error: { code: 'FORBIDDEN', message: 'You can only access your own conversations.' } });
      return;
    }

    const messages = db.prepare(`
      SELECT * FROM assistant_messages 
      WHERE conversation_id = ?
      ORDER BY created_at ASC
    `).all(conversationId) as any[];

    res.json({
      success: true,
      data: {
        conversation: {
          id: conv.id,
          title: conv.title,
          model: conv.model,
          isDemo: Boolean(conv.is_demo),
          createdAt: conv.created_at
        },
        messages: messages.map(m => ({
          id: m.id,
          conversationId: m.conversation_id,
          role: m.role,
          content: m.content,
          sources: JSON.parse(m.sources_json || '[]'),
          proposedAction: m.proposed_action_json ? JSON.parse(m.proposed_action_json) : null,
          createdAt: m.created_at
        }))
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message || 'Failed to fetch conversation' } });
  }
});

/**
 * DELETE /api/assistant/conversations/:conversationId
 * Delete own conversation.
 */
assistantRouter.delete('/conversations/:conversationId', requireAuth, (req: Request, res: Response): void => {
  try {
    const db = getDb();
    const userId = req.user?.sub;
    const { conversationId } = req.params;

    const conv = db.prepare('SELECT user_id FROM assistant_conversations WHERE id = ?').get(conversationId) as any;
    if (!conv) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Conversation not found' } });
      return;
    }

    if (conv.user_id !== userId) {
      res.status(403).json({ error: { code: 'FORBIDDEN', message: 'You can only delete your own conversations.' } });
      return;
    }

    db.prepare('DELETE FROM assistant_conversations WHERE id = ?').run(conversationId);
    res.json({ success: true, message: 'Conversation deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message || 'Failed to delete conversation' } });
  }
});

/**
 * POST /api/assistant/conversations/:conversationId/messages
 * Send user query, invoke Gemini / Grounded Retrieval, store turns, and return answer.
 */
assistantRouter.post('/conversations/:conversationId/messages', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const db = getDb();
    const userId = req.user?.sub;
    const { conversationId } = req.params;
    const { message } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Message cannot be empty' } });
      return;
    }

    let conv = db.prepare('SELECT * FROM assistant_conversations WHERE id = ?').get(conversationId) as any;
    if (!conv) {
      // Auto-create conversation if new
      const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
      db.prepare(`
        INSERT INTO assistant_conversations (id, user_id, title, model, is_demo)
        VALUES (?, ?, ?, ?, 0)
      `).run(conversationId, userId, message.trim().slice(0, 40), model);
      conv = { id: conversationId, user_id: userId, model };
    } else if (conv.user_id !== userId) {
      res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Access denied: not conversation owner.' } });
      return;
    }

    // Rate Limiting check: max 50 queries per user per day
    const today = new Date().toISOString().slice(0, 10);
    const usage = db.prepare('SELECT request_count FROM assistant_usage_daily WHERE date = ? AND user_id = ?')
      .get(today, userId) as any;
    if (usage && usage.request_count >= 100) {
      res.status(429).json({ error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Daily Copilot query limit reached (100 queries/day). Please continue tomorrow.' } });
      return;
    }

    // 1. Save user turn
    const userMsgId = `amsg_${Date.now()}_u_${Math.random().toString(36).substring(2, 6)}`;
    db.prepare(`
      INSERT INTO assistant_messages (id, conversation_id, role, content)
      VALUES (?, ?, 'user', ?)
    `).run(userMsgId, conversationId, message.trim());

    // 2. Fetch recent conversation history
    const pastMessages = db.prepare(`
      SELECT role, content FROM assistant_messages 
      WHERE conversation_id = ? AND id != ?
      ORDER BY created_at ASC
      LIMIT 10
    `).all(conversationId, userMsgId) as Array<{ role: 'user' | 'assistant'; content: string }>;

    // 3. Generate grounded cloud response
    const aiResponse = await GeminiService.generateResponse(message.trim(), pastMessages, userId);

    // 4. Save proposed action if any (with status 'pending' requiring UI confirmation)
    let actionId: string | null = null;
    if (aiResponse.proposedAction) {
      actionId = `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      db.prepare(`
        INSERT INTO assistant_action_confirmations (id, conversation_id, user_id, action_type, action_payload, status)
        VALUES (?, ?, ?, ?, ?, 'pending')
      `).run(
        actionId,
        conversationId,
        userId,
        aiResponse.proposedAction.actionType,
        JSON.stringify(aiResponse.proposedAction.payload)
      );

      // Attach actionId to the proposedAction object returned to client
      (aiResponse.proposedAction as any).actionId = actionId;
    }

    // 5. Save assistant turn
    const assistantMsgId = `amsg_${Date.now()}_a_${Math.random().toString(36).substring(2, 6)}`;
    db.prepare(`
      INSERT INTO assistant_messages (id, conversation_id, role, content, sources_json, proposed_action_json, token_count)
      VALUES (?, ?, 'assistant', ?, ?, ?, ?)
    `).run(
      assistantMsgId,
      conversationId,
      aiResponse.content,
      JSON.stringify(aiResponse.sources),
      aiResponse.proposedAction ? JSON.stringify(aiResponse.proposedAction) : null,
      Math.round(aiResponse.content.length / 4)
    );

    // Update conversation timestamp
    db.prepare('UPDATE assistant_conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(conversationId);

    // Record usage
    db.prepare(`
      INSERT INTO assistant_usage_daily (date, user_id, request_count, tokens_used)
      VALUES (?, ?, 1, 100)
      ON CONFLICT(date, user_id) DO UPDATE SET 
        request_count = request_count + 1,
        tokens_used = tokens_used + 100
    `).run(today, userId);

    res.status(200).json({
      success: true,
      data: {
        messageId: assistantMsgId,
        role: 'assistant',
        content: aiResponse.content,
        isLiveCloud: aiResponse.isLiveCloud,
        providerNote: aiResponse.providerNote,
        model: aiResponse.model,
        sources: aiResponse.sources,
        proposedAction: aiResponse.proposedAction
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message || 'Failed to process assistant request' } });
  }
});

/**
 * POST /api/assistant/actions/:actionId/confirm
 * Explicit user confirmation of a mutating assistant tool action.
 */
assistantRouter.post('/actions/:actionId/confirm', requireAuth, (req: Request, res: Response): void => {
  try {
    const db = getDb();
    const userId = req.user?.sub;
    const { actionId } = req.params;

    const action = db.prepare('SELECT * FROM assistant_action_confirmations WHERE id = ?').get(actionId) as any;
    if (!action) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Action proposal not found' } });
      return;
    }

    if (action.user_id !== userId) {
      res.status(403).json({ error: { code: 'FORBIDDEN', message: 'You can only confirm your own actions.' } });
      return;
    }

    if (action.status !== 'pending') {
      res.status(400).json({ error: { code: 'BAD_REQUEST', message: `Action has already been ${action.status}` } });
      return;
    }

    const payload = JSON.parse(action.action_payload || '{}');
    let executionResult: any = null;

    if (action.action_type === 'create_mentorship_request') {
      const { mentor_id, topic, preferred_slot, notes = '' } = payload;
      const reqId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      db.prepare(`
        INSERT INTO mentorship_requests (id, mentee_id, mentor_id, topic, preferred_slot, status, notes)
        VALUES (?, ?, ?, ?, ?, 'pending', ?)
      `).run(reqId, userId, mentor_id, topic, preferred_slot, notes);

      executionResult = { requestId: reqId, topic, status: 'pending' };
    } else if (action.action_type === 'register_for_event') {
      const { event_id } = payload;
      const regId = `ereg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      db.prepare(`
        INSERT OR IGNORE INTO event_registrations (id, event_id, user_id, status)
        VALUES (?, ?, ?, 'confirmed')
      `).run(regId, event_id, userId);

      db.prepare('UPDATE campus_events SET rsvp_count = rsvp_count + 1 WHERE id = ?').run(event_id);
      executionResult = { eventId: event_id, status: 'confirmed' };
    } else if (action.action_type === 'create_feed_post') {
      const { post_type, title, body, tags } = payload;
      const postId = `post_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      db.prepare(`
        INSERT INTO feed_posts (id, author_id, campus_id, post_type, title, body, tags, visibility, status)
        VALUES (?, ?, 'main_campus', ?, ?, ?, ?, 'campus', 'published')
      `).run(postId, userId, post_type, title || null, body, JSON.stringify(tags || []));
      executionResult = { postId, title };
    }

    // Mark action executed
    db.prepare(`
      UPDATE assistant_action_confirmations 
      SET status = 'executed', executed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(actionId);

    res.json({
      success: true,
      data: {
        actionId,
        actionType: action.action_type,
        status: 'executed',
        result: executionResult
      },
      message: 'Action confirmed and executed successfully.'
    });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message || 'Failed to execute confirmed action' } });
  }
});
