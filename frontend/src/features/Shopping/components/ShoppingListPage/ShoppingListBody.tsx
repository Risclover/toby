import React, { forwardRef } from "react";

type Props = { children: React.ReactNode };

export const ShoppingListBody = forwardRef<HTMLDivElement, Props>(({ children }, ref) => {
    return (
        <div className="household-tasklist-page-list">
            <div className="household-tasklist-page-tasks">
                <ul className="tasklist">{children} <li ref={ref} aria-hidden /></ul>
            </div>
        </div>
    );
});