'use client';
// Short video vertikal di bawah headline. Klik → pemutar layar penuh, geser atas/bawah untuk video berikutnya.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Icon from './Icon';

// hqdefault 4:3 berisi video vertikal di tengah, jadi pas di-crop (object-fit: cover) ke kotak 9:16.
const thumb = (id) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

function embedUrl(id, muted) {
	const q = new URLSearchParams({ autoplay: '1', mute: muted ? '1' : '0', playsinline: '1', loop: '1', playlist: id, controls: '0', rel: '0', modestbranding: '1', enablejsapi: '1', origin: window.location.origin });
	return `https://www.youtube-nocookie.com/embed/${id}?${q}`;
}

// Kendalikan pemutar YouTube lewat postMessage (butuh enablejsapi=1).
function command(frame, func) {
	frame?.contentWindow?.postMessage(JSON.stringify({ event: 'command', func, args: [] }), '*');
}

const shortUrl = (id) => `https://www.youtube.com/shorts/${id}`;
const fmt = new Intl.NumberFormat('id-ID', { notation: 'compact', maximumFractionDigits: 1 });
const count = (n) => fmt.format(n || 0);

// Suka disimpan di browser pengunjung.
const LIKES_KEY = 'gx-sv-likes';
function readLikes() {
	try { return new Set(JSON.parse(localStorage.getItem(LIKES_KEY) || '[]')); } catch (e) { return new Set(); }
}
function saveLikes(set) {
	try { localStorage.setItem(LIKES_KEY, JSON.stringify([...set])); } catch (e) { /* abaikan */ }
}

function Actions({ video, liked, onLike, onComment, onShare }) {
	return (
		<div className="gx-svp__rail">
			<a className="gx-svp__avatar" href={shortUrl(video.id)} target="_blank" rel="noopener" aria-label={`Kanal ${video.channel}`}>
				{(video.channel || '?').trim().charAt(0)}
			</a>
			<button type="button" className={`gx-svp__act${liked ? ' is-liked' : ''}`} onClick={onLike} aria-pressed={liked} aria-label="Suka">
				<span className="gx-svp__act-ic"><Icon name="heart" /></span>
				<span className="gx-svp__act-n">{count((video.likes || 0) + (liked ? 1 : 0))}</span>
			</button>
			<button type="button" className="gx-svp__act" onClick={onComment} aria-label="Komentar">
				<span className="gx-svp__act-ic"><Icon name="comment" /></span>
				<span className="gx-svp__act-n">{count(video.comments)}</span>
			</button>
			<button type="button" className="gx-svp__act" onClick={onShare} aria-label="Bagikan">
				<span className="gx-svp__act-ic"><Icon name="share" /></span>
				<span className="gx-svp__act-n">{count(video.shares)}</span>
			</button>
		</div>
	);
}

function Player({ videos, start, onClose }) {
	const feed = useRef(null);
	const frame = useRef(null);
	const settle = useRef(0);
	const [idx, setIdx] = useState(start);
	const [paused, setPaused] = useState(false);
	const [muted, setMuted] = useState(true);
	const mutedRef = useRef(true);
	const [likes, setLikes] = useState(() => readLikes());
	const [sheet, setSheet] = useState(false);
	const [toast, setToast] = useState('');
	const toastTimer = useRef(0);

	const flash = (msg) => {
		setToast(msg);
		clearTimeout(toastTimer.current);
		toastTimer.current = setTimeout(() => setToast(''), 1800);
	};
	const toggleLike = (id) => {
		const next = new Set(likes);
		if (next.has(id)) next.delete(id); else next.add(id);
		setLikes(next);
		saveLikes(next);
	};
	const share = async (v) => {
		const url = shortUrl(v.id);
		try {
			if (navigator.share) { await navigator.share({ title: v.title, url }); return; }
			await navigator.clipboard.writeText(url);
			flash('Tautan disalin');
		} catch (e) { /* dibatalkan pengguna */ }
	};

	// Posisi awal, kunci gulir halaman, fokus ke pemutar.
	useEffect(() => {
		const f = feed.current;
		f.scrollTop = start * f.clientHeight;
		f.focus({ preventScroll: true });
		const prev = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		return () => { document.body.style.overflow = prev; clearTimeout(settle.current); clearTimeout(toastTimer.current); };
	}, [start]);

	const go = useCallback((n) => {
		const f = feed.current;
		if (!f) return;
		const i = Math.max(0, Math.min(videos.length - 1, n));
		f.scrollTo({ top: i * f.clientHeight, behavior: 'smooth' });
	}, [videos.length]);

	useEffect(() => {
		const onKey = (e) => {
			if (e.key === 'Escape') { if (sheet) setSheet(false); else onClose(); }
			else if (e.key === 'ArrowDown') { e.preventDefault(); go(idx + 1); }
			else if (e.key === 'ArrowUp') { e.preventDefault(); go(idx - 1); }
		};
		document.addEventListener('keydown', onKey);
		return () => document.removeEventListener('keydown', onKey);
	}, [idx, go, onClose, sheet]);

	// Ganti video aktif setelah geseran berhenti (hindari memuat ulang saat masih menggeser).
	const onScroll = () => {
		clearTimeout(settle.current);
		settle.current = setTimeout(() => {
			const f = feed.current;
			if (!f) return;
			const n = Math.round(f.scrollTop / f.clientHeight);
			if (n !== idx) { setIdx(n); setPaused(false); setSheet(false); }
		}, 120);
	};

	// Status suara hanya dibaca saat video baru dimuat; setelahnya diubah lewat postMessage.
	// eslint-disable-next-line react-hooks/exhaustive-deps
	const src = useMemo(() => embedUrl(videos[idx].id, mutedRef.current), [idx, videos]);

	const togglePlay = () => { command(frame.current, paused ? 'playVideo' : 'pauseVideo'); setPaused(!paused); };
	const toggleMute = () => {
		command(frame.current, muted ? 'unMute' : 'mute');
		mutedRef.current = !muted;
		setMuted(!muted);
	};

	return (
		<div className="gx-svp" role="dialog" aria-modal="true" aria-label="Short video">
			<div className="gx-svp__feed" ref={feed} onScroll={onScroll} tabIndex={-1}>
				{videos.map((v, i) => (
					<div key={v.id} className="gx-svp__slide">
						<div className="gx-svp__stage">
							<div className="gx-svp__box">
								{i === idx
									? <iframe ref={frame} src={src} title={v.title} allow="autoplay; encrypted-media; picture-in-picture" />
									: <img src={thumb(v.id)} alt="" loading="lazy" decoding="async" />}
								{/* Lapisan sentuh: ketuk = jeda/putar, geser = video lain (iframe tidak menelan geseran). */}
								<button type="button" className="gx-svp__tap" onClick={i === idx ? togglePlay : () => go(i)} aria-label={paused ? 'Putar' : 'Jeda'}>
									{i === idx && paused ? <Icon name="circle-play" /> : null}
								</button>
								<div className="gx-svp__info">
									<a className="gx-svp__channel" href={shortUrl(v.id)} target="_blank" rel="noopener">@{v.channel}</a>
									<p className="gx-svp__title">{v.title}</p>
								</div>
							</div>
							<Actions video={v} liked={likes.has(v.id)} onLike={() => toggleLike(v.id)} onComment={() => setSheet(true)} onShare={() => share(v)} />
						</div>
					</div>
				))}
			</div>
			<button type="button" className="gx-svp__btn gx-svp__close" onClick={onClose} aria-label="Tutup"><Icon name="xmark" /></button>
			<button type="button" className="gx-svp__btn gx-svp__mute" onClick={toggleMute} aria-pressed={!muted}>
				{muted ? 'Nyalakan suara' : 'Matikan suara'}
			</button>
			<div className="gx-svp__nav">
				<button type="button" className="gx-svp__btn" onClick={() => go(idx - 1)} disabled={idx === 0} aria-label="Video sebelumnya"><Icon name="chevron-up" /></button>
				<button type="button" className="gx-svp__btn gx-svp__down" onClick={() => go(idx + 1)} disabled={idx === videos.length - 1} aria-label="Video berikutnya"><Icon name="chevron-up" /></button>
			</div>
			<span className="gx-svp__count" aria-live="polite">{idx + 1} / {videos.length}</span>
			{toast ? <div className="gx-svp__toast" role="status">{toast}</div> : null}
			{sheet ? (
				<>
					<div className="gx-svp__scrim" onClick={() => setSheet(false)} />
					<div className="gx-svp__sheet" role="dialog" aria-label="Komentar">
						<div className="gx-svp__sheet-head">
							<strong>{count(videos[idx].comments)} komentar</strong>
							<button type="button" className="gx-svp__sheet-x" onClick={() => setSheet(false)} aria-label="Tutup komentar"><Icon name="xmark" /></button>
						</div>
						<div className="gx-svp__sheet-body">
							<Icon name="comment" className="gx-svp__sheet-ic" />
							<p>Komentar video ini ada di YouTube. Baca dan tulis komentar langsung di sana.</p>
							<a className="gx-btn gx-btn--primary" href={shortUrl(videos[idx].id)} target="_blank" rel="noopener"><Icon name="youtube" /> Buka komentar di YouTube</a>
						</div>
					</div>
				</>
			) : null}
		</div>
	);
}

export default function ShortVideos({ videos, title = 'Short Video' }) {
	const [open, setOpen] = useState(null);
	if (!videos || !videos.length) return null;
	return (
		<section className="gx-sv" aria-label={title}>
			<div className="gx-sv__head">
				<span className="gx-sv__label"><Icon name="circle-play" />{title}</span>
				<div className="gx-sv__nav">
					<button type="button" className="gx-iconbtn gx-iconbtn--sm" data-gx-scroll="-1" aria-label="Sebelumnya"><Icon name="chevron-left" /></button>
					<button type="button" className="gx-iconbtn gx-iconbtn--sm" data-gx-scroll="1" aria-label="Berikutnya"><Icon name="chevron-right" /></button>
				</div>
			</div>
			<div className="gx-sv__track" data-gx-track>
				{videos.map((v, i) => (
					<button key={v.id} type="button" className="gx-sv__item" onClick={() => setOpen(i)} aria-label={`Putar: ${v.title}`}>
						<img src={thumb(v.id)} alt="" loading="lazy" decoding="async" />
						<span className="gx-sv__play"><Icon name="circle-play" /></span>
						<span className="gx-sv__title">{v.title}</span>
					</button>
				))}
			</div>
			{open !== null ? createPortal(<Player videos={videos} start={open} onClose={() => setOpen(null)} />, document.body) : null}
		</section>
	);
}
