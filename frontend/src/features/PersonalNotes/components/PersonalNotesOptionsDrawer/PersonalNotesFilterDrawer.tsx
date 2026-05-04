import { useParams } from "react-router-dom";
import { Drawer, useModalsStack, type DrawerProps } from "@mantine/core"

import { PersonalNotesFilterDrawerSection } from "./PersonalNotesFilterDrawerSection";
import { VisibilityFilterSectionBody } from "./VisibilityFilterSectionBody";
import { CategoryFilterSectionBody } from "./CategoryFilterSectionBody";
import { FavoritesFilterSectionBody } from "./FavoritesFilterSectionBody";
import { type VisibilityFilter } from "../../hooks";
import { useAuthenticateQuery } from "@/store";

const VISIBILITY_OPTIONS: { value: VisibilityFilter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "public", label: "Public" },
    { value: "private", label: "Private" },
];

type Props = {
    /** Drawer stack instance, for usage inside `Drawer.Stack`. */
    stack: ReturnType<typeof useModalsStack>;
    /** Props for drawer component */
    drawerProps: DrawerProps;
}

/** Filters drawer, inside of options drawer stack */
export const PersonalNotesFilterDrawer = ({ drawerProps, stack }: Props) => {
    const { userId } = useParams();
    const { data: currentUser } = useAuthenticateQuery();

    const userIsAuthor = !!currentUser && Number(userId) === currentUser.id;

    const filterSections = [
        {
            label: "Favorites",
            body: <FavoritesFilterSectionBody />,
        },
        {
            label: "Visibility",
            body: <VisibilityFilterSectionBody options={VISIBILITY_OPTIONS} />,
        },
        {
            label: "Categories",
            body: <CategoryFilterSectionBody />
        },
    ];

    return (
        <Drawer
            title="Filters"
            {...drawerProps}
            {...stack.register("filters")}
        >
            <div className="notes-options-drawer--body">
                {userIsAuthor ? filterSections.map(btn => (
                    <PersonalNotesFilterDrawerSection body={btn.body} />
                )) : <CategoryFilterSectionBody />}
            </div>
        </Drawer>
    )
}