Use the multi-agent teamwork capability available in this environment. Delegate independent work to specialist agents, coordinate their interfaces, review their code, integrate their branches, and independently verify the final result. Deliver UniVerse: An Intelligent, Sustainable, and Privacy-Aware Campus Ecosystem as a cohesive, fully runnable, integrated, polished, testable hackathon MVP across five integrated modules based on the authoritative specification in `Problem statement.docx`.

Working directory: /Users/divya/Documents/Problem statement 
Integrity mode: development

Reference material: `Problem statement.docx` (located in workspace or at `/Users/divya/Downloads/Problem statement.docx`)

## Requirements

### R1. Cohesive Five-Module Product Integration
Deliver a unified, fully runnable web application integrating all five campus modules into one cohesive application:
1. Student Intelligence and Academic Hub
2. Smart Campus Ride-Pooling
3. Sustainable Computing Observatory
4. Privacy-Aware Digital Wellbeing
5. Responsible Examination Monitoring
Every module must provide at least one genuinely functional end-to-end workflow on the initialized stack (React, Vite, Tailwind CSS, Express, better-sqlite3), avoiding superficial static mockups or disconnected demos.

### R2. Algorithmic Depth and Transparent Technical Implementation
Demonstrate graph-based ride matching for Smart Campus Ride-Pooling and computer-vision-assisted observations for Responsible Examination Monitoring (with the team deciding the CV/AI execution approach). Maintain clear and transparent distinctions in the architecture and user interface between actual model inference, simulated events, and estimated metrics.

### R3. Challenge Alignment and Responsible Technology
Adhere to the challenge requirements, responsible AI constraints, and evaluation criteria specified in `Problem statement.docx` (functional completeness: 25 marks, technical depth: 20 marks, integration/architecture: 15 marks, innovation: 10 marks, testing/validation: 10 marks, UX/usability: 10 marks, privacy/ethics/responsible AI: 5 marks, presentation/understanding: 5 marks).

### R4. Automated Testing and Verification Suite
Implement automated test suites and validation scripts from scratch that objectively verify the API endpoints, algorithmic correctness (graph ride matching and data calculations), and core end-to-end user workflows without relying on self-assessment.

## Acceptance Criteria

### Integrated Workflows & Algorithmic Correctness
- [ ] The web client and backend server start cleanly and run simultaneously without unhandled exceptions or crashes.
- [ ] All five modules are accessible from a shared navigation structure within a unified application.
- [ ] Each module completes at least one functional end-to-end workflow with persistent data stored in SQLite.
- [ ] Smart Campus Ride-Pooling executes graph-based ride matching and returns valid route/matching results.
- [ ] Responsible Examination Monitoring demonstrates CV-assisted observation with explicit labeling distinguishing actual inference, simulated events, and estimations.

### Verification and Test Execution
- [ ] An automated test suite runs via a single command (e.g. `npm test`) and passes completely without failures.
- [ ] Automated tests verify the backend API endpoints and core business logic for all five modules.
- [ ] Algorithmic test cases validate the graph matching logic and metrics calculations against defined test fixtures.
