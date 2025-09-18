import type { Todo } from "@/store/todoSlice";
import { Checkbox } from "@mantine/core";


type Props = {
    task: Todo;
}

export const HouseholdTasklistTask = ({ task }: Props) => {
    return <div className="household-tasklist-task">
        <Checkbox
            size="xs"
            radius='xl'
            label={task.title}
            readOnly
            checked={false}
        />
    </div>
}