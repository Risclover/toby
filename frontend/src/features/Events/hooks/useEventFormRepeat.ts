import dayjs from "dayjs";
import { useCombobox, useModalsStack } from "@mantine/core";
import type { DateTimeStringValue } from "@mantine/dates";

import {
    describeCustomRecurrenceRule,
    matchingPresetKind,
    nthWeekdaySuffix,
    type CustomRecurrenceRule,
    type PresetKind
} from "../utils/recurrence";
import type { ModalId } from "../types";


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

// Custom hook for logic for EventFormRepeat component
export const useEventFormRepeat = ({
    dateValue,
    customRule,
    repeatKind,
    stack,
    onRepeatKindChange
}: Props) => {

    /** ---------- Display labels ---------- */

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

    const presetKinds: PresetKind[] = ['none', 'daily', 'weekly', 'monthly', 'annually', 'weekday'];

    const customLabel = customRule ? describeCustomRecurrenceRule(customRule, today) : null;
    const customIsDuplicate = customRule ? matchingPresetKind(customRule, today) !== null : true;

    const value = repeatKind === 'custom' && customLabel ? customLabel : labelsByPreset[repeatKind as PresetKind];


    // ---------- Combobox store & option handling ----------
    const combobox = useCombobox({
        onDropdownClose: () => combobox.resetSelectedOption(),
    });

    const onOptionSubmit = (val: string) => {
        if (val === 'open-custom') {
            combobox.closeDropdown();
            return;
        }
        onRepeatKindChange(val as PresetKind | 'custom');
        combobox.closeDropdown();
    }


    // ---------- Modal stack navigation ----------
    const toggleStack = () => {
        stack?.open('recurrence');
        stack?.close('event-form');
    }

    return {
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
    }

}