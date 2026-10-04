export type Kelayakan = "boleh" | "belum_selesai" | "hadir" | "bukan_sasaran";

/**
 * Whether this participant is someone the no-show form is for.
 *
 * A walk-in who was never permitted did not fail to come — the hall was full and the
 * committee kept them out. Asking them why they were absent would read as a joke at
 * their expense, so they are not a target at all.
 *
 * Read from the programme's status, not from its date: the committee marks it
 * finished, the same switch the ticket page already reads.
 */
export function kelayakanAbsen(a: {
  statusAcara: string;
  hadir: boolean;
  jenis: string;
  izinOtsAt: Date | null;
}): Kelayakan {
  if (a.statusAcara !== "selesai") return "belum_selesai";
  if (a.hadir) return "hadir";
  if (a.jenis === "ots" && !a.izinOtsAt) return "bukan_sasaran";
  return "boleh";
}
