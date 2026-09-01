import { CloseButton, Combobox, InputBase, useCombobox, useModalsStack } from "@mantine/core"
import type { DateTimeStringValue } from "@mantine/dates"
import dayjs from "dayjs"
import { nthWeekdaySuffix, describeCustomRecurrenceRule, matchingPresetKind } from "../../../utils/recurrence";
import type { CustomRecurrenceRule, PresetKind } from "../../../utils/recurrence";
import EventRepeatRoundedIcon from '@mui/icons-material/EventRepeatRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';

type ModalId = 'recurrence' | 'event-form' | 'events-list';

type Props = {
    stack: ReturnType<typeof useModalsStack<ModalId>> | undefined;
    dateValue: DateTimeStringValue;
    customRule: CustomRecurrenceRule | null;
    // Was local state -- lifted so QuickAddEvent's handleSave can see what's
    // currently selected when building the RRULE to actually save.
    repeatKind: PresetKind | 'custom';
    onRepeatKindChange: (kind: PresetKind | 'custom') => void;
}

export const EventFormRepeat = ({ dateValue, stack, customRule, repeatKind, onRepeatKindChange }: Props) => {
    const today = dayjs(dateValue);
    const dayOfWeek = today.format("dddd");
    const annualFormat = today.format("MMMM DD");

    const labelsByPreset: Record<PresetKind, string> = {
        none: "Does not repeat",
        daily: "Daily",
        weekly: `Weekly on ${dayOfWeek}`,
        monthly: `Monthly on ${nthWeekdaySuffix(today)}`,
        annually: `Annually on ${annualFormat}`,
        weekday: "Every weekday (Monday to Friday)",
    };

    // NOTE: repeatKind is NOT synced from customRule here anymore. That
    // used to be a useEffect keyed on [customRule], but effects run on
    // every mount regardless of the dependency array -- and since
    // customRule is deliberately kept around after switching to a preset
    // (so it stays selectable in the dropdown below), any remount of this
    // component for ANY reason would silently re-derive and reapply
    // 'custom', clobbering whatever preset was actually active. The sync
    // now happens exactly once, explicitly, at the moment Save is pressed
    // in the custom recurrence modal -- see handleApplyCustomRule in
    // EventForm.tsx.

    const presetKinds: PresetKind[] = ['none', 'daily', 'weekly', 'monthly', 'annually', 'weekday'];

    const customLabel = customRule ? describeCustomRecurrenceRule(customRule, today) : null;
    const customIsDuplicate = customRule ? matchingPresetKind(customRule, today) !== null : true;

    const value = repeatKind === 'custom' && customLabel ? customLabel : labelsByPreset[repeatKind as PresetKind];

    const combobox = useCombobox({
        onDropdownClose: () => combobox.resetSelectedOption(),
    });

    const options = presetKinds.map((kind) => (
        <Combobox.Option value={kind} key={kind}>
            {labelsByPreset[kind]}
        </Combobox.Option>
    ));

    const toggleStack = () => {
        stack?.open('recurrence');
        stack?.close('event-form');
    }

    return (
        <div className="event-form-repeat-dropdown">
            <Combobox
                store={combobox}
                onOptionSubmit={(val) => {
                    // Mantine fires onOptionSubmit for EVERY option click,
                    // even when that option also has its own onClick prop --
                    // verified empirically (both fire unconditionally, and
                    // preventDefault/stopPropagation in the custom onClick
                    // doesn't stop it). The "Custom..." option below only
                    // exists to open the recurrence modal via toggleStack --
                    // it was never meant to be a selectable repeatKind, but
                    // every click was silently calling
                    // onRepeatKindChange("open-custom"), a value that isn't
                    // a real PresetKind or 'custom'. That corrupted
                    // repeatKind immediately, and nothing downstream
                    // (including Cancel) ever fixed it back. Filter it out
                    // here so opening Custom never touches repeatKind at
                    // all -- Cancel then has nothing to revert, because
                    // nothing was ever changed until an actual Save.
                    if (val === 'open-custom') {
                        combobox.closeDropdown();
                        return;
                    }
                    onRepeatKindChange(val as PresetKind | 'custom');
                    combobox.closeDropdown();
                }}
            >
                <Combobox.Target>
                    <InputBase
                        component="button"
                        type="button"
                        label="Recurrence"
                        pointer
                        multiline
                        leftSection={<EventRepeatRoundedIcon style={{ fill: "rgb(5, 5, 73)" }} />}
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
                        rightSectionPointerEvents={value === "none" ? 'none' : 'all'}
                        onClick={() => combobox.toggleDropdown()}
                    >
                        {value}
                    </InputBase>
                </Combobox.Target>
                <Combobox.Dropdown>
                    <Combobox.Options>
                        {options}
                        {customLabel && !customIsDuplicate && (
                            <Combobox.Option value="custom" key="custom">
                                {customLabel}
                            </Combobox.Option>
                        )}
                        <Combobox.Option value="open-custom" key="open-custom" onClick={toggleStack}>
                            Custom...
                        </Combobox.Option>
                    </Combobox.Options>
                </Combobox.Dropdown>
            </Combobox>
        </div>
    )
}
