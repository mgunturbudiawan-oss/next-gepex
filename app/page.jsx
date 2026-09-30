import { wp, getConfig, SITE_URL } from '@/lib/wp';
import { PageLayout, Sidebar } from '@/components/Layout';
import { Headline, Trending, Latest, Sections, Special } from '@/components/Home';
import ShortVideos from '@/components/ShortVideos';
import { SHORTS } from '@/lib/shorts';

export default async function HomePage() {
	const [config, home] = await Promise.all([getConfig(), wp('home')]);
	if (!config.licensed) return null;
	const o = config.options;
	const jsonLd = {
		'@context': 'https://schema.org',
		'@graph': [
			{ '@type': o.seo_org_type || 'NewsMediaOrganization', '@id': `${SITE_URL}/#organization`, name: config.site.name, url: `${SITE_URL}/`, logo: config.site.logo || undefined },
			{ '@type': 'WebSite', '@id': `${SITE_URL}/#website`, url: `${SITE_URL}/`, name: config.site.name, publisher: { '@id': `${SITE_URL}/#organization` }, potentialAction: { '@type': 'SearchAction', target: `${SITE_URL}/cari/?q={search_term_string}`, 'query-input': 'required name=search_term_string' } },
		],
	};
	const hideSideTrend = home.style === 'style3' || o.home_trending_enable;
	const wide = home.style === 'style4';
	const top = (
		<>
			<Special special={home.special} />
			<Headline home={home} opts={o} />
			<ShortVideos videos={SHORTS} />
		</>
	);
	return (
		<PageLayout config={config} className="gx-page--home" before={wide ? top : null} sidebar={<Sidebar config={config} hideTrending={hideSideTrend} />}>
			<h1 className="screen-reader-text">{config.site.name} — {config.site.description}</h1>
			{!wide ? top : null}
			{home.style !== 'style3' ? <Trending posts={home.trending} opts={o} /> : null}
			<Latest home={home} config={config} />
			<Sections sections={home.sections} opts={o} />
			<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
		</PageLayout>
	);
}
