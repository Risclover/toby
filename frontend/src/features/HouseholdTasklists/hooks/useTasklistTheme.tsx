import { useEffect } from "react";

export const useTasklistTheme = (color?: string) => {
    useEffect(() => {
        if (color) {
            document.documentElement.style.setProperty("--tasklist-color", color);
        } else {
            document.documentElement.style.removeProperty("--tasklist-color");
        }
    }, [color]);
};