import { CloseButton, Combobox, InputBase, ScrollArea, useModalsStack } from "@mantine/core"
import type { DateTimeStringValue } from "@mantine/dates"

import { useEventFormRepeat } from "../../../hooks/useEventFormRepeat";
import { type CustomRecurrenceRule, type PresetKind } from "../../../utils/recurrence";
import type { ModalId } from "../../../types";

import EventRepeatRoundedIcon from '@mui/icons-material/EventRepeatRounded';



type Props = {
    /** Modal stack */
    stack: ReturnType<typeof useModalsStack<ModalId>> | undefined;
    /** Start date (date clicked to open form) */
    dateValue: DateTimeStringValue;
    /** Custom recurrence rule */
    customRule: CustomRecurrenceRule | null;
    /** Kind of repeat (e.g. daily, weekly) */
    repeatKind: PresetKind | 'custom';
    /** Callback for when the repeat kind of changed; changes what is rendered */
    onRepeatKindChange: (kind: PresetKind | 'custom') => void;
}

/** Recurring event options combobox, inside event form */
export const EventFormRepeat = ({
    dateValue,
    stack,
    customRule,
    repeatKind,
    onRepeatKindChange
}: Props) => {
    const {
        // Display labels
        labelsByPreset,
        presetKinds,
        customLabel,
        customIsDuplicate,
        value,
        // Combobox store & option handling
        combobox,
        onOptionSubmit,
        // Modal stack navigation
        toggleStack,
    } = useEventFormRepeat({
        dateValue,
        customRule,
        repeatKind,
        stack,
        onRepeatKindChange
    })
    return (
        <div className="event-form-repeat-dropdown">
            <Combobox
                store={combobox}
                floatingHeight="viewport"
                onOptionSubmit={onOptionSubmit}
            >
                <Combobox.Target>
                    <InputBase
                        component="button"
                        type="button"
                        label="Recurrence"
                        pointer
                        multiline
                        leftSection={
                            <EventRepeatRoundedIcon
                                style={{
                                    fill: "rgb(5, 5, 73)"
                                }}
                            />
                        }
                        leftSectionWidth="40px"
                        leftSectionProps={{ color: "rgb(5, 5, 73)" }}
                        rightSection={
                            (value !== null && repeatKind !== "none") ? (
                                <CloseButton
                                    size="sm"
                                    onMouseDown={(event) => event.preventDefault()}
                                    onClick={() => onRepeatKindChange("none")}
                                    aria-label="Clear value"
                                />
                            ) : (
                                <Combobox.Chevron />
                            )
                        }
                        rightSectionPointerEvents={repeatKind === "none" ? 'none' : 'all'}
                        onClick={() => combobox.toggleDropdown()}
                    >
                        {value}
                    </InputBase>
                </Combobox.Target>

                <Combobox.Dropdown>
                    <ScrollArea.Autosize mah="var(--combobox-floating-options-max-height)">
                        <Combobox.Options>
                            {presetKinds.map((kind) => (
                                <Combobox.Option value={kind} key={kind} >
                                    {labelsByPreset[kind]}
                                </Combobox.Option>
                            ))}
                            {/** Render custom recurrence as new combobox option */}
                            {customLabel && !customIsDuplicate && (
                                <Combobox.Option value="custom" key="custom">
                                    {customLabel}
                                </Combobox.Option>
                            )}
                            <Combobox.Option value="open-custom" key="open-custom" onClick={toggleStack}>
                                Custom...
                            </Combobox.Option>
                        </Combobox.Options>
                    </ScrollArea.Autosize>
                </Combobox.Dropdown>
            </Combobox>
        </div>
    )
}