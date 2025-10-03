// src/components/HouseholdCheckinsMini.tsx
import { useMemo } from "react";
import { useGetUserCheckinsQuery } from "@/store/checkinSlice";
import "../styles/HouseholdCheckins.css"
import { Avatar, Tooltip } from "@mantine/core";
import { useNavigate } from "react-router-dom";

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
    className
}: {
    member: Member;
    days: { iso: string; label: string; isToday: boolean }[];
    from: string;
    to: string;
    size: number;
    gap: number;
    nameColClass: string;
    className: string;
}) {
    const navigate = useNavigate();
    const { data, isLoading } = useGetUserCheckinsQuery(
        { userId: member.id, from, to },
        { skip: !member?.id }
    );
    const checked = useMemo(() => new Set(data?.dates ?? []), [data]);

    return (
        <div className={`flex items-center ${className}`}>
            <div className={`flex items-center`}>
                {/* <div className="h-6 w-8 rounded-full grid place-items-center text-xs">
                    {member.profileImg ? (
                        <img src={member.profileImg} alt="" className="h-6 w-6 object-cover" />
                    ) : (
                        member.name?.slice(0, 1).toUpperCase()
                    )}
                </div> */}
                <Tooltip key={member.id} label={member.name} withArrow>
                    <Avatar
                        src={member.profileImg || undefined}
                        radius="xl"
                        size="xs"
                        onClick={() => navigate(`/users/${member.id}`)}
                        style={{ cursor: "pointer" }}
                    >
                        {!member.profileImg}
                    </Avatar>
                </Tooltip>
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
                                        ? "icon-checked"
                                        : "icon-none",

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
        <div className="household-checkins-mini">
            <div className="checkins-header-row">
                <div className="checkins-header-spacer"></div>
                <div className="checkins-header">
                    {days.map((day) => (
                        <div
                            className="checkins-header-day"
                            key={day.iso}
                            title={day.label}
                        >
                            {day.label.slice(0, 1)}
                        </div>
                    ))}
                </div>
            </div>
            <div className="checkins-member-rows">
                {members?.map((member) => (
                    <MemberRow
                        key={member.id}
                        member={member}
                        days={days}
                        from={from}
                        to={to}
                        size={size}
                        gap={gap}
                        nameColClass={nameColWidthClass}
                        className="checkins-member-row"
                    />
                ))}
            </div>
            <div className="checkins-legend">
                <div className="checkins-header-spacer"></div>
                <span className="checkins-legend-item">
                    <i className="checkins-legend-icon icon-checked" />
                    Checked
                </span>
                <span className="checkins-legend-item">
                    <i className="checkins-legend-icon icon-none" />
                    None
                </span>
            </div>
        </div>
    );
}
