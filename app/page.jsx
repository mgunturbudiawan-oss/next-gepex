import { wp, getConfig, getShorts, SITE_URL } from '@/lib/wp';
import { PageLayout, Sidebar } from '@/components/Layout';
import { Headline, Trending, Latest, Sections, Special, TrendingPanel, pickTrending } from '@/components/Home';
import ShortVideos from '@/components/ShortVideos';
import { SHORTS } from '@/lib/shorts';

// Panel Trending di samping headline (desktop). Sementara dimatikan: Trending tampil di sidebar (sticky).
// Ubah ke `true` untuk menyalakan lagi.
const TRENDING_PANEL = false;

export default async function HomePage() {
	const [config, home, shorts] = await Promise.all([getConfig(), wp('home'), getShorts()]);
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
			{/* Dari plugin WordPress "Geprex Short Video". Plugin belum aktif / daftarnya masih kosong → pakai lib/shorts.js;
			    "Tampilkan" dimatikan di plugin → disembunyikan. */}
			{shorts && !shorts.enabled ? null : <ShortVideos videos={shorts?.videos.length ? shorts.videos : SHORTS} title={shorts?.title || undefined} />}
		</>
	);
	// Desktop: headline + Short Video berdampingan dengan panel Trending setinggi keduanya.
	// Widget Trending di sidebar disembunyikan di desktop (CSS) agar tidak dobel; HP tetap seperti biasa.
	const pos = o.sidebar_position;
	const panel = TRENDING_PANEL && !wide && !hideSideTrend && o.sidebar_trending && (pos === 'right' || pos === 'left');
	const before = wide ? top : panel ? (
		<div className={`gx-hometop gx-hometop--${pos}`}>
			<div className="gx-hometop__main">{top}</div>
			<TrendingPanel posts={pickTrending(config, home)} opts={o} title={o.trending_title} />
		</div>
	) : null;
	return (
		<PageLayout config={config} className={`gx-page--home${panel ? ' gx-page--tpanel' : ''}`} before={before} sidebar={<Sidebar config={config} hideTrending={hideSideTrend} />}>
			<h1 className="screen-reader-text">{config.site.name} — {config.site.description}</h1>
			{!wide && !panel ? top : null}
			{home.style !== 'style3' ? <Trending posts={home.trending} opts={o} /> : null}
			<Latest home={home} config={config} />
			<Sections sections={home.sections} opts={o} />
			<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
		</PageLayout>
	);
}
