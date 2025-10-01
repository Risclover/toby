// src/components/HouseholdCheckinsMini.tsx
import { useMemo } from "react";
import { useGetUserCheckinsQuery } from "@/store/checkinSlice";

type Member = { id: number; name: string; profileImg?: string };

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
        return {
            iso,
            label: d.toLocaleDateString(undefined, { weekday: "short" }), // Mon, Tue, ...
            isToday: iso === toISO(today),
        };
    });
    return { days, from: days[0].iso, to: days[6].iso };
}

function MemberRow({
    member,
    days,
    from,
    to,
    size,
    gap,
    nameColClass,
}: {
    member: Member;
    days: { iso: string; label: string; isToday: boolean }[];
    from: string;
    to: string;
    size: number;
    gap: number;
    nameColClass: string;
}) {
    const { data, isLoading } = useGetUserCheckinsQuery(
        { userId: member.id, from, to },
        { skip: !member?.id }
    );
    const checked = useMemo(() => new Set(data?.dates ?? []), [data]);

    return (
        <div className="flex items-center">
            <div className={`flex px-2 gap-2 items-center ${nameColClass}`}>
                {/* <div className="h-6 w-8 rounded-full grid place-items-center text-xs">
                    {member.profileImg ? (
                        <img src={member.profileImg} alt="" className="h-6 w-6 object-cover" />
                    ) : (
                        member.name?.slice(0, 1).toUpperCase()
                    )}
                </div> */}
                <span className="text-sm text-right text-align-right w-full">{member.name}</span>
            </div>

            <div className="flex items-center" style={{ gap }}>
                {days.map((d) => {
                    const filled = checked.has(d.iso);
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
    size = 16,               // a little bigger
    gap = 6,                 // tight spacing
    nameColWidthClass = "w-20", // keep header + rows aligned
}: {
    members: Member[];
    size?: number;
    gap?: number;
    nameColWidthClass?: string; // e.g., "w-48" / "w-56" depending on your layout
}) {
    const { days, from, to } = useMemo(makeWindow, []);

    return (
        <div className="rounded-xl border border-gray-200 p-3">
            {/* Header row with weekday labels */}
            <div className="flex items-center">
                <div className={`${nameColWidthClass} text-xs text-gray-500`} />
                <div className="flex items-center" style={{ gap }}>
                    {days.map((d) => (
                        <div
                            key={d.iso}
                            className="text-[10px] text-gray-500 w-6 text-center select-none"
                            style={{ width: size }}
                            title={d.label}
                        >
                            {d.label.slice(0, 1)}
                        </div>
                    ))}
                </div>
            </div>

            {/* Member rows */}
            <div className="">
                {members?.map((m) => (
                    <MemberRow
                        key={m.id}
                        member={m}
                        days={days}
                        from={from}
                        to={to}
                        size={size}
                        gap={gap}
                        nameColClass={nameColWidthClass}
                    />
                ))}
            </div>

            {/* Legend (tiny) */}
            <div className="mt-2 flex items-center gap-3 text-[11px] text-gray-500">
                <span className="inline-flex items-center gap-1">
                    <i className="inline-block h-3 w-3 rounded bg-emerald-500" /> Checked
                </span>
                <span className="inline-flex items-center gap-1">
                    <i className="inline-block h-3 w-3 rounded bg-gray-200" /> None
                </span>
            </div>
        </div>
    );
}
