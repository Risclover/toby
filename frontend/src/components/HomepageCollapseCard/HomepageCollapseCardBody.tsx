type Props = {
    children: React.ReactNode;
}

export const HomepageCollapseCardBody = ({ children }: Props) => {
    return (
        <div className="homepage-collapse-card-body">{children}</div>
    )
}