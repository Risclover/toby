type Props = {
    label: string;
    children: React.ReactNode;
}

export const ShoppingListDetailField = ({ label, children }: Props) => (
    <div className="details-panel-section">
        <div className="task-details-label">{label}</div>
        {children}
    </div>
);