from typing import NamedTuple

from app.models.notification import Notification, NotificationEntity, NotificationType
from app.services.notification_service import NotificationService
from app.utils.timezone import ensure_utc


# ---- TASKS ----

def _notify_task(type_, task, actor, recipient_ids, batch_prefix):
    """Shared by the task triggers. Never commits."""
    return NotificationService.notify(
        type=type_,
        household_id=task.tasklist.household_id,
        recipient_ids=recipient_ids,
        actor_id=actor.id,
        entity_type=NotificationEntity.TASK,
        entity_id=task.id,
        entity_label=task.title,
        batch_key=f"{batch_prefix}-{task.list_id}",
    )


def notify_task_assigned(task, actor):
    """Tell the new assignee. Nothing if the task has no assignee."""
    if task.assigned_to_id is None:
        return []
    return _notify_task(
        NotificationType.TASK_ASSIGNED, task, actor, [task.assigned_to_id], "task-assigned"
    )


def notify_task_unassigned(task, old_assignee_id, actor):
    """Tell the person who was taken off the task. Nothing if there was no one."""
    if old_assignee_id is None:
        return []
    return _notify_task(
        NotificationType.TASK_UNASSIGNED, task, actor, [old_assignee_id], "task-unassigned"
    )


def notify_task_self_unassigned(task, actor):
    """Tell the creator that the assignee took themselves off the task."""
    return _notify_task(
        NotificationType.TASK_SELF_UNASSIGNED, task, actor, [task.creator_id], "task-self-unassigned"
    )


def notify_task_changed(task, actor, previous_assignee_id):
    """Tell the creator and the assignee a task was edited.

    Someone who was only just assigned (assignee != previous_assignee_id) is not
    told: they get the assigned notification instead.
    """
    recipients = [task.creator_id]
    if task.assigned_to_id is not None and task.assigned_to_id == previous_assignee_id:
        recipients.append(task.assigned_to_id)
    return _notify_task(NotificationType.TASK_CHANGED, task, actor, recipients, "task-changed")


def notify_task_deleted(task, actor):
    """Tell the creator and the assignee a task is being deleted. Call BEFORE deleting it."""
    recipients = [task.creator_id]
    if task.assigned_to_id is not None:
        recipients.append(task.assigned_to_id)
    return _notify_task(NotificationType.TASK_DELETED, task, actor, recipients, "task-deleted")


def notify_task_status_changed(task, old_status, actor):
    """Completed or reopened, to the assignee. Any other status change is silent."""
    if task.assigned_to_id is None:
        return []
    was_done = old_status == "completed"
    is_done = task.status == "completed"
    if was_done == is_done:
        return []
    type_ = NotificationType.TASK_COMPLETED if is_done else NotificationType.TASK_REOPENED
    prefix = "task-completed" if is_done else "task-reopened"
    return _notify_task(type_, task, actor, [task.assigned_to_id], prefix)


# ---- LISTS AND EVENTS ----

class _EntityKind(NamedTuple):
    """The notification types and batch-key prefix for one kind of shared entity."""
    entity_type: NotificationEntity
    prefix: str
    assigned: NotificationType
    unassigned: NotificationType
    self_unassigned: NotificationType
    changed: NotificationType
    deleted: NotificationType


_TASKLIST = _EntityKind(
    NotificationEntity.TASKLIST, "tasklist",
    NotificationType.TASKLIST_ASSIGNED,
    NotificationType.TASKLIST_UNASSIGNED,
    NotificationType.TASKLIST_SELF_UNASSIGNED,
    NotificationType.TASKLIST_CHANGED,
    NotificationType.TASKLIST_DELETED,
)
_EVENT = _EntityKind(
    NotificationEntity.EVENT, "event",
    NotificationType.EVENT_ASSIGNED,
    NotificationType.EVENT_UNASSIGNED,
    NotificationType.EVENT_SELF_UNASSIGNED,
    NotificationType.EVENT_CHANGED,
    NotificationType.EVENT_DELETED,
)
_SHOPPING_LIST = _EntityKind(
    NotificationEntity.SHOPPING_LIST, "shopping-list",
    NotificationType.SHOPPING_LIST_ASSIGNED,
    NotificationType.SHOPPING_LIST_UNASSIGNED,
    NotificationType.SHOPPING_LIST_SELF_UNASSIGNED,
    NotificationType.SHOPPING_LIST_CHANGED,
    NotificationType.SHOPPING_LIST_DELETED,
)


def _notify_entity(kind, type_, entity, actor, recipient_ids, batch_key):
    """Send one notification type about a list or event. Never commits.

    Entities with no creator (household-owned lists) just contribute no
    recipient for creator-only messages.
    """
    recipients = sorted(user_id for user_id in recipient_ids if user_id is not None)
    if entity.household_id is None or not recipients:
        return []
    return NotificationService.notify(
        type=type_,
        household_id=entity.household_id,
        recipient_ids=recipients,
        actor_id=actor.id,
        entity_type=kind.entity_type,
        entity_id=entity.id,
        entity_label=entity.title,
        batch_key=batch_key,
    )


def _notify_access_changed(kind, entity, before_ids, after_ids, actor):
    """Tell people who gained or lost access.

    Gained -> assigned. Lost -> unassigned. If the actor removed themselves
    (and isn't the creator), the creator hears they left.
    """
    gained = after_ids - before_ids
    lost = before_ids - after_ids

    if gained:
        _notify_entity(kind, kind.assigned, entity, actor, gained, f"{kind.prefix}-assigned")
    if lost:
        _notify_entity(kind, kind.unassigned, entity, actor, lost, f"{kind.prefix}-unassigned")
    if actor.id in lost and actor.id != entity.creator_id:
        _notify_self_unassigned(kind, entity, actor)


def _notify_self_unassigned(kind, entity, actor):
    """Tell the creator that someone took themselves off."""
    return _notify_entity(
        kind, kind.self_unassigned, entity, actor, [entity.creator_id],
        f"{kind.prefix}-self-unassigned",
    )


def _notify_changed(kind, entity, recipient_ids, actor):
    """Tell the given people the entity changed. Repeated edits fold per entity."""
    return _notify_entity(
        kind, kind.changed, entity, actor, recipient_ids, f"{kind.prefix}-changed-{entity.id}"
    )


def _notify_deleted(kind, entity, recipient_ids, actor):
    """Tell the given people the entity is being deleted. Deletes fold across entities."""
    return _notify_entity(kind, kind.deleted, entity, actor, recipient_ids, f"{kind.prefix}-deleted")


# ---- TASKLISTS ----

def tasklist_access_ids(tasklist):
    """Ids of everyone who can currently see the list.

    Everyone in the household for an all-members list, otherwise the explicit
    members, plus the creator when the list has one (household-owned lists don't).
    Take this BEFORE changing the list's members.
    """
    if tasklist.all_members and tasklist.household is not None:
        ids = {user.id for user in tasklist.household.members}
    else:
        ids = {link.user_id for link in tasklist.member_links}
    if tasklist.creator_id is not None:
        ids.add(tasklist.creator_id)
    return ids


def notify_tasklist_access_changed(tasklist, before_ids, after_ids, actor):
    _notify_access_changed(_TASKLIST, tasklist, before_ids, after_ids, actor)


def notify_tasklist_self_unassigned(tasklist, actor):
    return _notify_self_unassigned(_TASKLIST, tasklist, actor)


def notify_tasklist_changed(tasklist, recipient_ids, actor):
    """Pass the ids of people who had access both before and after the edit.
    People added or removed in the same save hear "assigned" / "unassigned" instead."""
    return _notify_changed(_TASKLIST, tasklist, recipient_ids, actor)


def notify_tasklist_deleted(tasklist, actor):
    """Call BEFORE deleting the list."""
    return _notify_deleted(_TASKLIST, tasklist, tasklist_access_ids(tasklist), actor)


# ---- EVENTS ----

def event_attendee_ids(event):
    """Ids of everyone currently attending. Take this BEFORE changing attendees."""
    return {link.user_id for link in event.attendee_links}


def event_content(event):
    """The parts of an event whose change is worth a notification.

    Times go through ensure_utc because SQLite hands back naive datetimes,
    which would otherwise never equal the aware ones from a request.
    """
    return (
        event.title,
        ensure_utc(event.start_utc) if event.start_utc else None,
        ensure_utc(event.end_utc) if event.end_utc else None,
        event.has_time,
        event.rrule,
    )


def notify_event_attendees_changed(event, before_ids, after_ids, actor):
    _notify_access_changed(_EVENT, event, before_ids, after_ids, actor)


def notify_event_self_unassigned(event, actor):
    return _notify_self_unassigned(_EVENT, event, actor)


def notify_event_changed(event, before_ids, after_ids, actor):
    """Tell the creator and the attendees who stayed on the event that it changed.

    People added in the same save hear "assigned" and people removed hear
    "unassigned", so neither is included here.
    """
    recipients = {event.creator_id} | (before_ids & after_ids)
    return _notify_changed(_EVENT, event, recipients, actor)


def notify_event_deleted(event, actor):
    """Call BEFORE deleting the event."""
    recipients = {event.creator_id} | event_attendee_ids(event)
    return _notify_deleted(_EVENT, event, recipients, actor)


# ---- SHOPPING LISTS ----

def shopping_list_access_ids(shopping_list):
    """Ids of everyone who can currently see the list: its members (or the whole
    household) plus the creator. Take this BEFORE changing the list's members."""
    return set(shopping_list.assignee_ids()) | {shopping_list.creator_id}


def notify_shopping_list_access_changed(shopping_list, before_ids, after_ids, actor):
    _notify_access_changed(_SHOPPING_LIST, shopping_list, before_ids, after_ids, actor)


def notify_shopping_list_self_unassigned(shopping_list, actor):
    return _notify_self_unassigned(_SHOPPING_LIST, shopping_list, actor)


def notify_shopping_list_changed(shopping_list, recipient_ids, actor):
    """Pass the ids of people who had access both before and after the edit.
    People added or removed in the same save hear "assigned" / "unassigned" instead."""
    return _notify_changed(_SHOPPING_LIST, shopping_list, recipient_ids, actor)


def notify_shopping_list_deleted(shopping_list, actor):
    """Call BEFORE deleting the list."""
    return _notify_deleted(
        _SHOPPING_LIST, shopping_list, shopping_list_access_ids(shopping_list), actor
    )


# ---- REMINDERS ----

def _snippet(text, limit=80):
    """A reminder or announcement has no title, so its label is its first words."""
    text = (text or "").strip()
    return text if len(text) <= limit else text[: limit - 1].rstrip() + "…"


def notify_reminder_assigned(reminder, assignee_ids, actor):
    """Tell the people a manual reminder was set for. The actor is skipped by the service."""
    if not assignee_ids:
        return []
    return NotificationService.notify(
        type=NotificationType.REMINDER_ASSIGNED,
        household_id=reminder.household_id,
        recipient_ids=sorted(assignee_ids),
        actor_id=actor.id,
        entity_type=NotificationEntity.REMINDER,
        entity_id=reminder.id,
        entity_label=_snippet(reminder.message),
        batch_key="reminder-assigned",
    )


# ---- ANNOUNCEMENTS ----

def _notify_announcement(type_, announcement, actor, batch_key):
    """Tell the author that someone else changed or removed their announcement."""
    return NotificationService.notify(
        type=type_,
        household_id=announcement.household_id,
        recipient_ids=[announcement.user_id],
        actor_id=actor.id,
        entity_type=NotificationEntity.ANNOUNCEMENT,
        entity_id=announcement.id,
        entity_label=_snippet(announcement.message),
        batch_key=batch_key,
    )


def notify_announcement_edited(announcement, actor):
    return _notify_announcement(
        NotificationType.ANNOUNCEMENT_EDITED, announcement, actor,
        f"announcement-edited-{announcement.id}",
    )


def notify_announcement_deleted(announcement, actor):
    """Call BEFORE deleting the announcement."""
    return _notify_announcement(
        NotificationType.ANNOUNCEMENT_DELETED, announcement, actor, "announcement-deleted"
    )


# ---- HOUSEHOLD ----

def _notify_household(type_, household, recipient_ids, actor, subject_id, label, batch_key):
    """Shared by the household triggers. The subject is the user the news is about."""
    recipients = sorted(recipient_ids)
    if not recipients:
        return []
    return NotificationService.notify(
        type=type_,
        household_id=household.id,
        recipient_ids=recipients,
        actor_id=actor.id,
        entity_type=NotificationEntity.USER,
        entity_id=subject_id,
        entity_label=label,
        batch_key=batch_key,
    )


def notify_member_joined(household, new_member):
    """Tell everyone already in the household. Call after the new member's household_id is set."""
    others = {u.id for u in household.members} - {new_member.id}
    return _notify_household(
        NotificationType.MEMBER_JOINED, household, others, new_member,
        new_member.id, new_member.display_name, "member-joined",
    )


def notify_member_left(household, leaving_member):
    """Tell the people who stay. Call BEFORE the member's household_id is cleared."""
    remaining = {u.id for u in household.members} - {leaving_member.id}
    return _notify_household(
        NotificationType.MEMBER_LEFT, household, remaining, leaving_member,
        leaving_member.id, leaving_member.display_name, "member-left",
    )


def notify_member_removed(household, removed_user, actor):
    """Tell the people who stay. Call BEFORE the removed user's household_id is cleared."""
    remaining = {u.id for u in household.members} - {removed_user.id}
    return _notify_household(
        NotificationType.MEMBER_REMOVED, household, remaining, actor,
        removed_user.id, removed_user.display_name, "member-removed",
    )


def notify_user_removed(household, removed_user, actor):
    """Tell the removed person. The label is the household's name."""
    return _notify_household(
        NotificationType.USER_REMOVED, household, {removed_user.id}, actor,
        removed_user.id, household.name, "user-removed",
    )


def notify_admin_changed(household, new_admin, actor):
    """Tell everyone in the household who the admin is now, the new admin included."""
    everyone = {u.id for u in household.members}
    return _notify_household(
        NotificationType.ADMIN_CHANGED, household, everyone, actor,
        new_admin.id, new_admin.display_name, "admin-changed",
    )



def notify_admin_request(household, candidate, admin):
    """The admin offered the role: tell the candidate."""
    _notify_household(
        NotificationType.ADMIN_REQUEST,
        household,
        [candidate.id],
        admin,
        subject_id=admin.id,
        label=household.name,
        batch_key=f"admin-request-{household.id}",
    )


def notify_admin_request_declined(household, admin, candidate):
    """The candidate said no: tell the admin."""
    _notify_household(
        NotificationType.ADMIN_REQUEST_DECLINED,
        household,
        [admin.id],
        candidate,
        subject_id=candidate.id,
        label=f"{candidate.first_name} {candidate.last_name}",
        batch_key=f"admin-request-declined-{candidate.id}",
    )


def retract_admin_request(household, candidate_id):
    """The admin cancelled: delete the candidate's unread request, if there is one."""
    Notification.query.filter_by(
        household_id=household.id,
        recipient_id=candidate_id,
        type=NotificationType.ADMIN_REQUEST,
        read_at=None,  # MATCH: use whatever marks a row as unread in your model
    ).delete()