from app.models.notification import NotificationType, NotificationEntity
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


def _notify_tasklist(type_, tasklist, actor, recipient_ids, batch_key):
    """Shared by the tasklist triggers. Never commits."""
    recipients = sorted(user_id for user_id in recipient_ids if user_id is not None)
    if tasklist.household_id is None or not recipients:
        return []
    return NotificationService.notify(
        type=type_,
        household_id=tasklist.household_id,
        recipient_ids=recipients,
        actor_id=actor.id,
        entity_type=NotificationEntity.TASKLIST,
        entity_id=tasklist.id,
        entity_label=tasklist.title,
        batch_key=batch_key,
    )


def notify_tasklist_access_changed(tasklist, before_ids, after_ids, actor):
    """Tell people who gained or lost access to a list.

    Gained -> assigned. Lost -> unassigned. If the actor removed themselves
    (and isn't the creator), the creator hears they left.
    """
    gained = after_ids - before_ids
    lost = before_ids - after_ids

    if gained:
        _notify_tasklist(
            NotificationType.TASKLIST_ASSIGNED, tasklist, actor, gained, "tasklist-assigned"
        )
    if lost:
        _notify_tasklist(
            NotificationType.TASKLIST_UNASSIGNED, tasklist, actor, lost, "tasklist-unassigned"
        )
    if actor.id in lost and actor.id != tasklist.creator_id:
        notify_tasklist_self_unassigned(tasklist, actor)


def notify_tasklist_self_unassigned(tasklist, actor):
    """Tell the creator that a member took themselves off the list."""
    return _notify_tasklist(
        NotificationType.TASKLIST_SELF_UNASSIGNED,
        tasklist,
        actor,
        [tasklist.creator_id],
        "tasklist-self-unassigned",
    )


def notify_tasklist_changed(tasklist, recipient_ids, actor):
    """Tell the given people a list was renamed.

    Pass the access ids taken BEFORE the edit, so people added in the same save
    hear "assigned" and people removed hear "unassigned" instead.
    """
    return _notify_tasklist(
        NotificationType.TASKLIST_CHANGED,
        tasklist,
        actor,
        recipient_ids,
        f"tasklist-changed-{tasklist.id}",
    )


def notify_tasklist_deleted(tasklist, actor):
    """Tell everyone with access that a list is being deleted. Call BEFORE deleting it."""
    return _notify_tasklist(
        NotificationType.TASKLIST_DELETED,
        tasklist,
        actor,
        tasklist_access_ids(tasklist),
        "tasklist-deleted",
    )

def test_household_owned_list_has_no_creator_to_notify(client, login, make_tasklist, scene, admin):
    """A list with no creator can still be renamed; only its members are told"""
    owned = make_tasklist(scene.alice, creator_id=None, all_members=False, title="House")
    add_member(owned, scene.bob)
    login(admin)

    response = rename(client, owned, "Household")

    assert response.status_code == 200
    assert count(scene.bob, T.TASKLIST_CHANGED) == 1



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


def _notify_event(type_, event, actor, recipient_ids, batch_key):
    """Shared by the event triggers. Never commits."""
    recipients = sorted(recipient_ids)
    if not recipients:
        return []
    return NotificationService.notify(
        type=type_,
        household_id=event.household_id,
        recipient_ids=recipients,
        actor_id=actor.id,
        entity_type=NotificationEntity.EVENT,
        entity_id=event.id,
        entity_label=event.title,
        batch_key=batch_key,
    )


def notify_event_attendees_changed(event, before_ids, after_ids, actor):
    """Tell people who were added to or removed from an event.

    Added -> assigned. Removed -> unassigned. If the actor removed themselves
    (and isn't the creator), the creator hears they left.
    """
    gained = after_ids - before_ids
    lost = before_ids - after_ids

    if gained:
        _notify_event(NotificationType.EVENT_ASSIGNED, event, actor, gained, "event-assigned")
    if lost:
        _notify_event(NotificationType.EVENT_UNASSIGNED, event, actor, lost, "event-unassigned")
    if actor.id in lost and actor.id != event.creator_id:
        notify_event_self_unassigned(event, actor)


def notify_event_self_unassigned(event, actor):
    """Tell the creator that an attendee took themselves off the event."""
    return _notify_event(
        NotificationType.EVENT_SELF_UNASSIGNED,
        event,
        actor,
        [event.creator_id],
        "event-self-unassigned",
    )


def notify_event_changed(event, before_ids, after_ids, actor):
    """Tell the creator and the attendees who stayed on the event that it changed.

    People added in the same save hear "assigned" and people removed hear
    "unassigned", so neither is included here.
    """
    recipients = {event.creator_id} | (before_ids & after_ids)
    return _notify_event(
        NotificationType.EVENT_CHANGED, event, actor, recipients, f"event-changed-{event.id}"
    )


def notify_event_deleted(event, actor):
    """Tell the creator and every attendee an event is being deleted. Call BEFORE deleting it."""
    recipients = {event.creator_id} | event_attendee_ids(event)
    return _notify_event(NotificationType.EVENT_DELETED, event, actor, recipients, "event-deleted")