import { useEffect } from "react";

export function useScrollToTopOnChange(trigger: unknown) {
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: "auto" });
    }, [trigger]);
}