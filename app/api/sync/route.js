import { revalidatePath, revalidateTag } from 'next/cache';
import { storeEnabled, storeSetMany } from '@/lib/store';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Kunci yang diterima: endpoint tema (+ query) atau "shorts".
const KEY_RE = /^(config|home|sitemap|indeks|list|post|shorts)(\?[\w%.,+=&-]{0,500})?$/;

/**
 * Menerima data dari plugin WordPress "Geprex Next Sync" (mode anti blokir) dan menyimpannya di Redis.
 * Body: { items: [{ key, status: 200|404|'unlicensed', data?, message? }] }, header X-Geprex-Secret.
 */
export async function POST(req) {
	const secret = process.env.REVALIDATE_SECRET;
	if (!secret || req.headers.get('x-geprex-secret') !== secret) {
		return Response.json({ ok: false, error: 'Kunci tidak cocok. Samakan "Kunci" di plugin dengan REVALIDATE_SECRET di Vercel.' }, { status: 401 });
	}
	if (!storeEnabled) {
		return Response.json({ ok: false, error: 'Penyimpanan belum aktif. Pasang integrasi Upstash Redis di Vercel (Storage), lalu redeploy.' }, { status: 503 });
	}
	const body = await req.json().catch(() => null);
	const items = Array.isArray(body?.items) ? body.items : [];
	const pairs = [];
	const rejected = [];
	for (const it of items) {
		const ok = it && typeof it.key === 'string' && KEY_RE.test(it.key) && (it.status === 200 || it.status === 404 || it.status === 'unlicensed');
		if (!ok) { rejected.push(it?.key ?? null); continue; }
		const value = it.status === 200 ? { status: 200, data: it.data } : it.status === 404 ? { status: 404 } : { status: 'unlicensed', message: String(it.message || 'Lisensi belum aktif') };
		pairs.push([it.key, value]);
	}
	let saved = 0;
	try {
		// Kirim ke Redis bertahap agar tiap permintaan tetap kecil.
		for (let i = 0; i < pairs.length; i += 25) saved += await storeSetMany(pairs.slice(i, i + 25));
	} catch (e) {
		return Response.json({ ok: false, error: `Gagal menyimpan ke Redis: ${e.message}`, saved }, { status: 502 });
	}
	if (saved) {
		revalidateTag('wp', 'max');
		revalidatePath('/', 'layout');
	}
	return Response.json({ ok: true, saved, rejected });
}
