ALTER TABLE "url_checks" DROP CONSTRAINT "url_checks_url_id_urls_id_fk";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "url_checks" ADD CONSTRAINT "url_checks_url_id_urls_id_fk" FOREIGN KEY ("url_id") REFERENCES "urls"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
