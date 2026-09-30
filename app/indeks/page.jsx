import Link from 'next/link';
import { wp, getConfig } from '@/lib/wp';
import { list } from '@/lib/list';
import { PageLayout, Breadcrumbs } from '@/components/Layout';
import { Cat } from '@/components/Cards';
import Icon from '@/components/Icon';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Indeks Berita', alternates: { canonical: '/indeks/' } };

export default async function IndeksPage(props) {
	const searchParams = await props.searchParams;
	const tanggal = /^\d{4}-\d{2}-\d{2}$/.test(searchParams.tanggal || '') ? searchParams.tanggal : '';
	const kanal = (searchParams.kanal || '').toString().replace(/[^a-z0-9-]/gi, '');
	const page = Math.max(1, parseInt(searchParams.page || '1', 10));
	const [config, data] = await Promise.all([getConfig(), wp('indeks', { tanggal, kanal, page }, { revalidate: 60 })]);
	const o = config.options;
	const fmtDay = (iso) => new Date(iso).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: config.site.timezone || 'Asia/Jakarta' });
	const fmtTime = (iso) => new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: config.site.timezone || 'Asia/Jakarta' });
	let lastDay = '';
	const link = (p) => `/indeks/?${new URLSearchParams({ ...(tanggal && { tanggal }), ...(kanal && { kanal }), page: String(p) })}`;
	return (
		<PageLayout config={config}>
			<Breadcrumbs items={[{ name: 'Beranda', path: '/' }, { name: 'Indeks Berita' }]} />
			<header className="gx-archive-head"><div><h1 className="gx-archive-head__title">Indeks Berita</h1><p className="gx-archive-head__desc">{tanggal ? `Berita tanggal ${fmtDay(tanggal + 'T12:00:00')}` : 'Semua berita terbaru'}</p></div></header>
			<form className="gx-filter" method="get" action="/indeks/">
				<label><span><Icon name="calendar-days" /> Tanggal</span><input type="date" name="tanggal" defaultValue={tanggal} /></label>
				<label><span><Icon name="grid" /> Kanal</span>
					<select name="kanal" defaultValue={kanal}>
						<option value="">Semua kanal</option>
						{list(config.categories).filter(Boolean).map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
					</select>
				</label>
				<button type="submit" className="gx-btn gx-btn--primary"><Icon name="filter" /> Tampilkan</button>
				{tanggal || kanal ? <Link className="gx-btn" href="/indeks/">Reset</Link> : null}
			</form>
			{data.posts.length ? (
				<ol className="gx-indeks">
					{data.posts.map((p) => {
						const day = fmtDay(p.date);
						const head = day !== lastDay ? <li key={`d${p.id}`} className="gx-indeks__day">{day}</li> : null;
						lastDay = day;
						return [head, (
							<li key={p.id} className="gx-indeks__item">
								<time dateTime={p.date}>{fmtTime(p.date)}</time>
								<div><Cat post={p} opts={o} /><h2 className="gx-indeks__title"><Link href={p.path}>{p.title}</Link></h2></div>
							</li>
						)];
					})}
				</ol>
			) : (
				<div className="gx-empty"><Icon name="calendar-xmark" className="gx-empty__icon" /><p>Tidak ada berita pada tanggal/kanal ini.</p></div>
			)}
			{data.totalPages > 1 ? (
				<nav className="gx-pagination" aria-label="Navigasi halaman">
					{page > 1 ? <Link className="page-numbers" href={link(page - 1)}><Icon name="chevron-left" /></Link> : null}
					<span className="page-numbers current">{page}</span>
					{page < data.totalPages ? <Link className="page-numbers" href={link(page + 1)}><Icon name="chevron-right" /></Link> : null}
				</nav>
			) : null}
		</PageLayout>
	);
}
