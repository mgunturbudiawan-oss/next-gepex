'use client';
// Cadangan halaman yang datanya belum dikirim ke Vercel dan tidak bisa diambil server (diblokir hosting):
// browser pengunjung meminta langsung ke WordPress lalu menampilkannya.
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CardList, Cat, Meta } from './Cards';
import { SkCardList, SkArticle } from './Skeleton';
import LoadMore from './LoadMore';
import ViewPing from './ViewPing';
import Icon from './Icon';
import { wpBrowserGet } from '@/lib/wp-browser';
import { stripBacaJugaThumbs } from '@/lib/list';

function useWp(path) {
	const [state, setState] = useState({ status: 'loading', data: null });
	useEffect(() => {
		let alive = true;
		wpBrowserGet(path)
			.then((data) => { if (alive) setState({ status: data && data.code ? 'missing' : 'ready', data }); })
			.catch((e) => { if (alive) setState({ status: e.status === 404 ? 'missing' : 'error', data: null }); });
		return () => { alive = false; };
	}, [path]);
	return state;
}

function Problem({ missing }) {
	return (
		<div className="gx-empty">
			<Icon name="newspaper" className="gx-empty__icon" />
			<p>{missing ? 'Halaman tidak ditemukan.' : 'Halaman sedang tidak bisa dimuat. Silakan muat ulang sebentar lagi.'}</p>
			<Link className="gx-btn" href="/">Kembali ke beranda</Link>
		</div>
	);
}

/** Arsip (tag / kategori / penulis). */
export function ClientArchive({ query, opts }) {
	const qs = new URLSearchParams(query).toString();
	const { status, data } = useWp(`hl/list?${qs}`);
	if (status === 'loading') return <SkCardList count={6} />;
	if (status !== 'ready') return <Problem missing={status === 'missing'} />;
	const posts = data.posts || [];
	return (
		<>
			<header className="gx-archive-head"><div><h1 className="gx-archive-head__title">{data.title}</h1>{data.description ? <p className="gx-archive-head__desc">{data.description}</p> : null}</div></header>
			{posts.length ? (
				<div id="gx-post-list">
					<div className="gx-list gx-list--list">{posts.map((p) => <CardList key={p.id} post={p} opts={opts} excerpt={opts.show_excerpt} />)}</div>
					{data.totalPages > 1 ? <LoadMore query={query} totalPages={data.totalPages} opts={opts} excerpt={opts.show_excerpt} /> : null}
				</div>
			) : <div className="gx-empty"><p>Belum ada berita di sini.</p></div>}
		</>
	);
}

/** Artikel atau halaman statis. */
export function ClientPost({ slug, opts }) {
	const { status, data: post } = useWp(`hl/post?slug=${encodeURIComponent(slug)}`);
	useEffect(() => {
		if (post && post.title) document.title = post.seo?.title || post.title;
	}, [post]);
	if (status === 'loading') return <SkArticle />;
	if (status !== 'ready') return <Problem missing={status === 'missing'} />;
	const isPost = post.type === 'post';
	const img = post.image;
	return (
		<article className={`gx-article${isPost ? '' : ' gx-article--page'}`}>
			<header className="gx-article__head">
				{isPost ? <Cat post={post} opts={opts} solid /> : null}
				<h1 className="gx-article__title">{post.title}</h1>
				{isPost && post.excerptRaw ? <p className="gx-article__lead">{post.excerptRaw}</p> : null}
				{isPost ? <div className="gx-article__info"><Meta post={post} opts={opts} views avatar={post.authorAvatar} /></div> : null}
			</header>
			{img && (opts.show_featured || !isPost) ? (
				<figure className="gx-article__figure">
					<img src={img.src} srcSet={img.srcset || undefined} sizes="(max-width: 768px) 100vw, 720px" width={img.width} height={img.height} alt={img.alt || post.title} className="gx-img" decoding="async" />
					{img.caption ? <figcaption>{img.caption}</figcaption> : null}
				</figure>
			) : null}
			<div className="gx-article__body">
				<div className="gx-content entry-content" dangerouslySetInnerHTML={{ __html: stripBacaJugaThumbs(post.content) }} />
				{isPost && opts.show_tags && post.tags?.length ? (
					<div className="gx-tags">
						<span className="gx-tags__label"><Icon name="hashtag" /> Tag</span>
						{post.tags.map((t) => <Link key={t.id} href={t.path}>{t.name}</Link>)}
					</div>
				) : null}
			</div>
			{isPost && opts.perf_view_counter ? <ViewPing id={post.id} /> : null}
		</article>
	);
}
