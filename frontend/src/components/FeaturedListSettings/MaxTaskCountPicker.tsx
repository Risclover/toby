import { useRef, useState } from 'react';
import { FloatingIndicator, UnstyledButton } from '@mantine/core';
import classes from './TaskCountPicker.module.css';
import type { ShoppingList } from '@/store';

const OPTIONS = [
    { label: '3', value: 3 },
    { label: '5', value: 5 },
    { label: '10', value: 10 },
    { label: 'All', value: -1 },
];

type Props = {
    value: number;
    onChange: (value: number) => void;
    list?: ShoppingList;
    disabled?: boolean;
};

export function MaxTaskCountPicker({ value, onChange, list, disabled = false }: Props) {
    const [rootRef, setRootRef] = useState<HTMLDivElement | null>(null);
    const [controlsRefs, setControlsRefs] = useState<Record<string, HTMLButtonElement | null>>({});

    // BUG FIX: `ref={setControlRef(val)}` was creating a brand-new function
    // every render. React treats a callback ref with a new identity as
    // "detach then reattach" on every render — which called setControlsRefs
    // again, triggering a re-render, which created new callbacks again, on
    // and on. This is what "Maximum update depth exceeded" was pointing at.
    // Caching one stable callback per option value (created once, reused
    // across renders) breaks the loop: React only invokes it on actual
    // mount/unmount of that button, not on every render.
    const refCallbacks = useRef<Record<string, (node: HTMLButtonElement | null) => void>>({});

    const getControlRef = (val: string) => {
        if (!refCallbacks.current[val]) {
            refCallbacks.current[val] = (node: HTMLButtonElement | null) => {
                setControlsRefs((prev) => {
                    if (prev[val] === node) return prev; // no-op if nothing actually changed
                    return { ...prev, [val]: node };
                });
            };
        }
        return refCallbacks.current[val];
    };

    const activeValue = value.toString();

    const controls = OPTIONS.map((item) => {
        const isActive = item.value === value;
        return (
            <UnstyledButton
                key={item.label}
                ref={getControlRef(item.value.toString())}
                onClick={() => { if (!disabled) onChange(item.value); }}
                className={classes.control}
                data-active={isActive || undefined}
                data-disabled={disabled || undefined}
                aria-disabled={disabled}
            >
                <span className={classes.controlLabel}>{item.label}</span>
            </UnstyledButton>
        );
    });

    return (
        <div className={classes.root} ref={setRootRef} data-disabled={disabled || undefined} style={disabled ? { opacity: 0.5, pointerEvents: 'none' } : undefined}>
            <FloatingIndicator
                target={controlsRefs[activeValue]}
                parent={rootRef}
                className={classes.indicator}
                style={{
                    backgroundColor: list?.color
                }}
            />
            <div className={classes.controlsGroup}>
                {controls}
            </div>
        </div>
    );
}