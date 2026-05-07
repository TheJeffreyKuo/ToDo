ALTER TABLE "tasks" ADD COLUMN "scheduled_for" date;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "estimated_minutes" integer;--> statement-breakpoint
CREATE INDEX "tasks_user_scheduled_idx" ON "tasks" USING btree ("user_id","scheduled_for");