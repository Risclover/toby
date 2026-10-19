import { DayEventRow } from "./DayEventRow";
import { EventsModalEmptyState } from "./EventsModalEmptyState";
import type { DayEventRowSharedProps, Occurrence } from "../../types";

type Props = {
    occurrences: Occurrence[];
    rowProps: DayEventRowSharedProps;
};

export const FlatEventList = ({ occurrences, rowProps }: Props) => {
    if (occurrences.length === 0) return <EventsModalEmptyState />;

    return (
        <>
            {occurrences.map((occurrence) => (
                <DayEventRow key={String(occurrence.id)} occurrence={occurrence} {...rowProps} />
            ))}
        </>
    );
};