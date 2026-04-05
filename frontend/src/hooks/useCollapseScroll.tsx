import { useRef } from "react";

export const useCollapseScroll = (selectors: string | string[]) => {
    const containerRef = useRef<HTMLDivElement>(null);

    const resetScroll = () => {
        const list = Array.isArray(selectors) ? selectors : [selectors];
        list.forEach(selector => {
            const el = containerRef.current?.querySelector(selector) as HTMLElement | null;
            if (el) el.scrollTop = 0;
        });
    };

    return { containerRef, resetScroll };
};