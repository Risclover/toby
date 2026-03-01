import pytest
from app.models import Announcement, AnnouncementSeen, User, Household 

def test_announcement_seen(household, sara, john):
    # 1. Create a household
    household = household(id=None)
    