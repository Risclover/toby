import { DEFAULT_EVENT_COLOR } from "./calendarConstants";

const RAW_CSS_COLOR_PREFIXES = ["#", "rgb", "hsl"];
const LIGHT_WHITE_MIX_PERCENT = 78;
const TEXT_BLACK_MIX_PERCENT = 15;
const LIGHT_SHADE = 1;
const DOT_SHADE = 6;
const TEXT_SHADE = 9;
const MULTI_MEMBER_TEXT_COLOR = "var(--mantine-color-dark-7)";

/** True for a literal CSS color; otherwise the value is a Mantine color name. */
const isRawCssColor = (color: string) =>
    RAW_CSS_COLOR_PREFIXES.some((prefix) => color.startsWith(prefix));

export function toLightCssColor(color: string): string {
    if (isRawCssColor(color)) {
        return `color-mix(in oklab, ${color}, white ${LIGHT_WHITE_MIX_PERCENT}%)`;
    }
    return `var(--mantine-color-${color}-${LIGHT_SHADE})`;
}

export function toDotCssColor(color: string): string {
    if (isRawCssColor(color)) return color;
    return `var(--mantine-color-${color}-${DOT_SHADE})`;
}

function toTextCssColor(color: string): string {
    if (isRawCssColor(color)) {
        return `color-mix(in oklab, ${color}, black ${TEXT_BLACK_MIX_PERCENT}%)`;
    }
    return `var(--mantine-color-${color}-${TEXT_SHADE})`;
}

export function getEventTextColor(colors: string[]): string {
    if (colors.length <= 1) return toTextCssColor(colors[0] ?? DEFAULT_EVENT_COLOR);
    return MULTI_MEMBER_TEXT_COLOR;
}