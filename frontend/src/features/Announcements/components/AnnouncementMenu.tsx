export const AnnouncementMenu = ({ ref, announcement }) => {
    return (
        <div className="announcement-menu" ref={ref}>
            {announcement.isImportant ? <button>Remove importance</button> : <button>Mark important</button>}
            <button>Delete</button>
        </div>
    )
}