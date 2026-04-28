import { Drawer } from "@mantine/core"
import { type FavoriteFilter, type VisibilityFilter } from "../../hooks/useNotesFilter";
import { PersonalNotesFilterDrawerSection } from "./PersonalNotesFilterDrawerSection";
import { NotesFilterSectionBody } from "./NotesFilterSectionBody";
import { useNotesFilterContext } from "@/contexts/NotesFilterContext";
import { useAuthenticateQuery, useGetCategoriesQuery } from "@/store";
import { CategoryFilterSectionBody } from "./CategoryFilterSectionBody";
import { FavoritesFilterSectionBody } from "./FavoritesFilterSectionBody";
import { useParams } from "react-router-dom";

type Props = {
    drawerProps: any;
    stack: any;
}

const VISIBILITY_OPTIONS: { value: VisibilityFilter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "public", label: "Public" },
    { value: "private", label: "Private" },
];

export const PersonalNotesFilterDrawer = ({ drawerProps, stack }: Props) => {
    const { userId } = useParams();
    const { data: currentUser } = useAuthenticateQuery();
    const userIsAuthor = !!currentUser && Number(userId) === currentUser.id;
    const filterSections = [
        {
            label: "Favorites",
            body: <FavoritesFilterSectionBody filterKey="favoritism" />,
        },
        {
            label: "Visibility",
            body: <NotesFilterSectionBody filterKey="visibility" options={VISIBILITY_OPTIONS} />,
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
                    <PersonalNotesFilterDrawerSection label={btn.label} body={btn.body} />
                )) : <CategoryFilterSectionBody />}
            </div>
        </Drawer>
    )
}