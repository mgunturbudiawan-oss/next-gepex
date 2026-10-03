// Alamat WordPress (dasbor) & situs Next.js — sama seperti lib/wp.js.
const clean = (v) => {
	let u = String(v || '').trim().replace(/^['"]|['"]$/g, '');
	if (!u) return '';
	if (!/^https?:\/\//i.test(u)) u = `https://${u}`;
	return u.replace(/\/(wp-admin|wp-json)(\/.*)?$/i, '').replace(/\/+$/, '');
};
const WP = clean(process.env.WP_URL) || 'https://deliknews.com';
const SITE = clean(process.env.SITE_URL) || clean(process.env.VERCEL_PROJECT_PRODUCTION_URL);
const hostOf = (u) => { try { return new URL(u).host; } catch { return ''; } };
// Hanya bila WordPress punya alamat sendiri (mis. cms.deliknews.com) yang berbeda dari situs ini.
const wpSeparate = Boolean(SITE) && hostOf(WP) !== hostOf(SITE);

/** @type {import('next').NextConfig} */
const nextConfig = {
	// Sama dengan permalink WordPress (/judul-berita/) agar URL lama tetap berlaku.
	trailingSlash: true,
	poweredByHeader: false,
	images: { unoptimized: true },
	async redirects() {
		// Pola URL tema WordPress lama → Next.js.
		const rules = [
			{ source: '/category/:slug*', destination: '/kategori/:slug*', permanent: true },
			{ source: '/author/:slug*', destination: '/penulis/:slug*', permanent: true },
		];
		if (wpSeparate) {
			// Setelah domain utama pindah ke Vercel: alamat WordPress lama tetap jalan,
			// dialihkan ke alamat dasbor (mis. deliknews.com/wp-admin → cms.deliknews.com/wp-admin).
			rules.push(
				{ source: '/wp-admin', destination: `${WP}/wp-admin/`, permanent: false },
				{ source: '/wp-admin/:path*', destination: `${WP}/wp-admin/:path*`, permanent: false },
				{ source: '/wp-login.php', destination: `${WP}/wp-login.php`, permanent: false },
				{ source: '/wp-content/:path*', destination: `${WP}/wp-content/:path*`, permanent: true },
				{ source: '/wp-includes/:path*', destination: `${WP}/wp-includes/:path*`, permanent: true },
				{ source: '/wp-json/:path*', destination: `${WP}/wp-json/:path*`, permanent: false },
				{ source: '/xmlrpc.php', destination: `${WP}/xmlrpc.php`, permanent: false },
				{ source: '/feed', destination: `${WP}/feed/`, permanent: false },
				{ source: '/feed/:path*', destination: `${WP}/feed/:path*`, permanent: false },
			);
		}
		return rules;
	},
};
export default nextConfig;
