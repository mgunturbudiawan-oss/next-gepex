import Link from 'next/link';
import Icon from '@/components/Icon';
import { SearchForm } from '@/components/Layout';

export const metadata = { title: 'Halaman tidak ditemukan', robots: { index: false } };

export default function NotFound() {
	return (
		<div className="container-custom gx-page">
			<main className="gx-404">
				<p className="gx-404__code">404</p>
				<h1 className="gx-404__title">Halaman tidak ditemukan</h1>
				<p className="gx-404__text">Berita yang Anda cari mungkin sudah dipindahkan atau dihapus. Coba cari berita lain:</p>
				<SearchForm id="gx-s-404" className="gx-search--block" />
				<Link className="gx-btn gx-btn--primary" href="/"><Icon name="house" /> Kembali ke beranda</Link>
			</main>
		</div>
	);
}
