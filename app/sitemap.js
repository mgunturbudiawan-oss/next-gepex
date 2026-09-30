import { wp, absolute } from '@/lib/wp';

export const revalidate = 3600;

export default async function sitemap() {
	const data = await wp('sitemap', {}, { revalidate: 3600 });
	return [
		{ url: absolute('/'), changeFrequency: 'hourly', priority: 1 },
		...data.categories.filter(Boolean).map((c) => ({ url: absolute(c.path), changeFrequency: 'hourly', priority: 0.7 })),
		...data.items.map((i) => ({ url: absolute(i.path), lastModified: i.modified, priority: i.type === 'post' ? 0.8 : 0.5 })),
	];
}
