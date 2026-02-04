import { useAuthenticateQuery } from "@/store/authSlice";
import "../../styles/HouseholdTasklists.css"
import { useGetHouseholdTasklistsQuery } from "@/store/householdSlice";
import { HouseholdTasklist } from "./HouseholdTasklist";
import { skipToken } from "@reduxjs/toolkit/query";
import { CreateTasklist } from "./CreateTasklist";
import { Center, Loader } from "@mantine/core";
import { useStablePending } from "@/hooks";

export const HouseholdTasklists = () => {
    const { data: user, isLoading: authLoading } = useAuthenticateQuery();

    const householdId = user?.householdId ?? skipToken;

    const {
        data: lists = [],
        isLoading,
        isFetching,
    } = useGetHouseholdTasklistsQuery(householdId, {
        refetchOnFocus: false,
        refetchOnReconnect: false,
        // ADDED: This ensures you get fresh data every time you navigate back to this page
        refetchOnMountOrArgChange: true,
    });

    const loading = useStablePending(isLoading, { showAfterMs: 0, minVisibleMs: 500 });


    if (authLoading || loading) return <Center h="100vh"><Loader color="cyan" style={{
        transition: 'opacity 200ms ease-in',
        opacity: loading ? 1 : 0,
    }} /></Center>

    return (
        <div className="household-tasklists">
            <div className="household-tasklists-heading">
                <div className="household-tasklists-heading-title">
                    <h1>Tasklists</h1>
                    <p>Shared lists for your household. Click to open full list.</p>
                </div>
                <CreateTasklist householdId={householdId} />
            </div>

            {isFetching && <div>Loading...</div>}

            <div className="household-tasklists-grid">
                {lists.map(list => {
                    // ADDED: Create a simple hash of the order. 
                    // This forces the 'HouseholdTasklist' component to completely reset 
                    // (and update its internal 'useMobileTasklist' hook) whenever the order changes.
                    const orderSignature = list.tasks
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
