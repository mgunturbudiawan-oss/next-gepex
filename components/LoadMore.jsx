'use client';
import { useState } from 'react';
import { CardList, CardGrid } from './Cards';
import { SkCardList, SkGrid } from './Skeleton';

// Tombol "Muat Berita Lainnya": memanggil /api/posts (proxy ke WordPress).
export default function LoadMore({ query, startPage = 2, totalPages, layout = 'list', opts, excerpt }) {
	const [page, setPage] = useState(startPage);
	const [items, setItems] = useState([]);
	const [state, setState] = useState('idle');
	const [total, setTotal] = useState(totalPages);
	const done = page > total;

	async function load() {
		setState('loading');
		try {
			const qs = new URLSearchParams({ ...query, page: String(page) });
			const res = await fetch(`/api/posts/?${qs}`);
			if (!res.ok) throw new Error();
			const data = await res.json();
			setItems((prev) => prev.concat(data.posts || []));
			setPage(page + 1);
			if (data.totalPages) setTotal(data.totalPages);
			setState('idle');
		} catch {
			setState('error');
		}
	}

	const C = layout === 'grid' ? CardGrid : CardList;
	return (
		<>
			{items.length ? (
				<div className={`gx-list gx-list--${layout}`}>
					{items.map((p) => <C key={p.id} post={p} opts={opts} excerpt={excerpt} />)}
				</div>
			) : null}
			{state === 'loading' ? (layout === 'grid' ? <SkGrid count={3} /> : <SkCardList count={3} />) : null}
			{!done ? (
				<div className="gx-loadmore">
					<button type="button" className="gx-btn gx-btn--primary" onClick={load} disabled={state === 'loading'}>
						{state === 'loading' ? 'Memuat...' : state === 'error' ? 'Gagal memuat, coba lagi' : 'Muat Berita Lainnya'}
					</button>
				</div>
			) : null}
		</>
	);
}
