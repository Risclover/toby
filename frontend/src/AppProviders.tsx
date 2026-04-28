import { CreateAnnouncementModalProvider, CreateReminderModalProvider, CreateTasklistModalProvider, HabitModalProvider, NoticeBoardProvider } from "@/contexts";
import { PersonalNoteModalProvider } from "./contexts/PersonalNoteModalContext";

const providers = [
    CreateAnnouncementModalProvider,
    CreateTasklistModalProvider,
    CreateReminderModalProvider,
    NoticeBoardProvider,
    HabitModalProvider,
    PersonalNoteModalProvider
];

export const AppProviders = ({ children }: { children: React.ReactNode }) => {
    return providers.reduceRight(
        (acc, Provider) => <Provider>{acc}</Provider>,
        children
    );
};
