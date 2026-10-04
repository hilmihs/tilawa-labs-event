CREATE TABLE "feedback_absen" (
	"peserta_id" uuid PRIMARY KEY NOT NULL,
	"acara_id" uuid NOT NULL,
	"alasan" text[],
	"alasan_lain" text,
	"waktu_cocok" text[],
	"pengingat" text[],
	"mau_online" boolean,
	"saran" text,
	"kabari" boolean DEFAULT false NOT NULL,
	"email_at" timestamp with time zone,
	"email_ingat_at" timestamp with time zone,
	"wa_at" timestamp with time zone,
	"dibuka_at" timestamp with time zone,
	"diisi_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "feedback_absen" ADD CONSTRAINT "feedback_absen_peserta_id_acara_peserta_id_fk" FOREIGN KEY ("peserta_id") REFERENCES "public"."acara_peserta"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback_absen" ADD CONSTRAINT "feedback_absen_acara_id_acara_id_fk" FOREIGN KEY ("acara_id") REFERENCES "public"."acara"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "feedback_absen_acara_idx" ON "feedback_absen" USING btree ("acara_id");