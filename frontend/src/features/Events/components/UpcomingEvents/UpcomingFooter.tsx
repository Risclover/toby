import type { ReactNode } from "react";
import { useCalendar } from "@/contexts";
import { toDateString } from "../../utils";

export type UpcomingFooterActions = {
    onAddEvent: () => void;
};

type Props = {
    renderFooter: (actions: UpcomingFooterActions) => ReactNode;
};

/** Bridges the calendar context to a footer rendered by the host (the homepage card). */
export const UpcomingFooter = ({ renderFooter }: Props) => {
    const { modals } = useCalendar();
    return <>{renderFooter({ onAddEvent: () => modals.createForDay(toDateString()) })}</>;
};