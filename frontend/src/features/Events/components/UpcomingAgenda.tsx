import { Stack } from "@mantine/core";
import { UpcomingEventSkeleton } from "./UpcomingEventSkeleton";
import { useUpcomingAgendaEvents } from "../hooks/useUpcomingAgendaEvents";
import "../styles/UpcomingThisWeek.css";
import { AgendaList } from "./AgendaList";

const SKELETON_COUNT = 4;
// The section title already says "this week", so hide AgendaView's own range header.
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
        return <AgendaList range={range} events={agendaEvents} styles={HIDDEN_RANGE_HEADER} />;
    };

    return (
        <div className="upcoming-events-container">
            <Stack className="upcoming-events" gap={0}>
                {renderContent()}
            </Stack>
        </div>
    );
};