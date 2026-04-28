import { AdminBadgeIcon } from "@/assets/icons/AdminBadgeIcon";
import { RemoveMemberIcon } from "@/assets/icons/RemoveMemberIcon";
import { useAuthenticateQuery, useTransferAdminRoleMutation, type Household } from "@/store";
import { ActionIcon, Menu } from "@mantine/core"
import { IoEllipsisVerticalSharp } from "react-icons/io5";
import type { HouseholdMember } from "./MembersModal";
import { KittyNotification } from "./KittyNotification";
import { KittyIcons } from "@/assets";
import { TransferAdminRoleConfirmation } from "./TransferAdminRoleConfirmation";
import { useDisclosure } from "@mantine/hooks";
import { RemoveMemberConfirmation } from "./RemoveMemberConfirmation";

export const MembersModalAdminMenu = ({ member, household }: { member: HouseholdMember; household: Household }) => {
    const [transferModalOpened, { open: openTransferModal, close: closeTransferModal }] = useDisclosure(false);
    const [removeModalOpened, { open: openRemoveModal, close: closeRemoveModal }] = useDisclosure(false);

    const confirmAdminTransfer = () => {
        openTransferModal();
    }

    const confirmMemberRemoval = () => {
        openRemoveModal();
    }
    return (
        <Menu
            withinPortal={true}
            menuItemTabIndex={0}
            shadow="xs"
        >
            <Menu.Target>
                <ActionIcon
                    p={0}
                    className="announcement-menu-btn"
                    variant="transparent"
                    color="var(--mantine-color-gray-6)"
                    size="xs"
                    onClick={(e) => e.stopPropagation()}
                >
                    <IoEllipsisVerticalSharp />
                </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
                {member.id !== household.adminId &&
                    <Menu.Item leftSection={<AdminBadgeIcon size="22px" color="var(--mantine-color-dark-9)" />} onClick={(e) => { e.stopPropagation(); confirmAdminTransfer(); }}>
                        Transfer admin role
                    </Menu.Item>
                }
                <Menu.Item color="red.9" leftSection={<RemoveMemberIcon size="22px" color="var(--mantine-color-red-9)" />} onClick={(e) => { e.stopPropagation(); confirmMemberRemoval(); }}>
                    Remove from household
                </Menu.Item>
            </Menu.Dropdown>
            <TransferAdminRoleConfirmation opened={transferModalOpened} onClose={closeTransferModal} member={member} household={household} />
            <RemoveMemberConfirmation opened={removeModalOpened} onClose={closeRemoveModal} member={member} household={household} />
        </Menu >
    )
}