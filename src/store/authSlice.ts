import { apiSlice } from "./apiSlice";


interface User {
    id: number;
    username: string;
    email: string;
    displayName?: string;
    createdAt: string;
    householdId?: number;
}

interface Household {
    id: number;
    name: string;
    inviteCode?: string;
    createdAt: string;
    creatorId: number;
    members: User[];
}

// Helper to read CSRF token from cookie
export function getCsrfTokenFromCookie(): string {
    const match = document.cookie.match(/csrf_token=([^;]+)/);
    return match ? match[1] : "";
}

export const authSlice = apiSlice.enhanceEndpoints({ addTagTypes: ["Session"] }).injectEndpoints({
    endpoints: (builder) => ({
        authenticate: builder.query<any, void>({
            query: () => ({
                url: "/auth",
                method: "GET",
                credentials: "include"
            }),
            providesTags: ["Session"]
        }),
        login: builder.mutation<any, { email: string; password: string }>({
            query: ({ email, password }) => ({
                url: "/auth/login",
                method: "POST",
                credentials: "include",
                body: {
                    email,
                    password,
                    csrf_token: getCsrfTokenFromCookie(),
                },
            }),
            invalidatesTags: ["Session"]
        }),
        logout: builder.mutation<void, void>({
            query: () => ({
                url: "/auth/logout",
                method: "GET",
                credentials: "include"
            }),
            invalidatesTags: ["Session"]
        }),
        signup: builder.mutation<
            { user: User; household?: Household },
            { username: string; email: string; password: string; household_name?: string }>({
                query: ({ username, email, password, household_name }) => ({
                    url: "/auth/signup",
                    method: "POST",
                    credentials: "include",
                    body: { username, email, password, household_name }
                }),
                invalidatesTags: ["Session"],
            }),
        joinHousehold: builder.mutation<
            { user: User; household: Household },
            { username: string; email: string; password: string; inviteCode: string | undefined }
        >({
            query: ({ username, email, password, inviteCode }) => ({
                url: `/auth/join/${inviteCode}`,
                method: "POST",
                credentials: "include",
                body: { username, email, password }
            }),
            invalidatesTags: ["Session"],
        }),
        generateInvite: builder.mutation({
            query: ({ householdId }) => ({
                url: `/auth/households/${householdId}/invite`,
                method: "POST",
                credentials: "include"
            }),
        }),
        checkUsername: builder.mutation<{ Message: boolean }, { username: string }>({
            query: ({ username }) => ({
                url: `/auth/signup/${username}`,
                method: "POST",
                credentials: "include",
                body: { username, csrf_token: getCsrfTokenFromCookie() }
            })
        }),


    })
})

export const {
    useAuthenticateQuery,
    useLoginMutation,
    useLogoutMutation,
    useSignupMutation,
    useJoinHouseholdMutation,
    useGenerateInviteMutation,
    useCheckUsernameMutation,
} = authSlice;