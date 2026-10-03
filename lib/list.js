/** Pastikan nilai berupa array (PHP kadang mengirim daftar sebagai objek berkunci angka). */
export function list(v) {
	if (Array.isArray(v)) return v;
	return v && typeof v === 'object' ? Object.values(v) : [];
}

/** Ubah entitas HTML dari WordPress (mis. "Ekonomi &amp; Bisnis") menjadi teks biasa. */
export function decodeHtml(s = '') {
	return String(s)
		.replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
		.replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
		.replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, '\u00a0')
		.replace(/&amp;/g, '&');
}
