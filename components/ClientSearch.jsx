'use client';
// Cadangan halaman pencarian: bila server tidak bisa mengambil hasil (diblokir hosting),
// browser pengunjung meminta langsung ke WordPress.
import { useEffect, useState } from 'react';
import { CardList } from './Cards';
import { SkCardList } from './Skeleton';
import { wpBrowserGet } from '@/lib/wp-browser';

export default function ClientSearch({ q, opts }) {
	const [state, setState] = useState({ status: 'loading', data: null });

	useEffect(() => {
		let alive = true;
		wpBrowserGet(`hl/list?type=search&q=${encodeURIComponent(q)}`)
			.then((data) => { if (alive) setState({ status: 'ready', data }); })
			.catch(() => { if (alive) setState({ status: 'error', data: null }); });
		return () => { alive = false; };
	}, [q]);

	if (state.status === 'loading') return <SkCardList count={5} />;
	if (state.status === 'error') return <p className="gx-empty">Pencarian sedang tidak tersedia. Silakan coba lagi sebentar lagi.</p>;
	const posts = state.data.posts || [];
	return (
		<>
			<p className="gx-archive-head__desc">{state.data.total || posts.length} berita ditemukan</p>
			{posts.length ? (
				<div className="gx-list gx-list--list">{posts.map((p) => <CardList key={p.id} post={p} opts={opts} excerpt={opts.show_excerpt} />)}</div>
			) : <p className="gx-empty">Tidak ada berita yang cocok.</p>}
		</>
	);
}
