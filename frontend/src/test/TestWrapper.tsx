import { Provider } from "react-redux";
import { setupStore } from "@/store";
import { NoticeBoardProvider } from "@/contexts";
import { server } from "./msw/server"
import { authHandlers } from "./msw/handlers"

export const TestWrapper = ({ children }: { children: React.ReactNode }) => {
    server.use(authHandlers.authenticated);

    return (
        <Provider store={setupStore()}>
            <NoticeBoardProvider>
                {children}
            </NoticeBoardProvider>
        </Provider>
    )
}