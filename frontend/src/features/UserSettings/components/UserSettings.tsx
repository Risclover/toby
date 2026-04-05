// UserSettingsModal.tsx
import {
    Modal, Stack, TextInput, Select, Switch,
    SegmentedControl, Button, Avatar, Text,
    Group,
    Tooltip,
    ActionIcon,
    Input
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useEffect, useMemo, useRef, useState } from "react";
import {
    useGetCurrentUserSettingsQuery,
    useUpdateUserSettingsMutation,
    type Theme,
    type PrivacyMode,
} from "@/store/userSettingsSlice";
import { useGetUserQuery, useUploadImgMutation } from "@/store/userSlice"; // adjust import to your slice
import { SettingsItem } from "@/features/HouseholdTasklists";
import { SettingsSection } from "@/components/FeaturedListSettings/SettingsSection";
import { useIsSmallScreen } from "@/hooks";
import { useAuthenticateQuery } from "@/store";
import "../styles/UserSettings.css"
import { InfoIcon } from "@/assets";
import HelpOutlineRoundedIcon from '@mui/icons-material/HelpOutlineRounded';

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
    { value: "normal", label: "Public" },
    { value: "private_by_default", label: "Private by default" },
    { value: "all_private", label: "All private" },
];

// ─── Component ────────────────────────────────────────────────────────────────

export const UserSettings = ({ opened, onClose }: Props) => {
    const isSmallScreen = useIsSmallScreen();
    const { data } = useGetCurrentUserSettingsQuery();
    const { data: currentUser } = useAuthenticateQuery();
    const { data: user } = useGetUserQuery(currentUser?.id);
    const [updateSettings] = useUpdateUserSettingsMutation();
    const [uploadImg] = useUploadImgMutation();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const firstNameRef = useRef<HTMLInputElement>(null);
    const lastNameRef = useRef<HTMLInputElement>(null);
    const timezoneRef = useRef<HTMLInputElement>(null);

    // Pending image is intentionally outside useForm — File objects aren't
    // form values, and the upload is a separate mutation.
    const [pendingImage, setPendingImage] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const defaultValues = ({
        firstName: "",
        lastName: "",
        timezone: "America/Los Angeles",
        siteTheme: "system",
        habitsOnHomepage: false,
        habitsPrivacyMode: "normal",
        notesPrivacyMode: "normal"

    })

    const initialValues = ({
        firstName: data?.user.firstName,
        lastName: data?.user.lastName,
        timezone: data?.user.timezone,
        siteTheme: data?.settings.siteTheme,
        habitsOnHomepage: data?.settings.habitsOnHomepage,
        habitsPrivacyMode: data?.settings.habitsPrivacyMode,
        notesPrivacyMode: data?.settings.notesPrivacyMode,
    })

    const form = useForm<UpdateUserSettingsPayload>({
        initialValues: {
            firstName: "",
            lastName: "",
            timezone: "America/Los Angeles",
            siteTheme: "system",
            habitsOnHomepage: false,
            habitsPrivacyMode: "normal",
            notesPrivacyMode: "normal",
        },
    });

    // Re-seed from server every time the modal opens, discarding unsaved changes.
    useEffect(() => {
        if (!opened || !data) return;
        form.setValues(initialValues);
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

    const handleSubmit = async () => {
        if (!hasChanges) return;
        setIsSubmitting(true);
        try {
            await Promise.all([
                (async () => {
                    if (pendingImage && data) {
                        await uploadImg({
                            userId: data.user.id,
                            imgType: "profile",
                            file: pendingImage,
                        }).unwrap();
                    }
                    if (form.isDirty()) {
                        await updateSettings(form.values as never).unwrap();
                    }
                })(),
                new Promise((resolve) => setTimeout(resolve, 400)),
            ]);
            form.resetDirty();
            setPendingImage(null);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleResetToDefaults = () => {
        if (!defaultValues) return;
        form.setValues(defaultValues);
    }

    const handleFirstNameBlur = () => {
        const trimmed = form.values.firstName.trim();
        if (!trimmed) {
            form.setFieldValue("firstName", data?.user.firstName ?? "");
        } else {
            form.setFieldValue("firstName", trimmed.charAt(0).toUpperCase() + trimmed.slice(1));
        }
    };
    const handleLastNameBlur = () => {
        if (!form.values.lastName.trim()) {
            form.setFieldValue("lastName", data?.user.lastName ?? "");
        }
    };

    const handleTimezoneBlur = () => {
        if (!form.values.timezone) {
            form.setFieldValue("timezone", data?.user.timezone ?? defaultValues.timezone);
        }
    };

    const avatarSrc = previewUrl ?? user?.profileImg ?? undefined;
    const hasChanges = form.isDirty() || pendingImage !== null;

    return (
        <Modal fullScreen={isSmallScreen} opened={opened} onClose={onClose} title="User Settings" radius="md" size="lg" centered styles={{
            body: { display: "flex", flexDirection: "column", height: "100%", padding: 0, overflow: 'hidden' },
            content: { overflow: 'hidden', maxHeight: isSmallScreen ? "100%" : "700px", height: "100%", display: "flex", flexDirection: "column" }
        }} >
            <div className="user-settings-body">
                <Stack mih={0}>
                    <SettingsSection title="Account">
                        <SettingsItem layout="column" label="Profile image" divider={false} description="Represents you across the app">
                            {/* Hidden file input — triggered by clicking the avatar */}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                style={{ display: "none" }}
                                onChange={handleFileChange}
                            />
                            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                                <Avatar
                                    src={avatarSrc}
                                    size="lg"
                                    radius="xl"
                                    onClick={() => fileInputRef.current?.click()}
                                    style={{ cursor: "pointer" }}
                                />
                            </div>
                        </SettingsItem>
                        <SettingsItem
                            description="Your name or nickname"
                            labelRequired
                            layout="column"
                            label="First name"
                            divider={false}
                        >
                            <TextInput
                                ref={firstNameRef}
                                {...form.getInputProps("firstName")}
                                onBlur={handleFirstNameBlur}
                                rightSection={
                                    form.values.firstName !== '' ? (
                                        <Input.ClearButton onClick={() => {
                                            form.setFieldValue('firstName', '');
                                            firstNameRef.current?.focus();
                                        }}
                                        />
                                    ) : undefined
                                }
                                rightSectionPointerEvents="auto"
                            />
                        </SettingsItem>
                        <SettingsItem
                            description="Your full name helps members identify you"
                            labelRequired
                            layout="column"
                            label="Last name"
                            divider={false}
                        >
                            <TextInput
                                ref={lastNameRef}
                                {...form.getInputProps("lastName")}
                                onBlur={handleLastNameBlur}
                                rightSection={
                                    form.values.lastName !== '' ? (
                                        <Input.ClearButton onClick={() => {
                                            form.setFieldValue('lastName', '');
                                            lastNameRef.current?.focus();
                                        }}
                                        />
                                    ) : undefined
                                }
                                rightSectionPointerEvents="auto"
                            />
                        </SettingsItem>
                        <SettingsItem description="Used to display dates and times in your local time" labelRequired layout="column" label="Timezone" divider={true}>
                            <Select
                                ref={timezoneRef}
                                required
                                clearable
                                searchable
                                data={TIMEZONE_OPTIONS}
                                {...form.getInputProps("timezone")}
                                onBlur={handleTimezoneBlur}
                                onClear={() => {
                                    form.setFieldValue("timezone", "");
                                    timezoneRef.current?.focus();
                                }}
                            />
                        </SettingsItem>
                    </SettingsSection>

                    <SettingsSection title="Appearance">
                        <SettingsItem description="Controls the app's color scheme" layout="column" label="Theme" divider={true}>
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
                                withThumbIndicator={false}
                                size="md"
                                color="rgb(5, 5, 73)"
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
                            label={
                                <Group justify="start" gap={0}>
                                    Habits privacy
                                    <Tooltip multiline events={{ hover: true, focus: true, touch: true }} label={
                                        <div>
                                            <div><span style={{ fontWeight: 600 }}>Public</span>: Habits are public by default.</div>
                                            <div><span style={{ fontWeight: 600 }}>Private by default</span>: New habits are automatically marked as private in the creation form.</div>
                                            <div><span style={{ fontWeight: 600 }}>All private</span>: All habits are always hidden from other members.</div>
                                        </div>
                                    } withArrow>
                                        <ActionIcon w={0} p={0} h="auto" radius="xl" className="featured-info-icon" variant="transparent" color="transparent"><HelpOutlineRoundedIcon /></ActionIcon>
                                    </Tooltip>
                                </Group>
                            }
                            description="Controls who can see your habit entries"
                            divider={false}
                        >
                            <Select
                                allowDeselect={false}
                                data={PRIVACY_OPTIONS}
                                {...form.getInputProps("habitsPrivacyMode")}
                            />
                        </SettingsItem>
                        <SettingsItem
                            layout="column"
                            label={
                                <Group justify="start" gap={0}>
                                    Notes privacy
                                    <Tooltip multiline events={{ hover: true, focus: true, touch: true }} label={
                                        <div>
                                            <div><span style={{ fontWeight: 600 }}>Public</span>: Notes are public by default.</div>
                                            <div><span style={{ fontWeight: 600 }}>Private by default</span>: New notes are automatically marked as private in the creation form.</div>
                                            <div><span style={{ fontWeight: 600 }}>All private</span>: All notes are always hidden from other members.</div>
                                        </div>
                                    } withArrow>
                                        <ActionIcon w={0} p={0} h="auto" radius="xl" className="featured-info-icon" variant="transparent" color="transparent"><HelpOutlineRoundedIcon /></ActionIcon>
                                    </Tooltip>
                                </Group>
                            }
                            description="Controls who can see your personal notes"
                            divider={false}
                        >
                            <Select
                                allowDeselect={false}
                                data={PRIVACY_OPTIONS}
                                {...form.getInputProps("notesPrivacyMode")}
                            />
                        </SettingsItem>
                    </SettingsSection>
                </Stack>
            </div>
            <Modal.Header component={'footer'} pos={'sticky'} bottom={0} style={{ flexShrink: 0, borderRadius: 0, borderTop: "1px solid var(--mantine-color-gray-3)" }}>
                <Group justify="space-between" w="100%">
                    <Button size="compact-sm" variant="transparent" color="rgb(5, 5, 73)" onClick={handleResetToDefaults} fw={500}>Reset to default</Button>
                    <Group gap="0.5rem">
                        <Button
                            variant="outline"
                            className="tasklist-settings-footer-btn"
                            onClick={() => form.reset()}
                            disabled={!form.isDirty() || !form.isValid()}
                            fw={500}
                            color="rgb(5, 5, 73)"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="filled"
                            color="rgb(5, 5, 73)"
                            disabled={!hasChanges || !form.isValid()}
                            loading={isSubmitting}
                            loaderProps={{ children: "Saving..." }}
                            className="tasklist-settings-footer-btn"
                            fw={500}
                            onClick={handleSubmit}
                        >
                            Update
                        </Button>
                    </Group>
                </Group>
            </Modal.Header>
        </Modal >
    );
};