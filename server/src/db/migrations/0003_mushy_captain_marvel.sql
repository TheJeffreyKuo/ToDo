DROP TABLE IF EXISTS "projects" CASCADE;--> statement-breakpoint
ALTER TABLE "tasks" DROP CONSTRAINT IF EXISTS "tasks_project_id_projects_id_fk";--> statement-breakpoint
ALTER TABLE "tasks" DROP COLUMN IF EXISTS "project_id";