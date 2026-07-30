import { Chip, Tooltip } from "@mantine/core";

type WeekdayChipProps = {
    label: string;
    value: string;
    tooltip: string;
}

export const WeekdayChip = ({ label, value, tooltip }: WeekdayChipProps) => {
    const dayChipStyles = {
        label: {
            width: 32,
            height: 32,
            padding: 0,
            justifyContent: 'center' as const,
            borderRadius: '50%',
        },
    } as const;

    return (
        <Tooltip
            label={tooltip}
            refProp="rootRef"
            transitionProps={{
                duration: 100,
                transition: {
                    in: { opacity: 1, transform: 'scale(1) translateY(0)' },
                    out: { transform: 'scale(0.8) translateY(0)', opacity: 0 },
                    common: { transformOrigin: 'bottom' },
                    transitionProperty: 'opacity, transform',
                },
            }}
        >
            <Chip
                value={value}
                icon={null}
                styles={dayChipStyles}
                classNames={{ label: "day-chip" }}
                color="blue.6"
            >
                {label}
            </Chip>
        </Tooltip>
    )
}