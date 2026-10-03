import Link from 'next/link';
import { list } from '@/lib/list';
import Icon from './Icon';
import Ad from './Ad';
import { CardMini } from './Cards';
import NearbyNews from './NearbyNews';

export function Logo({ config }) {
	const { site } = config;
	return (
		<div className="gx-brand">
			<Link href="/" rel="home" aria-label={site.name}>
				{site.logo ? <img src={site.logo} alt={site.name} className="gx-brand__img" decoding="async" /> : <span className="gx-brand__text">{site.name}</span>}
			</Link>
		</div>
	);
}

function MenuList({ items, className, icons }) {
	return (
		<ul className={className}>
			{list(items).map((m, i) => (
				<li key={i} className="menu-item">
					<Link href={m.path}>{icons && m.icon ? <><Icon name={m.icon} className="gx-mi" /><span>{m.title}</span></> : m.title}</Link>
				</li>
			))}
		</ul>
	);
}

function SearchForm({ id, className, placeholder = 'Cari berita...' }) {
	return (
		<form role="search" method="get" action="/cari/" className={`gx-search ${className}`}>
			<label htmlFor={id} className="screen-reader-text">Cari berita</label>
			<input id={id} type="search" name="q" placeholder={placeholder} />
			<button type="submit" aria-label="Cari"><Icon name="search" /></button>
		</form>
	);
}
export { SearchForm };

export function Breaking({ config }) {
	const items = list(config.breaking);
	if (!config.options.breaking_enable || !items.length) return null;
	const row = (hidden) => (
		<div className="gx-breaking__items" aria-hidden={hidden || undefined}>
			{items.map((p) => <Link key={p.id} href={p.path} tabIndex={hidden ? -1 : undefined}>{p.title}</Link>)}
		</div>
	);
	return (
		<div className="gx-breaking">
			<div className="container-custom gx-breaking__inner">
				<span className="gx-breaking__label"><Icon name="bolt" /><span>{config.options.breaking_label}</span></span>
				<div className="gx-breaking__track"><div className="gx-breaking__move">{row(false)}{row(true)}</div></div>
			</div>
		</div>
	);
}

export function Header({ config }) {
	const o = config.options;
	const center = o.header_layout === 'center';
	const darkToggle = o.dark_mode === 'toggle';
	const today = new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: config.site.timezone || 'Asia/Jakarta' }).format(new Date());
	return (
		<>
			<a className="gx-skip" href="#gx-content">Langsung ke konten</a>
			<header id="gx-header" className={`gx-header${center ? ' gx-header--center' : ''}`}>
				<div className="gx-topbar container-custom">
					<div className="gx-topbar__start">
						<button type="button" className="gx-burger" data-gx-menu-toggle aria-expanded="false" aria-controls="gx-mobile-menu" aria-label="Buka menu"><span /><span /><span /></button>
						{!center ? <div className="gx-logo"><Logo config={config} /></div> : null}
						{o.topbar_date ? <span className="gx-today" suppressHydrationWarning>{today}</span> : null}
					</div>
					{center ? <div className="gx-logo gx-logo--center"><Logo config={config} /></div> : null}
					<div className="gx-topbar__end">
						{o.show_header_search ? <SearchForm id="gx-header-search" className="gx-search--header" placeholder="Cari berita terbaru..." /> : null}
						<button type="button" className="gx-iconbtn gx-search-toggle" data-gx-search-open aria-label="Cari"><Icon name="search" /></button>
						{darkToggle ? (
							<button type="button" className="gx-iconbtn" data-gx-dark aria-label="Ganti mode gelap/terang">
								<Icon name="moon" className="gx-show-light" /><Icon name="sun" className="gx-show-dark" />
							</button>
						) : null}
					</div>
				</div>
				{/* Pembungkus menjaga tinggi saat bilah menu menempel (fixed) di desktop. */}
				<div className="gx-navwrap" data-gx-navwrap>
					<nav id="main-nav" className="gx-nav" aria-label="Menu utama">
						<div className="container-custom gx-nav__inner">
							<div className="gx-nav__logo"><Logo config={config} /></div>
							<div className="gx-nav__scroller" data-gx-nav>
								<button type="button" className="gx-nav__arrow gx-nav__arrow--prev" data-gx-nav-scroll="-1" aria-label="Geser menu ke kiri" tabIndex={-1}><Icon name="chevron-left" /></button>
								<MenuList items={list(config.menus?.main)} className="gx-nav__list" icons={o.menu_icons} />
								<button type="button" className="gx-nav__arrow gx-nav__arrow--next" data-gx-nav-scroll="1" aria-label="Geser menu ke kanan" tabIndex={-1}><Icon name="chevron-right" /></button>
							</div>
							<SearchForm id="gx-nav-search" className="gx-search--nav" />
						</div>
					</nav>
				</div>
				<Breaking config={config} />
			</header>
			<div className="gx-overlay" data-gx-menu-close />
			{/* Menu burger (HP/tablet): laci dari kiri, daftar kanal vertikal. */}
			<aside id="gx-mobile-menu" className="gx-drop" aria-label="Menu" aria-hidden="true" inert>
				<div className="gx-drop__head">
					<Logo config={config} />
					<button type="button" className="gx-iconbtn" data-gx-menu-close aria-label="Tutup menu"><Icon name="xmark" /></button>
				</div>
				<SearchForm id="gx-mobile-search" className="gx-search--drop" />
				<p className="gx-drop__label">Kanal</p>
				<nav aria-label="Menu mobile"><MenuList items={list(config.menus?.main)} className="gx-drop__list" icons /></nav>
				<div className="gx-drop__foot">
					<Link href="/indeks/"><Icon name="calendar-days" /> Indeks berita</Link>
					{darkToggle ? <button type="button" data-gx-dark><Icon name="moon" className="gx-show-light" /><Icon name="sun" className="gx-show-dark" /> <span className="gx-show-light">Mode gelap</span><span className="gx-show-dark">Mode terang</span></button> : null}
				</div>
			</aside>
			{o.ad_header ? <div className="container-custom gx-ad-wrap"><Ad config={config} slot="header" /></div> : null}
		</>
	);
}

export function SocialLinks({ config, className = 'gx-social' }) {
	const nets = { facebook: 'Facebook', x: 'X', instagram: 'Instagram', youtube: 'YouTube', tiktok: 'TikTok', threads: 'Threads', whatsapp: 'WhatsApp', telegram: 'Telegram', linkedin: 'LinkedIn' };
	const links = Object.entries(nets).filter(([k]) => config.options[`social_${k}`]);
	if (!links.length) return null;
	return (
		<div className={className}>
			{links.map(([k, label]) => <a key={k} href={config.options[`social_${k}`]} target="_blank" rel="noopener me" aria-label={label}><Icon name={k} /></a>)}
		</div>
	);
}

export function Footer({ config }) {
	const o = config.options;
	const cols = [[list(config.menus?.footer1), o.footer_menu1_title], [list(config.menus?.footer2), o.footer_menu2_title]].filter(([m]) => m.length);
	return (
		<>
			<footer className="gx-footer">
				<div className="container-custom gx-footer__grid">
					<div className="gx-footer__brand">
						<Logo config={config} />
						<p className="gx-footer__about">{o.footer_about || config.site.description}</p>
						<SocialLinks config={config} className="gx-social gx-social--footer" />
					</div>
					{cols.map(([items, title], i) => (
						<nav key={i} className="gx-footer__col" aria-label={title}>
							<h2 className="gx-footer__title">{title}</h2>
							<MenuList items={items} className="gx-footer__menu" />
						</nav>
					))}
				</div>
				<div className="gx-footer__bottom"><div className="container-custom" dangerouslySetInnerHTML={{ __html: config.copyright }} /></div>
			</footer>
			{o.back_to_top ? <button type="button" className="gx-totop" data-gx-totop hidden aria-label="Kembali ke atas"><Icon name="chevron-up" /></button> : null}
			{o.mobile_bottom_nav ? (
				<nav className="gx-bottomnav" aria-label="Navigasi cepat">
					<Link href="/"><Icon name="house" /><span>Beranda</span></Link>
					<Link href="/#gx-post-list"><Icon name="bolt" /><span>Terkini</span></Link>
					<button type="button" data-gx-menu-toggle aria-controls="gx-mobile-menu" aria-expanded="false"><Icon name="grid" /><span>Kanal</span></button>
					<Link href="/indeks/"><Icon name="calendar-days" /><span>Indeks</span></Link>
					<button type="button" data-gx-search-open><Icon name="search" /><span>Cari</span></button>
				</nav>
			) : null}
		</>
	);
}

export function Sidebar({ config, hideTrending, exclude }) {
	const o = config.options;
	const trend = list(config.trending).filter((p) => p.id !== exclude).slice(0, 5);
	return (
		<>
			<Ad config={config} slot="sidebar" />
			{o.sidebar_trending && !hideTrending && trend.length ? (
				<section className="gx-widget gx-widget--trending">
					<h2 className="gx-widget__title"><Icon name="fire" /> {o.trending_title}</h2>
					<div className="gx-wlist gx-wlist--number">
						{trend.map((p, i) => <CardMini key={p.id} post={p} opts={o} num={i + 1} views />)}
					</div>
				</section>
			) : null}
			<NearbyNews />
		</>
	);
}

/** Pembungkus konten + sidebar sesuai pengaturan. */
/**
 * `after` = konten selebar penuh di bawah area konten + sidebar (desktop), jadi sidebar sticky berhenti di atasnya.
 * Di HP urutannya tetap: konten → after → sidebar (lihat .gx-page--after di globals.css).
 */
export function PageLayout({ config, children, sidebar, position, className = '', before = null, after = null }) {
	const pos = position || config.options.sidebar_position;
	if (pos === 'none') {
		return <div className={`container-custom gx-page ${className}`}>{before}<div className="gx-layout gx-layout--full"><main className="gx-main">{children}{after}</main></div></div>;
	}
	return (
		<div className={`container-custom gx-page ${className}${after ? ' gx-page--after' : ''}`}>
			{before}
			<div className={`gx-layout gx-layout--${pos}`}>
				<main className="gx-main">{children}</main>
				<aside className={`gx-aside${config.options.sticky_sidebar ? ' gx-aside--sticky' : ''}`}>{sidebar || <Sidebar config={config} />}</aside>
			</div>
			{after ? <div className="gx-page__after">{after}</div> : null}
		</div>
	);
}

export function Breadcrumbs({ items }) {
	if (!items || items.length < 2) return null;
	return (
		<nav className="gx-breadcrumb" aria-label="Breadcrumb">
			<ol>
				{items.map((it, i) => (
					<li key={i}>
						{i < items.length - 1 ? <><Link href={it.path}>{it.name}</Link><Icon name="chevron-right" className="gx-breadcrumb__sep" /></> : <span aria-current="page">{it.name}</span>}
					</li>
				))}
			</ol>
		</nav>
	);
}

export function Share({ config, url, title, className = 'gx-share' }) {
	const o = config.options;
	const u = encodeURIComponent(url);
	const t = encodeURIComponent(title);
	const nets = [
		['whatsapp', 'WhatsApp', `https://api.whatsapp.com/send?text=${t}%20${u}`],
		['facebook', 'Facebook', `https://www.facebook.com/sharer/sharer.php?u=${u}`],
		['x', 'X', `https://twitter.com/intent/tweet?url=${u}&text=${t}`],
		['telegram', 'Telegram', `https://t.me/share/url?url=${u}&text=${t}`],
		['linkedin', 'LinkedIn', `https://www.linkedin.com/sharing/share-offsite/?url=${u}`],
	].filter(([k]) => o[`share_${k}`]);
	return (
		<div className={className}>
			{nets.map(([k, label, href]) => <a key={k} className={`gx-share__btn gx-share__btn--${k}`} href={href} target="_blank" rel="noopener nofollow" aria-label={`Bagikan ke ${label}`}><Icon name={k} /></a>)}
			{o.share_copy ? <button type="button" className="gx-share__btn gx-share__btn--copy" data-gx-copy={url} aria-label="Salin tautan"><Icon name="link" /></button> : null}
		</div>
	);
}
