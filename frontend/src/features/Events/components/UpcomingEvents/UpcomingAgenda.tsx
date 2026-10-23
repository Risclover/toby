import { Stack, type BoxProps } from "@mantine/core";
import { UpcomingEventSkeleton } from "./UpcomingEventSkeleton";
import { AgendaList } from "../AgendaList";
import { useUpcomingAgendaEvents } from "../../hooks";
import "../../styles/UpcomingThisWeek.css";

const SKELETON_COUNT = 4;
const ROW_PROPS: BoxProps = { px: 8, bg: "white", className: "upcoming-agenda-row" };
const HIDDEN_RANGE_HEADER = { agendaViewHeader: { display: "none" } };

type Props = {
    isReady: boolean;
    householdId: number;
};

export const UpcomingAgenda = ({ isReady, householdId }: Props) => {
    const { agendaEvents, range, isLoading } = useUpcomingAgendaEvents(householdId);

    const renderContent = () => {
        if (!isReady || isLoading) {
            return Array.from({ length: SKELETON_COUNT }, (_, i) => <UpcomingEventSkeleton key={i} />);
        }
        if (agendaEvents.length === 0) {
            return <div className="featured-empty-state">Good news, boss - your week is wide open!</div>;
        }
        return (
            <AgendaList
                range={range}
                events={agendaEvents}
                styles={HIDDEN_RANGE_HEADER}
                rowProps={ROW_PROPS}
            />
        );
    };

    return (
        <div className="upcoming-events-container">
            <Stack className="upcoming-events" gap={0}>
                {renderContent()}
            </Stack>
        </div>
    );
};