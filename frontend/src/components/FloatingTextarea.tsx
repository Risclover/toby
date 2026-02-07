import { useState } from 'react';
import { Textarea } from '@mantine/core';
import classes from "../features/Reminders/styles/Reminders.module.css"

type Props = {
    label: string;
}
export function FloatingTextarea({ label }: Props) {
    const [focused, setFocused] = useState(false);
    const [value, setValue] = useState('');

    // Determine if the label should float
    const floating = focused || value.trim().length > 0 || undefined;

    return (
        <Textarea
            label={label}
            placeholder="Hello" /* Placeholder is often hidden or empty for this pattern */
            required

            // STYLES API HOOKUP
            classNames={{
                root: classes.root,
                input: classes.textarea,
                label: classes.label,
            }}

            // Pass the floating state to the label via a data attribute
            labelProps={{
                'data-floating': floating,
            }}

            // State management
            value={value}
            onChange={(event) => setValue(event.currentTarget.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}

            // Optional: Standard Textarea props
            minRows={2}
            maxRows={6}
            autosize
            mt="lg"
            autoComplete="off"

            data-floating={floating}

        />
    );
}
