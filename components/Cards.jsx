import Link from 'next/link';
import Icon from './Icon';
import { decodeHtml } from '@/lib/list';

export function Thumb({ post, eager = false, sizes }) {
	const img = post.image;
	if (!img) {
		return <img src="/placeholder.svg" alt="" className="gx-img gx-placeholder" loading="lazy" width="800" height="500" />;
	}
	return (
		<img
			src={img.src}
			srcSet={img.srcset || undefined}
			sizes={img.srcset ? sizes || '(max-width: 640px) 50vw, 400px' : undefined}
			width={img.width || undefined}
			height={img.height || undefined}
			alt={img.alt || post.title}
			className="gx-img"
			loading={eager ? 'eager' : 'lazy'}
			fetchPriority={eager ? 'high' : undefined}
			decoding="async"
		/>
	);
}

export function Cat({ post, opts, solid }) {
	if (!opts.show_category || !post.category) return null;
	return <Link className={solid ? 'gx-cat gx-cat--solid' : 'gx-cat'} href={post.category.path}>{decodeHtml(post.category.name)}</Link>;
}

export function Meta({ post, opts, views = false, avatar, className = 'gx-meta' }) {
	const parts = [];
	if (opts.show_author && post.author?.name) {
		parts.push(<span key="a" className="gx-meta__author">{avatar ? <img src={avatar} alt="" width="24" height="24" className="gx-meta__avatar" loading="lazy" /> : null}{post.author.name}</span>);
	}
	if (opts.show_date) parts.push(<time key="d" dateTime={post.date}>{post.dateText}</time>);
	if (views && opts.show_views) parts.push(<span key="v" className="gx-meta__views"><Icon name="eye" /> {Number(post.views || 0).toLocaleString('id-ID')}</span>);
	if (!parts.length) return null;
	return (
		<div className={className}>
			{parts.map((p, i) => [i ? <span key={`s${i}`} className="gx-meta__sep" aria-hidden="true">•</span> : null, p])}
		</div>
	);
}

export function CardList({ post, opts, excerpt }) {
	return (
		<article className="gx-card gx-card--list">
			<Link href={post.path} className="gx-card__media" tabIndex={-1} aria-hidden="true"><Thumb post={post} /></Link>
			<div className="gx-card__body">
				<Cat post={post} opts={opts} />
				<h3 className="gx-card__title"><Link href={post.path}>{post.title}</Link></h3>
				{excerpt && post.excerpt ? <p className="gx-card__excerpt">{post.excerpt}</p> : null}
				<Meta post={post} opts={opts} views />
			</div>
		</article>
	);
}

export function CardGrid({ post, opts, className = '', excerpt }) {
	return (
		<article className={`gx-card gx-card--grid ${className}`.trim()}>
			<Link href={post.path} className="gx-card__media" tabIndex={-1} aria-hidden="true"><Thumb post={post} /></Link>
			<div className="gx-card__body">
				<Cat post={post} opts={opts} />
				<h3 className="gx-card__title"><Link href={post.path}>{post.title}</Link></h3>
				{excerpt && post.excerpt ? <p className="gx-card__excerpt">{post.excerpt}</p> : null}
				<Meta post={post} opts={opts} />
			</div>
		</article>
	);
}

export function CardOverlay({ post, opts, eager, heading = 'h2', className = '' }) {
	const H = heading;
	return (
		<article className={`gx-card gx-card--overlay ${className}`.trim()}>
			<div className="gx-card__media"><Thumb post={post} eager={eager} sizes="(max-width: 768px) 100vw, 680px" /></div>
			<div className="gx-card__shade">
				<Cat post={post} opts={opts} solid />
				<H className="gx-card__title"><Link href={post.path} className="gx-stretch">{post.title}</Link></H>
				<Meta post={post} opts={opts} className="gx-meta gx-meta--light" />
			</div>
		</article>
	);
}

export function CardMini({ post, opts, num, views }) {
	return (
		<article className="gx-card gx-card--mini">
			{num ? <span className="gx-card__num" aria-hidden="true">{num}</span> : null}
			<div className="gx-card__body">
				<h3 className="gx-card__title"><Link href={post.path}>{post.title}</Link></h3>
				<Meta post={post} opts={opts} views={views} />
			</div>
		</article>
	);
}

export function Card({ layout, ...props }) {
	return layout === 'grid' ? <CardGrid {...props} /> : <CardList {...props} />;
}

export function SectionTitle({ title, href, as = 'h2', icon, id }) {
	const H = as;
	return (
		<div className="gx-section-head">
			<H className="gx-section-title" id={id}><span className="gx-section-bar" aria-hidden="true" />{icon ? <Icon name={icon} className="gx-trending__fire" /> : null}{typeof title === 'string' ? decodeHtml(title) : title}</H>
			{href ? <Link className="gx-section-more" href={href}>Lihat semua <Icon name="chevron-right" /></Link> : null}
		</div>
	);
}

/** Daftar berita tanpa model kartu: foto di atas, kategori & judul di bawah (mis. Berita Terkait). */
export function PlainGrid({ posts, opts }) {
	return (
		<div className="gx-plain">
			{posts.map((p) => (
				<article key={p.id} className="gx-plain__item">
					<Link className="gx-plain__media" href={p.path} tabIndex={-1} aria-hidden="true"><Thumb post={p} sizes="(max-width: 640px) 50vw, 240px" /></Link>
					<Cat post={p} opts={opts} />
					<h3 className="gx-plain__title"><Link href={p.path}>{p.title}</Link></h3>
					<span className="gx-plain__time">{p.ago || p.dateText}</span>
				</article>
			))}
		</div>
	);
}

/** Centang biru "terverifikasi" ala Instagram (kecil). */
export function VerifiedBadge({ className = '' }) {
	return (
		<svg className={`gx-verified ${className}`.trim()} viewBox="0 0 40 40" role="img" aria-label="Terverifikasi">
			<path fill="currentColor" fillRule="evenodd" d="M19.998 3.094 14.638 0l-2.972 5.15H5.432v6.354L0 14.64 3.094 20 0 25.359l5.432 3.137v5.905h5.975L14.638 40l5.36-3.094L25.358 40l3.232-5.6h6.162v-6.01L40 25.359 36.905 20 40 14.641l-5.248-3.03v-6.46h-6.419L25.358 0l-5.36 3.094Zm7.415 11.225 2.254 2.287-11.43 11.5-6.835-6.93 2.244-2.258 4.587 4.581 9.18-9.18Z" />
		</svg>
	);
}

/** Avatar Gravatar resolusi lebih tinggi (s=128 → ukuran yang diminta). */
export const avatarAt = (url, size) => (url ? url.replace(/([?&])s=\d+/, `$1s=${size}`) : url);

/** Nama penulis + centang biru, menuju halaman penulis (dipakai di artikel). */
export function AuthorByline({ post, avatar }) {
	if (!post.author?.name) return null;
	const inner = (
		<>
			{avatar ? <img src={avatarAt(avatar, 64)} alt="" width="28" height="28" className="gx-byline__avatar" loading="lazy" /> : null}
			<span className="gx-byline__name">{post.author.name}<VerifiedBadge /></span>
		</>
	);
	return post.author.path
		? <Link className="gx-byline" href={post.author.path} rel="author">{inner}</Link>
		: <span className="gx-byline">{inner}</span>;
}
