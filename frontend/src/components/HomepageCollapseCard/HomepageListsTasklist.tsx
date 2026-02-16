import { ChevronDownIcon } from "@/assets/icons/ChevronDownIcon";
import { useAuthenticateQuery, useGetTasklistQuery } from "@/store"
import { Checkbox } from "@mantine/core";

export const HomepageListsTasklist = () => {
    const { data: user } = useAuthenticateQuery();
    const { data: tasklist } = useGetTasklistQuery(user?.featuredTasklistId);

    console.log('tasklist:', tasklist);

    return (
        <div className="homepage-lists-tasklist-container">
            <ul className="homepage-lists-tasklist">
                {tasklist?.tasks?.map(task => (
                    <li key={task.id}>
                        <Checkbox size="xs" color="cyan.6" label={task.title} />
                    </li>
                ))}
            </ul>
        </div>
    );
}
