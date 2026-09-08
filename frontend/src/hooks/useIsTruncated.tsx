import { useEffect, useRef, useState } from "react";

export function useIsTruncated<T extends HTMLElement>() {
    const ref = useRef<T>(null);
    const [isTruncated, setIsTruncated] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const checkTruncation = () => setIsTruncated(el.scrollWidth > el.clientWidth);
        checkTruncation();

        const observer = new ResizeObserver(checkTruncation);
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    return { ref, isTruncated };
}