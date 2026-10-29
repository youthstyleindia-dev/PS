# UniVerse: Algorithms & Mathematical Derivations

This document details the mathematical models, algorithmic formulations, and computational complexities of the five intelligent systems operating within UniVerse.

---

## 1. Algorithm 1: Dijkstra Shortest Path Routing with Time-Varying Traffic Weighting

### Purpose
Computes the lowest-cost path between any two campus locations on a weighted directed graph $G = (V, E)$, dynamically adjusted for diurnal peak traffic hours.

### Formulation
Let:
- $V$: Set of 10 campus nodes (gates, dorms, academic quads, labs, sports complex).
- $E$: Set of 30 directed edges connecting adjacent campus waypoints.
- $d(u, v)$: Baseline physical edge distance in kilometers ($d \ge 0$).
- $t_{\text{base}}(u, v)$: Base traverse time in minutes.
- $c(t)$: Time-of-day campus congestion multiplier:
  $$c(t) = \begin{cases} 
  1.65 & \text{if } 08:15 \le t \le 09:30 \quad (\text{Morning Rush}) \\
  1.35 & \text{if } 12:00 \le t \le 13:30 \quad (\text{Lunch Migration}) \\
  1.70 & \text{if } 17:00 \le t \le 18:30 \quad (\text{Evening Dispersal}) \\
  1.00 & \text{otherwise (Free-Flow)}
  \end{cases}$$

### Edge Cost Function
$$T(u, v, t) = t_{\text{base}}(u, v) \times c(t)$$

### Time Complexity
- **Time Complexity**: $\mathcal{O}((V + E) \log V)$ using a binary min-heap priority queue.
- **Space Complexity**: $\mathcal{O}(V + E)$ for adjacency storage and predecessor backtracking maps.

---

## 2. Algorithm 2: Dial-a-Ride Insertion & Detour Ratio Constraint Engine

### Purpose
Evaluates whether a passenger request $(p_{\text{origin}}, p_{\text{dest}})$ can be pooled into a driver's scheduled trip $(d_{\text{origin}}, d_{\text{dest}})$ without exceeding vehicle capacity or the driver's maximum detour tolerance.

### Insertion Ordering & Route Distance
1. Driver Solo Baseline Route:
   $$\text{Dist}_{\text{driver}} = \text{Dijkstra}(d_{\text{origin}}, d_{\text{dest}})$$
2. Pooled Shared Route:
   $$\text{Dist}_{\text{pooled}} = \text{Dijkstra}(d_{\text{origin}}, p_{\text{origin}}) + \text{Dijkstra}(p_{\text{origin}}, p_{\text{dest}}) + \text{Dijkstra}(p_{\text{dest}}, d_{\text{dest}})$$
3. Detour Calculation:
   $$\text{Detour} = \text{Dist}_{\text{pooled}} - \text{Dist}_{\text{driver}}$$
   $$\text{Detour Ratio} = \frac{\text{Detour}}{\text{Dist}_{\text{driver}}}$$

### Feasibility Conditions
A candidate match is valid if and only if:
1. **Seat Capacity**: $\text{seats}_{\text{available}} \ge \text{seats}_{\text{needed}}$
2. **Detour Bound**: $\text{Detour Ratio} \le \text{Max Detour Ratio}$ (Default: $0.35$ or $35\%$)
3. **Temporal Window**: $|\text{desired\_time} - \text{departure\_time}| \le 20 \text{ minutes}$

### Environmental & Cost Accounting
- **Shared Travel**: $\text{Dist}_{\text{shared}} = \text{Dijkstra}(p_{\text{origin}}, p_{\text{dest}})$
- **Avoided Carbon**:
  $$\Delta \text{CO}_2 (\text{kg}) = \text{Dist}_{\text{shared}} \times \text{EF}_{\text{vehicle}}$$
  Where $\text{EF}_{\text{vehicle}} = 0.142 \text{ kg CO}_2\text{e/km}$ (Central Electricity Authority / MoRTH baseline for Indian passenger vehicles).
- **Proportional Fare Discount**:
  $$\text{Fare}_{\text{solo}} = 15.00 + 12.00 \times \text{Dist}_{\text{shared}}$$
  $$\text{Fare}_{\text{pooled}} = \text{Fare}_{\text{solo}} \times 0.60 \quad (40\% \text{ passenger discount})$$
  $$\text{Driver Subsidy} = \text{Fare}_{\text{pooled}} \times 0.85 \quad (85\% \text{ to driver})$$

---

## 3. Algorithm 3: Non-Linear Server Power Modeling & Diurnal Carbon Accounting

### Purpose
Calculates dynamic server power consumption and facility carbon emissions without requiring hardware energy probes.

### Non-Linear Server Power Model
Server power is a convex function of CPU and GPU utilization:
$$P_{\text{server}}(U) = P_{\text{idle}} + (P_{\text{max}} - P_{\text{idle}}) \times \left( \frac{U}{100} \right)^\gamma$$
Where:
- $P_{\text{idle}} = 95.0\text{ W}$, $P_{\text{max}} = 340.0\text{ W}$, $\gamma = 1.25$ (Intel Xeon CPU profile).
- $U \in [0, 100]$ is the simulated CPU utilization percentage.

### Facility Power & PUE
Data center cooling and auxiliary power overhead is modeled via Power Usage Effectiveness ($\text{PUE}$):
$$P_{\text{facility}} = P_{\text{server}} \times \text{PUE} \times \text{replicas}$$
- **Baseline Scenario**: $\text{PUE} = 1.75$ (Legacy chiller cooling).
- **Eco-Optimized Scenario**: $\text{PUE} = 1.20$ (Free-air cooling + dynamic server idling).

### Diurnal Grid Carbon Intensity
$$I_{\text{grid}}(h) = I_{\text{base}} - \Delta I_{\text{solar}} \times \sin\left(\frac{\pi (h - 6)}{12}\right) \quad \text{for } 6 \le h \le 18$$
- Noon solar peak: $\sim 580\text{ g CO}_2\text{e/kWh}$.
- Evening coal peak: $\sim 820\text{ g CO}_2\text{e/kWh}$.

### Net Carbon Rate
$$\text{Carbon Emissions (g/hr)} = \frac{P_{\text{facility}}(\text{W}) \times 1\text{ hr}}{1000} \times I_{\text{grid}}(h)$$

---

## 4. Algorithm 4: Differential Privacy via Laplace Noise for Cohort Analytics

### Purpose
Permits university departments to analyze student study and focus trends without deanonymizing individual students.

### Formulation
Let individual daily focus minutes in department $D$ be $X = \{x_1, x_2, \dots, x_n\}$ where $x_i \in [0, 480\text{ mins}]$.
1. **$k$-Anonymity Suppression**:
   If $n < k$ (where $k = 3$), the query is suppressed to prevent deanonymizing small classes.
2. **Global Sensitivity**:
   $$\Delta f = \frac{\max(x) - \min(x)}{n} = \frac{480}{n}$$
3. **Laplace Noise Addition**:
   For privacy budget $\epsilon = 0.8$, draw noise from $\text{Lap}(b)$ where:
   $$b = \frac{\Delta f}{\epsilon} = \frac{480}{n \times 0.8}$$
   $$\tilde{\mu} = \max\left(0, \frac{1}{n}\sum_{i=1}^n x_i + \text{Lap}(b)\right)$$

### Deep Work Index (DWI) Formulation
Measures focus quality on user-defined productive domains:
$$\text{DWI} = \min\left(100, \max\left(0, \frac{t_{\text{prod}}}{t_{\text{active}}} \times 100 - 4.5 \times \text{switches}\right)\right)$$

---

## 5. Algorithm 5: Responsible Computer Vision Observation & Human Review Pipeline

### Purpose
Processes observable physical events from authorized webcam or deterministic sample feeds while strictly separating technical detection from disciplinary human review.

### States & Invariants
```text
[OBSERVABLE EVENT DETECTED]
           ↓
   (Event Ingestion)
           ↓
   [PENDING_REVIEW] ─── (Human Proctor Decision) ───┐
                                                     ├─→ [DISMISS_FALSE_POSITIVE]
                                                     ├─→ [DISMISS_BENIGN_BEHAVIOR]
                                                     └─→ [ESCALATE_TO_INVIGILATOR]
```

### Ethical Invariants
1. **No Automated Penalties**: Ingestion produces `review_status = 'PENDING_REVIEW'`. It never imposes sanctions.
2. **Mandatory Proctor Justification**: Proctor cannot resolve an observation without entering non-empty audit notes.
3. **Immutable Audit Log**: Every review action writes to `exam_audit_log` with proctor ID, timestamp, previous status, and justification.
