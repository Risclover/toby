import { CreateAnnouncementModalProvider, CreateReminderModalProvider, CreateTasklistModalProvider, HabitModalProvider, NoticeBoardProvider } from "@/contexts";

const providers = [
    CreateAnnouncementModalProvider,
    CreateTasklistModalProvider,
    CreateReminderModalProvider,
    NoticeBoardProvider,
    HabitModalProvider
];

export const AppProviders = ({ children }: { children: React.ReactNode }) => {
    return providers.reduceRight(
        (acc, Provider) => <Provider>{acc}</Provider>,
        children
    );
};
