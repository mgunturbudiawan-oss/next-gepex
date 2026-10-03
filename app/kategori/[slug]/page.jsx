import { wpOrNull, getConfig } from '@/lib/wp';
import Archive from '@/components/Archive';
import { PageLayout } from '@/components/Layout';
import { ClientArchive } from '@/components/ClientFallback';
import { themeOf } from '@/lib/category-themes';

const nameOf = (slug) => decodeURIComponent(slug).replace(/-/g, ' ');

export async function generateMetadata(props) {
	const params = await props.params;
	const d = await wpOrNull('list', { type: 'category', slug: params.slug });
	return { title: d ? d.title : nameOf(params.slug), description: d?.description || undefined, alternates: { canonical: `/kategori/${params.slug}/` } };
}

// Warna bilah browser di HP mengikuti tema kategori (mis. hijau untuk Jawa Timur).
export async function generateViewport(props) {
	const params = await props.params;
	const theme = themeOf(params.slug);
	return theme ? { themeColor: theme.themeColor } : {};
}

export default async function CategoryPage(props) {
	const params = await props.params;
	const [config, data] = await Promise.all([getConfig(), wpOrNull('list', { type: 'category', slug: params.slug })]);
	const query = { type: 'category', slug: params.slug };
	const theme = themeOf(params.slug);
	const themeClass = theme ? `gx-ctheme gx-ctheme--${theme.key}` : '';
	// Data belum terkirim & server diblokir hosting → diambil browser pengunjung.
	if (!data) return <PageLayout config={config} className={themeClass}><ClientArchive query={query} opts={config.options} /></PageLayout>;
	const heading = (
		<header className="gx-archive-head">
			<div>
				{theme ? <span className="gx-archive-head__kicker">Kanal</span> : null}
				<h1 className="gx-archive-head__title">{data.title}</h1>
				{data.description ? <p className="gx-archive-head__desc">{data.description}</p> : null}
			</div>
		</header>
	);
	return <Archive config={config} data={data} query={query} heading={heading} crumbs={[{ name: 'Beranda', path: '/' }, { name: data.title }]} className={themeClass} listTitle={theme ? theme.listTitle : ''} />;
}
