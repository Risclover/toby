import { Stack } from "@mantine/core";
import { UpcomingEventRow } from "./UpcomingEventRow";
import { UpcomingEventSkeleton } from "./UpcomingEventSkeleton";
import { useUpcomingRows } from "../hooks";
import "../styles/UpcomingThisWeek.css";

const SKELETON_COUNT = 5;

type Props = {
    isReady: boolean;
    householdId: number;
};

export function UpcomingThisWeek({ isReady, householdId }: Props) {
    const { rows, isLoading } = useUpcomingRows(householdId);

    return (
        <div className="upcoming-events-container">
            <Stack className="upcoming-events" gap="xs">
                {!isReady || isLoading
                    ? Array.from({ length: SKELETON_COUNT }, (_, i) => <UpcomingEventSkeleton key={i} />)
                    : rows.length === 0
                        ? <div className="featured-empty-state">Good news, boss - your week is wide open!</div>
                        : rows.map((row) => <UpcomingEventRow key={row.key} row={row} />)}
            </Stack>
        </div>
    );
}