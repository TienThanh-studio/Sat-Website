# Flappy SAT Bird Arcade Engine & Real Academic Hall of Fame

This upgrade replaces the racing mini-game in the Study Room with a pixel-perfect **Flappy SAT Bird** arcade engine featuring authentic Flappy Bird physics and interactive SAT Energy Gates, alongside a data-driven **Academic Hall of Fame** powered by real learner progress from `storageService`.

## User Review & Critical Decisions

> [!IMPORTANT]
> Because the clarifying questions were skipped, the plan adopts the recommended defaults below so gameplay and academic tracking remain seamless and responsive.

- **Confirmed Default 1 — SAT Energy Gate Physics**: Entering an SAT Portal every 5 pipes triggers a **3-second Slow-Motion Bullet-Time** window (`0.25x` scroll speed) with an interactive quiz HUD overlay. Answering correctly grants a **Vocab Shield** (absorbing 1 pipe collision) or activates a **2x Score Multiplier** if a shield is already active; missing or skipping resumes normal flight speed without penalty.
- **Confirmed Default 2 — Hall of Fame Placement**: The **Academic Hall of Fame** (Tab 1: *Hồ Sơ Năng Lực Cá Nhân* for Phan Tiến Thành & Tab 2: *Bảng Vinh Danh Sĩ Tử*) is positioned directly below the Flappy SAT Bird arena and above the live Co-working Signal & Chat panel.
- **Confirmed Default 3 — Forgiving Hitbox & Controls**: The bird's AABB collision box is inset by `3px` on all sides relative to its rendered sprite, with zero-latency flap impulse triggered via `Space`, `ArrowUp`, `W`, mouse click, or mobile touch.

---

## 1. Overview & Core Concept

- **What It Does**:
  1. **Flappy SAT Bird Engine**: A 60 FPS HTML5 Canvas arcade game faithfully reproducing classic Flappy Bird gravity, flap impulse, terminal velocity, hold-then-nosedive pitch rotation, scrolling neon ground, pipe gap obstacles, and periodic SAT Energy Gates.
  2. **Real Academic Hall of Fame**: Replaces synthetic racing leaderboards with genuine academic KPIs computed from `storageService` (Projected Adaptive SAT Score, 2-Strike Mistake Mastery Rate, C1/C2 Vocabulary Mastered, Study Streak & Focus Hours, Academic Tier S+/S/A/B classification, and a sortable Cohort Leaderboard).
- **Target Audience / Persona**: Digital SAT learners aiming for top tier scores (`1550+` / HUST IT1 & IT-E10) who want a crisp, rewarding brain-break mini-game and transparent academic mastery analytics inside the Co-working Study Room.
- **Key Value**: Transforms the Study Room from a simulated race into a high-skill, immediate-response arcade challenge tied directly to SAT vocabulary/math recall and authentic study telemetry.

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Title & Ready State**: The centered Canvas displays the Cyber/Cosmic skyline, scrolling neon base, hovering Cyber-Bird mascot, high-score badge, and clear control prompts (`Space` / Click / Tap).
  2. **Active Flight Loop**: Each tap/keypress applies an instant upward velocity impulse (`-7.0 px/frame`) and pitches the bird nose-up to `-24°` (`-0.42 rad`). Holding without flapping keeps the nose up for `9 frames` before smoothly pitching downward toward `+85°` (`1.48 rad`) as gravity (`0.40 px/frame²`) accelerates the bird up to terminal velocity (`10.5 px/frame`).
  3. **SAT Energy Gate (Every 5 Pipes)**: A glowing cyan/gold portal spawns between pipe pairs. Passing into the gate activates a 3-second countdown quiz card (Vocab or Math). Answering right awards **Vocab Shield** (visual energy aura around the bird that shatters instead of ending the game on the next pipe hit) or **2x Score**.
  4. **Game Over & Instant Restart**: Touching the ceiling, scrolling neon floor, or an unshielded pipe triggers a screen flash, Web Audio synth chime, medal badge, current vs. best score summary, and a single-click/Spacebar instant replay button.
  5. **Academic Hall of Fame Exploration**: Below the game arena, learners switch between **Tab 1: Hồ Sơ Năng Lực Cá Nhân (Personal Mastery Card)** and **Tab 2: Bảng Vinh Danh Sĩ Tử (Cohort Leaderboard)** with live sorting by *Chuỗi ngày học (Streak)*, *Số câu hoàn thành*, or *Điểm thi thử cao nhất*.

- **Visual Identity & Theme**:
  - *Aesthetic Direction*: Dark Cosmic Arcade & Academic Command Center (`60-30-10` color budget).
  - *Color Palette & Mood*:
    - `60%` Deep Space Arena & Surface (`#060913` background, `#0B1120` card surfaces).
    - `30%` Structural Glass Panels & Neon Pipes (`rgba(15, 23, 42, 0.85)` with `backdrop-blur-md`, `border-white/10`, emerald/cyan laser-rimmed pipes).
    - `10%` Focal Accents (`#22D3EE` Cyan Shield aura, `#FBBF24` Gold Tier S+ / SAT Portal, `#F43F5E` collision alert).
  - *Typography & Hierarchy*: `tabular-nums` monospace (`JetBrains Mono`) for live score counters, 3-second portal timers, and SAT scaled scores; crisp sans-serif with `.normalize('NFC')` across all Vietnamese labels.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Authentic Frame-Normalized Physics with 3px Forgiving AABB Hitbox**
  - *Chosen Approach*: Fixed-timestep delta normalization around 60 FPS with `gravity = 0.40`, `flapImpulse = -7.0`, `terminalVelocity = 10.5`, and a `3px` inward hitbox margin on all four edges of the bird.
  - *Why*: Classic Flappy Bird feels fair and addictive only when input latency is zero and near-misses on pipe corners do not feel cheap.
  - *Alternatives Considered*: Pixel-mask collision or full sprite bounding box, which feels overly punishing on diagonal dives.
- **Decision 2: Live Academic Telemetry Aggregation with Graceful Fallbacks**
  - *Chosen Approach*: Compute Projected SAT Score from `storageService.getExamHistory()`, 2-Strike Mastery Rate from `storageService.getMistakes()`, and Vocab Mastered from `storageService.getVocabProgress()`, while providing realistic baseline fallback metrics for `Phan Tiến Thành` when local storage is freshly initialized.
  - *Why*: Ensures the Personal Mastery Card immediately reflects every new exam, mistake drill, and vocabulary session while remaining visually complete on first visit.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

### Architecture & Component Diagram

```
┌───────────────────────────────────────────────────────────────────────────┐
│                         StudyRoomPage Controller                          │
├─────────────────────────────────────┬─────────────────────────────────────┤
│   Flappy SAT Bird Canvas Engine     │     Academic Hall of Fame Module    │
│  ┌───────────────────────────────┐  │  ┌───────────────────────────────┐  │
│  │ Physics & Pitch State Machine │  │  │ Live Storage Telemetry Hook   │  │
│  │ • Gravity: 0.40 px/frame²     │  │  │ • getExamHistory() -> Score   │  │
│  │ • Flap Impulse: -7.0 px/frame │  │  │ • getMistakes() -> 2-Strike % │  │
│  │ • Term Velocity: 10.5 px/f    │  │  │ • getVocabProgress() -> C1/C2 │  │
│  │ • Pitch: -24° hold 9f -> +85° │  │  │ • getCompletedQuestionIds()   │  │
│  └──────────────┬────────────────┘  │  └──────────────┬────────────────┘  │
│                 ▼                   │                 ▼                   │
│  ┌───────────────────────────────┐  │  ┌───────────────────────────────┐  │
│  │ Pipe Spawner & AABB Collider  │  │  │ Tab 1: Personal Mastery Card  │  │
│  │ • Gap: 125–145px              │  │  │ • Student: Phan Tiến Thành    │  │
│  │ • Spacing: 220–260px          │  │  │ • Tier S+/S/A/B Hierarchy     │  │
│  │ • Speed: 2.6 px/frame         │  │  │ • 1550+ Target Progress Bar   │  │
│  │ • Bird Hitbox: -3px inset     │  │  │ • Strengths & Trap Warnings   │  │
│  └──────────────┬────────────────┘  │  └──────────────┬────────────────┘  │
│                 ▼                   │                 ▼                   │
│  ┌───────────────────────────────┐  │  ┌───────────────────────────────┐  │
│  │ SAT Energy Gate (Every 5/10)  │  │  │ Tab 2: Cohort Leaderboard     │  │
│  │ • 3.0s Quick Vocab/Math Quiz  │  │  │ • Sort by: Streak / Solved /  │  │
│  │ • Grants Vocab Shield or 2x   │  │  │   Highest Projected SAT Score │  │
│  └───────────────────────────────┘  │  └───────────────────────────────┘  │
└─────────────────────────────────────┴─────────────────────────────────────┘
```

### Interactive Component & State Mapping

1. **Flappy Physics & Input Loop**:
   - States: `'IDLE' | 'PLAYING' | 'PORTAL_QUIZ' | 'GAME_OVER'`.
   - Input handlers (`keydown` for `Space`/`ArrowUp`/`W`, canvas `pointerdown`) invoke `flapBird()` immediately, setting `vy = -7.0`, `rotation = -0.42`, and `flapHoldFrames = 9`.
   - When `bird.y + bird.radius - 3 >= groundY` or `bird.y - bird.radius + 3 <= 0`, transitions immediately to `'GAME_OVER'`.
   - Pipe collision checks the inset AABB box. If `hasVocabShield === true`, consumes the shield, shatters the pipe with neon particles, and grants invulnerability for that pipe pair; otherwise transitions to `'GAME_OVER'`.
2. **SAT Energy Gate Power-up**:
   - Spawns at pipe #5, #10, #15, etc. Reaching the gate opens the 3-second quick-answer bar with 4 options (`1/2/3/4` keys or click/tap).
   - Correct answer within `3.0s` activates `hasVocabShield = true` (or `scoreMultiplier = 2` for 5 pipes if already shielded); wrong/timeout resumes normal flight with zero penalty.
3. **Academic Hall of Fame Tabs & Sorting**:
   - Reads `storageService.getExamHistory()`, `storageService.getMistakes()`, `storageService.getVocabProgress()`, and `storageService.getCompletedQuestionIds()` on mount and whenever the user switches tabs.
   - Calculates Tier badge (`Tier S+` for $\ge 1550$, `Tier S` for $1500\text{–}1540$, `Tier A` for $1400\text{–}1490$, `Tier B` for $< 1400$) and allows instant re-sorting of the Cohort Leaderboard by `streak`, `questionsSolved`, or `highestScore`.
