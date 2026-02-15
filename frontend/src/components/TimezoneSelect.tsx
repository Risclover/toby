import { Select } from "@mantine/core";
import { useEffect, useState } from "react";

export const TIMEZONE_OPTIONS = [
    // 🇺🇸 United States
    { value: "America/Los_Angeles", label: "(UTC−08:00) Pacific Time (US & Canada)" },
    { value: "America/Denver", label: "(UTC−07:00) Mountain Time (US & Canada)" },
    { value: "America/Chicago", label: "(UTC−06:00) Central Time (US & Canada)" },
    { value: "America/New_York", label: "(UTC−05:00) Eastern Time (US & Canada)" },
    { value: "America/Anchorage", label: "(UTC−09:00) Alaska" },
    { value: "Pacific/Honolulu", label: "(UTC−10:00) Hawaii" },

    // 🌎 Americas
    { value: "America/Vancouver", label: "(UTC−08:00) Vancouver" },
    { value: "America/Toronto", label: "(UTC−05:00) Toronto" },
    { value: "America/Mexico_City", label: "(UTC−06:00) Mexico City" },
    { value: "America/Sao_Paulo", label: "(UTC−03:00) São Paulo" },
    { value: "America/Argentina/Buenos_Aires", label: "(UTC−03:00) Buenos Aires" },

    // 🇪🇺 Europe
    { value: "Europe/London", label: "(UTC+00:00) London" },
    { value: "Europe/Paris", label: "(UTC+01:00) Paris" },
    { value: "Europe/Berlin", label: "(UTC+01:00) Berlin" },
    { value: "Europe/Madrid", label: "(UTC+01:00) Madrid" },
    { value: "Europe/Rome", label: "(UTC+01:00) Rome" },
    { value: "Europe/Amsterdam", label: "(UTC+01:00) Amsterdam" },
    { value: "Europe/Stockholm", label: "(UTC+01:00) Stockholm" },

    // 🌍 Africa
    { value: "Africa/Johannesburg", label: "(UTC+02:00) Johannesburg" },
    { value: "Africa/Cairo", label: "(UTC+02:00) Cairo" },
    { value: "Africa/Lagos", label: "(UTC+01:00) Lagos" },
    { value: "Africa/Nairobi", label: "(UTC+03:00) Nairobi" },

    // 🌏 Asia
    { value: "Asia/Dubai", label: "(UTC+04:00) Dubai" },
    { value: "Asia/Kolkata", label: "(UTC+05:30) India Standard Time" },
    { value: "Asia/Singapore", label: "(UTC+08:00) Singapore" },
    { value: "Asia/Hong_Kong", label: "(UTC+08:00) Hong Kong" },
    { value: "Asia/Shanghai", label: "(UTC+08:00) Shanghai" },
    { value: "Asia/Seoul", label: "(UTC+09:00) Seoul" },
    { value: "Asia/Tokyo", label: "(UTC+09:00) Tokyo" },

    // 🌏 Australia & Oceania
    { value: "Australia/Perth", label: "(UTC+08:00) Perth" },
    { value: "Australia/Sydney", label: "(UTC+10:00) Sydney" },
    { value: "Australia/Melbourne", label: "(UTC+10:00) Melbourne" },
    { value: "Pacific/Auckland", label: "(UTC+12:00) Auckland" },
];

export function detectUserTimezone(): string {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}

export function TimezoneSelect({
    value,
    onChange,
}: {
    value: string | null;
    onChange: (tz: string | null) => void;
}) {
    const [initialized, setInitialized] = useState(false);

    useEffect(() => {
        if (!value && !initialized) {
            const detected = detectUserTimezone();

            // Only auto-select if it's in our list
            const exists = TIMEZONE_OPTIONS.some(t => t.value === detected);
            if (exists) {
                onChange(detected);
            }

            setInitialized(true);
        }
    }, [value, initialized, onChange]);

    return (
        <Select
            label="Timezone"
            placeholder="Select your timezone"
            searchable
            data={TIMEZONE_OPTIONS}
            value={value}
            onChange={onChange}
            nothingFoundMessage="No timezone found"
            maxDropdownHeight={280}
            required
        />
    );
}