# UniVerse Campus Copilot — Cloud Generative AI Architecture

## 1. Overview & Philosophy
UniVerse Campus Copilot (`/assistant`) provides an intelligent, privacy-first conversational assistant grounded strictly in verified institutional campus data. Unlike generic chatbots, UniVerse Copilot:
- **Never hallucinates institutional facts:** Every recommendation for a mentor, course, carpool, event, or policy is grounded in verified SQLite records.
- **Never mutates data unilaterally:** Mutating actions (such as booking a mentorship session or registering for an event) generate structured proposal confirmation cards that require explicit human approval via the UI before executing.
- **Maintains ethical transparency:** If `GEMINI_API_KEY` is not configured, the copilot openly declares its offline local fallback mode rather than presenting canned responses as live cloud intelligence.

---

## 2. Official Google Gen AI SDK Integration
UniVerse integrates the official Google Gen AI SDK:
```bash
npm install @google/genai
```
- **Package:** `@google/genai` (v2.32.0)
- **Primary Model:** `gemini-2.5-flash`
- **Adapter Location:** `server/src/services/gemini.service.ts`

### Initialization Pattern
```typescript
import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY;
if (apiKey) {
  const ai = new GoogleGenAI({ apiKey });
  // Client is ready for grounded generation
}
```

---

## 3. Grounded Retrieval Architecture (RAG)
Before calling Gemini, the backend retrieval service (`server/src/services/campus_retrieval.service.ts`) executes controlled, read-only queries against authorized tables:
1. **Senior Mentors:** `mentors` + `users` (skills, topics, availability, placement offers)
2. **Academic Resources:** `academic_resources` (PYQs, course codes, ratings)
3. **Campus Events & Guilds:** `campus_events` + `communities` (hackathons, workshops, RSVPs)
4. **Community Feed:** `feed_posts` (questions, opportunities, project updates)
5. **Campus Directory:** `campus_locations` (labs, libraries, operating hours)
6. **Smart Transit / Carpools:** `ride_offers` (active open pooled routes)

### Prompt Construction & Grounding Contract
```text
VERIFIED REAL-TIME UNIVERSE CAMPUS DATA:
[Source 1] (mentor) Senior Mentor: Riya Shah (Machine Learning)
ID: mentor_riya | Route: /mentors/mentor_riya
Skills: Machine Learning, PyTorch, Deep Learning. Advises on: Research Internships. Offer: Google DeepMind.

[Source 2] (event) Campus Event: ACM Deep Learning Workshop
ID: evt_dl_workshop | Route: /events
Category: Workshop • Venue: Turing Hall • Starts: 2026-11-04 14:00

User Question: Who can mentor me in Machine Learning and PyTorch?
```

---

## 4. Mutating Action Proposals & Two-Phase Confirmation
When a user asks the copilot to perform an action (e.g. *"Please connect me with Riya for ML guidance"* or *"Register me for the AI hackathon"*), the model emits an actionable structured proposal token:
```text
<<<PROPOSED_ACTION:{"action_type": "create_mentorship_request", "payload": {"mentor_id": "mentor_riya", "topic": "ML Internship Guidance"}, "summary": "Submit guidance request to Riya Shah"}>>>
```

### Safety & Confirmation Workflow:
1. **Server Parsing:** `GeminiService.extractProposedAction()` parses the structured token and strips it from the user-facing text.
2. **Pending Proposal Storage:** The server inserts a row into `assistant_action_confirmations` with `status = 'pending'`.
3. **UI Confirmation Card:** The React client renders an interactive confirmation banner displaying the action summary, target parameters, and an explicit **"Confirm & Execute"** button.
4. **Execution Route:** Only upon receiving a client `POST /api/assistant/actions/:actionId/confirm` signed by the owning user does the server perform the database insert/update.
5. **Audit Logging:** Every confirmed action is logged to `activity_log` with user ID, timestamp, and action summary.

---

## 5. Security & Shielding
1. **Zero Secret Leakage:** Prompts and system instructions explicitly forbid disclosing passwords, JWT secrets, or unredacted exam records.
2. **Prompt Injection Shielding:** User inputs are treated strictly as untrusted parameters within delimited sections (`User Question: ...`). System rules override adversarial override instructions (*"Ignore previous instructions"*).
3. **Per-User Rate Limiting:** Each user is restricted to a maximum of 100 queries per day tracked in `assistant_usage_daily`.
4. **Data Isolation:** Assistant conversations are bound to `user_id`. Attempting to read another user's conversation returns `403 FORBIDDEN`.

---

## 6. Offline / Demo Mode Fallback
When running without internet access or when `GEMINI_API_KEY` is not provided:
- **Badge:** Displays `Local Offline Grounding` in the message header.
- **Provider Note:** `"Demo assistant mode — cloud AI is not configured (GEMINI_API_KEY unset). Grounded in local campus database."`
- **Retrieval Integrity:** Extracts verified records from SQLite and presents a structured, deterministic response with real campus mentor names, events, and resources.
