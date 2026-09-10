import { Select } from "@mantine/core"
import type { FormErrors, UseFormReturnType } from "@mantine/form";
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import type { EventFormValues } from "../../hooks/useEventForm";

type Props = {
    form: UseFormReturnType<EventFormValues, EventFormValues, (values: EventFormValues) => FormErrors>;

}
export const EventFormVisibility = ({ form }: Props) => {
    return (
        <Select
            {...form.getInputProps('visibility')}
            key={form.key('visibility')}
            data={[
                { value: "public", label: "Public" },
                { value: "private", label: "Private" }
            ]}
            allowDeselect={false}
            label="Visibility"
            leftSection={form.getValues().visibility === "public"
                ? <VisibilityRoundedIcon style={{ fill: "rgb(5, 5, 73)" }} />
                : <VisibilityOffIcon style={{ fill: "rgb(5, 5, 73)" }} />
            }
            leftSectionWidth="40px"
        />
    )
}