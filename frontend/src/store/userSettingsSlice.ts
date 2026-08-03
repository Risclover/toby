import { apiSlice } from "./apiSlice";

export type Theme = "light" | "dark" | "system";
export type PrivacyMode = "normal" | "all_private" | "private_by_default";

export interface UserSettings {
    id: number;
    userId: number;
    habitsOnHomepage: boolean;
    siteTheme: Theme;
    habitsPrivacyMode: PrivacyMode;
    notesPrivacyMode: PrivacyMode;
    eventsPrivacyMode: PrivacyMode;
}

export interface UserSettingsResponse {
    user: {
        id: number;
        firstName: string;
        lastName: string;
        email: string;
        timezone: string;
        profileImg: string;
        color: string;
        // Add other User fields you need here
    };
    settings: UserSettings;
}

export const userSettingsSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getCurrentUserSettings: builder.query<UserSettingsResponse, void>({
            query: () => "/user-settings",
            providesTags: ["UserSettings"]
        }),

        getUserSettings: builder.query<UserSettingsResponse, number>({
            query: (id) => `/user-settings/${id}`,
            providesTags: (_result, _error, id) => [{ type: "UserSettings", id }],
        }),

        updateUserSettings: builder.mutation<UserSettingsResponse, Partial<UserSettingsResponse>>({
            query: (data) => ({
                url: "/user-settings",
                method: "PUT",
                body: data
            }),
            invalidatesTags: ["UserSettings", "Auth", "Household", "Calendar"]
        }),

        resetUserSettings: builder.mutation<UserSettingsResponse, void>({
            query: () => ({
                url: "/user-settings/reset",
                method: "POST"
            }),
            invalidatesTags: ["UserSettings", "Auth", "Household", "Calendar"]
        }),
    })
});

export const {
    useGetCurrentUserSettingsQuery,
    useGetUserSettingsQuery,
    useUpdateUserSettingsMutation,
    useResetUserSettingsMutation,
} = userSettingsSlice;
