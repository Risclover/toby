// src/components/HouseholdCheckinsMini.tsx
import { useMemo } from "react";
import { useGetUserCheckinsQuery } from "@/store/checkinSlice";

type Member = { id: number; name: string; avatarUrl?: string };

function toISO(d: Date) {
    return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

function makeWindow() {
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - 3); // 3 days ago
    const days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        const iso = toISO(d);
        return { iso, isToday: iso === toISO(today) };
    });
    return { days, from: days[0].iso, to: days[6].iso };
}

function MemberMiniRow({
    member,
    size,
    gap,
    showNames,
    showAvatar,
    from,
    to,
}: {
    member: Member;
    size: number;
    gap: number;
    showNames: boolean;
    showAvatar: boolean;
    from: string;
    to: string;
}) {
    const { data, isLoading } = useGetUserCheckinsQuery(
        { userId: member.id, from, to },
        { skip: !member?.id }
    );

    // quick lookup set for filled squares
    const filledDates = useMemo(() => new Set(data?.dates ?? []), [data]);

    const { days } = useMemo(makeWindow, []); // same 7-day window for painting

    return (
        <div className="flex items-center gap-2">
            {(showAvatar || showNames) && (
                <div className="flex items-center gap-2 min-w-0">
                    {showAvatar &&
                        (member.avatarUrl ? (
                            <img
                                src={member.avatarUrl}
                                alt=""
                                className="h-5 w-5 rounded-full object-cover shrink-0"
                            />
                        ) : (
                            <div className="h-5 w-5 rounded-full bg-gray-300 grid place-items-center text-[10px] shrink-0">
                                {member.name.slice(0, 1).toUpperCase()}
                            </div>
                        ))}
                    {showNames && (
                        <span className="truncate text-xs text-gray-700">{member.name}</span>
                    )}
                </div>
            )}

            <div className="flex items-center" style={{ gap }}>
                {days.map((d) => {
                    const filled = filledDates.has(d.iso);
                    return (
                        <div
                            key={d.iso}
                            className={[
                                "rounded",
                                isLoading
                                    ? "animate-pulse bg-gray-200"
                                    : filled
                                        ? "bg-emerald-500"
                                        : "bg-gray-200",
                                d.isToday ? "outline outline-2 outline-indigo-500 outline-offset-1" : "",
                            ].join(" ")}
                            style={{ width: size, height: size }}
                            title={`${member.name} • ${d.iso} • ${filled ? "Checked in" : "No check-in"}`}
                            role="img"
                            aria-label={`${member.name} ${d.iso} ${filled ? "checked in" : "no check-in"}`}
                        />
                    );
                })}
            </div>
        </div>
    );
}

export default function HouseholdCheckinsMini({
    members,
    size = 10,         // px
    gap = 4,           // px
    showNames = false,
    showAvatar = false,
}: {
    members: Member[];
    size?: number;
    gap?: number;
    showNames?: boolean;
    showAvatar?: boolean;
}) {
    const { from, to } = useMemo(makeWindow, []);

    return (
        <div className="rounded-xl border border-gray-200 p-3">
            <div className="space-y-2">
                {members?.map((m) => (
                    <MemberMiniRow
                        key={m.id}
                        member={m}
                        size={size}
                        gap={gap}
                        showNames={showNames}
                        showAvatar={showAvatar}
                        from={from}
                        to={to}
                    />
                ))}
            </div>
        </div>
    );
}
