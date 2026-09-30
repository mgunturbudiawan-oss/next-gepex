import { SITE_URL } from '@/lib/wp';

export default function robots() {
	return {
		rules: [{ userAgent: '*', allow: '/', disallow: ['/api/', '/cari/'] }],
		sitemap: [`${SITE_URL}/sitemap.xml`, `${SITE_URL}/news-sitemap.xml`],
	};
}
