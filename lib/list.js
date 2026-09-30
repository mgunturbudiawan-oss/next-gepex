/** Pastikan nilai berupa array (PHP kadang mengirim daftar sebagai objek berkunci angka). */
export function list(v) {
	if (Array.isArray(v)) return v;
	return v && typeof v === 'object' ? Object.values(v) : [];
}
