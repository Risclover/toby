import { ActionIcon, CloseIcon, ComboboxPopover, Group, Indicator, Tooltip } from "@mantine/core";
import FilterAltRoundedIcon from "@mui/icons-material/FilterAltRounded";

import { EVENTS_FILTER_OPTIONS } from "../../utils/eventsModalFilter";
import { TOOLTIP_EVENTS } from "../../utils/eventRowTooltipProps";

type Props = {
    /** Selected filter option */
    filterValue: string | null;
    /** Called when the filter changes or is cleared */
    onFilterChange: (value: string | null) => void;
};

const DROPDOWN_STYLES = {
    dropdown: { minWidth: 150, maxWidth: "calc(100vw - 1rem)" },
};
const INDICATOR_STYLES = {
    root: { display: "flex", alignItems: "center", justifyContent: "center" },
};
const INDICATOR_SIZE = 7;
const INDICATOR_OFFSET = 4;
const INDICATOR_Z_INDEX = 2;

export const EventsModalFilter = ({ filterValue, onFilterChange }: Props) => {
    const clearFilter = () => onFilterChange(null);

    return (
        <Group gap={1} align="center">
            <ComboboxPopover
                data={EVENTS_FILTER_OPTIONS}
                value={filterValue}
                onChange={onFilterChange}
                styles={DROPDOWN_STYLES}
            >
                <ComboboxPopover.Target>
                    <Indicator
                        styles={INDICATOR_STYLES}
                        h="auto"
                        disabled={!filterValue}
                        size={INDICATOR_SIZE}
                        color="blue"
                        offset={INDICATOR_OFFSET}
                        zIndex={INDICATOR_Z_INDEX}
                    >
                        <Tooltip events={TOOLTIP_EVENTS} withArrow label="Filter options">
                            <ActionIcon variant="subtle" color="navy" size="md" radius="sm">
                                <FilterAltRoundedIcon />
                            </ActionIcon>
                        </Tooltip>
                    </Indicator>
                </ComboboxPopover.Target>
            </ComboboxPopover>
            {filterValue && (
                <Tooltip events={TOOLTIP_EVENTS} label="Clear filter" withArrow>
                    <ActionIcon
                        variant="subtle"
                        color="navy"
                        size="sm"
                        radius="sm"
                        p={0}
                        w={0}
                        onClick={clearFilter}
                        aria-label="Clear filter"
                    >
                        <CloseIcon />
                    </ActionIcon>
                </Tooltip>
            )}
        </Group>
    );
};