import { CreateAnnouncementModalProvider, CreateReminderModalProvider, CreateTasklistModalProvider, NoticeBoardProvider } from "@/contexts";

const providers = [
    CreateAnnouncementModalProvider,
    CreateTasklistModalProvider,
    CreateReminderModalProvider,
    NoticeBoardProvider
];

export const AppProviders = ({ children }: { children: React.ReactNode }) => {
    return providers.reduceRight(
        (acc, Provider) => <Provider>{acc}</Provider>,
        children
    );
};
