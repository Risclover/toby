import React, { useEffect, useState } from "react"
import { Collapse } from "@mantine/core"
import { HomepageCollapseCardBody } from "./HomepageCollapseCardBody"
import { HomepageCollapseCardTitle } from "./HomepageCollapseCardTitle"

type Props = {
    cardKey: string;
    title: string;
    color: string;
    badge?: React.ReactNode,
    children: React.ReactNode;
}

export const HomepageCollapseCard = ({ cardKey, title, color, badge, children }: Props) => {
    const CARD_KEY = `homepage-card-${cardKey}`;
    const [showCard, setShowCard] = useState(() => {
        const saved = localStorage.getItem(CARD_KEY);
        return saved !== null ? JSON.parse(saved) : true;
    });
    const [hasAnimated, setHasAnimated] = useState(!showCard); // if starts open, skip first animation

    useEffect(() => {
        localStorage.setItem(CARD_KEY, JSON.stringify(showCard));
    }, [showCard]);

    return (
        <div className="homepage-collapse-card fade-in">
            <HomepageCollapseCardTitle dotColor={color} title={title} setShowCard={() => { setShowCard((v: boolean) => !v); setHasAnimated(true); }} showCard={showCard} badge={badge} />
            <Collapse
                in={showCard}
                transitionDuration={hasAnimated ? 100 : 0}
                transitionTimingFunction="ease-in-out"
                keepMounted
            >
                <HomepageCollapseCardBody>{children}</HomepageCollapseCardBody>
            </Collapse>
        </div>
    )
}