export const EVENTS_FILTER = {
    MINE_ONLY: "Mine only",
    GROUP_BY_USER: "Group by user",
} as const;

export type EventsFilter = (typeof EVENTS_FILTER)[keyof typeof EVENTS_FILTER];

export const EVENTS_FILTER_OPTIONS: EventsFilter[] = Object.values(EVENTS_FILTER);