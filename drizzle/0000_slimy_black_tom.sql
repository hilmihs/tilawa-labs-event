CREATE TABLE "acara" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"nama" text NOT NULL,
	"nama_ar" text,
	"judul" text,
	"judul_ar" text,
	"pemateri" text,
	"pemateri_ar" text,
	"penyelenggara" text DEFAULT 'Majelis Pendidikan' NOT NULL,
	"tanggal" date NOT NULL,
	"waktu_mulai" time,
	"waktu_wajib_tiba" time,
	"waktu_selesai" time,
	"registrasi_buka_at" timestamp with time zone,
	"registrasi_tutup_at" timestamp with time zone,
	"lokasi" text,
	"lokasi_ar" text,
	"alamat" text,
	"alamat_ar" text,
	"peta_url" text,
	"tatib_url" text,
	"feedback_url" text,
	"gate_ikhwan" text,
	"gate_akhwat" text,
	"kuota" integer,
	"kuota_ots" integer,
	"prefiks_nomor" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "acara_akses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"acara_id" uuid,
	"jenis" text NOT NULL,
	"wa4" text,
	"ip_hash" text,
	"berhasil" boolean NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "acara_counter" (
	"acara_id" uuid NOT NULL,
	"gender" text NOT NULL,
	"terakhir" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "acara_counter_acara_id_gender_pk" PRIMARY KEY("acara_id","gender")
);
--> statement-breakpoint
CREATE TABLE "acara_kehadiran" (
	"peserta_id" uuid PRIMARY KEY NOT NULL,
	"acara_id" uuid NOT NULL,
	"scanned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"client_scanned_at" timestamp with time zone,
	"gate" text,
	"petugas" text,
	"metode" text DEFAULT 'qr' NOT NULL,
	"offline" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "acara_panitia" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"acara_id" uuid NOT NULL,
	"user_id" text,
	"nama" text NOT NULL,
	"gender" text,
	"wa" text,
	"divisi" text,
	"sub_tim" text,
	"peran" text,
	"kode_pos" text,
	"status" text,
	"bisa_tm" boolean,
	"bisa_gladi" boolean,
	"bisa_0445" boolean,
	"punya_powerbank" boolean,
	"catatan" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "acara_peserta" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"acara_id" uuid NOT NULL,
	"nomor" text NOT NULL,
	"kode" text NOT NULL,
	"nama" text NOT NULL,
	"gender" text NOT NULL,
	"wa" text NOT NULL,
	"email" text,
	"status_lipia" text,
	"nim" text,
	"prodi" text,
	"sesi" text,
	"semester" text,
	"tahun_lulus" text,
	"domisili" text,
	"transportasi" text,
	"kebutuhan_khusus" text,
	"jenis" text DEFAULT 'pra' NOT NULL,
	"sumber" text DEFAULT 'web' NOT NULL,
	"aktif" boolean DEFAULT true NOT NULL,
	"konfirmasi" boolean,
	"konfirmasi_at" timestamp with time zone,
	"tiket_dibuka_at" timestamp with time zone,
	"catatan" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "acara_akses" ADD CONSTRAINT "acara_akses_acara_id_acara_id_fk" FOREIGN KEY ("acara_id") REFERENCES "public"."acara"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "acara_counter" ADD CONSTRAINT "acara_counter_acara_id_acara_id_fk" FOREIGN KEY ("acara_id") REFERENCES "public"."acara"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "acara_kehadiran" ADD CONSTRAINT "acara_kehadiran_peserta_id_acara_peserta_id_fk" FOREIGN KEY ("peserta_id") REFERENCES "public"."acara_peserta"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "acara_kehadiran" ADD CONSTRAINT "acara_kehadiran_acara_id_acara_id_fk" FOREIGN KEY ("acara_id") REFERENCES "public"."acara"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "acara_panitia" ADD CONSTRAINT "acara_panitia_acara_id_acara_id_fk" FOREIGN KEY ("acara_id") REFERENCES "public"."acara"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "acara_peserta" ADD CONSTRAINT "acara_peserta_acara_id_acara_id_fk" FOREIGN KEY ("acara_id") REFERENCES "public"."acara"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "acara_slug_unik" ON "acara" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "akses_ip_idx" ON "acara_akses" USING btree ("ip_hash","jenis","created_at");--> statement-breakpoint
CREATE INDEX "kehadiran_waktu_idx" ON "acara_kehadiran" USING btree ("acara_id","scanned_at");--> statement-breakpoint
CREATE INDEX "kehadiran_gate_idx" ON "acara_kehadiran" USING btree ("acara_id","gate");--> statement-breakpoint
CREATE UNIQUE INDEX "peserta_nomor_unik" ON "acara_peserta" USING btree ("acara_id","nomor");--> statement-breakpoint
CREATE UNIQUE INDEX "peserta_wa_unik" ON "acara_peserta" USING btree ("acara_id","wa");--> statement-breakpoint
CREATE UNIQUE INDEX "peserta_kode_unik" ON "acara_peserta" USING btree ("kode");--> statement-breakpoint
CREATE UNIQUE INDEX "peserta_nim_unik" ON "acara_peserta" USING btree ("acara_id","nim") WHERE "acara_peserta"."nim" is not null;--> statement-breakpoint
CREATE INDEX "peserta_gender_idx" ON "acara_peserta" USING btree ("acara_id","gender");--> statement-breakpoint
CREATE INDEX "peserta_tiket_dibuka_idx" ON "acara_peserta" USING btree ("acara_id","tiket_dibuka_at");--> statement-breakpoint
CREATE INDEX "peserta_nama_idx" ON "acara_peserta" USING btree ("acara_id","nama");