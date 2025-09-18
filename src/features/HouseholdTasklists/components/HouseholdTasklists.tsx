import { useAuthenticateQuery } from "@/store/authSlice";
import "../styles/HouseholdTasklists.css"
import { useGetHouseholdTodoListsQuery } from "@/store/householdSlice";
import { Card, Progress } from "@mantine/core";
import { HouseholdTasklist } from "./HouseholdTasklist";
import { skipToken } from "@reduxjs/toolkit/query";
import { CreateTodoList } from "@/component/CreateTodoList";

export const HouseholdTasklists = () => {
    const { data: user, isLoading: authLoading } = useAuthenticateQuery();

    // Gate the lists query until we have an ID
    const householdId = user?.householdId ?? skipToken;

    const {
        data: lists = [],
        isLoading,     // true only for the *first* load
        isFetching,    // true for background refetches
    } = useGetHouseholdTodoListsQuery(householdId, {
        // Optional: reduce surprise refetches
        refetchOnFocus: false,
        refetchOnReconnect: false,
    });

    if (authLoading || isLoading) return <div>Loading...</div>;

    return (
        <div className="household-tasklists">
            <div className="household-tasklists-heading">
                <div className="household-tasklists-heading-title">
                    <h1>Tasklists</h1>
                    <p>Shared lists for your household</p>
                </div>
                <CreateTodoList householdId={householdId} />
            </div>

            {/* If you want, show a tiny non-blocking hint */}
            {isFetching && <div className="subtle-loading">Refreshing…</div>}

            <div className="household-tasklists-grid">
                {lists.map(list => (
                    <HouseholdTasklist key={list.id} list={list} />
                ))}
            </div>
        </div>
    );
};