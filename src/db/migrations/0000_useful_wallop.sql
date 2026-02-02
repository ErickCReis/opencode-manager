CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`repo` text NOT NULL,
	`branch` text NOT NULL,
	`port` integer NOT NULL,
	`pid` integer,
	`status` text DEFAULT 'stopped' NOT NULL,
	`created_at` integer NOT NULL
);
