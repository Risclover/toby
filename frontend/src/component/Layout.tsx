import { AppRoutes } from "@/routes"
import Sidebar from "@/layout/Sidebar"
import { useMantineColorScheme } from "@mantine/core";
import { useEffect, useState } from "react";
import { SpeedDial } from 'primereact/speeddial';
import { Tooltip } from "primereact/tooltip";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useIsSmallScreen } from "@/hooks/useIsSmallScreen";

export const Layout = () => {
    const isMobile = useIsMobile();
    const isSmallScreen = useIsSmallScreen();
    const { setColorScheme } = useMantineColorScheme();
    const [sidebarExpanded, setSidebarExpanded] = useState(() => {
        try { return localStorage.getItem("sidebar-collapsed") === "1"; }
        catch { return false; }
    });

    useEffect(() => {
        setColorScheme('light');
    }, [])

    let items = [
        {
            label: "Hello",
            icon: "",
            command: () => console.log("hey")
        }
    ]
    return (
        <div className="flex flex-1 gap-4 pt-0 w-full">
            {(!isMobile && !isSmallScreen) && <Sidebar setSidebarExpanded={setSidebarExpanded} sidebarExpanded={sidebarExpanded} />}
            <main className="w-full">
                <AppRoutes />
            </main>
        </div>
    )
}