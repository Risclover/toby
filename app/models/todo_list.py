from app.extensions import db
from sqlalchemy import CheckConstraint, UniqueConstraint, Index
from app.models.todo_list_member import TodoListMember

class TodoList(db.Model):
    __tablename__ = "todo_lists"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(120), nullable=False)
    icon = db.Column(db.String(120), nullable=True)

    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    household_id = db.Column(db.Integer, db.ForeignKey("households.id"), nullable=True)
    all_members = db.Column(db.Boolean, default=True, nullable=False)

    created_at = db.Column(db.DateTime, server_default=db.func.now())
    updated_at = db.Column(db.DateTime, server_default=db.func.now(), onupdate=db.func.now())

    # relationships
    todos = db.relationship(
        "Todo",
        back_populates="todo_list",
        cascade="all, delete-orphan"  # optional but handy
    )
    user = db.relationship("User", back_populates="todo_lists")
    household = db.relationship("Household", back_populates="todo_lists")
    member_links = db.relationship("TodoListMember", back_populates="todo_list", cascade="all, delete-orphan", lazy="selectin")
    members = db.relationship("User", secondary=lambda: TodoListMember.__table__, back_populates="lists_participating", lazy="selectin", viewonly=True)

    __table_args__ = (
        # XOR: exactly one of user_id / household_id must be non-null
        CheckConstraint(
            "(user_id IS NOT NULL) <> (household_id IS NOT NULL)",
            name="ck_todo_lists_exactly_one_owner",
        ),
        # Unique title per owner (fix: use 'title', not 'name')
        Index("ix_todo_lists_user_id", "user_id"),
        Index("ix_todo_lists_household_id", "household_id"),
    )

    @property
    def scope(self) -> str:
        return "user" if self.user_id is not None else "household"

    def audience_user_ids(self):
        """Who should see this list?"""
        if self.user_id is not None:
            return [self.user_id]
        if self.all_members:
            # assumes Household.members is defined
            return [m.id for m in (self.household.members or [])]
        return [link.user_id for link in self.member_links]

    def to_dict(self, include_todos: bool = True, include_members: bool = True):
        return {
            "id": self.id,
            "title": self.title,
            "icon": self.icon,
            "userId": self.user_id,
            "householdId": self.household_id,
            "scope": self.scope,
            "allMembers": self.all_members,
            "memberIds": self.audience_user_ids() if include_members else None,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
            "todos": [t.to_dict() for t in self.todos] if include_todos else [],
        }

    def __repr__(self):
        return f"<TodoList id={self.id} title={self.title!r} scope={self.scope} all_members={self.all_members}>"

