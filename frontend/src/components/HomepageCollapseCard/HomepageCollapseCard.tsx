import React, { useEffect, useState } from "react"
import { Collapse } from "@mantine/core"
import { HomepageCollapseCardBody } from "./HomepageCollapseCardBody"
import { HomepageCollapseCardTitle } from "./HomepageCollapseCardTitle"
import { useCollapseScroll } from "@/hooks"

type Props = {
    cardKey: string;
    title: string;
    color: string;
    badge?: React.ReactNode;
    scrollSelector?: string | string[];
    children: React.ReactNode;
}

export const HomepageCollapseCard = ({ cardKey, title, color, badge, scrollSelector, children }: Props) => {
    const CARD_KEY = `homepage-card-${cardKey}`;
    const [showCard, setShowCard] = useState(() => {
        const saved = localStorage.getItem(CARD_KEY);
        return saved !== null ? JSON.parse(saved) : true;
    });
    const [hasAnimated, setHasAnimated] = useState(!showCard);
    const { containerRef, resetScroll } = useCollapseScroll(scrollSelector ?? []);

    useEffect(() => {
        localStorage.setItem(CARD_KEY, JSON.stringify(showCard));
    }, [showCard]);

    const handleToggle = () => {
        if (!showCard) resetScroll(); // reset before opening
        setShowCard((v: boolean) => !v);
        setHasAnimated(true);
    };

    return (
        <div className="homepage-collapse-card fade-in" ref={containerRef}>
            <HomepageCollapseCardTitle dotColor={color} title={title} setShowCard={handleToggle} showCard={showCard} badge={badge} />
            <Collapse in={showCard} transitionDuration={hasAnimated ? 100 : 0} transitionTimingFunction="ease-in-out" keepMounted>
                <HomepageCollapseCardBody>{children}</HomepageCollapseCardBody>
            </Collapse>
        </div>
    );
};