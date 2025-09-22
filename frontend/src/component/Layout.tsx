import { SidebarInset } from "@/components/ui/sidebar"
import { AppRoutes } from "@/routes"
import Sidebar from "@/layout/Sidebar"
export const Layout = () => {
    return (
        <>
            <Sidebar />
            <SidebarInset>
                <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                    <AppRoutes />
                </div>
            </SidebarInset>
        </ >
    )
}