import { useState, type MouseEvent } from "react";

export function useMemberEventSection() {
    const [isCollapsed, setIsCollapsed] = useState(false);

    const handleToggle = (event: MouseEvent) => {
        event.stopPropagation();
        setIsCollapsed((prev) => !prev);
    };

    return { isCollapsed, handleToggle };
}