import { WP_URL } from '@/lib/wp';

export async function POST(req) {
	const body = await req.json().catch(() => ({}));
	const res = await fetch(`${WP_URL}/wp-json/geprex/v1/hl/comment`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': req.headers.get('x-forwarded-for') || '' },
		body: JSON.stringify(body),
		cache: 'no-store',
	});
	const data = await res.json().catch(() => ({ message: 'Gagal mengirim komentar' }));
	return Response.json(data, { status: res.status });
}
