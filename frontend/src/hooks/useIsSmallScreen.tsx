import { useState, useEffect } from "react";

export function useIsSmallScreen(maxWidth = 768) {
    const [isSmall, setIsSmall] = useState(() => window.innerWidth <= maxWidth);
    useEffect(() => {
        const onResize = () => setIsSmall(window.innerWidth <= maxWidth);
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, [maxWidth]);
    return isSmall;
}
