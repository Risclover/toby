import { useEffect, useRef } from "react";

export const useModalFocus = (isOpen: boolean) => {
    const ref = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!isOpen) return;
        setTimeout(() => ref.current?.focus(), 200);
    }, [isOpen]);

    return ref;
};