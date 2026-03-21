# 05 — Stats & Streaks

## Streak System

### Data Model

One `streaks` row per user (see `01-database-schema.md`):
- `current_streak` — consecutive days with at least one completed session
- `longest_streak` — all-time best streak
- `last_session_date` — the most recent calendar day a session was completed

### Streak Update Algorithm

The `update_streak` database function (see `01-database-schema.md`) runs as an RPC call after every session ends. It handles three cases:

| Condition | Action |
|---|---|
| `last_session_date = today` | No change (already counted today) |
| `last_session_date = yesterday` | Increment `current_streak` by 1 |
| `last_session_date < yesterday` OR `NULL` | Reset `current_streak` to 1 |

After incrementing, if `current_streak > longest_streak`, update `longest_streak`.

### Streak Service

**File:** `lib/streak-service.ts`

```typescript
async function getStreak(userId: string): Promise<{
  currentStreak: number;
  longestStreak: number;
  lastSessionDate: string | null;
}>
// SELECT current_streak, longest_streak, last_session_date
// FROM streaks WHERE user_id = userId
```

The streak update itself is called from `session-service.endSession()` via RPC — the streak service is read-only from the client.

### Streak Display

**StreakBadge Component** (`components/streak-badge.tsx`):

```typescript
type StreakBadgeProps = {
  count: number;
  size?: 'small' | 'large';  // small for leaderboard rows, large for home screen
};
```

- Fire/flame icon + number
- If `count === 0`, show muted "Start a streak!" text
- Animated scale-up when streak increments (using `react-native-reanimated`)
- Uses `ThemedText` for theme-aware text coloring

---

## Stats Service

**File:** `lib/stats-service.ts`

### getUserStats

```typescript
async function getUserStats(userId: string): Promise<{
  totalSeverSeconds: number;
  bestSessionSeconds: number;
  totalSessions: number;
}>
```

Queries the `user_stats` view:
```sql
SELECT * FROM user_stats WHERE user_id = $1
```

Returns zeroed defaults if no sessions exist yet.

### getSessionHistory

```typescript
async function getSessionHistory(
  userId: string,
  page: number,
  limit: number
): Promise<{
  sessions: Session[];
  hasMore: boolean;
}>
```

```sql
SELECT * FROM sessions
WHERE user_id = $1 AND ended_at IS NOT NULL
ORDER BY started_at DESC
LIMIT $limit OFFSET $page * $limit
```

Paginated with `FlatList` `onEndReached` in the Stats screen.

### getCalendarData

```typescript
async function getCalendarData(
  userId: string,
  year: number,
  month: number
): Promise<string[]>  // Array of ISO date strings like "2026-03-15"
```

```sql
SELECT DISTINCT DATE(started_at)::text
FROM sessions
WHERE user_id = $1
  AND ended_at IS NOT NULL
  AND EXTRACT(YEAR FROM started_at) = $year
  AND EXTRACT(MONTH FROM started_at) = $month
```

### getDailyTotal

```typescript
async function getDailyTotal(
  userId: string,
  date: string  // "YYYY-MM-DD"
): Promise<{
  sessionCount: number;
  totalSeconds: number;
}>
```

Queries the `daily_session_totals` view for a specific date.

### getPersonalBest

```typescript
async function getPersonalBest(userId: string): Promise<Session | null>
```

```sql
SELECT * FROM sessions
WHERE user_id = $1 AND ended_at IS NOT NULL
ORDER BY duration_seconds DESC
LIMIT 1
```

---

## Calendar Heatmap Component

**File:** `components/calendar-heatmap.tsx`

### Props

```typescript
type CalendarHeatmapProps = {
  activeDates: string[];   // ISO date strings for the displayed month
  year: number;
  month: number;           // 1-12
  onMonthChange: (year: number, month: number) => void;
};
```

### Behavior

- Renders a 7-column grid (M T W T F S S) for the given month
- Days with sessions: filled circle or highlighted background using `Colors[colorScheme].tint`
- Days without sessions: muted/empty
- Left/right arrows (or swipe via `react-native-gesture-handler`) to navigate months
- Current day gets a subtle border
- Month/year header: "March 2026"
- Uses `ThemedText` and `ThemedView` for colors

### Layout

```
     ← March 2026 →
  M   T   W   T   F   S   S
                          1
  2   3   4   5   6   7   8
  ●   ●   .   ●   .   ●   .
  9  10  11  12  13  14  15
  ●   .   ●   ●   ●   .   .
 16  17  18  19  20  21  22
  .   ●   .   .   ●   .   .
 23  24  25  26  27  28  29
  ●   .   .   .   .   .   .
 30  31
  .   .
```

Where `●` = active day, `.` = inactive day.

---

## Stat Card Component

**File:** `components/stat-card.tsx`

### Props

```typescript
type StatCardProps = {
  label: string;       // e.g., "Total Time"
  value: string;       // e.g., "47h 12m"
  icon?: string;       // Optional icon name
  highlight?: boolean; // Special styling (e.g., personal best)
};
```

- Card with subtle background (slightly elevated from screen background)
- Label on top (small, muted color via `Colors[colorScheme].icon`)
- Value below (large, bold, primary text color)
- Used in Stats screen (3-across row) and Profile screen (2x2 grid)
- Uses `ThemedView` for background, `ThemedText` for text

---

## Session List Item Component

**File:** `components/session-list-item.tsx`

### Props

```typescript
type SessionListItemProps = {
  session: Session;
  isPersonalBest: boolean;
};
```

### Layout

```
Mar 15, 2026  ·  1h 23m 45s     🏆
```

- Date on left, formatted duration on right
- If `isPersonalBest`: trophy icon and/or highlighted row background
- If `ended_reason === 'movement'`: subtle indicator (e.g., "(movement)" suffix)
- Uses `ThemedText` for text, `ThemedView` for row container

---

## Duration Formatting Utility

Used across multiple screens:

```typescript
function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function formatDurationShort(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);

  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}
```

Place in `lib/format.ts` or `constants/` — used by Stats, Profile, Leaderboard, and Life Unlocked screens.
