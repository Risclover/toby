const FREQUENCY_PATTERN = /FREQ=(\w+)/;
const DEFAULT_LABEL = "Repeats";

const FREQUENCY_LABELS: Record<string, string> = {
    daily: "Repeats daily",
    weekly: "Repeats weekly",
    monthly: "Repeats monthly",
    yearly: "Repeats yearly",
};

export const describeRecurrence = (rrule?: string | null): string | null => {
    if (!rrule) return null;

    const frequency = rrule.match(FREQUENCY_PATTERN)?.[1]?.toLowerCase();

    return (frequency && FREQUENCY_LABELS[frequency]) || DEFAULT_LABEL;
};