/** @type {import('next').NextConfig} */
const nextConfig = {
	// Sama dengan permalink WordPress (/judul-berita/) agar URL lama tetap berlaku.
	trailingSlash: true,
	poweredByHeader: false,
	images: { unoptimized: true },
	async redirects() {
		// Pola URL tema WordPress lama → Next.js.
		return [
			{ source: '/category/:slug*', destination: '/kategori/:slug*', permanent: true },
			{ source: '/author/:slug*', destination: '/penulis/:slug*', permanent: true },
		];
	},
};
export default nextConfig;
