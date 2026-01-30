import { forwardRef, type ReactNode } from "react";

export function TasklistCardTooltip({
    children,
    innerRef,
}: {
    children: ReactNode;
    innerRef?: React.ForwardedRef<HTMLDivElement>;
}) {
    return (
        <div ref={innerRef} className="mobile-tasklist-card-data-item">
            {children}
        </div>
    );
};