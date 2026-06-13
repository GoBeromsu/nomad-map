# Nomad Rating Rubric

**Purpose:** Standardize the 1–5 integer scores stored in `data/places.json → ratings` so any reviewer scores a place consistently, regardless of category (cafe, accommodation, restaurant, recovery, other).

**Ground rule:** If you cannot observe or measure a criterion during your visit, leave the field `null`. Never guess or interpolate from memory.

---

## Axis 1 — `wifi` (Wi-Fi Speed & Stability)

**What it measures:** Whether the location's Wi-Fi can sustain typical nomad workloads — video calls, cloud sync, remote dev, uploads.

| Score | Label | Observable Criteria |
|-------|-------|---------------------|
| 1 | No usable Wi-Fi | No network available, captive portal never resolves, or effective speed < 1 Mbps down. Mobile data is the only practical option. |
| 2 | Marginal | Connects and loads light pages, but video calls drop or stutter. 1–10 Mbps down, < 5 Mbps up, or high packet loss (> 5 %). |
| 3 | Functional | Adequate for browsing, Slack/email, and 720p video calls. Typically 10–30 Mbps down / 5–10 Mbps up. Occasional drops under load or at peak hours. |
| 4 | Good | Stable for simultaneous Zoom + cloud backup. 30–50 Mbps down / 10–20 Mbps up. Rare drops; password-free or easy-to-obtain password; no time limit. |
| 5 | Excellent | Fast, rock-solid, no limits. > 50 Mbps down / > 20 Mbps up, < 20 ms latency to a major city, zero noticeable drops over a 2 h session. No time cap, no bandwidth throttle. |

### How to assess in 5 minutes
1. Connect to the Wi-Fi and note whether authentication is required and how easy it is.
2. Run a speed test (fast.com or Speedtest app) — record down / up / latency.
3. Start a 5-minute video call or screen share and observe stability.
4. Check for session time limits (pop-up logout, captive portal re-auth).
5. Ask staff or check signage for any bandwidth caps or device limits.

---

## Axis 2 — `power` (Outlet Accessibility)

**What it measures:** How easily you can keep your laptop and peripherals charged throughout a work session.

| Score | Label | Observable Criteria |
|-------|-------|---------------------|
| 1 | No outlets | Zero accessible outlets anywhere in the working area. Battery-only session guaranteed. |
| 2 | Very limited | 1–2 outlets total in the venue, usually occupied or inconveniently placed (floor behind a pillar, staff desk). You must compete for access or rearrange furniture. |
| 3 | Adequate | Roughly 1 outlet per 3–4 seats, or power strips at some tables. You can usually find a seat with access, but may need to wait or move. |
| 4 | Good | Most tables (> 50 %) have at least one outlet within arm's reach (table-integrated, on the wall beside each seat, or via power strip). No negotiation needed. |
| 5 | Excellent | Every seat has dedicated outlet access (table-top sockets, individual power strips, or USB-A/C ports). Multi-device charging is effortless. |

### How to assess in 5 minutes
1. Walk the room and count visible outlets vs. total seats.
2. Check whether outlets are in usable positions (table height vs. floor level).
3. Check socket type compatibility (Korean 220V type C/F — bring adapters if needed).
4. Note whether extension cords are available on request.
5. Test a socket with your charger before settling in.

---

## Axis 3 — `seating` (Comfort & Ergonomics for Long Work Sessions)

**What it measures:** Whether the furniture supports multi-hour focused work without physical discomfort.

| Score | Label | Observable Criteria |
|-------|-------|---------------------|
| 1 | Unusable for work | No flat working surface, or only floor seating / low cushions. Laptop use is physically impractical beyond 15–20 minutes. |
| 2 | Tolerable short-term | Table and chair present, but significant ergonomic shortfalls: table too low/high, no back support, bar-stool-only, or very cramped. Comfortable for < 1 hour. |
| 3 | Adequate | Standard café-style table and chair. Flat work surface, some back support. Manageable for 2–3 hours but likely to cause fatigue (hard seat, fixed height, limited space). |
| 4 | Good | Padded or contoured chair with proper back support, spacious table (room for laptop + notebook), good table height. Comfortable for a full 4-hour work block. |
| 5 | Excellent | Ergonomic or height-adjustable chairs, wide desks, elbow room between seats. Some locations may offer standing desks or sofa/lounge areas as alternatives. Sustainable for an 8-hour day. |

### How to assess in 5 minutes
1. Sit down and open your laptop — is the table height comfortable?
2. Check whether the chair has a back and whether it has any lumbar contact.
3. Measure visual table space: can a laptop + coffee + notebook fit without stacking?
4. Estimate seat padding — hard wood vs. upholstered vs. ergonomic mesh.
5. Note whether you feel cramped by adjacent seats or a wall.

---

## Axis 4 — `quiet` (Noise Level for Calls & Focus Work)

**What it measures:** The ambient noise level and its predictability — relevant for deep work and audio calls.

| Score | Label | Observable Criteria |
|-------|-------|---------------------|
| 1 | Loud / unusable for calls | Continuous high-volume music, kitchen noise, construction, or crowd chatter that makes a phone call impossible without a headset and ANC at max volume. |
| 2 | Noisy | Background music is prominent, frequent loud conversation, or irregular loud events (coffee grinders every 5 min, TV on). Concentration is possible with headphones; calls are difficult. |
| 3 | Moderate | Typical café murmur — conversations around you, background music at low volume. Headphones recommended but not mandatory. Unmuted calls are strained. Muted calls with mic isolation work fine. |
| 4 | Quiet | Subdued atmosphere. Music is absent or very faint. Conversations are hushed. Most people are working. Unmuted calls are feasible with minor ambient noise. |
| 5 | Very quiet | Library-level or near-silent. No music, voices are whispers or absent. You can take an unmuted call without apology. |

### How to assess in 5 minutes
1. Sit quietly for 60 seconds and identify all noise sources.
2. Measure approximate dB with a phone app (e.g., NIOSH SLM) — casual target: < 50 dB for score 4+.
3. Try a 30-second test call to a friend and ask whether they can hear background noise clearly.
4. Note whether noise is constant (music) or unpredictable (espresso machine bursts, door bells).
5. Check if there is a designated quiet zone or separate room.

---

## Axis 5 — `longStay` (Tolerance for Staying Several Hours)

**What it measures:** How welcome a nomad is to occupy a seat for 3–6+ hours, whether explicitly or through the venue's culture and economics.

| Score | Label | Observable Criteria |
|-------|-------|---------------------|
| 1 | Not tolerated | Signs or staff explicitly state a time limit (e.g., "max 1 hour"), or you are asked to leave / make another purchase within the first hour. Minimum spend enforced. |
| 2 | Discouraged | No explicit rule, but the atmosphere (rapid table turnover, staff hovering, small venue) makes lingering feel uncomfortable. A second purchase within 2 hours is the expected norm. |
| 3 | Neutral | No explicit policy; a second drink every 2–3 hours feels appropriate and is accepted without issue. The venue is large enough that you are not displacing customers. |
| 4 | Welcomed | Staff are clearly comfortable with nomads (laptop-friendly cues: power strips on tables, signage like "study OK"). You can stay 4–6 hours with one purchase and feel zero social pressure. |
| 5 | Optimized for long stay | The venue is explicitly nomad/study-friendly: free time-unlimited Wi-Fi, no minimum spend, ample seating, lockers, or co-working messaging. Staff proactively accommodate long-session workers. |

### How to assess in 5 minutes
1. Look for signage — "study welcome", "no laptop", "1-hour limit", or co-working branding.
2. Observe other guests: are people with laptops staying long? Proportion of laptop users is a proxy.
3. Ask staff directly: "Is it okay to work here for a few hours?"
4. Check whether the menu has time-based pricing or minimum-order requirements.
5. Note venue size and fill rate — a small café at 90% capacity has implicit pressure even without a rule.

---

## General Notes

- **Category matters:** Apply the rubric relative to the venue type. An accommodation rated 4 on `seating` should be judged on its work area (desk chair), not the bed. A restaurant scored on `quiet` is assessed during a non-meal work window, not peak dining.
- **Time of visit matters:** Record the time and day in `visit.note`. A 4 on `quiet` at 9 AM may become a 2 at noon.
- **Unknown = null:** If you could not test Wi-Fi (e.g., accommodation visited at midnight), set `ratings.wifi = null`. Do not default to 3.
- **Integer only:** The UI renders scores with one decimal (`value.toFixed(1)`), but the source data stores integers 1–5. Do not enter 3.5.

---

## Structured Rubric (YAML)

```yaml
rubric:
  wifi:
    1: "No usable Wi-Fi or < 1 Mbps. Mobile data only."
    2: "Connects but drops calls; 1–10 Mbps down, < 5 Mbps up, high packet loss."
    3: "Functional for browsing and 720p calls; 10–30 Mbps down / 5–10 up; occasional drops."
    4: "Stable for Zoom + cloud backup; 30–50 Mbps down / 10–20 up; no time limit."
    5: "> 50 Mbps down / > 20 up, < 20 ms latency, zero drops over 2 h, no caps."

  power:
    1: "No accessible outlets in the working area."
    2: "1–2 outlets total; usually occupied or difficult to reach."
    3: "~1 outlet per 3–4 seats; can find access with effort or wait."
    4: "> 50% of tables have an outlet within arm's reach; no competition needed."
    5: "Every seat has dedicated outlet or USB port; multi-device charging effortless."

  seating:
    1: "No flat work surface or only floor seating; impractical beyond 15–20 min."
    2: "Table + chair present but significant ergonomic issues; comfortable < 1 h."
    3: "Standard café table + chair with back support; manageable for 2–3 h."
    4: "Padded chair with back support, spacious table; comfortable for a 4 h block."
    5: "Ergonomic/adjustable chairs, wide desks, ample elbow room; sustainable all day."

  quiet:
    1: "Loud continuous noise; calls impossible even with headset + ANC."
    2: "Prominent music or crowd noise; calls difficult, headphones required for focus."
    3: "Typical café murmur; headphones recommended; muted calls fine."
    4: "Subdued; faint or no music; unmuted calls feasible."
    5: "Library-level silence; unmuted calls with no apology needed."

  longStay:
    1: "Explicit time limit or asked to leave / reorder within 1 h."
    2: "No rule but lingering feels unwelcome; second purchase expected every 2 h."
    3: "Neutral; staying 3–4 h with one reorder is accepted without issue."
    4: "Laptop-friendly cues; 4–6 h with one purchase, zero social pressure."
    5: "Explicitly nomad/study-optimized; unlimited time, no minimum spend, full amenities."
```
