// Provinsi yang punya kategori berita di WordPress, untuk rubrik "Berita Sekitar Anda".
// lat/lng = titik tengah kira-kira provinsi. `slugs` = kategori WordPress milik provinsi itu
// (kota ikut provinsinya, mis. Surabaya → Jawa Timur). Tambahkan provinsi baru di sini.
export const REGIONS = [
	{ id: 'aceh', name: 'Aceh', lat: 4.69, lng: 96.75, slugs: ['aceh'] },
	{ id: 'sumut', name: 'Sumatera Utara', lat: 2.12, lng: 99.55, slugs: ['medan', 'asahan'] },
	{ id: 'sumbar', name: 'Sumatera Barat', lat: -0.74, lng: 100.8, slugs: ['sumbar'] },
	{ id: 'sumsel', name: 'Sumatera Selatan', lat: -3.32, lng: 104.91, slugs: ['sumatera-selatan', 'palembang'] },
	{ id: 'jakarta', name: 'DKI Jakarta', lat: -6.2, lng: 106.85, slugs: ['jakarta'] },
	{ id: 'banten', name: 'Banten', lat: -6.41, lng: 106.06, slugs: ['tangerang'] },
	{ id: 'jabar', name: 'Jawa Barat', lat: -6.9, lng: 107.6, slugs: ['jawa-barat', 'bandung'] },
	{ id: 'jateng', name: 'Jawa Tengah', lat: -7.15, lng: 110.14, slugs: ['jawa-tengah'] },
	{ id: 'diy', name: 'DI Yogyakarta', lat: -7.8, lng: 110.37, slugs: ['yogyakarta'] },
	{ id: 'jatim', name: 'Jawa Timur', lat: -7.54, lng: 112.24, slugs: ['jatim', 'surabaya'] },
	{ id: 'bali', name: 'Bali', lat: -8.41, lng: 115.19, slugs: ['bali'] },
	{ id: 'ntt', name: 'Nusa Tenggara Timur', lat: -8.66, lng: 121.08, slugs: ['ntt'] },
	{ id: 'sulut', name: 'Sulawesi Utara', lat: 0.62, lng: 123.98, slugs: ['sulawesi-utara'] },
	{ id: 'malut', name: 'Maluku Utara', lat: 1.57, lng: 127.81, slugs: ['maluku-utara'] },
];

// Jarak (km) dua titik di bumi (rumus haversine).
function distance(lat1, lng1, lat2, lng2) {
	const rad = (d) => (d * Math.PI) / 180;
	const a = Math.sin(rad(lat2 - lat1) / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lng2 - lng1) / 2) ** 2;
	return 6371 * 2 * Math.asin(Math.sqrt(a));
}

/** Provinsi diurutkan dari yang terdekat ke lokasi pengunjung. */
export function nearestRegions(lat, lng) {
	return REGIONS.map((r) => ({ ...r, km: distance(lat, lng, r.lat, r.lng) })).sort((a, b) => a.km - b.km);
}
