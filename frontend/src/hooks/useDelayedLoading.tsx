import { useEffect, useState } from "react";

export const useDelayedLoading = (isLoading: boolean, delay = 200) => {
    const [show, setShow] = useState(false);

    useEffect(() => {
        if (!isLoading) {
            setShow(false);
            return;
        }
        const timer = setTimeout(() => setShow(true), delay);
        return () => clearTimeout(timer);
    }, [isLoading, delay]);

    return show;
}