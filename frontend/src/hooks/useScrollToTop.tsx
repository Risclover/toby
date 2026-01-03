// hooks/useScrollToTop.ts
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export const useScrollToTop = (trigger?: unknown) => {
    const { pathname } = useLocation();

    useEffect(() => {
        window.scrollTo({
            top: 0,
            left: 0,
            behavior: "instant",
        });
    }, [pathname, trigger]); // Runs on route change OR trigger change
};
