// Pengambil data dari WordPress (tema Geprex, endpoint /wp-json/geprex/v1/hl/*).
import { notFound } from 'next/navigation';

export const WP_URL = (process.env.WP_URL || '').trim().replace(/\/$/, '');
export const SITE_URL = (process.env.SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
const REVALIDATE = parseInt(process.env.REVALIDATE || '60', 10);

export class UnlicensedError extends Error {}

// PHP kadang mengirim daftar sebagai objek {"0":..,"2":..}. Ubah semua menjadi array agar aman.
function normalize(v) {
	if (Array.isArray(v)) return v.map(normalize);
	if (v && typeof v === 'object') {
		const keys = Object.keys(v);
		if (keys.length && keys.every((k) => /^\d+$/.test(k))) return keys.sort((a, b) => a - b).map((k) => normalize(v[k]));
		for (const k of keys) v[k] = normalize(v[k]);
	}
	return v;
}

export { list } from './list';

export async function wp(endpoint, params = {}, { revalidate = REVALIDATE, allow404 = false } = {}) {
	if (!WP_URL) {
		throw new Error('WP_URL belum diisi. Buat file .env.local (salin dari .env.example), isi WP_URL dengan alamat WordPress Anda, lalu jalankan ulang Next.js.');
	}
	const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ''));
	const url = `${WP_URL}/wp-json/geprex/v1/hl/${endpoint}${qs.toString() ? `?${qs}` : ''}`;
	let res;
	try {
		res = await fetch(url, { next: { revalidate, tags: ['wp'] }, headers: { Accept: 'application/json' } });
	} catch (e) {
		throw new Error(`Tidak dapat menghubungi WordPress (${WP_URL}): ${e.message}`);
	}
	if (res.status === 404) {
		if (allow404) return null;
		notFound();
	}
	if (res.status === 403) {
		const body = await res.json().catch(() => ({}));
		if (body.code === 'geprex_unlicensed') throw new UnlicensedError(body.message || 'Lisensi belum aktif');
	}
	if (!res.ok) throw new Error(`WordPress menjawab HTTP ${res.status} untuk ${endpoint}`);
	return normalize(await res.json());
}

export async function getConfig() {
	try {
		return { ...(await wp('config')), licensed: true };
	} catch (e) {
		if (e instanceof UnlicensedError) return { licensed: false, message: e.message };
		throw e;
	}
}

export const o = (config, key) => (config && config.options ? config.options[key] : undefined);

export function absolute(path) {
	if (!path) return SITE_URL;
	return /^https?:\/\//.test(path) ? path : SITE_URL + path;
}

export function stripTags(html = '') {
	return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}
