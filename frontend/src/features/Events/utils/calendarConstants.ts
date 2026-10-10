export const DATE_FORMAT = "YYYY-MM-DD";
export const WALL_CLOCK_FORMAT = "YYYY-MM-DD HH:mm:ss";
export const TIME_FORMAT = "HH:mm"; // "HH:mm:ss" if TimeInput gets withSeconds
export const DEFAULT_TZID = "UTC";
export const DEFAULT_EVENT_COLOR = "blue";
export const DEFAULT_EVENT_DURATION_HOURS = 1;
export const MOBILE_BREAKPOINT = 768;
export const MAX_EVENTS_PER_DAY = 10;
export const EVENT_ID_SEPARATOR = "::";

export const MORE_EVENTS_PROPS = {
    classNames: {
        moreEventsButton: "toby-more-events-button",
        moreEventsDropdown: "toby-more-events-dropdown",
    },
} as const;