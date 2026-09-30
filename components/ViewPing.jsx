'use client';
import { useEffect } from 'react';

// Hitung "dibaca" sekali per sesi (aman untuk cache halaman).
export default function ViewPing({ id }) {
	useEffect(() => {
		const key = `gx_v_${id}`;
		try { if (sessionStorage.getItem(key)) return; } catch { /* abaikan */ }
		const t = setTimeout(() => {
			fetch(`/api/view/${id}/`, { method: 'POST', keepalive: true }).catch(() => {});
			try { sessionStorage.setItem(key, '1'); } catch { /* abaikan */ }
		}, 1500);
		return () => clearTimeout(t);
	}, [id]);
	return null;
}
