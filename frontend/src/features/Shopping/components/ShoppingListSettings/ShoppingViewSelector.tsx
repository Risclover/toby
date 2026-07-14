import { StarIcon } from "@/assets";
import { useIsSmallScreen } from "@/hooks";
import type { FeaturedListView, ShoppingList } from "@/store";
import type { FeaturedShoppingListView } from "@/store/featuredShoppingListSettingSlice";
import { Box, Checkbox, Flex, Group, rem, Stack, Text } from "@mantine/core";
import { list } from "postcss";
import type React from "react";

type MiniLineProps = {
    width: string | number;
    height: string | number;
    opacity?: number;
    marginTop?: string | number;
    color?: string;
}

function MiniLine({ width, height, opacity = 1, marginTop, color = 'currentColor' }: MiniLineProps) {
    return (
        <Box
            style={{
                width,
                height,
                backgroundColor: color,
                opacity,
                marginTop,
                borderRadius: rem(2)
            }}
        />
    )
}

type MiniCircleProps = {
    size: string | number;
}

function MiniCircle({ size }: MiniCircleProps) {
    return (
        <Box
            style={{
                width: size,
                height: size,
                border: '1.5px solid currentColor',
                borderRadius: '50%',
                flexShrink: 0,
                opacity: 0.4
            }}
        />
    )
}

type DetailedItemProps = {
    color: string | undefined;
}

function DetailedItem({ color }: DetailedItemProps) {
    return (
        <Box py={6} px={6} style={{ borderBottom: '1px solid var(--mantine-color-gray-2)', color: 'var(--mantine-color-gray-6)' }}>
            <Flex align="flex-start" gap={6}>
                {/* Checkbox (top aligned) */}
                <MiniCircle size={10} />

                {/* Middle content */}
                <Stack gap={4} style={{ flex: 1 }}>
                    {/* Main item text */}
                    <MiniLine width="85%" height={6} opacity={0.6} marginTop="2px" />

                    {/* Metadata Row */}
                    <Flex gap={4} align="center">
                        <MiniLine width={8} height={8} opacity={0.7} color={color} /> {/* Icon Box */}
                        <MiniLine width="55%" height={4} opacity={0.4} /> {/* Text Line */}
                    </Flex>
                </Stack>

                {/* Real Star Icon (Top aligned) */}
                <MiniLine marginTop="2px" width={7} height={7} opacity={0.5} color="var(--mantine-color-gray-6)" />
            </Flex>
        </Box>
    )
}

function CompactItem() {
    return (
        <Box py={4} px={6} style={{ borderBottom: '1px solid var(--mantine-color-gray-2)', color: 'var(--mantine-color-gray-6)' }}>
            <Flex align="center" gap={10}>
                {/* Checkbox */}
                <MiniCircle size={10} />

                {/* Task Text */}
                <Box style={{ flex: 1 }}>
                    <MiniLine width="65%" height={6} opacity={0.6} />
                </Box>

                {/* Real Star Icon */}
                <MiniLine width={7} height={7} opacity={0.5} color="var(--mantine-color-gray-6)" />
            </Flex>
        </Box>
    )
}

// Main container

type PreviewWindowProps = {
    label: string;
    onKeyDown: (e: any) => void;
    onClick: () => void;
    activeItemDisplay: string | undefined;
    color: string | undefined;
    children: React.ReactNode;
}

function PreviewWindow({ label, onClick, onKeyDown, activeItemDisplay, color, children }: PreviewWindowProps) {
    console.log(activeItemDisplay === label)
    return (
        <Stack gap="0.25rem">
            <Box style={{
                border: activeItemDisplay === label.toLowerCase() ? `2px solid ${color}` : "2px solid transparent",
                borderRadius: "var(--mantine-radius-md)",
                padding: "2px",
            }}
                onClick={onClick}>
                <Box
                    style={{
                        width: rem(180),
                        height: rem(125),
                        border: '1px solid var(--mantine-color-gray-3)',
                        borderRadius: 'var(--mantine-radius-md)',
                        backgroundColor: 'white',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                >
                    {children}
                </Box>
            </Box>
            <Group gap="0.5rem" align="center" ml={5}>
                <Checkbox onChange={onClick} onKeyDown={onKeyDown} color={color} checked={activeItemDisplay === label.toLowerCase()} size="xs" radius="xl" />
                <Text size="13px" fw={400} c="black" mt={1}>{label}</Text>
            </Group>
        </Stack>
    );
}

type ShoppingViewSelectorProps = {
    activeItemDisplay: string | undefined;
    setActiveItemDisplay: (val: FeaturedShoppingListView | ((prevValue: FeaturedShoppingListView) => FeaturedShoppingListView)) => void;
    list: ShoppingList | undefined;
}

export function ShoppingViewSelector({ activeItemDisplay, setActiveItemDisplay, list }: ShoppingViewSelectorProps) {
    const isSmallScreen = useIsSmallScreen();

    return (
        <Flex m="auto" gap={isSmallScreen ? 20 : 30} justify="center" wrap="wrap">
            <PreviewWindow label="Detailed" onKeyDown={(e) => { if (e.key === " " || e.key === "Enter") { setActiveItemDisplay("detailed") } }} onClick={() => setActiveItemDisplay("detailed")} activeItemDisplay={activeItemDisplay} color={list?.color}>
                <DetailedItem color={list?.color} />
                <DetailedItem color={list?.color} />
                <DetailedItem color={list?.color} />
                <Box style={{ opacity: "0.5" }} ><DetailedItem color={list?.color} /></Box>
            </PreviewWindow>

            <PreviewWindow label="Compact" onKeyDown={(e) => { if (e.key === " " || e.key === "Enter") { setActiveItemDisplay("compact") } }} onClick={() => setActiveItemDisplay("compact")} activeItemDisplay={activeItemDisplay} color={list?.color}>
                <CompactItem />
                <CompactItem />
                <CompactItem />
                <CompactItem />
                <CompactItem />
                <CompactItem />
                <Box style={{ opacity: "0.5" }} ><CompactItem /></Box>
            </PreviewWindow>
        </Flex>
    );
}