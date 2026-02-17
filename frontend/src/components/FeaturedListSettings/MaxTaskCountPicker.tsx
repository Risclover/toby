import { useState } from 'react';
import { FloatingIndicator, UnstyledButton, Group, Text, Box } from '@mantine/core';
import classes from './TaskCountPicker.module.css';

// 1. Define your options
const OPTIONS = [
    { label: '3', value: 3 },
    { label: '5', value: 5 },
    { label: '10', value: 10 },
    { label: 'All', value: -1 }, // Use -1 or null to represent "All"
];

type Props = {
    value: number;
    onChange: (value: number) => void;
};

export function MaxTaskCountPicker({ value, onChange }: Props) {
    const [rootRef, setRootRef] = useState<HTMLDivElement | null>(null);
    const [controlsRefs, setControlsRefs] = useState<Record<string, HTMLButtonElement | null>>({});

    // 2. Helper to capture refs for each button
    const setControlRef = (val: string) => (node: HTMLButtonElement) => {
        controlsRefs[val] = node;
        setControlsRefs(controlsRefs);
    };

    // 3. Determine active value for the indicator
    // We convert the number to a string key to match our options logic
    const activeValue = value.toString();

    const controls = OPTIONS.map((item) => {
        const isActive = item.value === value;
        return (
            <UnstyledButton
                key={item.label}
                ref={setControlRef(item.value.toString())}
                onClick={() => onChange(item.value)}
                className={classes.control}
                data-active={isActive || undefined}
            >
                <span className={classes.controlLabel}>{item.label}</span>
            </UnstyledButton>
        );
    });

    return (
        <div className={classes.root} ref={setRootRef}>
            {/* 4. The Magic Indicator */}
            <FloatingIndicator
                target={controlsRefs[activeValue]}
                parent={rootRef}
                className={classes.indicator}
            />
            <div className={classes.controlsGroup}>
                {controls}
            </div>
        </div>
    );
}
