import { wp, getConfig } from '@/lib/wp';
import Archive from '@/components/Archive';

export async function generateMetadata(props) {
	const params = await props.params;
	const [config, d] = await Promise.all([getConfig(), wp('list', { type: 'author', slug: params.slug })]);
	return { title: d.title, description: d.description || undefined, alternates: { canonical: `/penulis/${params.slug}/` }, robots: { index: !config.options?.seo_noindex_author, follow: true } };
}

export default async function AuthorPage(props) {
	const params = await props.params;
	const [config, data] = await Promise.all([getConfig(), wp('list', { type: 'author', slug: params.slug })]);
	const heading = (
		<header className="gx-archive-head">
			{data.avatar ? <img src={data.avatar} alt="" width="64" height="64" className="gx-archive-head__avatar" /> : null}
			<div><h1 className="gx-archive-head__title">{data.title}</h1>{data.description ? <p className="gx-archive-head__desc">{data.description}</p> : null}</div>
		</header>
	);
	return <Archive config={config} data={data} query={{ type: 'author', slug: params.slug }} heading={heading} crumbs={[{ name: 'Beranda', path: '/' }, { name: data.title }]} />;
}
