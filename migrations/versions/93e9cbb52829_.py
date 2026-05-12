"""empty message

Revision ID: 93e9cbb52829
Revises: afbadfbe5e71
Create Date: 2026-05-12 04:07:10.842756

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '93e9cbb52829'
down_revision = 'afbadfbe5e71'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table('shopping_lists',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=30), nullable=False),
        sa.Column('household_id', sa.Integer(), nullable=False),
        sa.Column('creator_id', sa.Integer(), nullable=False),
        sa.Column('all_members', sa.Boolean(), nullable=False),
        sa.Column('is_archived', sa.Boolean(), nullable=False),
        sa.Column('archived_by', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
        sa.ForeignKeyConstraint(['archived_by'], ['users.id'], name=op.f('fk_shopping_lists_archived_by_users')),
        sa.ForeignKeyConstraint(['creator_id'], ['users.id'], name=op.f('fk_shopping_lists_creator_id_users')),
        sa.ForeignKeyConstraint(['household_id'], ['households.id'], name=op.f('fk_shopping_lists_household_id_households')),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_shopping_lists'))
    )
    with op.batch_alter_table('shopping_lists', schema=None) as batch_op:
        batch_op.create_index('ix_shopping_lists_household_id_id', ['household_id', 'id'], unique=False)

    op.create_table('shopping_list_members',
        sa.Column('list_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
        sa.ForeignKeyConstraint(['list_id'], ['shopping_lists.id'], name=op.f('fk_shopping_list_members_list_id_shopping_lists'), ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], name=op.f('fk_shopping_list_members_user_id_users'), ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('list_id', 'user_id', name=op.f('pk_shopping_list_members'))
    )
    with op.batch_alter_table('shopping_list_members', schema=None) as batch_op:
        batch_op.create_index('ix_slm_user_id', ['user_id'], unique=False)


def downgrade():
    op.drop_table('shopping_list_members')
    op.drop_table('shopping_lists')