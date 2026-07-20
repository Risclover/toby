import { Combobox, InputBase, useCombobox, useModalsStack } from "@mantine/core"
import type { DateTimeStringValue } from "@mantine/dates"
import dayjs from "dayjs"
import { useEffect, useState } from "react";
import { nthWeekdaySuffix, describeCustomRecurrenceRule, matchingPresetKind } from "../../utils/recurrence";
import type { CustomRecurrenceRule, PresetKind } from "../../utils/recurrence";

type ModalId = 'recurrence' | 'event-form';

type Props = {
    stack: ReturnType<typeof useModalsStack<ModalId>>
    dateValue: DateTimeStringValue;
    // Owned by the parent so EventFormRepeatCustom can hand back a finished
    // rule and have it show up here. null until the user has ever opened
    // "Custom..." and closed it with something configured.
    customRule: CustomRecurrenceRule | null;
}

export const EventFormRepeat = ({ dateValue, stack, customRule }: Props) => {
    const today = dayjs(dateValue);
    const dayOfWeek = today.format("dddd");
    const annualFormat = today.format("MMMM DD");

    const [repeatKind, setRepeatKind] = useState<PresetKind | 'custom'>('none');

    const labelsByPreset: Record<PresetKind, string> = {
        none: "Does not repeat",
        daily: "Daily",
        weekly: `Weekly on ${dayOfWeek}`,
        monthly: `Monthly on ${nthWeekdaySuffix(today)}`,
        annually: `Annually on ${annualFormat}`,
        weekday: "Every weekday (Monday to Friday)",
    };

    // Whenever a new custom rule comes in from the modal: if it's really
    // just a preset in disguise (e.g. "every 1 week on Tuesday" when today
    // IS Tuesday), select the existing preset instead of adding a
    // duplicate-looking row. Otherwise select the genuinely custom option.
    useEffect(() => {
        if (!customRule) return;
        const preset = matchingPresetKind(customRule, today);
        setRepeatKind(preset ?? 'custom');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [customRule]);

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
        stack.open('recurrence');
        stack.close('event-form');
    }

    return (
        <div className="event-form-repeat-dropdown">
            <Combobox
                store={combobox}
                onOptionSubmit={(val) => {
                    setRepeatKind(val as PresetKind | 'custom');
                    combobox.closeDropdown();
                }}
            >
                <Combobox.Target>
                    <InputBase
                        component="button"
                        type="button"
                        pointer
                        rightSection={<Combobox.Chevron />}
                        rightSectionPointerEvents="none"
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