import { Skeleton } from "@mantine/core"

export const PersonalNoteGridSkeleton = () => {
    return (
        <div className="personal-note-skeleton-container">
            <div className="single-note-container">
                <div className="single-note-container-main">
                    <div className="single-note-container-header">
                        <div className="single-note-container-header--top">
                            <div className="single-note-title"><Skeleton height={20} /></div>
                            <div className="single-note-container-header--top-right">
                                <Skeleton height={20} width={20} />
                                <Skeleton height={20} width={20} />
                            </div>
                        </div>
                        <div className="single-note-date-container">
                            <Skeleton height={8} width={150} mt=".5rem" />
                        </div>
                    </div>
                    <div className="single-note-content">
                        <Skeleton height={8} mt=".75rem" />
                        <Skeleton height={8} mt=".75rem" />
                        <Skeleton height={8} mt=".75rem" width={200} />
                    </div>
                </div>
                <div className="single-note-footer">
                    <Skeleton radius="xl" height={20} width={100} />
                </div>
            </div>
        </div>
    )
}

export const PersonalNoteListSkeleton = () => {
    return (
        <div className="single-note-container list-container">
            <div className="single-note-container-main list-container-main">
                <div className="single-note-container-header list-container-top">
                    <div className="single-note-container-header--top">
                        <div className="single-note-title"><Skeleton height={16} /></div>
                        <div className="single-note-container-header--top-right">
                            <Skeleton height={20} width={20} />
                            <Skeleton height={20} width={20} />
                        </div>
                    </div>
                    <div className="single-note-date-container">
                        <Skeleton height={8} width={150} mt=".5rem" />
                    </div>
                </div>
            </div>
            <div className="single-note-footer list-note-footer">
                <Skeleton radius="xl" height={20} width={100} mt=".5rem" />
            </div>
        </div>
    )
}