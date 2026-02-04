import { useState, useRef, useCallback, useEffect } from 'react';

export const useScrollProgress = () => {
    const viewportRef = useRef<HTMLDivElement>(null);
    const [isAtStart, setIsAtStart] = useState(true);
    const [isAtEnd, setIsAtEnd] = useState(false);

    const handleScroll = useCallback(() => {
        const { scrollLeft, scrollWidth, clientWidth } = viewportRef.current!;

        // We use a 5px buffer to account for sub-pixel rounding
        setIsAtStart(scrollLeft <= 5);
        setIsAtEnd(scrollLeft + clientWidth >= scrollWidth - 5);
    }, []);

    useEffect(() => {
        const viewport = viewportRef.current;
        if (viewport) {
            viewport.addEventListener('scroll', handleScroll);
            // Run once on mount to set initial state
            handleScroll();
            return () => viewport.removeEventListener('scroll', handleScroll);
        }
    }, [handleScroll]);

    return { viewportRef, isAtStart, isAtEnd };
};