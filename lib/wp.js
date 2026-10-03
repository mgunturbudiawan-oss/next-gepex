// Pengambil data dari WordPress (tema Geprex, endpoint /wp-json/geprex/v1/hl/*).
import { notFound } from 'next/navigation';
import { unstable_cache } from 'next/cache';
import { storeEnabled, storeGet, storeSetMany } from './store';

// Toleran salah isi: tanda kutip, spasi, tanpa https://, garis miring akhir, atau ikut /wp-admin, /wp-json.
function cleanUrl(v) {
	let u = String(v || '').trim().replace(/^['"]|['"]$/g, '').trim();
	if (!u) return '';
	if (!/^https?:\/\//i.test(u)) u = `https://${u}`;
	return u.replace(/\/(wp-admin|wp-json)(\/.*)?$/i, '').replace(/\/+$/, '');
}
// Nilai bawaan agar bisa langsung di-import ke Vercel tanpa mengisi Environment Variables.
// Bila WP_URL / SITE_URL diisi (Vercel atau .env.local), isian itulah yang dipakai.
const DEFAULT_WP_URL = 'https://deliknews.com';
export const WP_URL = cleanUrl(process.env.WP_URL) || DEFAULT_WP_URL;
// Di Vercel, alamat situs diambil otomatis dari variabel sistem Vercel.
export const SITE_URL = cleanUrl(process.env.SITE_URL)
	|| cleanUrl(process.env.VERCEL_PROJECT_PRODUCTION_URL)
	|| cleanUrl(process.env.VERCEL_URL)
	|| 'http://localhost:3000';
// User-Agent tetap untuk permintaan server → WordPress, agar mudah dikecualikan di firewall hosting
// (mis. "Bot White List" reCAPTCHA LiteSpeed).
export const WP_UA = 'GeprexNext/2.0 (+https://github.com/mgunturbudiawan-oss/next-gepex)';
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

/**
 * Ambil JSON dari WordPress. Hanya jawaban yang valid yang dikembalikan; selain itu dilempar sebagai error.
 * Hasil: { status: 200, data } | { status: 404 } | { status: 'unlicensed', message }.
 */
async function fetchJson(url) {
	let res;
	try {
		res = await fetch(url, { cache: 'no-store', headers: { Accept: 'application/json', 'User-Agent': WP_UA }, signal: AbortSignal.timeout(15000) });
	} catch (e) {
		throw new Error(`Tidak dapat menghubungi WordPress (${WP_URL}): ${e.message}`);
	}
	if (res.status === 404) return { status: 404 };
	const text = await res.text();
	let body;
	try {
		body = JSON.parse(text);
	} catch (e) {
		// Biasanya firewall hosting (mis. reCAPTCHA LiteSpeed "Bot Verification") membalas halaman HTML.
		const title = (text.match(/<title>([^<]*)<\/title>/i) || [])[1] || 'bukan JSON';
		throw new Error(`WordPress membalas halaman "${title}" (HTTP ${res.status}), bukan data JSON: ${url}. Kecualikan server Next.js dari firewall/bot protection hosting (User-Agent: ${WP_UA}).`);
	}
	if (res.status === 403 && body && body.code === 'geprex_unlicensed') return { status: 'unlicensed', message: body.message || 'Lisensi belum aktif' };
	if (!res.ok) throw new Error(`WordPress menjawab HTTP ${res.status}: ${url}`);
	return { status: 200, data: body };
}

/**
 * Kunci data yang sama persis dengan yang dikirim plugin "Geprex Next Sync":
 * endpoint + parameter terurut abjad, mis. "list?page=2&slug=jatim&type=category".
 */
export function dataKey(endpoint, params = {}) {
	const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '').sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));
	const s = qs.toString();
	return s ? `${endpoint}?${s}` : endpoint;
}

// Urutan sumber data: 1) data kiriman WordPress di Redis (anti blokir), 2) minta langsung ke WordPress.
// Jawaban langsung yang berhasil ikut disimpan ke Redis sebagai cadangan.
async function load(key, url) {
	if (storeEnabled) {
		const hit = await storeGet(key).catch(() => null);
		if (hit) return hit;
	}
	const r = await fetchJson(url);
	if (storeEnabled && r.status === 200) storeSetMany([[key, r]]).catch(() => {});
	return r;
}

// Cache data WordPress. Kenapa bukan cache fetch bawaan: cache fetch ikut menyimpan halaman blokir
// ("Bot Verification", HTTP 200) sehingga situs error sampai cache kedaluwarsa. Dengan unstable_cache,
// error tidak pernah disimpan, dan bila pembaruan di latar belakang gagal (WordPress sedang memblokir),
// data terakhir yang berhasil tetap dipakai.
// Dengan Redis, cache boleh lebih lama: setiap kiriman dari WordPress langsung menyegarkannya (revalidateTag).
const STORE_REVALIDATE = 600;
const cachedBy = new Map();
function cachedLoad(key, url, revalidate) {
	if (!revalidate) return load(key, url); // revalidate 0 (mis. pencarian) = tanpa cache
	const ttl = storeEnabled ? Math.max(revalidate, STORE_REVALIDATE) : revalidate;
	if (!cachedBy.has(ttl)) cachedBy.set(ttl, unstable_cache(load, ['wp-data', String(ttl)], { revalidate: ttl, tags: ['wp'] }));
	return cachedBy.get(ttl)(key, url);
}

export async function wp(endpoint, params = {}, { revalidate = REVALIDATE, allow404 = false } = {}) {
	const key = dataKey(endpoint, params);
	const url = `${WP_URL}/wp-json/geprex/v1/hl/${key}`;
	const r = await cachedLoad(key, url, revalidate);
	if (r.status === 404) {
		if (allow404) return null;
		notFound();
	}
	if (r.status === 'unlicensed') throw new UnlicensedError(r.message);
	return normalize(r.data);
}

/**
 * Short Video dari plugin WordPress "Geprex Short Video" (/wp-json/geprex-shorts/v1/videos).
 * null = plugin belum aktif / tidak bisa dihubungi → pemanggil memakai daftar cadangan lib/shorts.js.
 */
export async function getShorts() {
	try {
		const r = await cachedLoad('shorts', `${WP_URL}/wp-json/geprex-shorts/v1/videos`, REVALIDATE);
		return r.status === 200 && r.data && Array.isArray(r.data.videos) ? r.data : null;
	} catch (e) {
		return null;
	}
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
