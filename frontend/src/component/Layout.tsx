import { AppRoutes } from "@/routes"
import Sidebar from "@/layout/Sidebar"
import { useMantineColorScheme } from "@mantine/core";
import { useEffect } from "react";

export const Layout = () => {
    const { setColorScheme } = useMantineColorScheme();

    useEffect(() => {
        setColorScheme('light');
    }, [])
    return (
        <>
            <Sidebar />
            <main className="flex flex-1 flex-col gap-4 pt-0">
                <AppRoutes />
            </main>
        </ >
    )
}