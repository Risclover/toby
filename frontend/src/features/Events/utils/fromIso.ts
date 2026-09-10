import dayjs from "dayjs";

export const ymdFromIso = (iso?: string | null, fallback = new Date()) =>
    dayjs(iso ?? fallback).format("YYYY-MM-DD");

export const hmFromIso = (iso?: string | null) =>
    iso ? dayjs(iso).format("HH:mm") : "";