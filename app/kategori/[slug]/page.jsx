import { wpOrNull, getConfig } from '@/lib/wp';
import Archive from '@/components/Archive';
import { PageLayout } from '@/components/Layout';
import { ClientArchive } from '@/components/ClientFallback';

const nameOf = (slug) => decodeURIComponent(slug).replace(/-/g, ' ');

export async function generateMetadata(props) {
	const params = await props.params;
	const d = await wpOrNull('list', { type: 'category', slug: params.slug });
	return { title: d ? d.title : nameOf(params.slug), description: d?.description || undefined, alternates: { canonical: `/kategori/${params.slug}/` } };
}

export default async function CategoryPage(props) {
	const params = await props.params;
	const [config, data] = await Promise.all([getConfig(), wpOrNull('list', { type: 'category', slug: params.slug })]);
	const query = { type: 'category', slug: params.slug };
	// Data belum terkirim & server diblokir hosting → diambil browser pengunjung.
	if (!data) return <PageLayout config={config}><ClientArchive query={query} opts={config.options} /></PageLayout>;
	const heading = (
		<header className="gx-archive-head"><div><h1 className="gx-archive-head__title">{data.title}</h1>{data.description ? <p className="gx-archive-head__desc">{data.description}</p> : null}</div></header>
	);
	return <Archive config={config} data={data} query={query} heading={heading} crumbs={[{ name: 'Beranda', path: '/' }, { name: data.title }]} />;
}
