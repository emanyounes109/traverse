CREATE UNIQUE INDEX one_deadline_reminder_per_task
ON "Notification" (("payload"->>'taskId'))
WHERE "type" = 'TASK_DEADLINE_APPROACHING';