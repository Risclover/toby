import { TodoList } from "./TodoList";
import { useAuthenticateQuery } from "@/store/authSlice";
import { useGetHouseholdTodoListsQuery, useGetHouseholdQuery } from "@/store/householdSlice";
import { Button } from "@mantine/core";
import { CreateTodoList } from "./CreateTodoList";


export const HouseholdTodoLists = () => {
    const { data: user } = useAuthenticateQuery();
    const { data: lists, isLoading } = useGetHouseholdTodoListsQuery(user?.householdId)

    if (isLoading) return <div>Loading...</div>;

    return (
        <div>
            <CreateTodoList householdId={user?.householdId} />
            {lists?.map((list) => (
                <TodoList householdId={user?.householdId} list={list} />
            ))}

        </div>
    );
};
