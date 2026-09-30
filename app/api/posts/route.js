import { wp } from '@/lib/wp';

// Proxy "muat lebih banyak" → WordPress.
export async function GET(req) {
	const p = Object.fromEntries(new URL(req.url).searchParams);
	const allowed = ['latest', 'category', 'tag', 'author', 'search'];
	if (!allowed.includes(p.type)) return Response.json({ posts: [] }, { status: 400 });
	const data = await wp('list', { type: p.type, slug: p.slug, q: p.q, page: p.page, exclude: p.exclude }, { revalidate: 60, allow404: true });
	return Response.json(data || { posts: [] }, { headers: { 'Cache-Control': 'public, s-maxage=60' } });
}
