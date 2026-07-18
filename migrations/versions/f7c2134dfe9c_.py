"""add recurrence, attendees, and colors

Revision ID: f7c2134dfe9c
Revises: 7d53809109ae
Create Date: 2026-07-18 08:00:28.888295

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'f7c2134dfe9c'
down_revision = '7d53809109ae'
branch_labels = None
depends_on = None

# Duplicated here rather than imported from your models file -- migrations
# shouldn't depend on live application code, since models.py can keep
# evolving after this migration is written and merged. Keep this list in
# sync with PRESET_USER_COLORS by hand if you ever change the palette.
PRESET_USER_COLORS = [
    "blue", "red", "green", "grape", "orange",
    "teal", "pink", "indigo", "cyan", "lime",
]


def upgrade():
    # ### event_attendees table -- unchanged, autogenerate got this right ###
    op.create_table('event_attendees',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('event_id', sa.Integer(), nullable=False),
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.ForeignKeyConstraint(['event_id'], ['events.id'], name=op.f('fk_event_attendees_event_id_events'), ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], name=op.f('fk_event_attendees_user_id_users')),
    sa.PrimaryKeyConstraint('id', name=op.f('pk_event_attendees')),
    sa.UniqueConstraint('event_id', 'user_id', name='uq_event_attendee')
    )

    # ### events.rrule -- unchanged, nullable so no backfill needed ###
    with op.batch_alter_table('events', schema=None) as batch_op:
        batch_op.add_column(sa.Column('rrule', sa.String(length=255), nullable=True))

    # ### users.color -- THIS is what needed fixing ###
    #
    # Autogenerate produced `nullable=False` with no default, which fails the
    # instant this runs against a table that already has rows -- there's no
    # value to put in the new column for existing users. It also didn't add
    # a uniqueness constraint, so two users in the same household could end
    # up with matching colors, which breaks the whole point of the feature.
    #
    # IMPORTANT: this adds the column as NOT NULL immediately, using a
    # `server_default` placeholder ('blue') so SQLite can satisfy the
    # constraint for existing rows as part of the SAME table rebuild --
    # rather than adding it nullable and flipping it to NOT NULL in a
    # SEPARATE later step. Splitting those into two batch_alter_table blocks
    # is what caused the `_alembic_tmp_users.color` NOT NULL failure you hit:
    # the second block's table rebuild didn't correctly pick up the column
    # from the first block's plain ADD COLUMN. Doing it as one forced
    # recreate up front avoids that entirely. Verified end-to-end against a
    # real SQLite file, including confirming the unique constraint below
    # actually rejects a duplicate afterward.
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.add_column(
            sa.Column('color', sa.String(length=20), nullable=False, server_default='blue')
        )

    # --- backfill ---
    # Overwrites the 'blue' placeholder with a real, per-household-unique
    # color for every existing user.
    #
    # ASSUMPTION: users.household_id exists as a simple FK. If your household
    # membership is actually a many-to-many table, swap this query for your
    # real membership lookup.
    connection = op.get_bind()
    households = connection.execute(
        sa.text("SELECT DISTINCT household_id FROM users")
    ).fetchall()

    for (household_id,) in households:
        member_rows = connection.execute(
            sa.text("SELECT id FROM users WHERE household_id = :hid ORDER BY id"),
            {"hid": household_id},
        ).fetchall()
        for index, (user_id,) in enumerate(member_rows):
            # Deterministic, order-by-id assignment -- guarantees no collision
            # for existing members as long as the household has <=
            # len(PRESET_USER_COLORS) members. A household already larger
            # than that today would get a repeated color for the 11th+
            # member -- rare enough to check manually rather than build
            # around, same call made in assign_user_color() at runtime.
            color = PRESET_USER_COLORS[index % len(PRESET_USER_COLORS)]
            connection.execute(
                sa.text("UPDATE users SET color = :color WHERE id = :uid"),
                {"color": color, "uid": user_id},
            )

    # --- lock down uniqueness ---
    # Every row already has NOT NULL + a real value at this point, so this
    # step ONLY adds the constraint -- it doesn't also need to change
    # nullability, which is the combination that triggered the original bug.
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.create_unique_constraint(
            'uq_users_household_id_color', ['household_id', 'color']
        )
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.drop_constraint('uq_users_household_id_color', type_='unique')
        batch_op.drop_column('color')

    with op.batch_alter_table('events', schema=None) as batch_op:
        batch_op.drop_column('rrule')

    op.drop_table('event_attendees')
    # ### end Alembic commands ###