import { useEffect, useState } from "react";

export const useInfiniteScroll = ({ items, renderItem, itemsPerPage = 10 }) => {
    const [visibleItems, setVisibleItems] = useState(itemsPerPage);

    useEffect(() => {
        const handleScroll = () => {
            const scrolledToBottom =
                window.innerHeight + window.scrollY >= document.body.offsetHeight;

            if (scrolledToBottom) {
                setVisibleItems((prevVisibleItems) =>
                    Math.min(prevVisibleItems + itemsPerPage, items.length)
                );
            }
        };

        window.addEventListener('scroll', handleScroll);

        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, [items, itemsPerPage]);

    return { visibleItems }
}