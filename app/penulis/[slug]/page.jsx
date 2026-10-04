import { wpOrNull, getConfig, robotsFor } from '@/lib/wp';
import Archive from '@/components/Archive';
import { PageLayout } from '@/components/Layout';
import { ClientArchive } from '@/components/ClientFallback';
import { VerifiedBadge, avatarAt } from '@/components/Cards';

const nameOf = (slug) => decodeURIComponent(slug).replace(/-/g, ' ');

export async function generateMetadata(props) {
	const params = await props.params;
	const [config, d] = await Promise.all([getConfig(), wpOrNull('list', { type: 'author', slug: params.slug })]);
	return { title: d ? d.title : nameOf(params.slug), description: d?.description || undefined, alternates: { canonical: `/penulis/${params.slug}/` }, robots: robotsFor(!config.options?.seo_noindex_author) };
}

/** Profil penulis: cover (foto artikel terbaru), avatar, nama + centang biru, bio, jumlah artikel. */
function Profile({ data, siteName }) {
	const latest = (data.posts || []).find((p) => p.image);
	const cover = latest ? latest.image.full || latest.image.src : '';
	return (
		<header className="gx-profile">
			<div className="gx-profile__cover">{cover ? <img src={cover} alt="" loading="eager" decoding="async" /> : null}</div>
			<div className="gx-profile__body">
				{data.avatar ? <img className="gx-profile__avatar" src={avatarAt(data.avatar, 256)} alt={data.title} width="112" height="112" /> : null}
				<div className="gx-profile__info">
					<h1 className="gx-profile__name">{data.title}<VerifiedBadge /></h1>
					<p className="gx-profile__role">Penulis di {siteName}</p>
					{data.description ? <p className="gx-profile__bio">{data.description}</p> : null}
					<p className="gx-profile__stats"><strong>{Number(data.total || 0).toLocaleString('id-ID')}</strong> artikel</p>
				</div>
			</div>
		</header>
	);
}

export default async function AuthorPage(props) {
	const params = await props.params;
	const [config, data] = await Promise.all([getConfig(), wpOrNull('list', { type: 'author', slug: params.slug })]);
	const query = { type: 'author', slug: params.slug };
	// Data belum terkirim & server diblokir hosting → diambil browser pengunjung.
	if (!data) return <PageLayout config={config}><ClientArchive query={query} opts={config.options} /></PageLayout>;
	return (
		<Archive
			config={config}
			data={data}
			query={query}
			heading={<Profile data={data} siteName={config.site.name} />}
			crumbs={[{ name: 'Beranda', path: '/' }, { name: data.title }]}
			headlineAllowed={false}
			listTitle={`Artikel terbaru oleh ${data.title}`}
		/>
	);
}
