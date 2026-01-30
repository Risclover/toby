import { Tooltip } from "@mantine/core";
import { useState, type ReactNode } from "react";

interface Props {
    children: ReactNode;
    label: string; // 🚀 Make it reusable
    color?: string;
}

export function TasklistCardTooltip({ children, label, color }: Props) {
    const [opened, setOpened] = useState(false);

    return (
        <Tooltip
            label={label}
            opened={opened}
            color={color}
            withArrow
            position="top"
            offset={5}
        >
            <div
                className="mobile-tasklist-card-data-item"
                tabIndex={0} // Allows keyboard focus
                onFocus={() => setOpened(true)}
                onBlur={() => setOpened(false)}
                onMouseEnter={() => setOpened(true)}
                onMouseLeave={() => setOpened(false)}
                // 🚀 Touch support for mobile
                onTouchStart={(e) => { e.stopPropagation(); setOpened(true) }}
                onClick={(e) => { e.stopPropagation(); setOpened((prev) => !prev) }}
            >
                {children}
            </div>
        </Tooltip>
    );
}