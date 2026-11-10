from typing import NamedTuple

from app.models.notification import NotificationEntity, NotificationType
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