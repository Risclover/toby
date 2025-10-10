import { AppRoutes } from "@/routes"
import Sidebar from "@/layout/Sidebar"
import { useMantineColorScheme } from "@mantine/core";
import { useEffect } from "react";
import { SpeedDial } from 'primereact/speeddial';
import { Tooltip } from "primereact/tooltip";

export const Layout = () => {
    const { setColorScheme } = useMantineColorScheme();

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
        <>
            <Sidebar />
            <main className="flex flex-1 flex-col gap-4 pt-0">
                <AppRoutes />
            </main>
        </ >
    )
}