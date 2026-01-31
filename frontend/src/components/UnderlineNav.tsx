import React, { useLayoutEffect, useMemo, useRef, useState } from "react";
import "./UnderlineNav.css";

type Item = { id: string; label: string; href: string };

export function UnderlineNav({
    items,
    activeId,
    onNavigate,
}: {
    items: Item[];
    activeId: string;
    onNavigate?: (href: string) => void;
}) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const itemRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
    const [indicator, setIndicator] = useState({ left: 0, width: 0, visible: false });

    const activeItem = useMemo(() => items.find((i) => i.id === activeId), [items, activeId]);

    const measure = () => {
        const container = containerRef.current;
        const el = activeItem ? itemRefs.current[activeItem.id] : null;
        if (!container || !el) return;

        const c = container.getBoundingClientRect();
        const r = el.getBoundingClientRect();

        setIndicator({
            left: r.left - c.left,
            width: r.width,
            visible: true,
        });
    };

    useLayoutEffect(() => {
        measure();

        const ro = new ResizeObserver(measure);
        if (containerRef.current) ro.observe(containerRef.current);
        window.addEventListener("resize", measure);

        return () => {
            ro.disconnect();
            window.removeEventListener("resize", measure);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeId, items.length]);

    return (
        <div className="unav" ref={containerRef}>
            {items.map((item) => (
                <a
                    key={item.id}
                    href={item.href}
                    ref={(node) => {
                        itemRefs.current[item.id] = node;
                    }}
                    className={`unav__link ${item.id === activeId ? "is-active" : ""}`}
                    onClick={(e) => {
                        if (onNavigate) {
                            e.preventDefault();
                            onNavigate(item.href);
                        }
                    }}
                >
                    {item.label}
                </a>
            ))}

            <span
                aria-hidden="true"
                className="unav__indicator"
                style={{
                    transform: `translateX(${indicator.left}px)`,
                    width: `${indicator.width}px`,
                    opacity: indicator.visible ? 1 : 0,
                }}
            />
        </div>
    );
}
