import type { UseFormReturnType } from "@mantine/form";
import type { EventFormValues } from "./utils";

export type ModalId = 'recurrence' | 'event-form' | 'events-list';
export type EventFormInstance = UseFormReturnType<EventFormValues>;