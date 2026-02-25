import { AppRoutes } from "@/routes"
import { Sidebar } from "@/layout/Sidebar"
import { useMantineColorScheme } from "@mantine/core";
import { useEffect, useState } from "react";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useIsSmallScreen } from "@/hooks/useIsSmallScreen";
import { useScrollToTop } from "@/hooks/useScrollToTop";
import { CreateTasklist } from "@/features";
import { useAuthenticateQuery } from "@/store";

export const Layout = () => {
    const isMobile = useIsMobile();
    const isSmallScreen = useIsSmallScreen();
    useScrollToTop();
    const { setColorScheme } = useMantineColorScheme();
    const [sidebarExpanded, setSidebarExpanded] = useState(() => {
        try { return localStorage.getItem("sidebar-collapsed") === "1"; }
        catch { return false; }
    });

    const { data: user } = useAuthenticateQuery();

    // Guard for when user is not yet loaded
    const householdId = user?.householdId;

    useEffect(() => {
        setColorScheme('light');
    }, [])

    return (
        <div className="flex flex-1 gap-4 pt-0 w-full">
            {(!isMobile && !isSmallScreen) &&
                <Sidebar setSidebarExpanded={setSidebarExpanded} sidebarExpanded={sidebarExpanded} />
            }
            <main className="w-full">
                <AppRoutes />
                {householdId && <CreateTasklist householdId={householdId} />}
            </main>
        </div>
    )
}