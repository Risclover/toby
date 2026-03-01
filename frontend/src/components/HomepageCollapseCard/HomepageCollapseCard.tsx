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
        // Default to TRUE if no value is saved, or parse the saved string
        return saved !== null ? JSON.parse(saved) : true;
    });

    useEffect(() => {
        localStorage.setItem(CARD_KEY, JSON.stringify(showCard));
    }, [showCard]);


    return (
        <div className="homepage-collapse-card">
            <HomepageCollapseCardTitle dotColor={color} title={title} setShowCard={setShowCard} showCard={showCard} badge={badge} />
            <Collapse
                in={showCard}
                transitionDuration={100}
                transitionTimingFunction="ease-in-out"
            >
                <HomepageCollapseCardBody>{children}</HomepageCollapseCardBody>
            </Collapse>
        </div>
    )
}