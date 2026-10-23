import { CalendarProvider } from "@/contexts";
import { CalendarModals } from "./CalendarPage/CalendarModals";
import { UpcomingAgenda } from "./UpcomingAgenda";
import { toDateString } from "../utils";

const AGENDA_VIEW = "week";

type Props = {
    isReady: boolean;
    householdId: number;
};

/** Homepage "Upcoming This Week": the calendar's agenda list, with the same details/edit modals. */
export function UpcomingThisWeek({ isReady, householdId }: Props) {
    return (
        <CalendarProvider view={AGENDA_VIEW}>
            <UpcomingAgenda isReady={isReady} householdId={householdId} />
            <CalendarModals date={toDateString()} />
        </CalendarProvider>
    );
}