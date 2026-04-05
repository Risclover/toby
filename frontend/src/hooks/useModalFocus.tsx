import { useEffect, useRef } from "react";

export const useModalFocus = <T extends HTMLElement = HTMLInputElement>(autoFocus = true) => {
    const ref = useRef<T>(null);

    const transitionProps = {
        onEntered: () => { if (autoFocus) ref.current?.focus(); }
    };

    return { ref, transitionProps };
};