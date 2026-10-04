import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { CariTiket } from "./cari";
import { ambilAcara } from "@/lib/acara/queries";
import { pintuPendaftaranTerbuka, waAdmin } from "@/lib/acara/view-model";
import { isLang, t } from "@/lib/i18n/dict";

export const dynamic = "force-dynamic";

export default async function CariPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string; slug: string }>;
  searchParams: Promise<{ pending?: string }>;
}) {
  const { lang, slug } = await params;
  const sp = await searchParams;
  if (!isLang(lang)) notFound();
  const d = t(lang);
  // A draft has no public page, even for someone holding the link. The
  // token-based /ticket/[token] pages stay reachable: a ticket already issued must
  // not stop working because the committee took the programme off the site.
  const ev = await ambilAcara(slug);
  if (!ev || !ev.tampil) notFound();

  return (
    <main className="min-h-dvh bg-[var(--color-surface)]">
      <PageHeader lang={lang} title={d.cari.title} back={`/${lang}/p/${slug}`} />
      <div className="mx-auto w-full max-w-[440px] px-5 pt-8">
        {/*
          Reached by a submission the honeypot rejected. It must say something: an
          empty search box after pressing "submit registration" reads as the form
          having eaten the request, which is precisely what it did.
        */}
        {sp.pending === "1" ? (
          <div className="mb-5 rounded-[8px] bg-brand-100 p-4">
            <div className="text-[15px] font-semibold text-brand">{d.cari.pendingTitle}</div>
            <p className="mt-1.5 text-[13px] leading-[1.6]">{d.cari.pendingBody}</p>
          </div>
        ) : null}

        <CariTiket
          lang={lang}
          slug={slug}
          masihBuka={pintuPendaftaranTerbuka(ev.status)}
          waAdmin={waAdmin(ev)}
        />
      </div>
    </main>
  );
}
