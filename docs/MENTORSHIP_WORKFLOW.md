# UniVerse Senior-to-Junior Mentorship Architecture & Workflow

## 1. Executive Summary

The UniVerse Mentorship Network bridges graduating senior scholars holding top-tier placement offers with junior students seeking technical interview preparation, project guidance, and resume critique.

Unlike commercial advising marketplaces, UniVerse operates on a **zero-arbitrage peer protocol**:
- Mentorship is completely free of hourly fees or commissions.
- Mentors are verified through campus placement records (`placement_records`).
- Direct private messaging is strictly gatekept: a student cannot message a mentor until the mentor explicitly reviews and accepts the student's mentorship request.

---

## 2. End-to-End Mentorship Lifecycle

```mermaid
sequenceDiagram
    autonumber
    actor Mentee as Junior Scholar (Student)
    actor Mentor as Senior Mentor (Approved)
    participant API as UniVerse Express Backend
    participant DB as SQLite Relational Database

    Note over Mentee, Mentor: Phase 1: Discovery & Proposal
    Mentee->>API: GET /api/mentors?skills=PyTorch&available_only=true
    API-->>Mentee: Returns matched mentors with placement provenance
    Mentee->>API: POST /api/mentorship/requests {mentor_id, topic, preferred_slot, notes}
    API->>DB: INSERT INTO mentorship_requests (status = 'pending')
    DB-->>API: Request Record Created
    API-->>Mentee: HTTP 201 Created

    Note over Mentee, Mentor: Phase 2: Mentor Review & Double-Opt-In
    Mentor->>API: GET /api/mentorship/requests/all
    API-->>Mentor: Returns incoming request queue
    Mentor->>API: PATCH /api/mentorship/requests/:id {status: 'accepted', mentor_notes}
    API->>DB: UPDATE mentorship_requests SET status = 'accepted'
    API->>DB: INSERT INTO mentorship_conversations (mentee_id, mentor_id)
    API-->>Mentor: HTTP 200 OK (Returns active conversationId)

    Note over Mentee, Mentor: Phase 3: Sovereign Private Messaging
    Mentee->>API: POST /api/mentorship/conversations/:id/messages {content}
    API->>DB: Verify user is participant (mentee OR mentor)
    API->>DB: INSERT INTO mentorship_messages
    API-->>Mentee: HTTP 201 Created
    Mentor->>API: GET /api/mentorship/conversations/:id
    API-->>Mentor: Returns decrypted message history
```

---

## 3. Security & Anti-Harassment Safeguards

1. **Unsolicited Message Prevention**:
   - Calling `POST /api/mentorship/conversations/:id/messages` without an existing conversation returns `404 Not Found`.
   - Creating a conversation requires an accepted `mentorship_requests` record. Students cannot directly initiate a conversation without mentor consent.
2. **Conversation Confidentiality**:
   - Every request to `/api/mentorship/conversations/:id` checks:
     `conv.mentee_id === req.user.sub || conv.mentor_id === req.user.sub`
   - Third-party users attempting access receive HTTP `403 Forbidden`.
3. **Availability & Capacity Caps**:
   - Each mentor defines `max_mentees` (default: 3-5). When `active_mentees >= max_mentees`, the mentor's profile displays "Cohort Full (Waitlist)" and rejects new request submissions until active sessions conclude.
