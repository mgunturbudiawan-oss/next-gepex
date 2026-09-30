import { wp, absolute } from '@/lib/wp';

// Dibuat saat diakses (build tidak menghubungi WordPress); data tetap di-cache 10 menit.
export const dynamic = 'force-dynamic';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Sitemap Google News: berita 48 jam terakhir.
export async function GET() {
	const data = await wp('sitemap', {}, { revalidate: 600 });
	const since = Date.now() - 48 * 3600 * 1000;
	const items = data.items.filter((i) => i.type === 'post' && new Date(i.date).getTime() >= since).slice(0, 1000);
	const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${items.map((i) => `<url><loc>${esc(absolute(i.path))}</loc><news:news><news:publication><news:name>${esc(data.newsName)}</news:name><news:language>${esc(data.language || 'id')}</news:language></news:publication><news:publication_date>${esc(i.date)}</news:publication_date><news:title>${esc(i.title)}</news:title></news:news></url>`).join('\n')}
</urlset>`;
	return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=600' } });
}
