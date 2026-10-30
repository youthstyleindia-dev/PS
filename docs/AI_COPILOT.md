# UniVerse Grounded AI Campus Copilot

## 1. Architectural Philosophy: Grounded Retrieval vs Hallucination

The UniVerse Campus Copilot is an intelligent assistant designed to navigate the collegiate operating environment. Unlike unconstrained chatbots, the Copilot enforces **Grounding-by-Construction**:

- **Real Database Context**: Every prompt to the assistant service (`assistant.service.ts`) is preceded by deterministic SQL queries extracting real campus locations, mentors, events, and carpooling corridors.
- **Mandatory Provenance Citations**: Every generated recommendation must cite real records in the database (`sources: GroundedSourceRef[]`). If an entity does not exist in `universe.db`, the model explicitly disclaims its existence.
- **Human-in-the-Loop Structured Actions**: When a student asks the Copilot to perform a campus mutation (e.g. "request a mentorship session with Diya" or "reserve a ride with Vikram"), the AI generates a `ProposedActionRef` card. The user must manually click "Confirm Action" before any transaction is executed.

---

## 2. Model & Fallback Architecture

1. **Primary Cloud Inference**:
   - Provider: Google Gemini API via `@google/genai` (`gemini-2.5-flash`).
   - Grounded system prompt with strictly sanitized relational context.
2. **Local Deterministic Fallback**:
   - If `GEMINI_API_KEY` is absent or the cloud endpoint times out (>5000ms), the system seamlessly falls back to a deterministic semantic rule parser (`mockAssistantProvider`).
   - The fallback analyzes intent tokens (e.g. `mentor`, `pytorch`, `dijkstra`, `event`, `hackathon`, `ride`, `carpool`), queries SQLite directly, and returns real database records with identical citation structures.

---

## 3. Grounded Citation Structure

Each response returns:

```typescript
export interface GroundedSourceRef {
  sourceType: 'mentor' | 'event' | 'ride_offer' | 'academic_resource' | 'community' | 'location';
  recordId: string;
  title: string;
  snippet: string;
  urlOrRoute: string;
}
```

Example JSON response:
```json
{
  "success": true,
  "data": {
    "role": "assistant",
    "content": "I recommend connecting with Diya Patel (Senior Scholar). She holds an incoming Google AI Resident offer and mentors students on PyTorch and Deep Learning.",
    "sources": [
      {
        "sourceType": "mentor",
        "recordId": "men_1",
        "title": "Diya Patel • Google AI Resident",
        "snippet": "Domain: Machine Learning & NLP. Available slots: Wednesday 16:00 - 17:30.",
        "urlOrRoute": "/mentors?id=men_1"
      }
    ],
    "proposedAction": {
      "actionId": "act_839210",
      "actionType": "create_mentorship_request",
      "payload": {
        "mentor_id": "usr_student_2",
        "topic": "PyTorch & Deep Learning Guidance"
      },
      "summary": "Submit formal mentorship inquiry to Diya Patel"
    }
  }
}
```
