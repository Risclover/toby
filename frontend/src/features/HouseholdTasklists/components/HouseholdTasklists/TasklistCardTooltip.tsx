import { Tooltip } from "@mantine/core";
import { useState, type ReactNode } from "react";

interface Props {
    children: ReactNode;
    label: string;
    color?: string; // e.g., "red", "orange", "blue"
    stat: number | undefined;
}

export function TasklistCardTooltip({ children, label, color, stat }: Props) {
    const [opened, setOpened] = useState(false);

    // 1. Determine color logic here. 
    // If stat is 0, force grey. Otherwise, use the passed color or default to inherit.
    const activeColor = stat === 0 ? "var(--mantine-color-gray-6)" : color;

    return (
        <Tooltip
            label={label}
            opened={opened}
            withArrow
            position="top"
            offset={5}
            openDelay={300}
            closeDelay={100}
        >
            <div
                className="mobile-tasklist-card-data-item"
                // 2. Apply color directly via style. This is cleaner than multiple CSS classes.
                style={{ color: activeColor }}
                tabIndex={0}
                onFocus={() => setOpened(true)}
                onBlur={() => setOpened(false)}
                onMouseEnter={() => setOpened(true)}
                onMouseLeave={() => setOpened(false)}
                onTouchStart={(e) => {
                    e.stopPropagation();
                    setOpened(true);
                }}
                onClick={(e) => {
                    e.stopPropagation();
                    setOpened((prev) => !prev);
                }}
            >
                {children}
            </div>
        </Tooltip>
    );
}
