import Link from 'next/link';
import Icon from './Icon';
import Ad from './Ad';
import LoadMore from './LoadMore';
import { CardOverlay, CardList, CardGrid, CardMini, Meta, Thumb, SectionTitle } from './Cards';
import HeadlineSlider from './HeadlineSlider';
import { list } from '@/lib/list';

export function Special({ special }) {
	if (!special || !list(special.posts).length) return null;
	return (
		<section className="gx-special" aria-label={`${special.label}: ${special.name}`}>
			<div className="gx-special__head">
				<span className="gx-special__label"><Icon name="star" />{special.label}</span>
				<Link className="gx-special__name" href={special.path}>{special.name}</Link>
				<div className="gx-special__nav">
					<button type="button" className="gx-iconbtn gx-iconbtn--sm" data-gx-scroll="-1" aria-label="Sebelumnya"><Icon name="chevron-left" /></button>
					<button type="button" className="gx-iconbtn gx-iconbtn--sm" data-gx-scroll="1" aria-label="Berikutnya"><Icon name="chevron-right" /></button>
				</div>
			</div>
			<div className="gx-special__track" data-gx-track>
				{list(special.posts).map((p) => (
					<Link key={p.id} className="gx-special__item" href={p.path}>
						<span className="gx-special__thumb"><Thumb post={p} /></span>
						<span className="gx-special__text">
							<span className="gx-special__title">{p.title}</span>
							<span className="gx-special__time">{p.ago || p.dateText}</span>
						</span>
					</Link>
				))}
				<Link className="gx-special__all" href={special.path}><Icon name="arrow-right" /><span>Lihat semua berita topik ini</span></Link>
			</div>
		</section>
	);
}

export function Headline({ home, opts }) {
	const [first, ...rest] = home.headline;
	if (!first) return null;
	if (home.style === 'style4') {
		return <HeadlineSlider slides={home.headline} badge={home.badge} autoplay={parseInt(opts.home_slider_autoplay, 10) || 0} showCategory={opts.show_category} />;
	}
	if (home.style === 'style2') {
		return (
			<section className="gx-headline gx-headline--style2" aria-label="Berita utama">
				<div className="gx-headline__main"><CardOverlay post={first} opts={opts} eager className="gx-card--hero" /></div>
				{rest.length ? <div className="gx-headline__side">{rest.map((p) => <CardOverlay key={p.id} post={p} opts={opts} heading="h3" className="gx-card--sub" />)}</div> : null}
			</section>
		);
	}
	if (home.style === 'style3') {
		return (
			<section className="gx-headline gx-headline--style3" aria-label="Berita utama">
				<div className="gx-headline__main"><CardOverlay post={first} opts={opts} eager className="gx-card--hero" /></div>
				{home.trending.length ? (
					<div className="gx-headline__side gx-box">
						<SectionTitle title={opts.trending_title} />
						{home.trending.slice(0, 5).map((p, i) => <CardMini key={p.id} post={p} opts={opts} num={i + 1} />)}
					</div>
				) : null}
			</section>
		);
	}
	return (
		<section className="gx-headline gx-headline--style1" aria-label="Berita utama">
			<CardOverlay post={first} opts={opts} eager className="gx-card--hero" />
		</section>
	);
}

export function Trending({ posts, opts }) {
	if (!opts.home_trending_enable || !posts.length) return null;
	return (
		<section className="gx-trending" aria-labelledby="gx-trending-title">
			<SectionTitle title={opts.home_trending_title} icon="fire" id="gx-trending-title" />
			<ol className="gx-trending__list">
				{posts.map((p, i) => (
					<li key={p.id} className="gx-trending__item">
						<span className="gx-trending__num" aria-hidden="true">{i + 1}</span>
						<div className="gx-trending__body">
							<h3 className="gx-trending__title"><Link href={p.path}>{p.title}</Link></h3>
							<Meta post={p} opts={opts} views className="gx-meta gx-meta--compact" />
						</div>
						<Link className="gx-trending__thumb" href={p.path} tabIndex={-1} aria-hidden="true"><Thumb post={p} /></Link>
					</li>
				))}
			</ol>
		</section>
	);
}

export function Topics({ topics, opts }) {
	if (!opts.home_topics_enable || !topics.length) return null;
	return (
		<section className="gx-topics" aria-label={opts.home_topics_title}>
			<div className="gx-section-head">
				<h2 className="gx-section-title"><span className="gx-section-bar" aria-hidden="true" />{opts.home_topics_title}</h2>
				<div className="gx-topics__nav">
					<button type="button" className="gx-iconbtn gx-iconbtn--sm" data-gx-scroll="-1" aria-label="Sebelumnya"><Icon name="chevron-left" /></button>
					<button type="button" className="gx-iconbtn gx-iconbtn--sm" data-gx-scroll="1" aria-label="Berikutnya"><Icon name="chevron-right" /></button>
				</div>
			</div>
			<div className="gx-topics__track" data-gx-track>
				{topics.map((t) => (
					<Link key={t.path} className="gx-topic" href={t.path}>
						{t.image ? <img src={t.image} alt="" className="gx-img" loading="lazy" decoding="async" /> : <span className="gx-topic__ph" aria-hidden="true"><Icon name="hashtag" /></span>}
						<span className="gx-topic__text"><span className="gx-topic__name">#{t.name}</span><span className="gx-topic__count">{t.count} berita</span></span>
					</Link>
				))}
			</div>
		</section>
	);
}

export function Latest({ home, config }) {
	const opts = config.options;
	const after = parseInt(opts.home_topics_after, 10) || 0;
	const adAfter = Math.max(1, parseInt(opts.ad_home_list_after, 10) || 4);
	const topics = <Topics topics={home.topics} opts={opts} />;
	const posts = home.latest;
	const split = after > 0 && posts.length > after;
	const render = (list, offset) => list.map((p, i) => [
		<CardList key={p.id} post={p} opts={opts} excerpt={opts.show_excerpt} />,
		opts.ad_home_list && offset + i + 1 === adAfter ? <Ad key="ad" config={config} slot="home_list" className="gx-list__ad" /> : null,
	]);
	return (
		<>
			{after < 1 ? topics : null}
			<SectionTitle title={opts.home_latest_title} />
			<div className="gx-list gx-list--list">{render(split ? posts.slice(0, after) : posts, 0)}</div>
			{split ? topics : null}
			<div id="gx-post-list">
				{split ? <div className="gx-list gx-list--list">{render(posts.slice(after), after)}</div> : null}
				{home.hasMore ? <LoadMore query={{ type: 'latest', exclude: home.exclude.join(',') }} totalPages={999} opts={opts} excerpt={opts.show_excerpt} /> : null}
			</div>
			{after > 0 && !split ? topics : null}
		</>
	);
}

export function Sections({ sections, opts }) {
	const mGrid = opts.home_mobile_grid;
	const mCount = Math.max(2, parseInt(opts.home_mobile_count, 10) || 4);
	return sections.map((s) => (
		<section key={s.path} className={`gx-section gx-sec gx-sec--${s.layout}${mGrid ? ' gx-sec--mgrid' : ''}`}>
			<SectionTitle title={s.title} href={opts.home_sections_title_link ? s.path : ''} />
			<div className="gx-sec__items">
				{s.posts.map((p, i) => {
					const cls = [i === 0 ? 'gx-sec__first' : '', i >= s.count ? 'gx-hide-d' : '', mGrid && i >= mCount ? 'gx-hide-m' : ''].filter(Boolean).join(' ');
					return <CardGrid key={p.id} post={p} opts={opts} className={cls} />;
				})}
			</div>
		</section>
	));
}
