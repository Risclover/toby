import { useEffect } from "react";

export const useTasklistTheme = (color?: string) => {
    useEffect(() => {
        if (!color) return;
        document.documentElement.style.setProperty("--tasklist-color", color);
    }, [color]);
};