// useStablePending.ts
import { useEffect, useRef, useState } from "react";

export function useStablePending(
    pending: boolean,
    { showAfterMs = 120, minVisibleMs = 300 } = {}
) {
    const [show, setShow] = useState(false);
    const shownAt = useRef<number | null>(null);
    useEffect(() => {
        let t1: any, t2: any;
        if (pending) {
            // Delay before showing the loader
            t1 = setTimeout(() => {
                shownAt.current = Date.now();
                setShow(true);
            }, showAfterMs);
        } else {
            // Keep the loader visible for at least minVisibleMs
            const elapsed = shownAt.current ? Date.now() - shownAt.current : 0;
            const remaining = Math.max(minVisibleMs - elapsed, 0);
            t2 = setTimeout(() => {
                setShow(false);
                shownAt.current = null;
            }, remaining);
        }
        return () => { clearTimeout(t1); clearTimeout(t2); };
    }, [pending, showAfterMs, minVisibleMs]);
    return show;
}
