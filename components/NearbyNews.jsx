'use client';
// Rubrik sidebar "Berita Sekitar Anda": lokasi pengunjung (GPS/browser) → provinsi terdekat yang punya berita.
// Tampilan: 1 berita dengan gambar di atas & judul di bawah, lalu 3 daftar berita.
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Icon from './Icon';
import { Thumb } from './Cards';
import { REGIONS, nearestRegions } from '@/lib/regions';
import { fetchWithFallback } from '@/lib/wp-browser';

const STORE_KEY = 'gx-nearby-region';

// Gabungkan berita semua kategori provinsi, urutkan terbaru, ambil 4 (1 utama + 3 daftar).
async function fetchRegion(region) {
	const lists = await Promise.all(region.slugs.map((slug) => {
		const qs = `type=category&slug=${encodeURIComponent(slug)}`;
		return fetchWithFallback(`/api/posts/?${qs}`, `hl/list?${qs}`).catch(() => ({ posts: [] }));
	}));
	const seen = new Set();
	return lists.flatMap((d) => d.posts || [])
		.filter((p) => !seen.has(p.id) && seen.add(p.id))
		.sort((a, b) => new Date(b.date) - new Date(a.date))
		.slice(0, 4);
}

// Pin lokasi sederhana.
function PinIcon() {
	return (
		<svg className="gx-nearby__pin" viewBox="0 0 48 60" aria-hidden="true" focusable="false">
			<ellipse cx="24" cy="56" rx="9" ry="2.5" fill="currentColor" opacity=".18" />
			<path d="M24 2C12.4 2 3 11.2 3 22.6 3 37.8 24 54 24 54s21-16.2 21-31.4C45 11.2 35.6 2 24 2z" fill="currentColor" />
			<circle cx="24" cy="22" r="7.5" fill="#fff" />
		</svg>
	);
}

// Ikon panah navigasi GPS.
function NavArrowIcon() {
	return (
		<svg className="gx-locbtn__arrow" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
			<path d="M20.6 3.4 3.9 10.2c-.8.3-.7 1.5.1 1.7l6.6 1.6 1.6 6.6c.2.8 1.4.9 1.7.1l6.8-16.7c.3-.7-.4-1.4-1.1-1.1z" fill="currentColor" />
		</svg>
	);
}

/** Tombol "pakai lokasi" dengan ikon panah GPS. */
function LocateButton({ onClick, busy, label }) {
	return (
		<button type="button" className="gx-locbtn" onClick={onClick} disabled={busy}>
			{busy ? <span className="gx-locbtn__spin" aria-hidden="true" /> : <NavArrowIcon />}
			{label}
		</button>
	);
}

function RegionSelect({ value, onPick }) {
	return (
		<label className="gx-nearby__pick">
			<span className="screen-reader-text">Pilih provinsi</span>
			<select value={value || ''} onChange={(e) => e.target.value && onPick(e.target.value)}>
				<option value="">Pilih provinsi…</option>
				{REGIONS.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
			</select>
		</label>
	);
}

export default function NearbyNews() {
	const [status, setStatus] = useState('idle'); // idle | locating | loading | ready | error
	const [region, setRegion] = useState(null);
	const [posts, setPosts] = useState([]);
	const [msg, setMsg] = useState('');
	const [picking, setPicking] = useState(false);

	const show = useCallback(async (candidates) => {
		setStatus('loading');
		// Coba dari provinsi terdekat; lewati yang (sementara) belum ada beritanya.
		for (const r of candidates) {
			const list = await fetchRegion(r);
			if (list.length) {
				setRegion(r);
				setPosts(list);
				setStatus('ready');
				setPicking(false);
				try { localStorage.setItem(STORE_KEY, r.id); } catch (e) { /* abaikan */ }
				return;
			}
		}
		setStatus('error');
		setMsg('Belum ada berita untuk wilayah ini.');
	}, []);

	const pick = useCallback((id) => {
		const r = REGIONS.find((x) => x.id === id);
		if (r) show([r]);
	}, [show]);

	// Kunjungan berikutnya: langsung tampilkan provinsi terakhir tanpa meminta lokasi lagi.
	useEffect(() => {
		let saved = null;
		try { saved = localStorage.getItem(STORE_KEY); } catch (e) { /* abaikan */ }
		if (saved) pick(saved);
	}, [pick]);

	const locate = () => {
		setMsg('');
		if (!navigator.geolocation) {
			setStatus('error');
			setMsg('Browser Anda tidak mendukung lokasi. Pilih provinsi di bawah.');
			return;
		}
		setStatus('locating');
		navigator.geolocation.getCurrentPosition(
			({ coords }) => show(nearestRegions(coords.latitude, coords.longitude)),
			(err) => {
				setStatus('error');
				setMsg(err.code === 1 ? 'Izin lokasi ditolak. Pilih provinsi di bawah.' : 'Lokasi tidak ditemukan. Pilih provinsi di bawah.');
			},
			{ enableHighAccuracy: false, timeout: 10000, maximumAge: 30 * 60 * 1000 },
		);
	};

	const busy = status === 'locating' || status === 'loading';
	const [lead, ...rest] = posts;

	return (
		<section className="gx-widget gx-nearby" aria-labelledby="gx-nearby-title">
			<h2 className="gx-widget__title" id="gx-nearby-title"><span className="gx-section-bar gx-reco__bar" aria-hidden="true" />Berita Sekitar Anda</h2>
			{status === 'ready' && lead ? (
				<>
					<div className="gx-nearby__bar">
						<span className="gx-nearby__place"><Icon name="map-pin" /> {region.name}</span>
						<button type="button" className="gx-nearby__change" onClick={() => setPicking((v) => !v)} aria-expanded={picking}>Ganti</button>
					</div>
					{picking ? (
						<div className="gx-nearby__picker">
							<LocateButton onClick={locate} busy={busy} label={status === 'locating' ? 'Mencari lokasi…' : status === 'loading' ? 'Memuat berita…' : 'Pakai lokasi saya'} />
							<div className="gx-nearby__or"><span>atau pilih provinsi</span></div>
							<RegionSelect value={region.id} onPick={pick} />
						</div>
					) : null}
					<article className="gx-nearby__lead">
						<Link className="gx-nearby__media" href={lead.path} tabIndex={-1} aria-hidden="true"><Thumb post={lead} sizes="300px" /></Link>
						<h3 className="gx-nearby__lead-title"><Link href={lead.path}>{lead.title}</Link></h3>
						<span className="gx-nearby__time">{lead.ago || lead.dateText}</span>
					</article>
					{rest.length ? (
						<ul className="gx-nearby__list">
							{rest.slice(0, 3).map((p) => (
								<li key={p.id}>
									<Link href={p.path}>{p.title}</Link>
									<span className="gx-nearby__time">{p.ago || p.dateText}</span>
								</li>
							))}
						</ul>
					) : null}
					<Link className="gx-section-more gx-nearby__more" href={`/kategori/${region.slugs[0]}/`}>Berita {region.name} lainnya <Icon name="chevron-right" /></Link>
				</>
			) : (
				<div className="gx-nearby__intro">
					<div className="gx-nearby__hero">
						<PinIcon />
						<p className="gx-nearby__headline">Berita di sekitarmu</p>
						<p className="gx-nearby__sub">Tampilkan berita dari provinsi terdekat dengan lokasimu.</p>
						<LocateButton onClick={locate} busy={busy} label={status === 'locating' ? 'Mencari lokasi…' : status === 'loading' ? 'Memuat berita…' : 'Gunakan lokasi saya'} />
					</div>
					{msg ? <p className="gx-nearby__msg" role="status">{msg}</p> : null}
					<div className="gx-nearby__or"><span>atau pilih provinsi</span></div>
					<RegionSelect value={region?.id} onPick={pick} />
				</div>
			)}
		</section>
	);
}
