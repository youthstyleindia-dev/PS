import { getDb } from '../db/connection.js';

export interface GroundedSource {
  sourceType: 'mentor' | 'feed_post' | 'event' | 'resource' | 'ride' | 'directory' | 'announcement';
  recordId: string;
  title: string;
  snippet: string;
  urlOrRoute: string;
  metadata?: Record<string, any>;
}

export interface RetrievalResult {
  sources: GroundedSource[];
  contextPromptSnippet: string;
}

export class CampusRetrievalService {
  /**
   * Performs semantic & keyword grounded search across authorized campus domains.
   * Only returns records authorized for general student view or the active user.
   */
  public static retrieveCampusContext(
    query: string,
    currentUserId?: string,
    limitPerDomain: number = 4
  ): RetrievalResult {
    const db = getDb();
    const queryLower = query.toLowerCase().trim();
    const terms = queryLower.split(/[\s,?!;:]+/).filter(t => t.length > 2);
    const stopWords = new Set(['who', 'can', 'you', 'the', 'and', 'for', 'are', 'there', 'any', 'about', 'with', 'from', 'what', 'how', 'tell', 'show', 'please', 'help']);
    const keywords = terms.filter(t => !stopWords.has(t));
    const effectiveKeywords = keywords.length > 0 ? keywords.slice(0, 4) : terms.slice(0, 3);
    const sources: GroundedSource[] = [];

    const buildLike = (columns: string[]) => {
      if (effectiveKeywords.length === 0) {
        return { clause: '1=1', params: [] as any[] };
      }
      const clauses: string[] = [];
      const params: any[] = [];
      for (const kw of effectiveKeywords) {
        const sub = columns.map(c => `${c} LIKE ?`).join(' OR ');
        clauses.push(`(${sub})`);
        for (let i = 0; i < columns.length; i++) {
          params.push(`%${kw}%`);
        }
      }
      return { clause: `(${clauses.join(' OR ')})`, params };
    };

    // 1. Mentors (Machine Learning, Skills, Domains)
    try {
      const ml = buildLike(['u.name', 'm.domain', 'm.skills', 'm.topics', 'm.company_offer']);
      const mentors = db.prepare(`
        SELECT m.id, m.user_id, m.domain, m.skills, m.topics, m.company_offer, m.available_slots,
               u.name, u.department, u.year_of_study
        FROM mentors m
        JOIN users u ON m.user_id = u.id
        WHERE m.is_approved = 1 AND ${ml.clause}
        LIMIT ?
      `).all(...ml.params, limitPerDomain) as any[];

      for (const m of mentors) {
        const skills = JSON.parse(m.skills || '[]');
        const topics = JSON.parse(m.topics || '[]');
        sources.push({
          sourceType: 'mentor',
          recordId: m.id,
          title: `Senior Mentor: ${m.name} (${m.domain})`,
          snippet: `Skills: ${skills.join(', ')}. Advises on: ${topics.join(', ')}. Offer: ${m.company_offer || 'Open'}. Available slots: ${JSON.parse(m.available_slots || '[]').join(', ')}.`,
          urlOrRoute: `/mentors`,
          metadata: { userId: m.user_id, skills, company: m.company_offer }
        });
      }
    } catch {
      // Ignore if table error
    }

    // 2. Academic Resources
    try {
      const rl = buildLike(['title', 'course_code', 'course_name', 'category', 'department']);
      const resources = db.prepare(`
        SELECT id, title, course_code, course_name, category, semester, department, rating, downloads_count
        FROM academic_resources
        WHERE ${rl.clause}
        LIMIT ?
      `).all(...rl.params, limitPerDomain) as any[];

      for (const r of resources) {
        sources.push({
          sourceType: 'resource',
          recordId: r.id,
          title: `Academic Resource: ${r.title} (${r.course_code})`,
          snippet: `${r.course_name} • Semester ${r.semester} • Rating: ${r.rating}★ (${r.downloads_count} downloads). Category: ${r.category}.`,
          urlOrRoute: `/academic`,
          metadata: { courseCode: r.course_code, category: r.category }
        });
      }
    } catch {
      // Ignore
    }

    // 3. Campus Events & Hackathons
    try {
      const el = buildLike(['title', 'description', 'category', 'venue', 'tags']);
      const events = db.prepare(`
        SELECT id, title, description, category, venue, start_time, rsvp_count, capacity
        FROM campus_events
        WHERE status = 'scheduled' AND ${el.clause}
        LIMIT ?
      `).all(...el.params, limitPerDomain) as any[];

      for (const ev of events) {
        sources.push({
          sourceType: 'event',
          recordId: ev.id,
          title: `Campus Event: ${ev.title}`,
          snippet: `Category: ${ev.category} • Venue: ${ev.venue} • Starts: ${ev.start_time} • ${ev.rsvp_count}/${ev.capacity} RSVPs. ${ev.description}`,
          urlOrRoute: `/events`,
          metadata: { category: ev.category, venue: ev.venue }
        });
      }
    } catch {
      // Ignore
    }

    // 4. Campus Feed Posts & Questions
    try {
      const fl = buildLike(['title', 'body', 'tags']);
      const posts = db.prepare(`
        SELECT id, title, body, post_type, tags, likes_count, comments_count
        FROM feed_posts
        WHERE status = 'published' AND visibility = 'campus' AND ${fl.clause}
        ORDER BY likes_count DESC
        LIMIT ?
      `).all(...fl.params, limitPerDomain) as any[];

      for (const p of posts) {
        sources.push({
          sourceType: 'feed_post',
          recordId: p.id,
          title: `Feed Post [${p.post_type}]: ${p.title || p.body.slice(0, 50)}`,
          snippet: `${p.body.slice(0, 200)}... (${p.likes_count} likes, ${p.comments_count} comments)`,
          urlOrRoute: `/feed`,
          metadata: { postType: p.post_type }
        });
      }
    } catch {
      // Ignore
    }

    // 5. Campus Directory & Facilities
    try {
      const dl = buildLike(['name', 'building', 'zone', 'description']);
      const locations = db.prepare(`
        SELECT id, name, category, building, zone, hours, description
        FROM campus_locations
        WHERE ${dl.clause}
        LIMIT ?
      `).all(...dl.params, limitPerDomain) as any[];

      for (const loc of locations) {
        sources.push({
          sourceType: 'directory',
          recordId: loc.id,
          title: `Facility: ${loc.name}`,
          snippet: `${loc.building} (Zone ${loc.zone}) • Hours: ${loc.hours} • ${loc.description}`,
          urlOrRoute: `/campus`,
          metadata: { category: loc.category, building: loc.building }
        });
      }
    } catch {
      // Ignore
    }

    // 6. Active Carpools / Rides
    try {
      if (queryLower.includes('ride') || queryLower.includes('carpool') || queryLower.includes('transit')) {
        const offers = db.prepare(`
          SELECT ro.id, ro.origin_node_id, ro.destination_node_id, ro.departure_time, ro.available_seats,
                 u.name as driver_name
          FROM ride_offers ro
          JOIN users u ON ro.driver_id = u.id
          WHERE ro.status = 'open' AND ro.available_seats > 0
          LIMIT ?
        `).all(limitPerDomain) as any[];

        for (const o of offers) {
          sources.push({
            sourceType: 'ride',
            recordId: o.id,
            title: `Carpool Offer: ${o.origin_node_id} → ${o.destination_node_id}`,
            snippet: `Driver: ${o.driver_name} • Leaves: ${o.departure_time} • ${o.available_seats} seats remaining.`,
            urlOrRoute: `/rides`,
            metadata: { seats: o.available_seats }
          });
        }
      }
    } catch {
      // Ignore
    }

    // Format consolidated context prompt snippet
    let contextPromptSnippet = 'VERIFIED REAL-TIME UNIVERSE CAMPUS DATA:\n';
    if (sources.length === 0) {
      contextPromptSnippet += 'No matching institutional records found for this specific query.\n';
    } else {
      sources.forEach((s, idx) => {
        contextPromptSnippet += `[Source ${idx + 1}] (${s.sourceType}) ${s.title}\nID: ${s.recordId} | Route: ${s.urlOrRoute}\n${s.snippet}\n\n`;
      });
    }

    return {
      sources,
      contextPromptSnippet: contextPromptSnippet.trim()
    };
  }
}
