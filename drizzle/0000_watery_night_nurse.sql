-- Audit Trail System - Complete Schema with API Key Isolation
-- This migration includes multi-tenancy support from the start

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
	`api_key_hash` text DEFAULT '' NOT NULL,
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
CREATE INDEX `audit_logs_api_key_hash_idx` ON `audit_logs` (`api_key_hash`);--> statement-breakpoint
CREATE INDEX `audit_logs_api_key_created_at_idx` ON `audit_logs` (`api_key_hash`,`created_at`);--> statement-breakpoint
CREATE TABLE `audit_settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`enabled` integer DEFAULT 0 NOT NULL,
	`retention_days` integer DEFAULT 30 NOT NULL,
	`user_identifier` text,
	`api_key_hash` text DEFAULT '' NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `audit_settings_api_key_hash_idx` ON `audit_settings` (`api_key_hash`);--> statement-breakpoint
CREATE TABLE `schema_migrations` (
	`version` integer PRIMARY KEY NOT NULL,
	`applied_at` integer DEFAULT (unixepoch()) NOT NULL
);
