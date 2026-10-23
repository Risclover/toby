import { Stack, type BoxProps } from "@mantine/core";
import { UpcomingDaySection } from "./UpcomingDaySection";
import { UpcomingEventSkeleton } from "./UpcomingEventSkeleton";
import "../../styles/UpcomingThisWeek.css";
import { useUpcomingAgendaEvents } from "../..";

const SKELETON_COUNT = 4;
const ROW_PROPS: BoxProps = { px: 4, bg: "white", className: "upcoming-agenda-row" };

type Props = {
    isReady: boolean;
    householdId: number;
};

export const UpcomingAgenda = ({ isReady, householdId }: Props) => {
    const { days, isLoading } = useUpcomingAgendaEvents(householdId);

    const renderContent = () => {
        if (!isReady || isLoading) {
            return Array.from({ length: SKELETON_COUNT }, (_, i) => <UpcomingEventSkeleton key={i} />);
        }
        if (days.length === 0) {
            return <div className="featured-empty-state">Good news, boss - your week is wide open!</div>;
        }
        return days.map((day) => <UpcomingDaySection key={day.ymd} day={day} rowProps={ROW_PROPS} />);
    };

    return (
        <div className="upcoming-events-container">
            <Stack className="upcoming-events" gap={0}>
                {renderContent()}
            </Stack>
        </div>
    );
};