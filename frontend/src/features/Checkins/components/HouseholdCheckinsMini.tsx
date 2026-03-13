// src/components/HouseholdCheckinsMini.tsx
import { useMemo } from "react";
import { useGetUserCheckinsQuery } from "@/store/checkinSlice";
import "../styles/HouseholdCheckins.css"
import { Avatar, Skeleton, Tooltip } from "@mantine/core";
import { useNavigate } from "react-router-dom";
import { useIsSmallScreen } from "@/hooks";

type Member = { id: number; firstName: string; profileImg?: string };

function toISO(d: Date) {
    return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

function makeWindow(timezone: string) {
    const now = new Date();

    // Get current date parts in the user's timezone
    const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: timezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        weekday: "short",
    }).formatToParts(now);

    const todayIso = `${parts.find(p => p.type === "year")!.value}-${parts.find(p => p.type === "month")!.value}-${parts.find(p => p.type === "day")!.value}`;
    const dowMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    const dow = dowMap[parts.find(p => p.type === "weekday")!.value];

    // Build Sunday of this week in user's timezone
    const days = Array.from({ length: 7 }, (_, i) => {
        const offset = i - dow;
        const d = new Date(now);
        d.setDate(d.getDate() + offset);
        const iso = new Intl.DateTimeFormat("en-CA", {
            timeZone: timezone,
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        }).format(d);
        const label = new Intl.DateTimeFormat("en-US", {
            timeZone: timezone,
            weekday: "short",
        }).format(d);
        return { iso, label, isToday: iso === todayIso };
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
    const isSmall = useIsSmallScreen(375);
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
                <Tooltip key={member.id} label={member.firstName} withArrow>
                    <Avatar
                        src={member.profileImg || undefined}
                        radius="xl"
                        size={isSmall ? 28 : 34}
                        onClick={() => window.open(`/users/${member.id}`, "_blank")}
                        style={{ cursor: "pointer", border: "1px solid var(--mantine-color-white)", marginRight: "10px" }}
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
                                "rounded-sm",
                                isLoading
                                    ? "animate-pulse bg-gray-200"
                                    : filled
                                        ? "icon-checked"
                                        : "icon-none",

                            ].join(" ")}
                            style={{ width: size, height: size }}
                            title={`${member.firstName} • ${d.iso} • ${filled ? "Checked in" : "No check-in"}`}
                            role="img"
                            aria-label={`${member.firstName} ${d.iso} ${filled ? "checked in" : "no check-in"}`}
                        />
                    );
                })}
            </div>
        </div>
    );
}

export function HouseholdCheckinsMini({
    members,
    timezone = "UTC",
    size = 32,
    gap = 8,
    nameColWidthClass = "w-20",
}: {
    members: Member[] | undefined;
    timezone?: string;
    size?: number;
    gap?: number;
    nameColWidthClass?: string;
}) {
    const isSmall = useIsSmallScreen(375);
    const { days, from, to } = useMemo(() => makeWindow(timezone), [timezone]);

    return (
        <div className="household-checkins-mini-container">
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
                    {!members
                        ? Array.from({ length: 3 }).map((_, i) => <MemberRowSkeleton key={i} />)
                        : members.map((member) => (
                            <MemberRow
                                key={member.id}
                                member={member}
                                days={days}
                                from={from}
                                to={to}
                                size={isSmall ? 26 : 32}
                                gap={gap}
                                nameColClass={nameColWidthClass}
                                className="checkins-member-row"
                            />
                        ))
                    }
                </div>
            </div>
        </div>
    );
}

const MemberRowSkeleton = () => {
    const isSmall = useIsSmallScreen(375);
    const avatarSize = isSmall ? 28 : 34;
    const squareSize = isSmall ? 26 : 32;

    return (
        <div className="member-row-skeleton">
            <Skeleton circle width={avatarSize} height={avatarSize} mr={10} />
            <div className="member-row-skeleton-checkins">
                {Array.from({ length: 7 }).map((_, i) => (
                    <Skeleton radius="0.4rem" className="member-row-skeleton-square" key={i} width={squareSize} height={squareSize} />
                ))}
            </div>
        </div>
    );
};