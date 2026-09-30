import { WP_URL } from '@/lib/wp';

export async function POST(req, ctx) {
	const params = await ctx.params;
	const id = parseInt(params.id, 10);
	if (!id) return new Response(null, { status: 400 });
	await fetch(`${WP_URL}/wp-json/geprex/v1/view/${id}`, { method: 'POST', headers: { 'User-Agent': req.headers.get('user-agent') || '' }, cache: 'no-store' }).catch(() => {});
	return new Response(null, { status: 204 });
}
