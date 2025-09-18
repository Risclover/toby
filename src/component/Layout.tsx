import { Link } from "react-router-dom"
import { useAuthenticateQuery } from "../store/authSlice"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar"
import { AppRoutes } from "@/routes"
import Sidebar from "@/layout/Sidebar"
export const Layout = () => {
    const { open } = useSidebar();
    return (
        // <ul className='navbar'>
        //     <li><Link to="/">Home</Link></li>
        //     <li><Link to="/login">Log In</Link></li>
        //     <li><Link to="/signup">Sign Up</Link></li>
        //     <li><Link to="/todo_lists">Todo Lists</Link></li>
        //     <li><Link to={`/users/${user?.id}`}>Profile</Link></li>
        // </ul>
        <>
            <Sidebar />
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
                    <div className="flex items-center gap-2 px-4">
                        <SidebarTrigger className="-ml-1" />
                    </div>
                </header>
                <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                    <AppRoutes />
                </div>
            </SidebarInset>
        </ >
    )
}