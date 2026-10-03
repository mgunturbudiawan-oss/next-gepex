'use client';
import { useEffect } from 'react';
import { wpBase } from '@/lib/wp-browser';

// Hitung "dibaca" sekali per sesi (aman untuk cache halaman).
// Dikirim langsung dari browser ke WordPress (tidak kena blokir server); proxy Next.js sebagai cadangan.
export default function ViewPing({ id }) {
	useEffect(() => {
		const key = `gx_v_${id}`;
		try { if (sessionStorage.getItem(key)) return; } catch { /* abaikan */ }
		const t = setTimeout(() => {
			const base = wpBase();
			const direct = base ? fetch(`${base}/wp-json/geprex/v1/view/${id}`, { method: 'POST', keepalive: true }) : Promise.reject();
			direct.then((r) => { if (!r.ok) throw new Error(); }).catch(() => fetch(`/api/view/${id}/`, { method: 'POST', keepalive: true }).catch(() => {}));
			try { sessionStorage.setItem(key, '1'); } catch { /* abaikan */ }
		}, 1500);
		return () => clearTimeout(t);
	}, [id]);
	return null;
}
