'use client';
export default function Error({ reset }) {
	return (
		<div className="container-custom gx-page">
			<div className="gx-empty"><p>Terjadi gangguan saat memuat berita.</p><button className="gx-btn gx-btn--primary" onClick={() => reset()}>Coba lagi</button></div>
		</div>
	);
}
