import { useAuthenticateQuery } from "@/store/authSlice";
import "../../styles/HouseholdTasklists.css"
import { useGetHouseholdTodoListsQuery } from "@/store/householdSlice";
import { HouseholdTasklist } from "./HouseholdTasklist";
import { skipToken } from "@reduxjs/toolkit/query";
import { CreateTodoList } from "./CreateTodoList";

export const HouseholdTasklists = () => {
    const { data: user, isLoading: authLoading } = useAuthenticateQuery();

    const householdId = user?.householdId ?? skipToken;

    const {
        data: lists = [],
        isLoading,
        isFetching,
    } = useGetHouseholdTodoListsQuery(householdId, {
        refetchOnFocus: false,
        refetchOnReconnect: false,
        // ADDED: This ensures you get fresh data every time you navigate back to this page
        refetchOnMountOrArgChange: true,
    });

    if (authLoading || isLoading) return <div>Loading...</div>;

    return (
        <div className="household-tasklists">
            <div className="household-tasklists-heading">
                <div className="household-tasklists-heading-title">
                    <h1>Tasklists</h1>
                    <p>Shared lists for your household. Click to open full list.</p>
                </div>
                <CreateTodoList householdId={householdId} />
            </div>

            {isFetching && <div className="subtle-loading">Refreshing…</div>}

            <div className="household-tasklists-grid">
                {lists.map(list => {
                    // ADDED: Create a simple hash of the order. 
                    // This forces the 'HouseholdTasklist' component to completely reset 
                    // (and update its internal 'useMobileTasklist' hook) whenever the order changes.
                    const orderSignature = list.todos
                        ?.map((t) => t.id)
                        .join("-");

                    return (
                        <HouseholdTasklist
                            key={`${list.id}-${orderSignature}`}
                            list={list}
                        />
                    );
                })}
            </div>

        </div>
    );
};
