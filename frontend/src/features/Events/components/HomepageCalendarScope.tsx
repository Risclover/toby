import type { ReactNode } from "react";
import { CalendarProvider } from "@/contexts";
import { AgendaModal } from "./CalendarPage/AgendaModal";
import { CalendarModals } from "./CalendarPage/CalendarModals";
import { toDateString } from "../utils";

const HOMEPAGE_VIEW = "week";

type Props = {
    children: ReactNode;
};

/** One calendar context plus its modals (agenda, details, event form) for everything on the homepage events card. */
export const HomepageCalendarScope = ({ children }: Props) => (
    <CalendarProvider view={HOMEPAGE_VIEW}>
        {children}
        <AgendaModal />
        <CalendarModals date={toDateString()} />
    </CalendarProvider>
);