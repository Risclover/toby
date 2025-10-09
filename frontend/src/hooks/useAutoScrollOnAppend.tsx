import { useLayoutEffect, useRef } from "react";

type Options = {
    behavior?: ScrollBehavior;          // "auto" | "smooth"
    requireNearBottom?: boolean;        // default false => always scroll on append
    thresholdPx?: number;               // if requireNearBottom=true
};

// works with useRef<HTMLDivElement>(null) etc.
type AnyRef<E extends HTMLElement> = { current: E | null };

export function useAutoScrollOnAppend<E extends HTMLElement>(
    containerRef: AnyRef<E>,
    itemCount: number,
    {
        behavior = "smooth",
        requireNearBottom = false,
        thresholdPx = 80,
    }: Options = {}
) {
    const prevCountRef = useRef(itemCount);

    useLayoutEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const isAppend = itemCount > prevCountRef.current;
        prevCountRef.current = itemCount;
        if (!isAppend) return;

        // Only if the container *can* scroll
        if (el.scrollHeight <= el.clientHeight) return;

        // Optionally respect the user's position
        if (requireNearBottom) {
            const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
            if (distanceFromBottom > thresholdPx) return;
        }

        // Double rAF ensures the new row has painted & affected layout
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                el.scrollTo({ top: el.scrollHeight, behavior });
            });
        });
    }, [itemCount, containerRef, behavior, requireNearBottom, thresholdPx]);
}
