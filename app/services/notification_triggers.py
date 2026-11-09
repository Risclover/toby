from app.models import NotificationEntity, NotificationType 
from app.services import NotificationService 

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