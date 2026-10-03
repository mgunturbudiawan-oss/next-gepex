'use client';
// Skeleton (efek kilau) saat berpindah halaman lewat klik link.
// Ditampilkan oleh browser — bukan loading.jsx di server — sehingga status HTTP tetap benar
// (halaman yang tidak ada = 404 asli, bukan "soft 404" yang dinilai buruk oleh Google).
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePathname, useSearchParams } from 'next/navigation';
import { SkPage, SkHeadline, SkTitle, SkCardList, SkArticle } from './Skeleton';
import SkArchive from './SkArchive';

const DELAY = 100; // halaman yang sudah siap (prefetch) tidak perlu menampilkan skeleton
const MAX = 15000; // pengaman bila navigasi gagal

// Indeks & pencarian masih memakai loading.jsx (tidak pernah 404), jadi dilewati di sini.
function kindOf(path) {
	if (path === '/') return 'home';
	if (/^\/(kategori|tag|penulis)\//.test(path)) return 'archive';
	if (/^\/(indeks|cari|api)\//.test(path)) return null;
	return 'article';
}

function Skeleton({ kind }) {
	if (kind === 'home') {
		return <SkPage head={<SkHeadline />}><SkTitle w="11rem" /><SkCardList count={5} /></SkPage>;
	}
	if (kind === 'archive') return <SkArchive />;
	return <SkPage><SkArticle /></SkPage>;
}

export default function NavSkeleton() {
	const pathname = usePathname();
	const search = useSearchParams();
	const [kind, setKind] = useState(null);
	const timers = useRef([]);

	const clear = () => { timers.current.forEach(clearTimeout); timers.current = []; };

	useEffect(() => {
		const onClick = (e) => {
			if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
			const a = e.target.closest && e.target.closest('a[href]');
			if (!a || a.target === '_blank' || a.hasAttribute('download')) return;
			const url = new URL(a.href, location.href);
			if (url.origin !== location.origin || (url.pathname === location.pathname && url.search === location.search)) return;
			const k = kindOf(url.pathname);
			if (!k) return;
			clear();
			timers.current.push(setTimeout(() => { setKind(k); window.scrollTo(0, 0); }, DELAY));
			timers.current.push(setTimeout(() => setKind(null), MAX));
		};
		document.addEventListener('click', onClick, true);
		return () => { document.removeEventListener('click', onClick, true); clear(); };
	}, []);

	// Halaman baru sudah tampil → skeleton hilang.
	useEffect(() => { clear(); setKind(null); }, [pathname, search]);

	useEffect(() => {
		document.body.classList.toggle('gx-navsk', Boolean(kind));
	}, [kind]);

	const host = typeof document !== 'undefined' ? document.getElementById('gx-content') : null;
	if (!kind || !host) return null;
	return createPortal(<div className="gx-navsk__wrap"><Skeleton kind={kind} /></div>, host);
}
