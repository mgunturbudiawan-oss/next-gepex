import Link from 'next/link';
import { permanentRedirect } from 'next/navigation';
import { wp, getConfig, absolute, SITE_URL } from '@/lib/wp';
import { PageLayout, Sidebar, Breadcrumbs, Share } from '@/components/Layout';
import { Cat, Meta, CardGrid, SectionTitle } from '@/components/Cards';
import Icon from '@/components/Icon';
import Ad from '@/components/Ad';
import ViewPing from '@/components/ViewPing';
import Comments from '@/components/Comments';
import { decodeHtml } from '@/lib/list';

// Mendukung semua struktur permalink WordPress: /judul/, /2026/09/30/judul/, /kategori/judul/, /induk/anak/ …
// Slug artikel = segmen terakhir URL.
const slugOf = (params) => {
	const parts = Array.isArray(params.slug) ? params.slug : [params.slug];
	return decodeURIComponent(parts[parts.length - 1] || '');
};
const pathOf = (params) => '/' + (Array.isArray(params.slug) ? params.slug : [params.slug]).map((p) => decodeURIComponent(p)).join('/') + '/';

export async function generateMetadata(props) {
	const params = await props.params;
	const [config, post] = await Promise.all([getConfig(), wp('post', { slug: slugOf(params) })]);
	const url = absolute(post.path);
	const images = post.seo.image ? [{ url: post.seo.image, width: post.image?.width, height: post.image?.height, alt: post.title }] : undefined;
	return {
		title: post.seo.title,
		description: post.seo.description,
		alternates: { canonical: post.path },
		openGraph: post.type === 'post'
			? { type: 'article', url, title: post.seo.title, description: post.seo.description, images, publishedTime: post.date, modifiedTime: post.modified, section: post.category?.name, tags: post.tags.map((t) => t.name), siteName: config.site?.name }
			: { type: 'website', url, title: post.seo.title, description: post.seo.description, images, siteName: config.site?.name },
		twitter: { card: 'summary_large_image', title: post.seo.title, description: post.seo.description, images: post.seo.image ? [post.seo.image] : undefined },
	};
}

export default async function SinglePage(props) {
	const params = await props.params;
	const [config, post] = await Promise.all([getConfig(), wp('post', { slug: slugOf(params) })]);
	// URL berbeda dari permalink resmi (mis. tanggal salah) → alihkan ke alamat yang benar.
	if (post.path && post.path.startsWith('/') && decodeURI(post.path) !== pathOf(params)) {
		permanentRedirect(post.path);
	}
	const o = config.options;
	const isPost = post.type === 'post';
	const url = absolute(post.path);
	const position = ['right', 'left', 'none'].includes(post.sidebar) ? post.sidebar : undefined;
	const crumbs = [{ name: 'Beranda', path: '/' }];
	if (isPost && post.category) crumbs.push({ name: decodeHtml(post.category.name), path: post.category.path });
	crumbs.push({ name: post.title });

	const jsonLd = isPost ? {
		'@context': 'https://schema.org',
		'@graph': [
			{
				'@type': 'NewsArticle',
				mainEntityOfPage: { '@type': 'WebPage', '@id': url },
				headline: post.title,
				description: post.seo.description,
				image: post.image ? [post.image.full || post.image.src] : undefined,
				datePublished: post.date,
				dateModified: post.modified,
				author: post.author ? { '@type': 'Person', name: post.author.name, url: absolute(post.author.path) } : undefined,
				publisher: { '@type': 'Organization', name: config.site.name, logo: config.site.logo ? { '@type': 'ImageObject', url: config.site.logo } : undefined },
				articleSection: post.category ? decodeHtml(post.category.name) : undefined,
				keywords: post.tags.map((t) => t.name).join(', ') || undefined,
			},
			{ '@type': 'BreadcrumbList', itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: c.path ? absolute(c.path) : url })) },
		],
	} : null;

	return (
		<PageLayout config={config} position={position} sidebar={<Sidebar config={config} exclude={post.id} />}>
			{(!isPost || o.single_breadcrumb) ? <Breadcrumbs items={crumbs} /> : null}
			<article className={`gx-article${isPost ? '' : ' gx-article--page'}`}>
				<header className="gx-article__head">
					{isPost ? <Cat post={post} opts={o} solid /> : null}
					<h1 className="gx-article__title">{post.title}</h1>
					{isPost && post.excerptRaw ? <p className="gx-article__lead">{post.excerptRaw}</p> : null}
					{isPost ? (
						<>
							<div className="gx-article__info">
								<Meta post={post} opts={o} views avatar={post.authorAvatar} />
								{o.show_reading_time ? <div className="gx-meta gx-meta--sub"><span><Icon name="clock" /> {post.readingTime} menit baca</span></div> : null}
							</div>
							<Share config={config} url={url} title={post.title} />
						</>
					) : null}
				</header>

				{post.image && (o.show_featured || !isPost) ? (
					<figure className="gx-article__figure">
						{o.lightbox ? <a href={post.image.full} data-gx-lightbox><FeaturedImg post={post} /></a> : <FeaturedImg post={post} />}
						{post.image.caption ? <figcaption>{post.image.caption}</figcaption> : null}
					</figure>
				) : null}

				<div className="gx-article__wrap">
					{isPost && o.share_floating ? <div className="gx-article__float"><Share config={config} url={url} title={post.title} className="gx-share gx-share--vertical" /></div> : null}
					<div className="gx-article__body">
						{isPost ? <Ad config={config} slot="before_content" /> : null}
						<div className="gx-content entry-content" dangerouslySetInnerHTML={{ __html: post.content }} />
						{isPost ? <Ad config={config} slot="after_content" /> : null}
						{isPost && o.show_tags && post.tags.length ? (
							<div className="gx-tags">
								<span className="gx-tags__label"><Icon name="hashtag" /> Tag</span>
								{post.tags.map((t) => <Link key={t.id} href={t.path}>{t.name}</Link>)}
							</div>
						) : null}
						{isPost ? (
							<div className="gx-article__share-end"><span>Bagikan berita ini</span><Share config={config} url={url} title={post.title} /></div>
						) : null}
						{isPost && o.author_box && post.author ? (
							<div className="gx-author">
								{post.authorAvatar ? <img src={post.authorAvatar} alt="" width="64" height="64" className="gx-author__avatar" loading="lazy" /> : null}
								<div className="gx-author__body">
									<p className="gx-author__label">Penulis</p>
									<Link className="gx-author__name" href={post.author.path}>{post.author.name}</Link>
									{post.authorBio ? <p className="gx-author__bio">{post.authorBio}</p> : null}
								</div>
							</div>
						) : null}
					</div>
				</div>
			</article>

			{isPost && post.related && post.related.length ? (
				<section className="gx-related">
					<SectionTitle title={o.related_title} />
					<div className="gx-grid">{post.related.map((p) => <CardGrid key={p.id} post={p} opts={o} />)}</div>
				</section>
			) : null}

			{post.commentsOpen || post.comments.length ? <Comments post={post} /> : null}
			{isPost && o.perf_view_counter ? <ViewPing id={post.id} /> : null}
			{jsonLd ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} /> : null}
		</PageLayout>
	);
}

function FeaturedImg({ post }) {
	const i = post.image;
	return <img src={i.src} srcSet={i.srcset || undefined} sizes="(max-width: 768px) 100vw, 720px" width={i.width} height={i.height} alt={i.alt || post.title} className="gx-img" loading="eager" fetchPriority="high" decoding="async" />;
}
