import { WP_URL, SITE_URL } from '@/lib/wp';

export const dynamic = 'force-dynamic';

// Cek koneksi Next.js → WordPress (untuk memeriksa pemasangan). Tidak menampilkan kunci rahasia.
export async function GET() {
	const out = {
		wp_url: WP_URL || null,
		site_url: SITE_URL,
		revalidate_secret_diisi: Boolean(process.env.REVALIDATE_SECRET),
		node: process.version,
	};
	if (!WP_URL) return Response.json({ ...out, ok: false, pesan: 'WP_URL belum diisi di Environment Variables.' }, { status: 500 });
	const t = Date.now();
	try {
		const res = await fetch(`${WP_URL}/wp-json/geprex/v1/hl/config`, { cache: 'no-store', headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(15000) });
		const text = await res.text();
		let body = null;
		try { body = JSON.parse(text); } catch (e) { /* bukan JSON */ }
		return Response.json({
			...out,
			ok: res.ok && Boolean(body),
			status: res.status,
			ms: Date.now() - t,
			lisensi_aktif: res.ok && body ? true : body?.code === 'geprex_unlicensed' ? false : null,
			site_name: body?.site?.name ?? null,
			cuplikan: body ? undefined : text.replace(/\s+/g, ' ').slice(0, 2500),
			headers: body ? undefined : Object.fromEntries([...res.headers].filter(([k]) => !/cookie/i.test(k))),
		}, { headers: { 'Cache-Control': 'no-store' } });
	} catch (e) {
		return Response.json({ ...out, ok: false, ms: Date.now() - t, error: e.cause?.code || e.name, pesan: e.message }, { status: 502 });
	}
}
