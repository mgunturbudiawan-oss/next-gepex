import { wp, getConfig } from '@/lib/wp';
import Archive from '@/components/Archive';
import { SearchForm, PageLayout } from '@/components/Layout';
import ClientSearch from '@/components/ClientSearch';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Pencarian', robots: { index: false, follow: true } };

export default async function SearchPage(props) {
	const searchParams = await props.searchParams;
	const q = (searchParams.q || '').toString().slice(0, 100);
	const config = await getConfig();
	// Pencarian tidak bisa dikirim lebih dulu oleh WordPress; bila server diblokir hosting,
	// hasilnya diambil browser pengunjung (ClientSearch).
	let data = { posts: [], total: 0, totalPages: 0 };
	let blocked = false;
	if (q) {
		try {
			data = await wp('list', { type: 'search', q }, { revalidate: 0 });
		} catch (e) {
			blocked = true;
		}
	}
	const heading = (
		<header className="gx-archive-head gx-archive-head--search">
			<div>
				<h1 className="gx-archive-head__title">Hasil pencarian: <span className="gx-hl">{q}</span></h1>
				{blocked ? null : <p className="gx-archive-head__desc">{data.total} berita ditemukan</p>}
			</div>
			<SearchForm id="gx-s-page" className="gx-search--block" />
		</header>
	);
	if (blocked) {
		return <PageLayout config={config}>{heading}<ClientSearch q={q} opts={config.options} /></PageLayout>;
	}
	return <Archive config={config} data={data} query={{ type: 'search', q }} heading={heading} headlineAllowed={false} />;
}
