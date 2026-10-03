'use client';
// Slider headline: desktop = slide besar + thumbnail; HP = mode tengah, geser dengan jari.
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { decodeHtml } from '@/lib/list';

function Img({ post, eager, sizes, className = 'gx-img' }) {
	const i = post.image;
	if (!i) return <img src="/placeholder.svg" alt="" className={className} />;
	return <img src={i.src} srcSet={i.srcset || undefined} sizes={i.srcset ? sizes : undefined} width={i.width} height={i.height} alt={i.alt || post.title} className={className} loading={eager ? 'eager' : 'lazy'} fetchPriority={eager ? 'high' : undefined} decoding="async" />;
}

export default function HeadlineSlider({ slides, badge, autoplay = 6, showCategory = true }) {
	const track = useRef(null);
	const [idx, setIdx] = useState(0);
	const paused = useRef(false);

	const go = useCallback((i) => {
		const t = track.current;
		if (!t) return;
		const n = (i + slides.length) % slides.length;
		const s = t.children[n];
		t.scrollTo({ left: s.offsetLeft - (t.clientWidth - s.clientWidth) / 2, behavior: 'smooth' });
		setIdx(n);
	}, [slides.length]);

	// Sinkronkan indeks saat digeser dengan jari.
	useEffect(() => {
		const t = track.current;
		if (!t) return;
		let raf = 0;
		const onScroll = () => {
			cancelAnimationFrame(raf);
			raf = requestAnimationFrame(() => {
				const mid = t.scrollLeft + t.clientWidth / 2;
				let best = 0;
				let dist = Infinity;
				[...t.children].forEach((s, n) => {
					const d = Math.abs(s.offsetLeft + s.clientWidth / 2 - mid);
					if (d < dist) { dist = d; best = n; }
				});
				setIdx(best);
			});
		};
		t.addEventListener('scroll', onScroll, { passive: true });
		return () => { t.removeEventListener('scroll', onScroll); cancelAnimationFrame(raf); };
	}, []);

	// Geser otomatis (desktop saja).
	useEffect(() => {
		if (!autoplay || slides.length < 2) return;
		const mq = window.matchMedia('(min-width: 768px)');
		const rm = window.matchMedia('(prefers-reduced-motion: reduce)');
		const id = setInterval(() => {
			if (mq.matches && !rm.matches && !paused.current && document.visibilityState === 'visible') go(idx + 1);
		}, autoplay * 1000);
		return () => clearInterval(id);
	}, [autoplay, slides.length, idx, go]);

	if (!slides.length) return null;
	const multi = slides.length > 1;

	return (
		<section className="gx-headline gx-headline--style4" aria-label="Berita utama">
			<div className="gx-hs" aria-roledescription="carousel" style={{ '--gx-hs-n': slides.length }}
				onMouseEnter={() => { paused.current = true; }} onMouseLeave={() => { paused.current = false; }}
				onFocus={() => { paused.current = true; }} onBlur={() => { paused.current = false; }}>
				<div className="gx-hs__stage">
					{badge ? <span className="gx-hs__badge">{badge}</span> : null}
					<div className="gx-hs__track" ref={track}>
						{slides.map((p, i) => {
							const H = i === 0 ? 'h2' : 'h3';
							return (
								<article key={p.id} className={`gx-hs__slide${i === idx ? ' is-current' : ''}`} aria-roledescription="slide" aria-label={`${i + 1} / ${slides.length}`}>
									<div className="gx-hs__media"><Img post={p} eager={i === 0} sizes="(max-width: 768px) 85vw, 980px" /></div>
									<div className="gx-hs__shade">
										{showCategory && p.category ? <Link className="gx-hs__cat" href={p.category.path}>{decodeHtml(p.category.name)}</Link> : null}
										<H className="gx-hs__title"><Link href={p.path}>{p.title}</Link></H>
									</div>
								</article>
							);
						})}
					</div>
					{multi ? (
						<div className="gx-hs__dots" aria-hidden="true">
							{slides.map((p, i) => <span key={p.id} className={`gx-hs__dot${i === idx ? ' is-active' : ''}`} onClick={() => go(i)} />)}
						</div>
					) : null}
				</div>
				{multi ? (
					<div className="gx-hs__tabs" role="tablist" aria-label="Pilih headline">
						{slides.map((p, i) => (
							<button key={p.id} type="button" role="tab" aria-selected={i === idx} className={`gx-hs__tab${i === idx ? ' is-active' : ''}`} onClick={() => go(i)}>
								<span className="gx-hs__tab-img"><Img post={p} sizes="240px" /></span>
								<span className="gx-hs__tab-title">{p.title}</span>
							</button>
						))}
					</div>
				) : null}
			</div>
		</section>
	);
}
