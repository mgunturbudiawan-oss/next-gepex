// Permintaan ke WordPress langsung dari BROWSER pengunjung (bukan dari server Vercel).
// Dipakai untuk aksi pengunjung (komentar, hitungan dibaca, muat lebih banyak, pencarian): IP pengunjung
// tidak diblokir firewall hosting seperti IP pusat data Vercel. WordPress REST API mengizinkan CORS.

/** Alamat WordPress dari atribut <html data-wp> (diisi layout dari config.site.wpUrl). */
export function wpBase() {
	try {
		return (document.documentElement.dataset.wp || '').replace(/\/+$/, '');
	} catch (e) {
		return '';
	}
}

/** GET JSON dari endpoint tema; melempar error bila gagal / bukan JSON (mis. halaman blokir). */
export async function wpBrowserGet(path) {
	const base = wpBase();
	if (!base) throw new Error('Alamat WordPress tidak diketahui');
	const res = await fetch(`${base}/wp-json/geprex/v1/${path}`, { headers: { Accept: 'application/json' } });
	if (!res.ok) throw new Error(`HTTP ${res.status}`);
	return res.json();
}

/**
 * Coba proxy Next.js dulu (cepat, ter-cache), bila gagal minta langsung dari browser.
 * `proxyUrl` mis. "/api/posts/?type=latest&page=2", `wpPath` mis. "hl/list?type=latest&page=2".
 */
export async function fetchWithFallback(proxyUrl, wpPath) {
	try {
		const res = await fetch(proxyUrl);
		if (res.ok) return await res.json();
	} catch (e) { /* lanjut ke browser */ }
	return wpBrowserGet(wpPath);
}
