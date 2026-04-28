import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export const useCloseModalOnNavigate = (close: () => void) => {
    const { pathname } = useLocation();
    useEffect(() => {
        close();
    }, [pathname]);
};