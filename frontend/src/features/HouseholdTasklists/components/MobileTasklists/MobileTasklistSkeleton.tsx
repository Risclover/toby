import { Skeleton } from "@mantine/core";

export const MobileTasklistSkeleton = () => (
    <ul className="homepage-lists-tasklist">
        {Array.from({ length: 3 }).map((_, i) => (
            <li key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: ".75rem" }}>
                    <Skeleton circle width={16} height={16} />
                    <Skeleton width={140} height={8} radius="sm" />
                </div>
                <Skeleton circle width={16} height={16} />
            </li>
        ))}
    </ul>
);