import React, { useEffect, useState } from "react"
import { Collapse } from "@mantine/core"
import { HomepageCollapseCardBody } from "./HomepageCollapseCardBody"
import { HomepageCollapseCardTitle } from "./HomepageCollapseCardTitle"
import { useCollapseScroll } from "@/hooks"
import { getCardOpen, setCardOpen } from "@/utils"

type Props = {
    cardKey: string;
    title: string;
    color: string;
    badge?: React.ReactNode;
    scrollSelector?: string | string[];
    children: React.ReactNode;
    noTopMargin?: boolean;
}

export const HomepageCollapseCard = ({ cardKey, title, color, badge, scrollSelector, noTopMargin, children }: Props) => {
    const [showCard, setShowCard] = useState(() => getCardOpen(cardKey));
    const [hasAnimated, setHasAnimated] = useState(!showCard);
    const { containerRef, resetScroll } = useCollapseScroll(scrollSelector ?? []);

    useEffect(() => {
        setCardOpen(cardKey, showCard);
    }, [cardKey, showCard]);

    const handleToggle = () => {
        if (!showCard) resetScroll();
        setShowCard((v: boolean) => !v);
        setHasAnimated(true);
    };

    return (
        <div className={`homepage-collapse-card fade-in${noTopMargin ? " no-top-margin" : ""}`} ref={containerRef}>

            <HomepageCollapseCardTitle dotColor={color} title={title} setShowCard={handleToggle} showCard={showCard} badge={badge} />
            <Collapse in={showCard} transitionDuration={hasAnimated ? 100 : 0} transitionTimingFunction="ease-in-out" keepMounted>
                <HomepageCollapseCardBody>{children}</HomepageCollapseCardBody>
            </Collapse>
        </div>
    );
};