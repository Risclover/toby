// AnnouncementsTabOptimistic.tsx
import React, { useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import {
    useGetAnnouncementsQuery,
    useMarkAnnouncementSeenMutation,
    announcementApi
} from "@/store/announcementSlice";
import { useAppDispatch } from "@/store/hooks";

type Props = { householdId: number; active: boolean };

export default function AnnouncementsTabOptimistic({ householdId, active }: Props) {
    const dispatch = useAppDispatch();
    const { data: announcements } = useGetAnnouncementsQuery({ householdId });
    const [markSeen] = useMarkAnnouncementSeenMutation();
    const markTimerRef = useRef<number | null>(null);

    useEffect(() => {
        if (!active) {
            // cancel any scheduled marking
            if (markTimerRef.current) {
                window.clearTimeout(markTimerRef.current);
                markTimerRef.current = null;
            }
            return;
        }

        const unseen = announcements?.filter(a => !a.seenByCurrent) ?? [];
        if (unseen.length === 0) return;

        // Delayed mark: wait ~800ms so accidental tab clicks don't mark.
        markTimerRef.current = window.setTimeout(() => {
            // Optimistically update the announcements query cache for the household
            const patchResult = dispatch(
                announcementApi.util.updateQueryData(
                    "getAnnouncements",
                    { householdId },
                    (draft) => {
                        for (const ann of draft) {
                            if (!ann.seenByCurrent) ann.seenByCurrent = true;
                        }
                    }
                )
            );

            // Fire network requests in background
            (async () => {
                try {
                    await Promise.all(unseen.map(a =>
                        markSeen({ announcementId: a.id, householdId }).unwrap()
                    ));
                } catch (err) {
                    console.error("Failed to mark some announcements seen", err);
                    // On failure you have a few options:
                    // 1) dispatch(announcementApi.util.invalidateTags(...)) to refetch
                    // 2) rollback the optimistic patch by calling patchResult.undo()
                    // We'll invalidate to keep server + client consistent:
                    dispatch(announcementApi.util.invalidateTags([{ type: "Announcement", id: `HOUSEHOLD_${householdId}` }]));
                }
            })();

            markTimerRef.current = null;
        }, 800);

        // cleanup if active changes / component unmounts
        return () => {
            if (markTimerRef.current) {
                window.clearTimeout(markTimerRef.current);
                markTimerRef.current = null;
            }
        };
    }, [active, announcements, householdId, dispatch, markSeen]);

    return (
        <div>
            {announcements?.map(a => (
                <div key={a.id}>
                    <span>{a.message}</span>
                    {a.seenByCurrent ? null : <strong> (new)</strong>}
                </div>
            ))}
        </div>
    );
}
