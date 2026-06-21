from app.extensions import db

class ShoppingItemUnit(db.Model):
    __tablename__ = "shopping_item_units"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    name = db.Column(db.String(15), nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, server_default=db.func.now())

    __table_args__ = (
        db.UniqueConstraint('user_id', 'name', name='uq_user_unit'),
    )

    # Relationships
    user = db.relationship("User", back_populates="shopping_item_units")

    def to_dict(self):
        return {
            "id": self.id,
            "userId": self.user_id,
            "name": self.name,
            "createdAt": self.created_at
        }