// MobileAnnouncementsFilterDrawer.tsx
import { Avatar, Button, Drawer, Group, Stack, Text, Space } from "@mantine/core";
import { useState } from "react";
import { type FiltersType } from "@/features/Announcements/components/Announcements";

type Props = {
    opened: boolean;
    close: () => void;
    householdMembers: { id: number; name: string; profileImg: string }[];
    filters: FiltersType;
    setFilters: React.Dispatch<React.SetStateAction<FiltersType>>;
};

export const MobileAnnouncementsFilterDrawer = ({ opened, close, householdMembers, filters, setFilters }: Props) => {
    const [localFilters, setLocalFilters] = useState(filters);

    const handleApply = () => {
        setFilters(localFilters);
        close();
    };

    const handleReset = () => {
        const resetFilters: FiltersType = {
            importance: "all",
            creatorId: null,
            time: "all",
        };
        setLocalFilters(resetFilters);
        setFilters(resetFilters);
        close();
    };

    return (
        <Drawer size="auto" styles={{ content: { borderRadius: "1rem", maxHeight: "440px" } }} opened={opened} onClose={close} position="bottom" withCloseButton={false}>
            <div className="h-1 w-12 bg-muted mx-auto rounded-full mb-4"></div>
            <Stack justify="space-between">
                {/* Importance */}
                <Stack>
                    <Text size="sm">Importance</Text>
                    <Group>
                        <Button variant={localFilters.importance === "all" ? "filled" : "outline"} onClick={() => setLocalFilters({ ...localFilters, importance: "all" })}>
                            All
                        </Button>
                        <Button variant={localFilters.importance === "important" ? "filled" : "outline"} onClick={() => setLocalFilters({ ...localFilters, importance: "important" })}>
                            Important
                        </Button>
                    </Group>
                </Stack>

                {/* Creator */}
                <Stack>
                    <Text size="sm">Creator</Text>
                    <Group>
                        {householdMembers?.map((member) => (
                            <Avatar
                                key={member.id}
                                radius="xl"
                                src={member.profileImg}
                                style={{
                                    border: localFilters.creatorId === member.id ? "2px solid #4ade80" : undefined,
                                    cursor: "pointer",
                                }}
                                onClick={() => setLocalFilters({ ...localFilters, creatorId: localFilters.creatorId === member.id ? null : member.id })}
                            />
                        ))}
                    </Group>
                </Stack>

                {/* Time */}
                <Stack>
                    <Text size="sm">Time</Text>
                    <Group>
                        {["today", "7days", "30days", "all"].map((t) => (
                            <Button
                                key={t}
                                variant={localFilters.time === t ? "filled" : "outline"}
                                onClick={() => setLocalFilters({ ...localFilters, time: t as any })}
                            >
                                {t === "7days" ? "7 days" : t === "30days" ? "30 days" : t.charAt(0).toUpperCase() + t.slice(1)}
                            </Button>
                        ))}
                    </Group>
                </Stack>

                <Space h="md" />

                {/* Actions */}
                <Group grow>
                    <Button variant="outline" onClick={handleReset}>
                        Reset
                    </Button>
                    <Button onClick={handleApply}>Apply</Button>
                </Group>
            </Stack>
        </Drawer>
    );
};
