import { MAKS_JAWABAN, type Pertanyaan } from "./konten";

export type HasilJawaban = { ok: true; jawaban: Record<string, string> } | { ok: false; kosong: string[] };

/**
 * Reads a questionnaire's answers off a form. Every question is required: a choice
 * must be one of its options, free text must not be blank. Text is trimmed and cut at
 * MAKS_JAWABAN so a pasted essay does not end up in the committee's spreadsheet.
 * `kosong` lists the unanswered question ids in form order, for the message and focus.
 */
export function bacaFormJawaban(daftar: Pertanyaan[], ambil: (id: string) => unknown): HasilJawaban {
  const jawaban: Record<string, string> = {};
  const kosong: string[] = [];
  for (const q of daftar) {
    const v = String(ambil(q.id) ?? "").trim();
    if (q.pilihan) {
      if (q.pilihan.some((o) => o.value === v)) jawaban[q.id] = v;
      else kosong.push(q.id);
    } else if (v) {
      jawaban[q.id] = v.slice(0, MAKS_JAWABAN);
    } else {
      kosong.push(q.id);
    }
  }
  return kosong.length ? { ok: false, kosong } : { ok: true, jawaban };
}
