from app.models import NotificationEntity, NotificationType 
from app.services import NotificationService 

def notify_task_assigned(task, actor):
    """Tell a task's assignee they were assigned"""
    if task.assigned_to_id is None:
        return []
    
    return NotificationService.notify(
        type=NotificationType.TASK_ASSIGNED,
        household_id=task.tasklist.household_id,
        recipient_ids=[task.assigned_to_id],
        actor_id=actor.id,
        entity_type=NotificationEntity.TASK,
        entity_id=task.id,
        entity_label=task.title,
        batch_key=f"task-assigned-{task.list_id}",
    )