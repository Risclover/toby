import { type Habit } from "@/store";

interface Props {
    habit: Habit;
    completions: string[]; // ["2026-03-01", "2026-03-04", ...]
    year: number;
    month: number; // 1-indexed
}

export function HabitMonthCard({ habit, completions, year, month }: Props) {
    const today = new Date();
    const daysInMonth = new Date(year, month, 0).getDate();
    const firstDayOfWeek = new Date(year, month - 1, 1).getDay(); // 0 = Sun
    const completionSet = new Set(completions);
    const iCurrentMonth =
        today.getFullYear() === year && today.getMonth() + 1 === month;

    const pad = (n: number) => String(n).padStart(2, "0");
    const dateKey = (d: number) => `${year}-${pad(month)}-${pad(d)}`;

    const isToday = (d: number) =>
        iCurrentMonth && today.getDate() === d;
    const isFuture = (d: number) =>
        iCurrentMonth && d > today.getDate();

    // Count completions this month (excluding future)
    const maxDay = iCurrentMonth ? today.getDate() : daysInMonth;
    const completedCount = completions.filter((dt) => {
        const d = parseInt(dt.split("-")[2]);
        return d <= maxDay;
    }).length;

    const totalCells = Math.ceil((firstDayOfWeek + daysInMonth) / 7) * 7;

    const todayDone = iCurrentMonth && completionSet.has(dateKey(today.getDate()));

    return (
        <div
            className="monthly-habit"
        >
            {/* Header */}
            <div className="monthly-habit-header" style={{ display: "flex", alignItems: "center", gap: "4px", marginBottom: "10px" }}>
                <div className="monthly-habit-title">
                    {habit.name}
                </div>
            </div>

            {/* Dot grid */}
            <div className="monthly-habit-grid">
                {Array.from({ length: totalCells }, (_, i) => {
                    const day = i - firstDayOfWeek + 1;
                    const outOfMonth = day < 1 || day > daysInMonth;

                    if (outOfMonth) {
                        return <div key={i} style={{ aspectRatio: "1" }} />;
                    }

                    const future = isFuture(day);
                    const done = completionSet.has(dateKey(day));
                    const todayCell = isToday(day);

                    let bg = "transparent";
                    let opacity = 1;
                    let outline = "none";

                    if (future) {
                        bg = "var(--color-border-tertiary)";
                        opacity = 0.35;
                    } else if (done) {
                        bg = habit.color;
                        if (todayCell) outline = `2px solid ${habit.color}`;
                    } else {
                        bg = habit.color + "28"; // ~15% opacity tint
                    }

                    return (
                        <div
                            key={i}
                            style={{
                                aspectRatio: "1",
                                borderRadius: ".25rem",
                                background: bg,
                                opacity,
                                outline,
                                outlineOffset: todayCell ? 2 : 0,
                            }}
                        />
                    );
                })}
            </div>
        </div>
    );
}