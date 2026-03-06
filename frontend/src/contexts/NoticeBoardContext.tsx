import { useAuthenticateQuery, useGetAnnouncementsQuery, useMarkAnnouncementsSeenBulkMutation } from "@/store";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";


interface NoticeBoardContextValue {
    hasUnseen: boolean;
    hasOpenedAnnouncements: boolean;
    onAnnouncementsOpened: () => void;
    unseenSnapshot: Set<number>;
}

const NoticeBoardContext = createContext<NoticeBoardContextValue | null>(null);

interface NoticeBoardProviderProps {
    children: ReactNode;
}

export const NoticeBoardProvider = ({ children }: NoticeBoardProviderProps) => {
    const { data: user } = useAuthenticateQuery();
    const { data } = useGetAnnouncementsQuery({ householdId: user?.householdId, limit: 50 });
    const [markSeenBulk] = useMarkAnnouncementsSeenBulkMutation();

    const unseenSnapshotRef = useRef<Set<number> | null>(null);
    const [unseenSnapshot, setUnseenSnapshot] = useState<Set<number>>(new Set());
    const markedRef = useRef(false);

    const [hasOpenedAnnouncements, setHasOpenedAnnouncements] = useState(false);

    useEffect(() => {
        if (!data || unseenSnapshotRef.current !== null) return;
        const ids = new Set(
            data.items
                .filter((a) => a.seenByCurrent === false)
                .map((a) => a.id)
        );
        unseenSnapshotRef.current = ids;
        setUnseenSnapshot(ids);
    }, [data]);

    useEffect(() => {
        return () => {
            unseenSnapshotRef.current = null;
            markedRef.current = false;
        };
    }, []);

    const onAnnouncementsOpened = () => {
        setHasOpenedAnnouncements(true);
        if (markedRef.current) return;

        if (!unseenSnapshotRef.current || unseenSnapshotRef.current.size === 0) return;

        markedRef.current = true;
        markSeenBulk({
            householdId: user?.householdId,
            announcementIds: [...unseenSnapshotRef.current]
        })
    }

    const hasUnseen = unseenSnapshot.size > 0;

    return (
        <NoticeBoardContext.Provider value={{ hasUnseen, hasOpenedAnnouncements, onAnnouncementsOpened, unseenSnapshot }}>
            {children}
        </NoticeBoardContext.Provider>
    )
}

export const useNoticeBoard = () => {
    const ctx = useContext(NoticeBoardContext);
    if (!ctx) throw new Error("useNoticeBoard must be used within a NoticeBoardProvider");
    return ctx;
}