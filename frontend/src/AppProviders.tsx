import { CreateAnnouncementModalProvider, CreateReminderModalProvider, CreateTasklistModalProvider, HabitModalProvider, NoticeBoardProvider } from "@/contexts";
import { PersonalNoteModalProvider } from "./contexts/PersonalNoteModalContext";
import { CreateShoppingListModalProvider } from "./contexts/CreateShoppingListContext";

const providers = [
    CreateAnnouncementModalProvider,
    CreateTasklistModalProvider,
    CreateReminderModalProvider,
    CreateShoppingListModalProvider,
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
