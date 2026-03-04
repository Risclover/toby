import { CreateAnnouncementModalProvider, CreateReminderModalProvider, CreateTasklistModalProvider } from "@/contexts";

const providers = [
    CreateAnnouncementModalProvider,
    CreateTasklistModalProvider,
    CreateReminderModalProvider
];

export const AppProviders = ({ children }: { children: React.ReactNode }) => {
    return providers.reduceRight(
        (acc, Provider) => <Provider>{acc}</Provider>,
        children
    );
};
