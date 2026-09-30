'use client';
// Bilah progres tipis di atas layar saat berpindah halaman.
import { useEffect, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export default function NavProgress() {
	const pathname = usePathname();
	const search = useSearchParams();
	const [width, setWidth] = useState(0);
	const [visible, setVisible] = useState(false);
	const timer = useRef(null);

	useEffect(() => {
		const onClick = (e) => {
			if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
			const a = e.target.closest && e.target.closest('a[href]');
			if (!a || a.target === '_blank' || a.hasAttribute('download')) return;
			const url = new URL(a.href, location.href);
			if (url.origin !== location.origin || (url.pathname === location.pathname && url.search === location.search)) return;
			clearInterval(timer.current);
			setVisible(true);
			setWidth(12);
			timer.current = setInterval(() => setWidth((w) => (w < 88 ? w + (90 - w) * 0.12 : w)), 180);
		};
		document.addEventListener('click', onClick, true);
		return () => document.removeEventListener('click', onClick, true);
	}, []);

	useEffect(() => {
		if (!visible) return;
		clearInterval(timer.current);
		setWidth(100);
		const t = setTimeout(() => { setVisible(false); setWidth(0); }, 350);
		return () => clearTimeout(t);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [pathname, search]);

	return <div className="gx-progress" style={{ width: `${width}%`, opacity: visible ? 1 : 0 }} aria-hidden="true" />;
}
