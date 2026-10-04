/**
 * Plain constants shared by the picker's server action and the reader.
 *
 * It lives apart from `pilih.ts` so the `"use server"` module can name the cookie
 * without importing the database layer along with it.
 */
export const COOKIE_ACARA = "nawa_acara";
