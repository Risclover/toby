from copy import deepcopy
from enum import Enum

from app.extensions import db
from flask_login import current_user
from sqlalchemy import inspect
from app.models import ShoppingItem
from app.models.shopping_list_member import ShoppingListMember
from app.models.shopping_category import ShoppingCategory

class DuplicateMode(str, Enum):
    ONLY_UNCOMPLETE = 'only_uncomplete'
    ALL_PRESERVE = 'all_preserve'
    ALL_RESET = 'all_reset'

class ShoppingList(db.Model):
    __tablename__ = "shopping_lists"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(30), nullable=False)
    household_id = db.Column(db.Integer, db.ForeignKey("households.id"), nullable=False)
    creator_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    color = db.Column(db.String(20), default="#15aabf")
    all_members = db.Column(db.Boolean, default=True, nullable=False)
    is_archived = db.Column(db.Boolean, default=False, nullable=False)
    archived_by = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    archived_date = db.Column(db.DateTime, nullable=True)
    default_sort = db.Column(db.String(10), nullable=False, default="created")
    group_by_category = db.Column(db.Boolean, nullable=False, default=True)
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    updated_at = db.Column(db.DateTime, server_default=db.func.now(), onupdate=db.func.now())

    # Parent -> children relationships (own the cascade)
    creator = db.relationship(
        "User",
        foreign_keys=[creator_id],
        back_populates="shopping_lists"
    )
    items = db.relationship(
        "ShoppingItem",
        back_populates="shopping_list",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    categories = db.relationship(
        "ShoppingCategory",
        back_populates="shopping_list",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    household = db.relationship("Household", back_populates="shopping_lists")

    member_links = db.relationship(
        "ShoppingListMember", 
        back_populates="shopping_list", 
        cascade="all, delete-orphan", 
        lazy="selectin"
    )
    members = db.relationship(
        "User",
        secondary=lambda: ShoppingListMember.__table__,
        back_populates="shopping_lists_participating",
        lazy="selectin",
        viewonly=True
    )
    archiver = db.relationship("User", foreign_keys=[archived_by], back_populates="archived_shopping_lists")

    __table_args__ = (
        db.Index("ix_shopping_lists_household_id_id", "household_id", "id"),
    )

    def assignee_ids(self):
        if self.all_members:
            return [m.id for m in (self.household.members or [])]
        return [link.user_id for link in self.member_links]

    def duplicate(self, mode: DuplicateMode = DuplicateMode.ALL_PRESERVE):
        """
        Create a copy of this list based on the selected mode.

        Args:
            mode (DuplicateMode):
                - ONLY_UNCOMPLETE: Copy only uncompleted items.
                - ALL_PRESERVE: Copy all items, keeping their completion status.
                - ALL_RESET: Copy all items, but mark them all as uncompleted.
        """
        duplicate = ShoppingList(
            title=f"{self.title} (Copy)",
            creator_id=self.creator_id,
            household_id=self.household_id,
            all_members=self.all_members
        )

        db.session.add(duplicate)
        db.session.flush()

        if not self.all_members:
            for member_link in self.member_links:
                new_link = ShoppingListMember(
                    list_id=duplicate.id,
                    user_id=member_link.user_id
                )
                db.session.add(new_link)

        category_map = {}
        for category in self.categories:
            new_category = ShoppingCategory(
                name=category.name,
                color=category.color,
                list_id=duplicate.id,
            )
            db.session.add(new_category)
            db.session.flush()
            category_map[category.id] = new_category.id

        for item in self.items:
            if mode == DuplicateMode.ONLY_UNCOMPLETE and getattr(item, "is_checked", False):
                continue

            new_item = ShoppingItem()

            for col in inspect(ShoppingItem).columns:
                if col.key in {"id", "created_at", "updated_at", "list_id"}:
                    continue
                setattr(new_item, col.key, getattr(item, col.key))

            if mode == DuplicateMode.ALL_RESET:
                new_item.is_checked = False

            new_item.list_id = duplicate.id
            new_item.category_id = category_map.get(item.category_id)
            db.session.add(new_item)

        return duplicate

    def to_dict(self):
        try:
            viewer = current_user
        except:
            viewer = self.creator
        return {
            "id": self.id,
            "title": self.title,
            "householdId": self.household_id,
            "creatorId": self.creator_id,
            "color": self.color,
            "allMembers": self.all_members,
            "isArchived": self.is_archived,
            "archivedBy": {
                "id": self.archiver.id,
                "profileImg": self.archiver.profile_img, # Ensure this matches your User col name
                "firstName": self.archiver.first_name,
                "lastName": self.archiver.last_name
            } if self.is_archived and self.archiver else None,
            "archivedDate": self.archived_date.isoformat() + "Z" if self.archived_date else None,
            "categories": [category.to_dict() for category in self.categories],
            "defaultSort": self.default_sort,
            "groupByCategory": self.group_by_category,
            "createdAt": self.created_at.isoformat() + "Z" if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() + "Z" if self.updated_at else None,
            "items": [item.to_dict() for item in self.items],
            "memberIds": self.assignee_ids(),
        }

    def __repr__(self):
        return f"<ShoppingList {self.id} {self.title!r}>"