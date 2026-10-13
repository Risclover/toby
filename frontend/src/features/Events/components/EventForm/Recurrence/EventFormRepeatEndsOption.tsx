import type { ReactNode } from "react";
import { Radio } from "@mantine/core";

import type { EndsMode } from "../../../hooks/useEventFormRepeatCustom";

type Props = {
    /** Ends mode this card selects */
    value: EndsMode;
    /** Text shown next to the radio indicator */
    label: string;
    /** Optional input that belongs to this option */
    children?: ReactNode;
};

export const EventFormRepeatEndsOption = ({ value, label, children }: Props) => (
    <Radio.Card value={value} className="radio-root">
        <div className="radio-root-label">
            <Radio.Indicator color="navy" />
            <span className="radio-label">{label}</span>
        </div>
        {children}
    </Radio.Card>
);