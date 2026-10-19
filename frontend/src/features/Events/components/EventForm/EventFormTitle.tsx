import type { RefObject } from "react";
import { TextInput } from "@mantine/core"
import type { FormErrors, UseFormReturnType } from "@mantine/form";
import { RemainingChars } from "@/components";
import type { EventFormValues } from "../../utils";

type Props = {
    form: UseFormReturnType<EventFormValues, EventFormValues, (values: EventFormValues) => FormErrors>;
    title: string;
    nameRef: RefObject<HTMLInputElement | null>;
}

const TITLE_MAX_LENGTH = 100;

export const EventFormTitle = ({ form, title, nameRef }: Props) => {

    return (
        <>
            <TextInput
                {...form.getInputProps('title')}
                error={!!form.errors.title}
                key={form.key('title')}
                ref={nameRef}
                label="Title"
                placeholder="ex: Dentist"
                required
                maxLength={TITLE_MAX_LENGTH}
            />
            <div className="event-form-input--error-container">
                <div className="event-form-input--error">{form.errors.title}</div>
                <div className="event-form-input--error-right">
                    <RemainingChars count={title.length} max={TITLE_MAX_LENGTH} />
                </div>
            </div>
        </>
    )
}