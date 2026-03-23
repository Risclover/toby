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
}

export interface UserSettingsResponse {
    user: {
        id: number;
        firstName: string;
        lastName: string;
        email: string;
        timezone: string;
        profileImg: string;
        // Add other User fields you need here
    };
    settings: UserSettings;
}

export const userSettingsSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getUserSettings: builder.query<UserSettingsResponse, void>({
            query: () => "/user-settings",
            providesTags: ["UserSettings"]
        }),

        updateUserSettings: builder.mutation<UserSettingsResponse, Partial<UserSettingsResponse>>({
            query: (data) => ({
                url: "/user-settings",
                method: "PUT",
                body: data
            }),
            invalidatesTags: ["UserSettings"]
        }),

        resetUserSettings: builder.mutation<UserSettingsResponse, void>({
            query: () => ({
                url: "/user-settings/reset",
                method: "POST"
            }),
            invalidatesTags: ["UserSettings"]
        }),
    })
});

export const {
    useGetUserSettingsQuery,
    useUpdateUserSettingsMutation,
    useResetUserSettingsMutation,
} = userSettingsSlice;
