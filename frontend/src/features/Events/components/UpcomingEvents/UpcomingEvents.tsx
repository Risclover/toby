import type { ReactNode } from "react";
import { CalendarModals } from "../..";
import { UpcomingAgenda } from "./UpcomingAgenda";
import { UpcomingFooter, type UpcomingFooterActions } from "./UpcomingFooter";
import { CalendarProvider } from "@/contexts";
import { toDateString } from "../../utils";

const AGENDA_VIEW = "week";

type Props = {
    isReady: boolean;
    householdId: number;
    /** Rendered under the list, inside the calendar context, so it can trigger add-event. */
    renderFooter?: (actions: UpcomingFooterActions) => ReactNode;
};

export function UpcomingEvents({ isReady, householdId, renderFooter }: Props) {
    return (
        <CalendarProvider view={AGENDA_VIEW}>
            <UpcomingAgenda isReady={isReady} householdId={householdId} />
            {renderFooter && <UpcomingFooter renderFooter={renderFooter} />}
            <CalendarModals date={toDateString()} />
        </CalendarProvider>
    );
}