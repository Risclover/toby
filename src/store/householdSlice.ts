import { apiSlice } from "./apiSlice";

const householdSlice = apiSlice.enhanceEndpoints({ addTagTypes: [] }).injectEndpoints({
    endpoints: (builder) => ({
        getHousehold: builder.query({
            query: (householdId) => `/households/${householdId}`
        })
    })
})

export const { useGetHouseholdQuery } = householdSlice;