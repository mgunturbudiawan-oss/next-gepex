'use client';
// Menyisipkan HTML dari admin (iklan, analytics) dan menjalankan <script> di dalamnya.
import { useEffect, useRef } from 'react';

export default function RawHtml({ html, className, as = 'div' }) {
	const ref = useRef(null);
	useEffect(() => {
		const el = ref.current;
		if (!el || !html) return;
		el.innerHTML = html;
		el.querySelectorAll('script').forEach((old) => {
			const s = document.createElement('script');
			[...old.attributes].forEach((a) => s.setAttribute(a.name, a.value));
			s.text = old.textContent;
			old.replaceWith(s);
		});
	}, [html]);
	if (!html) return null;
	const Tag = as;
	return <Tag ref={ref} className={className} suppressHydrationWarning />;
}
