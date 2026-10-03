// Penyimpanan data WordPress di Upstash Redis (REST API), untuk mode anti blokir:
// WordPress MENGIRIM datanya ke /api/sync, Next.js membacanya dari sini — Vercel tidak perlu
// meminta data ke hosting WordPress yang memblokir server pusat data.
// Aktif otomatis bila integrasi Upstash/KV dipasang di Vercel (variabel lingkungan di bawah).
import { gzipSync, gunzipSync } from 'zlib';

const URL_ = (process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '').replace(/\/$/, '');
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '';
const PREFIX = 'gx:';

export const storeEnabled = Boolean(URL_ && TOKEN);

async function call(path, body) {
	const res = await fetch(`${URL_}${path}`, {
		method: 'POST',
		headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
		body: JSON.stringify(body),
		cache: 'no-store',
		signal: AbortSignal.timeout(8000),
	});
	if (!res.ok) throw new Error(`Redis HTTP ${res.status}`);
	return res.json();
}

// Data dikompres (gzip + base64): sitemap ±1,5 MB jadi ±150 KB (batas 1 kiriman Upstash gratis 1 MB).
const pack = (value) => gzipSync(Buffer.from(JSON.stringify(value))).toString('base64');
const unpack = (b64) => JSON.parse(gunzipSync(Buffer.from(b64, 'base64')).toString('utf8'));

/** Ambil satu entri; null bila belum ada. */
export async function storeGet(key) {
	if (!storeEnabled) return null;
	const { result } = await call('', ['GET', PREFIX + key]);
	return result ? unpack(result) : null;
}

/** Simpan banyak entri sekaligus: [[key, value], ...]. */
export async function storeSetMany(pairs) {
	if (!storeEnabled || !pairs.length) return 0;
	const out = await call('/pipeline', pairs.map(([key, value]) => ['SET', PREFIX + key, pack(value)]));
	return out.filter((r) => r && r.result === 'OK').length;
}

/** Jumlah entri tersimpan (untuk halaman cek). */
export async function storeCount() {
	if (!storeEnabled) return 0;
	let cursor = '0';
	let n = 0;
	do {
		const { result } = await call('', ['SCAN', cursor, 'MATCH', `${PREFIX}*`, 'COUNT', '1000']);
		cursor = result[0];
		n += result[1].length;
	} while (cursor !== '0' && n < 100000);
	return n;
}
