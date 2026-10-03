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
