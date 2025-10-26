-- CreateTable
CREATE TABLE "audit_logs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "operation_type" TEXT NOT NULL,
    "operation_status" TEXT NOT NULL,
    "operation_id" TEXT,
    "template_slug" TEXT,
    "template_name" TEXT NOT NULL,
    "state_before" TEXT,
    "state_after" TEXT,
    "changes_summary" TEXT,
    "user_identifier" TEXT,
    "error_message" TEXT,
    "error_details" TEXT,
    "bulk_operation" INTEGER NOT NULL DEFAULT 0,
    "bulk_total_count" INTEGER,
    "bulk_success_count" INTEGER,
    "bulk_failure_count" INTEGER,
    "search_text" TEXT
);

-- CreateTable
CREATE TABLE "audit_settings" (
    "id" INTEGER NOT NULL PRIMARY KEY DEFAULT 1,
    "enabled" INTEGER NOT NULL DEFAULT 0,
    "retention_days" INTEGER NOT NULL DEFAULT 30,
    "user_identifier" TEXT,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at" DESC);

-- CreateIndex
CREATE INDEX "audit_logs_template_name_idx" ON "audit_logs"("template_name");

-- CreateIndex
CREATE INDEX "audit_logs_operation_type_idx" ON "audit_logs"("operation_type");

-- CreateIndex
CREATE INDEX "audit_logs_operation_id_idx" ON "audit_logs"("operation_id");

-- CreateIndex
CREATE INDEX "audit_logs_search_text_idx" ON "audit_logs"("search_text");

-- CreateIndex
CREATE INDEX "audit_logs_operation_type_created_at_idx" ON "audit_logs"("operation_type", "created_at");

-- Insert default settings
INSERT INTO "audit_settings" ("id", "enabled", "retention_days") VALUES (1, 0, 30);
