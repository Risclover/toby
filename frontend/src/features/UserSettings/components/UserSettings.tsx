// UserSettingsModal.tsx
import {
    Modal, Stack, TextInput, Select, Switch,
    SegmentedControl, Button, Avatar, Text
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useEffect, useRef, useState } from "react";
import {
    useGetUserSettingsQuery,
    useUpdateUserSettingsMutation,
    type Theme,
    type PrivacyMode,
} from "@/store/userSettingsSlice";
import { useUploadImgMutation } from "@/store/userSlice"; // adjust import to your slice
import { SettingsItem } from "@/features/HouseholdTasklists";
import { SettingsSection } from "@/components/FeaturedListSettings/SettingsSection";


// ─── Types ────────────────────────────────────────────────────────────────────

type UpdateUserSettingsPayload = {
    firstName: string;
    lastName: string;
    timezone: string;
    siteTheme: Theme;
    habitsOnHomepage: boolean;
    habitsPrivacyMode: PrivacyMode;
    notesPrivacyMode: PrivacyMode;
};

type Props = {
    opened: boolean;
    onClose: () => void;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const TIMEZONE_OPTIONS = Intl.supportedValuesOf("timeZone").map((tz) => ({
    value: tz,
    label: tz.replace(/_/g, " "),
}));

const THEME_OPTIONS: { value: Theme; label: string }[] = [
    { value: "light", label: "Light" },
    { value: "dark", label: "Dark" },
    { value: "system", label: "System" },
];

const PRIVACY_OPTIONS: { value: PrivacyMode; label: string }[] = [
    { value: "normal", label: "Normal" },
    { value: "private_by_default", label: "Private by default" },
    { value: "all_private", label: "All private" },
];

// ─── Component ────────────────────────────────────────────────────────────────

export const UserSettings = ({ opened, onClose }: Props) => {
    const { data } = useGetUserSettingsQuery();
    const [updateSettings] = useUpdateUserSettingsMutation();
    const [uploadImg] = useUploadImgMutation();

    // Pending image is intentionally outside useForm — File objects aren't
    // form values, and the upload is a separate mutation.
    const [pendingImage, setPendingImage] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const form = useForm<UpdateUserSettingsPayload>({
        initialValues: {
            firstName: "",
            lastName: "",
            timezone: "",
            siteTheme: "system",
            habitsOnHomepage: false,
            habitsPrivacyMode: "normal",
            notesPrivacyMode: "normal",
        },
    });

    // Re-seed from server every time the modal opens, discarding unsaved changes.
    useEffect(() => {
        if (!opened || !data) return;
        form.setValues({
            firstName: data.user.firstName,
            lastName: data.user.lastName,
            timezone: data.user.timezone,
            siteTheme: data.settings.siteTheme,
            habitsOnHomepage: data.settings.habitsOnHomepage,
            habitsPrivacyMode: data.settings.habitsPrivacyMode,
            notesPrivacyMode: data.settings.notesPrivacyMode,
        });
        form.resetDirty();
        setPendingImage(null);
        setPreviewUrl(null);
    }, [opened, data]);

    // Revoke the object URL when it's replaced or the component unmounts,
    // so we don't leak memory.
    useEffect(() => {
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPendingImage(file);
        setPreviewUrl(URL.createObjectURL(file));
    };

    const handleSubmit = async (values: UpdateUserSettingsPayload) => {
        if (pendingImage && data) {
            await uploadImg({
                userId: data.user.id,
                imgType: "profile",
                file: pendingImage,
            }).unwrap();
        }

        if (form.isDirty()) {
            await updateSettings(values as never).unwrap();
        }

        onClose();
    };

    const avatarSrc = previewUrl ?? data?.user.profileImg ?? undefined;
    const hasChanges = form.isDirty() || pendingImage !== null;

    return (
        <Modal opened={opened} onClose={onClose} title="Settings" radius="md" centered>
            <form onSubmit={form.onSubmit(handleSubmit)}>
                <Stack>

                    <SettingsSection title="Account">
                        <SettingsItem layout="row" label="Profile image" divider={false}>
                            {/* Hidden file input — triggered by clicking the avatar */}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                style={{ display: "none" }}
                                onChange={handleFileChange}
                            />
                            <Avatar
                                src={avatarSrc}
                                size="lg"
                                radius="xl"
                                onClick={() => fileInputRef.current?.click()}
                                style={{ cursor: "pointer" }}
                            />
                            {pendingImage && (
                                <Text size="xs" c="dimmed">{pendingImage.name}</Text>
                            )}
                        </SettingsItem>
                        <SettingsItem layout="row" label="First name" divider={false}>
                            <TextInput {...form.getInputProps("firstName")} />
                        </SettingsItem>
                        <SettingsItem layout="row" label="Last name" divider={false}>
                            <TextInput {...form.getInputProps("lastName")} />
                        </SettingsItem>
                        <SettingsItem layout="row" label="Timezone" divider={true}>
                            <Select
                                searchable
                                data={TIMEZONE_OPTIONS}
                                {...form.getInputProps("timezone")}
                            />
                        </SettingsItem>
                    </SettingsSection>

                    <SettingsSection title="Appearance">
                        <SettingsItem layout="row" label="Theme" divider={true}>
                            <SegmentedControl
                                data={THEME_OPTIONS}
                                {...form.getInputProps("siteTheme")}
                            />
                        </SettingsItem>
                    </SettingsSection>

                    <SettingsSection title="Homepage">
                        <SettingsItem
                            layout="row"
                            label="Show habits on homepage"
                            description="Display your habit tracker on the dashboard"
                            divider={true}
                        >
                            <Switch
                                checked={form.values.habitsOnHomepage}
                                onChange={(e) =>
                                    form.setFieldValue("habitsOnHomepage", e.currentTarget.checked)
                                }
                            />
                        </SettingsItem>
                    </SettingsSection>

                    <SettingsSection title="Privacy">
                        <SettingsItem
                            layout="column"
                            label="Habits privacy"
                            description="Controls who can see your habit entries"
                            divider={false}
                        >
                            <Select
                                data={PRIVACY_OPTIONS}
                                {...form.getInputProps("habitsPrivacyMode")}
                            />
                        </SettingsItem>
                        <SettingsItem
                            layout="column"
                            label="Notes privacy"
                            description="Controls who can see your personal notes"
                            divider={false}
                        >
                            <Select
                                data={PRIVACY_OPTIONS}
                                {...form.getInputProps("notesPrivacyMode")}
                            />
                        </SettingsItem>
                    </SettingsSection>

                    <Button
                        type="submit"
                        variant="filled"
                        color="cyan"
                        disabled={!hasChanges}
                    >
                        Save changes
                    </Button>
                </Stack>
            </form>
        </Modal>
    );
};