import { apiSlice } from "./apiSlice";


export interface User {
    id: number;
    firstName: string;
    lastName: string;
    profileImg: string;
    email: string;
    displayName?: string;
    createdAt: string;
    householdId?: number;
    featuredTasklistId: number;
    timezone: string;
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

export const authSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        authenticate: builder.query<any, void>({
            query: () => ({
                url: "/auth",
                method: "GET",
                credentials: "include"
            }),
            providesTags: ["Session", "Auth"]
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
            // ✅ ADD THIS: Clear ALL RTK Query cache on logout
            async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
                try {
                    await queryFulfilled;

                    // ✅ Nuke entire cache after successful logout
                    // userSettings, tasklists, featuredTasklist - all gone!
                    dispatch(apiSlice.util.resetApiState());

                } catch (error) {
                    console.error('Logout failed:', error);
                }
            },
            invalidatesTags: ["Session"]
        }),
        signup: builder.mutation<
            { user: User; household?: Household },
            { firstName: string; lastName: string; email: string; password: string; household_name?: string }>({
                query: ({ firstName, lastName, email, password, household_name }) => ({
                    url: "/auth/signup",
                    method: "POST",
                    credentials: "include",
                    body: { firstName, lastName, email, password, household_name }
                }),
                invalidatesTags: ["Session"],
            }),
        joinHousehold: builder.mutation<
            { user: User; household: Household },
            { firstName: string; lastName: string; email: string; password: string; inviteCode: string | undefined }
        >({
            query: ({ firstName, lastName, email, password, inviteCode }) => ({
                url: `/auth/join/${inviteCode}`,
                method: "POST",
                credentials: "include",
                body: { firstName, lastName, email, password }
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
        validateInvite: builder.query({
            query: (code) => `/auth/join/${code}`
        }),
        checkEmail: builder.mutation<{ Message: boolean }, { email: string }>({
            query: ({ email }) => ({
                url: `/auth/signup/check-email/${email}`,
                method: "POST",
                credentials: "include",
                body: { email }
            })
        }),

        googleLogin: builder.mutation<User, { access_token: string; invite_code?: string }>({
            query: (body) => ({
                url: '/auth/google',
                method: 'POST',
                credentials: "include",
                body,
            }),
            invalidatesTags: ["Session"]
        }),

        createHousehold: builder.mutation<{ user: User; household: Household }, { household_name: string }>({
            query: (body) => ({
                url: '/auth/household/create',
                method: 'POST',
                credentials: 'include',
                body,
            }),
            invalidatesTags: ['Session'],
        }),

        joinExistingHousehold: builder.mutation<{ user: User; household: Household }, { inviteCode: string }>({
            query: ({ inviteCode }) => ({
                url: `/auth/household/join/${inviteCode}`,
                method: 'POST',
                credentials: 'include',
            }),
            invalidatesTags: ['Session'],
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
    useCheckEmailMutation,
    useValidateInviteQuery,
    useGoogleLoginMutation,
    useCreateHouseholdMutation,
    useJoinExistingHouseholdMutation
} = authSlice;