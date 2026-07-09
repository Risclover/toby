from app.extensions import db
from enum import Enum

class FeaturedListSortOrder(str, Enum):
    ALPHA = "alpha"
    CREATED = "created"

class FeaturedShoppingListSetting(db.Model):
    __tablename__ = "featured_shopping_list_settings"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), unique=True, nullable=False)

    # Featured shopping list settings
    list_id = db.Column(db.Integer, db.ForeignKey("shopping_lists.id", ondelete="SET NULL"), nullable=True)
    max_items = db.Column(db.Integer, default=5, nullable=False)
    show_completed = db.Column(db.Boolean, default=False)
    sort_order = db.Column(db.Enum(FeaturedListSortOrder), default=FeaturedListSortOrder.CREATED, nullable=False)
    category_groups = db.Column(db.Boolean, default=True, nullable=False)
    show_progress = db.Column(db.Boolean, default=False)
    show_quick_add = db.Column(db.Boolean, default=False)

    # Relationships
    user = db.relationship("User", back_populates="featured_shopping_list_settings", uselist=False)
    featured_shopping_list = db.relationship("ShoppingList", foreign_keys=[list_id], uselist=False)

    def to_dict(self):
        return {
            "id": self.id,
            "userId": self.user_id,
            "featuredList": {
                "listId": self.list_id,
                "maxItems": self.max_items,
                "showCompleted": self.show_completed,
                "sortOrder": self.sort_order,
                "categoryGroups": self.category_groups,
                "showProgress": self.show_progress,
                "showQuickAdd": self.show_quick_add
            }
        }