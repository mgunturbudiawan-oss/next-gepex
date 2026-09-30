import { wp, getConfig } from '@/lib/wp';
import Archive from '@/components/Archive';
import { SearchForm } from '@/components/Layout';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Pencarian', robots: { index: false, follow: true } };

export default async function SearchPage(props) {
	const searchParams = await props.searchParams;
	const q = (searchParams.q || '').toString().slice(0, 100);
	const config = await getConfig();
	const data = q ? await wp('list', { type: 'search', q }, { revalidate: 0 }) : { posts: [], total: 0, totalPages: 0 };
	const heading = (
		<header className="gx-archive-head gx-archive-head--search">
			<div>
				<h1 className="gx-archive-head__title">Hasil pencarian: <span className="gx-hl">{q}</span></h1>
				<p className="gx-archive-head__desc">{data.total} berita ditemukan</p>
			</div>
			<SearchForm id="gx-s-page" className="gx-search--block" />
		</header>
	);
	return <Archive config={config} data={data} query={{ type: 'search', q }} heading={heading} headlineAllowed={false} />;
}
