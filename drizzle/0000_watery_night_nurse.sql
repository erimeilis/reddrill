CREATE TABLE `audit_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`operation_type` text NOT NULL,
	`operation_status` text NOT NULL,
	`operation_id` text,
	`template_slug` text,
	`template_name` text NOT NULL,
	`state_before` text,
	`state_after` text,
	`changes_summary` text,
	`user_identifier` text,
	`error_message` text,
	`error_details` text,
	`bulk_operation` integer DEFAULT 0 NOT NULL,
	`bulk_total_count` integer,
	`bulk_success_count` integer,
	`bulk_failure_count` integer,
	`search_text` text
);
--> statement-breakpoint
CREATE INDEX `audit_logs_created_at_idx` ON `audit_logs` (`created_at`);--> statement-breakpoint
CREATE INDEX `audit_logs_template_name_idx` ON `audit_logs` (`template_name`);--> statement-breakpoint
CREATE INDEX `audit_logs_operation_type_idx` ON `audit_logs` (`operation_type`);--> statement-breakpoint
CREATE INDEX `audit_logs_operation_id_idx` ON `audit_logs` (`operation_id`);--> statement-breakpoint
CREATE INDEX `audit_logs_search_text_idx` ON `audit_logs` (`search_text`);--> statement-breakpoint
CREATE INDEX `audit_logs_operation_type_created_at_idx` ON `audit_logs` (`operation_type`,`created_at`);--> statement-breakpoint
CREATE TABLE `audit_settings` (
	`id` integer PRIMARY KEY DEFAULT 1 NOT NULL,
	`enabled` integer DEFAULT 0 NOT NULL,
	`retention_days` integer DEFAULT 30 NOT NULL,
	`user_identifier` text,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `schema_migrations` (
	`version` integer PRIMARY KEY NOT NULL,
	`applied_at` integer DEFAULT (unixepoch()) NOT NULL
);
