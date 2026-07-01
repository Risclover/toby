import { useEffect, useState } from "react";

export const useIsScrolledToTop = () => {
    const [isAtTop, setIsAtTop] = useState(window.scrollY === 0);

    useEffect(() => {
        const handleScroll = () => setIsAtTop(window.scrollY === 0);
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return isAtTop;
};