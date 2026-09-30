import { wp, getConfig } from '@/lib/wp';
import Archive from '@/components/Archive';

export async function generateMetadata(props) {
	const params = await props.params;
	const [config, d] = await Promise.all([getConfig(), wp('list', { type: 'tag', slug: params.slug })]);
	return { robots: { index: !config.options?.seo_noindex_tag, follow: true }, title: d.title, description: d.description || undefined, alternates: { canonical: `/tag/${params.slug}/` } };
}

export default async function TagPage(props) {
	const params = await props.params;
	const [config, data] = await Promise.all([getConfig(), wp('list', { type: 'tag', slug: params.slug })]);
	const heading = (
		<header className="gx-archive-head"><div><h1 className="gx-archive-head__title">{data.title}</h1>{data.description ? <p className="gx-archive-head__desc">{data.description}</p> : null}</div></header>
	);
	return <Archive config={config} data={data} query={{ type: 'tag', slug: params.slug }} heading={heading} crumbs={[{ name: 'Beranda', path: '/' }, { name: data.title }]} />;
}
