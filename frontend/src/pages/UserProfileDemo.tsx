import {
    Avatar,
    Badge,
    Box,
    Divider,
    Group,
    Progress,
    SimpleGrid,
    Stack,
    Tabs,
    Text,
    Tooltip,
    UnstyledButton,
} from "@mantine/core";
import {
    IconCalendarStats,
    IconCheck,
    IconChecks,
    IconChevronDown,
    IconChevronRight,
    IconFlame,
    IconLock,
    IconNote,
    IconUser,
} from "@tabler/icons-react";
// Note: IconUser retained for the Tabs.Tab icon below
import { useState } from "react";

// ---------------------------------------------------------------------------
// Design tokens — matches TOBY's existing palette
// ---------------------------------------------------------------------------
const T = {
    navy: "#0d1b3e",
    teal: "#00bcd4",
    tealLight: "#e0f7fa",
    bg: "#eef0f4",
    cardBg: "#ffffff",
    textPrimary: "#1a1a2e",
    textSecondary: "#6b7280",
    textMuted: "#9ca3af",
    border: "#e5e7eb",
    green: "#22c55e",
    shadow: "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)",
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Habit {
    id: string;
    name: string;
    bestStreak: number;
    currentStreak: number;
    completedDays: boolean[]; // Mon–Sun, length 7
}

interface Note {
    id: string;
    title: string;
    updatedAt: string;
    isPrivate: boolean;
}

interface ActivityItem {
    id: string;
    text: string;
    time: string;
}

interface UserProfileProps {
    isOwner: boolean;
    user: {
        displayName: string;
        initials: string;
        householdName: string;
        memberSince: string;
        bio: string;
        tags: string[];
        mood?: string; // only shown to owner
        stats: {
            checkInStreak: number;
            checkInMonthPct: number;
            tasksCompleted: number;
            bestHabitStreak: number;
        };
        householdContrib: { completed: number; total: number };
        recentActivity: ActivityItem[];
        habits: Habit[];
        notes: Note[];
    };
}

// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------

/** Matches the "● SECTION LABEL ▼" collapsible section header pattern */
function SectionHeader({
    label,
    dotColor = T.teal,
    collapsible = false,
    collapsed = false,
    onToggle,
}: {
    label: string;
    dotColor?: string;
    collapsible?: boolean;
    collapsed?: boolean;
    onToggle?: () => void;
}) {
    return (
        <UnstyledButton
            onClick={collapsible ? onToggle : undefined}
            style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "12px 16px",
                cursor: collapsible ? "pointer" : "default",
            }}
        >
            <Box
                style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: dotColor,
                    flexShrink: 0,
                }}
            />
            <Text
                style={{
                    fontSize: 12,
                    fontWeight: 600,
                    letterSpacing: "0.07em",
                    textTransform: "uppercase",
                    color: T.textSecondary,
                    flex: 1,
                }}
            >
                {label}
            </Text>
            {collapsible &&
                (collapsed ? (
                    <IconChevronRight size={16} color={T.textMuted} />
                ) : (
                    <IconChevronDown size={16} color={T.textMuted} />
                ))}
        </UnstyledButton>
    );
}

/** White rounded card */
function Card({
    children,
    style,
}: {
    children: React.ReactNode;
    style?: React.CSSProperties;
}) {
    return (
        <Box
            style={{
                background: T.cardBg,
                borderRadius: 12,
                boxShadow: T.shadow,
                overflow: "hidden",
                ...style,
            }}
        >
            {children}
        </Box>
    );
}

/** Teal-accented stat tile */
function StatCard({
    icon,
    value,
    label,
    accent,
}: {
    icon: React.ReactNode;
    value: string | number;
    label: string;
    accent?: boolean;
}) {
    return (
        <Box
            style={{
                background: T.cardBg,
                borderRadius: 12,
                boxShadow: T.shadow,
                padding: "12px 8px",
                textAlign: "center",
            }}
        >
            <Box
                style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: accent ? T.tealLight : "#f3f4f6",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 6px",
                    color: accent ? T.teal : T.textSecondary,
                }}
            >
                {icon}
            </Box>
            <Text
                style={{
                    fontSize: 20,
                    fontWeight: 700,
                    color: accent ? T.teal : T.textPrimary,
                    lineHeight: 1,
                }}
            >
                {value}
            </Text>
            <Text style={{ fontSize: 10, color: T.textMuted, marginTop: 3, lineHeight: 1.3 }}>
                {label}
            </Text>
        </Box>
    );
}

// ---------------------------------------------------------------------------
// Habit row
// ---------------------------------------------------------------------------

function HabitRow({ habit, isLast }: { habit: Habit; isLast: boolean }) {
    const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];
    const todayIndex = new Date().getDay();
    const todayMon = todayIndex === 0 ? 6 : todayIndex - 1;

    return (
        <Box
            style={{
                padding: "12px 16px",
                borderBottom: isLast ? "none" : `1px solid ${T.border}`,
            }}
        >
            <Group justify="space-between" mb={10}>
                <Text style={{ fontSize: 14, fontWeight: 500, color: T.textPrimary }}>
                    {habit.name}
                </Text>
                <Group gap={4}>
                    <IconFlame size={13} color={T.teal} />
                    <Text style={{ fontSize: 12, color: T.teal }}>{habit.bestStreak} best</Text>
                </Group>
            </Group>

            <Group gap={5} mb={6}>
                {habit.completedDays.map((done, i) => {
                    const isToday = i === todayMon;
                    return (
                        <Tooltip key={i} label={DAY_LABELS[i]} withArrow>
                            <Box
                                style={{
                                    width: 28,
                                    height: 28,
                                    borderRadius: "50%",
                                    border: isToday
                                        ? `2px solid ${T.teal}`
                                        : `1.5px solid ${T.border}`,
                                    background: done ? T.teal : "transparent",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                {done && <IconCheck size={11} color="#fff" />}
                            </Box>
                        </Tooltip>
                    );
                })}
            </Group>

            <Text style={{ fontSize: 11, color: T.textMuted }}>
                {habit.completedDays.filter(Boolean).length} of 7 days · streak:{" "}
                {habit.currentStreak}
            </Text>
        </Box>
    );
}

// ---------------------------------------------------------------------------
// Note row — mirrors task-row visual style
// ---------------------------------------------------------------------------

function NoteRow({ note, isLast }: { note: Note; isLast: boolean }) {
    return (
        <Group
            justify="space-between"
            style={{
                padding: "12px 16px",
                cursor: "pointer",
                borderBottom: isLast ? "none" : `1px solid ${T.border}`,
            }}
        >
            <Box>
                <Text style={{ fontSize: 14, color: T.textPrimary }}>{note.title}</Text>
                <Text style={{ fontSize: 12, color: T.textMuted }}>
                    Updated {note.updatedAt}
                </Text>
            </Box>
            <Box
                style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: note.isPrivate ? T.textMuted : T.teal,
                    background: note.isPrivate ? "#f3f4f6" : T.tealLight,
                    borderRadius: 20,
                    padding: "3px 10px",
                }}
            >
                {note.isPrivate ? "private" : "shared"}
            </Box>
        </Group>
    );
}

// ---------------------------------------------------------------------------
// Private wall
// ---------------------------------------------------------------------------

function PrivateWall({
    title,
    subtitle,
}: {
    title: string;
    subtitle: React.ReactNode;
}) {
    return (
        <Box
            style={{
                textAlign: "center",
                padding: "40px 24px",
            }}
        >
            <Box
                style={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    background: T.tealLight,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 12px",
                }}
            >
                <IconLock size={20} color={T.teal} />
            </Box>
            <Text
                style={{
                    fontSize: 15,
                    fontWeight: 600,
                    color: T.textPrimary,
                    marginBottom: 6,
                }}
            >
                {title}
            </Text>
            <Text
                style={{
                    fontSize: 13,
                    color: T.textSecondary,
                    maxWidth: 280,
                    margin: "0 auto",
                    lineHeight: 1.6,
                }}
            >
                {subtitle}
            </Text>
        </Box>
    );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function UserProfileDemo({ isOwner, user }: UserProfileProps) {
    const [activityCollapsed, setActivityCollapsed] = useState(false);

    const contrib = Math.round(
        (user.householdContrib.completed / user.householdContrib.total) * 100
    );
    const sharedNotes = user.notes.filter((n) => !n.isPrivate);
    const firstName = user.displayName.split(" ")[0];

    return (
        <Box style={{ background: T.bg, minHeight: "100vh" }}>

            {/* ── Header — identity info lives here ── */}
            <Box
                style={{
                    background: T.navy,
                    padding: "16px 16px 20px",
                }}
            >
                <Group align="flex-start" gap={14} wrap="nowrap">
                    <Box style={{ position: "relative", flexShrink: 0 }}>
                        <Avatar
                            size={64}
                            radius={14}
                            style={{
                                background: T.teal,
                                color: "#fff",
                                fontWeight: 700,
                                fontSize: 20,
                            }}
                        >
                            {user.initials}
                        </Avatar>
                        <Box
                            style={{
                                position: "absolute",
                                bottom: -2,
                                right: -2,
                                width: 14,
                                height: 14,
                                borderRadius: "50%",
                                background: T.green,
                                border: `2px solid ${T.navy}`,
                            }}
                        />
                    </Box>

                    <Box style={{ flex: 1, minWidth: 0 }}>
                        <Text style={{ fontSize: 17, fontWeight: 700, color: "#fff", lineHeight: 1.2 }}>
                            {user.displayName}
                        </Text>
                        <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 8 }}>
                            {user.householdName} · since {user.memberSince}
                        </Text>
                        <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", lineHeight: 1.6, marginBottom: 10 }}>
                            {user.bio}
                        </Text>
                        <Group gap={6} wrap="wrap">
                            {user.tags.map((tag) => (
                                <Box
                                    key={tag}
                                    style={{
                                        fontSize: 11,
                                        color: T.teal,
                                        background: "rgba(0,188,212,0.15)",
                                        border: "1px solid rgba(0,188,212,0.3)",
                                        borderRadius: 20,
                                        padding: "3px 10px",
                                        fontWeight: 500,
                                    }}
                                >
                                    {tag}
                                </Box>
                            ))}
                            {isOwner && user.mood && (
                                <Box
                                    style={{
                                        fontSize: 11,
                                        color: "rgba(255,255,255,0.45)",
                                        background: "rgba(255,255,255,0.08)",
                                        border: "1px solid rgba(255,255,255,0.15)",
                                        borderRadius: 20,
                                        padding: "3px 10px",
                                    }}
                                >
                                    {user.mood}
                                </Box>
                            )}
                        </Group>
                    </Box>
                </Group>
            </Box>

            <Box style={{ padding: "14px 12px", maxWidth: 680, margin: "0 auto" }}>

                {/* ── Stats row ── */}
                <SimpleGrid cols={4} spacing={8} style={{ marginBottom: 10 }}>
                    <StatCard
                        icon={<IconCalendarStats size={15} />}
                        value={user.stats.checkInStreak}
                        label="streak"
                        accent
                    />
                    <StatCard
                        icon={<IconChecks size={15} />}
                        value={user.stats.tasksCompleted}
                        label="tasks done"
                    />
                    <StatCard
                        icon={<IconFlame size={15} />}
                        value={user.stats.bestHabitStreak}
                        label="habit best"
                        accent
                    />
                    <StatCard
                        icon={<IconCalendarStats size={15} />}
                        value={`${user.stats.checkInMonthPct}%`}
                        label="check-ins"
                    />
                </SimpleGrid>

                {/* ── Tabs ── */}
                <Tabs
                    defaultValue="profile"
                    styles={{
                        root: {
                            background: T.cardBg,
                            borderRadius: 12,
                            boxShadow: T.shadow,
                            overflow: "hidden",
                        },
                        list: {
                            background: T.navy,
                            borderBottom: "none",
                            gap: 0,
                        },
                        tab: {
                            flex: 1,
                            color: "rgba(255,255,255,0.55)",
                            fontSize: 13,
                            fontWeight: 500,
                            padding: "11px 8px",
                            border: "none",
                            borderBottom: "2px solid transparent",
                            borderRadius: 0,
                            justifyContent: "center",
                            "&[dataActive]": {
                                color: "#fff",
                                borderBottomColor: T.teal,
                                background: "transparent",
                            },
                        },
                        panel: { padding: 0 },
                    }}
                >
                    <Tabs.List>
                        <Tabs.Tab value="profile" leftSection={<IconUser size={13} />}>
                            Profile
                        </Tabs.Tab>
                        <Tabs.Tab value="notes" leftSection={<IconNote size={13} />}>
                            Notes
                        </Tabs.Tab>
                        <Tabs.Tab value="habits" leftSection={<IconFlame size={13} />}>
                            Habits
                        </Tabs.Tab>
                    </Tabs.List>

                    {/* ── Profile tab ── */}
                    <Tabs.Panel value="profile">
                        <SectionHeader label="Household contribution" />
                        <Box style={{ padding: "0 16px 16px" }}>
                            <Group justify="space-between" mb={6}>
                                <Text style={{ fontSize: 13, color: T.textSecondary }}>
                                    {firstName} completed {user.householdContrib.completed} of{" "}
                                    {user.householdContrib.total} tasks this month
                                </Text>
                                <Text style={{ fontSize: 13, fontWeight: 700, color: T.teal }}>
                                    {contrib}%
                                </Text>
                            </Group>
                            <Progress value={contrib} color="cyan" size={6} radius="xl" />
                        </Box>

                        <Divider color={T.border} />

                        <SectionHeader
                            label="Recent activity"
                            collapsible
                            collapsed={activityCollapsed}
                            onToggle={() => setActivityCollapsed((v) => !v)}
                        />
                        {!activityCollapsed && (
                            <Stack gap={0}>
                                {user.recentActivity.map((item, i) => (
                                    <Box
                                        key={item.id}
                                        style={{
                                            padding: "10px 16px",
                                            borderTop: i > 0 ? `1px solid ${T.border}` : undefined,
                                        }}
                                    >
                                        <Group align="flex-start" gap={10} wrap="nowrap">
                                            <Box
                                                style={{
                                                    width: 28,
                                                    height: 28,
                                                    borderRadius: "50%",
                                                    background: T.tealLight,
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    flexShrink: 0,
                                                }}
                                            >
                                                <IconChecks size={13} color={T.teal} />
                                            </Box>
                                            <Box style={{ flex: 1, minWidth: 0 }}>
                                                <Text
                                                    style={{
                                                        fontSize: 13,
                                                        color: T.textPrimary,
                                                        lineHeight: 1.4,
                                                    }}
                                                >
                                                    {item.text}
                                                </Text>
                                                <Text style={{ fontSize: 12, color: T.textMuted }}>
                                                    {item.time}
                                                </Text>
                                            </Box>
                                        </Group>
                                    </Box>
                                ))}
                            </Stack>
                        )}
                    </Tabs.Panel>

                    {/* ── Notes tab ── */}
                    <Tabs.Panel value="notes">
                        {isOwner ? (
                            <>
                                <SectionHeader label="Your notes" />
                                <Stack gap={0}>
                                    {user.notes.map((note, i) => (
                                        <NoteRow
                                            key={note.id}
                                            note={note}
                                            isLast={i === user.notes.length - 1}
                                        />
                                    ))}
                                </Stack>
                            </>
                        ) : sharedNotes.length > 0 ? (
                            <>
                                <Box style={{ padding: "12px 16px 0" }}>
                                    <Group
                                        gap={8}
                                        style={{
                                            background: T.tealLight,
                                            borderRadius: 8,
                                            padding: "10px 12px",
                                        }}
                                    >
                                        <IconLock size={13} color={T.teal} />
                                        <Text style={{ fontSize: 12, color: T.teal }}>
                                            Personal notes are private. Only shared notes appear here.
                                        </Text>
                                    </Group>
                                </Box>
                                <SectionHeader label="Shared notes" />
                                <Stack gap={0}>
                                    {sharedNotes.map((note, i) => (
                                        <NoteRow
                                            key={note.id}
                                            note={note}
                                            isLast={i === sharedNotes.length - 1}
                                        />
                                    ))}
                                </Stack>
                            </>
                        ) : (
                            <PrivateWall
                                title="Personal notes are private"
                                subtitle={`${firstName} hasn't shared any notes with the household yet.`}
                            />
                        )}
                    </Tabs.Panel>

                    {/* ── Habits tab ── */}
                    <Tabs.Panel value="habits">
                        {isOwner ? (
                            <>
                                <SectionHeader label="This week" />
                                <Stack gap={0}>
                                    {user.habits.map((habit, i) => (
                                        <HabitRow
                                            key={habit.id}
                                            habit={habit}
                                            isLast={i === user.habits.length - 1}
                                        />
                                    ))}
                                </Stack>
                            </>
                        ) : (
                            <PrivateWall
                                title="Habit details are private"
                                subtitle={
                                    <>
                                        {firstName}'s best streak is{" "}
                                        <Text span style={{ fontWeight: 700, color: T.teal }}>
                                            {user.stats.bestHabitStreak} days
                                        </Text>
                                        . Individual habits are only visible to {firstName}.
                                    </>
                                }
                            />
                        )}
                    </Tabs.Panel>
                </Tabs>
            </Box>
        </Box>
    );
}

// ---------------------------------------------------------------------------
// Example usage — swap MOCK_USER for RTK Query data in production
// ---------------------------------------------------------------------------

const MOCK_USER: UserProfileProps["user"] = {
    displayName: "Jordan Kim",
    initials: "JK",
    householdName: "Maple House",
    memberSince: "January 2024",
    bio: "Trying to keep the chaos organised, one chore at a time. Early riser. Makes the coffee.",
    tags: ["Morning person", "Cooks on weekends", "Finances lead"],
    mood: "feeling good today",
    stats: {
        checkInStreak: 24,
        checkInMonthPct: 92,
        tasksCompleted: 183,
        bestHabitStreak: 41,
    },
    householdContrib: { completed: 38, total: 99 },
    recentActivity: [
        { id: "1", text: "Completed \"Deep clean the bathroom\"", time: "2 hours ago" },
        { id: "2", text: "Added 6 items to the shopping list", time: "Yesterday" },
        { id: "3", text: "Logged a bill payment — Electricity", time: "2 days ago" },
        { id: "4", text: "Completed \"Take bins out\"", time: "3 days ago" },
        { id: "5", text: "Checked in for the day", time: "This morning" },
    ],
    habits: [
        {
            id: "h1",
            name: "Morning journaling",
            bestStreak: 41,
            currentStreak: 5,
            completedDays: [true, true, true, true, true, false, false],
        },
        {
            id: "h2",
            name: "30 min reading",
            bestStreak: 18,
            currentStreak: 4,
            completedDays: [true, false, true, true, true, false, false],
        },
        {
            id: "h3",
            name: "No phone after 10pm",
            bestStreak: 9,
            currentStreak: 2,
            completedDays: [true, true, false, true, true, false, false],
        },
    ],
    notes: [
        { id: "n1", title: "Weekly reflection", updatedAt: "2 days ago", isPrivate: true },
        { id: "n2", title: "Things I want to try this spring", updatedAt: "1 week ago", isPrivate: false },
        { id: "n3", title: "Budget goals 2025", updatedAt: "3 weeks ago", isPrivate: true },
        { id: "n4", title: "House project ideas", updatedAt: "last month", isPrivate: false },
    ],
};

export default function UserProfilePageDemo() {
    return <UserProfileDemo isOwner={true} user={MOCK_USER} />;
}
