import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import {
    useAuthenticateQuery,
    useGetAnnouncementsQuery,
    useMarkAnnouncementsSeenBulkMutation,
    useGetUserRemindersPreviewQuery,
    useMarkReminderSeenBulkMutation
} from "@/store";

interface NoticeBoardContextValue {
    // Announcements
    hasUnseen: boolean;
    hasOpenedAnnouncements: boolean;
    onAnnouncementsOpened: () => void;
    unseenSnapshot: Set<number>;
    // Reminders
    hasUnseenReminders: boolean;
    hasOpenedReminders: boolean;
    onRemindersOpened: () => void;
    unseenReminderSnapshot: Set<number>;
}

const NoticeBoardContext = createContext<NoticeBoardContextValue | null>(null);

export const NoticeBoardProvider = ({ children }: { children: ReactNode }) => {
    const { data: user } = useAuthenticateQuery();

    // --- Announcements (unchanged) ---
    const { data: announcementData } = useGetAnnouncementsQuery(
        { householdId: user?.householdId!, limit: 50 },
        { skip: !user?.householdId }
    );
    const [markAnnouncementsSeenBulk] = useMarkAnnouncementsSeenBulkMutation();

    const unseenSnapshotRef = useRef<Set<number> | null>(null);
    const [unseenSnapshot, setUnseenSnapshot] = useState<Set<number>>(new Set());
    const announcementsMarkedRef = useRef(false);
    const [hasOpenedAnnouncements, setHasOpenedAnnouncements] = useState(false);

    useEffect(() => {
        if (!announcementData || unseenSnapshotRef.current !== null) return;
        const ids = new Set(
            announcementData.items
                .filter((a) => a.seenByCurrent === false)
                .map((a) => a.id)
        );
        unseenSnapshotRef.current = ids;
        setUnseenSnapshot(ids);
    }, [announcementData]);

    useEffect(() => {
        return () => {
            unseenSnapshotRef.current = null;
            announcementsMarkedRef.current = false;
        };
    }, []);

    const onAnnouncementsOpened = () => {
        setHasOpenedAnnouncements(true);
        if (announcementsMarkedRef.current) return;
        if (!unseenSnapshotRef.current || unseenSnapshotRef.current.size === 0) return;
        announcementsMarkedRef.current = true;
        markAnnouncementsSeenBulk({
            householdId: user?.householdId,
            announcementIds: [...unseenSnapshotRef.current]
        });
    };

    // --- Reminders ---
    const { data: reminderData } = useGetUserRemindersPreviewQuery(user?.householdId, {
        skip: !user?.householdId
    });
    const [markReminderSeenBulk] = useMarkReminderSeenBulkMutation();

    const unseenReminderSnapshotRef = useRef<Set<number> | null>(null);
    const [unseenReminderSnapshot, setUnseenReminderSnapshot] = useState<Set<number>>(new Set());
    const remindersMarkedRef = useRef(false);
    const [hasOpenedReminders, setHasOpenedReminders] = useState(false);

    useEffect(() => {
        if (!reminderData || unseenReminderSnapshotRef.current !== null) return;
        const ids = new Set(
            reminderData
                .filter((r) => r.currentUserAssignment?.seen === false)
                .map((r) => r.id)
        );
        unseenReminderSnapshotRef.current = ids;
        setUnseenReminderSnapshot(ids);
    }, [reminderData]);

    useEffect(() => {
        return () => {
            unseenReminderSnapshotRef.current = null;
            remindersMarkedRef.current = false;
        };
    }, []);

    const onRemindersOpened = () => {
        setHasOpenedReminders(true);
        if (remindersMarkedRef.current) return;
        if (!unseenReminderSnapshotRef.current || unseenReminderSnapshotRef.current.size === 0) return;
        remindersMarkedRef.current = true;
        markReminderSeenBulk({
            reminderIds: [...unseenReminderSnapshotRef.current]
        });
    };

    const hasUnseen = unseenSnapshot.size > 0;
    const hasUnseenReminders = unseenReminderSnapshot.size > 0;

    return (
        <NoticeBoardContext.Provider value={{
            hasUnseen,
            hasOpenedAnnouncements,
            onAnnouncementsOpened,
            unseenSnapshot,
            hasUnseenReminders,
            hasOpenedReminders,
            onRemindersOpened,
            unseenReminderSnapshot,
        }}>
            {children}
        </NoticeBoardContext.Provider>
    );
};

export const useNoticeBoard = () => {
    const ctx = useContext(NoticeBoardContext);
    if (!ctx) throw new Error("useNoticeBoard must be used within a NoticeBoardProvider");
    return ctx;
};