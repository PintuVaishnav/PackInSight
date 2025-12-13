CREATE TABLE `scans` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`scan_type` text NOT NULL,
	`packages_scanned` integer NOT NULL,
	`vulnerabilities_found` integer NOT NULL,
	`scan_date` integer NOT NULL,
	`scan_results` text NOT NULL,
	`file_name` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
