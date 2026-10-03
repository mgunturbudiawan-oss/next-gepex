import './theme.css';
import './globals.css';
import { getConfig, SITE_URL } from '@/lib/wp';
import { Header, Footer } from '@/components/Layout';
import UiController from '@/components/UiController';
import NavProgress from '@/components/NavProgress';
import { Suspense } from 'react';
import RawHtml from '@/components/RawHtml';

// Render saat diakses, bukan saat build: build (mis. di Vercel) tidak perlu menghubungi WordPress.
// Data WordPress tetap di-cache (fetch `next.revalidate` di lib/wp.js), jadi beban WordPress tidak bertambah.
export const dynamic = 'force-dynamic';

export async function generateMetadata() {
	const config = await getConfig();
	if (!config.licensed) return { title: 'Situs sedang disiapkan', robots: { index: false } };
	const { site, options: o } = config;
	return {
		metadataBase: new URL(SITE_URL),
		title: { default: site.description ? `${site.name} — ${site.description}` : site.name, template: `%s - ${site.name}` },
		description: site.description,
		alternates: { canonical: '/', types: { 'application/rss+xml': `${site.wpUrl}feed/` } },
		openGraph: { siteName: site.name, locale: (site.language || 'id-ID').replace('-', '_'), type: 'website', images: o.seo_default_image ? [o.seo_default_image] : undefined },
		twitter: { card: 'summary_large_image', site: o.seo_twitter_site || undefined },
		icons: site.icon ? { icon: site.icon, apple: site.icon } : undefined,
		verification: { google: o.seo_google_verify || undefined, other: o.seo_bing_verify ? { 'msvalidate.01': o.seo_bing_verify } : undefined },
		robots: { index: true, follow: true, 'max-image-preview': 'large' },
	};
}

export async function generateViewport() {
	const config = await getConfig();
	return { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: config.licensed ? config.options.color_nav_start : '#dc2626' };
}

function darkBoot(o) {
	if (o.dark_mode === 'off') return '';
	if (o.dark_mode === 'always') return "document.documentElement.classList.add('dark');";
	return `(function(){try{var t=localStorage.getItem('theme'),d=${JSON.stringify(o.dark_default)};if(t==='dark'||(!t&&(d==='dark'||(d==='system'&&matchMedia('(prefers-color-scheme: dark)').matches))))document.documentElement.classList.add('dark');}catch(e){}})();`;
}

export default async function RootLayout({ children }) {
	const config = await getConfig();
	if (!config.licensed) {
		return (
			<html lang="id">
				<body>
					<div className="gx-locked"><div><h1>Situs sedang disiapkan</h1><p>Silakan kembali beberapa saat lagi.</p></div></div>
				</body>
			</html>
		);
	}
	const o = config.options;
	const bodyClass = ['gx-sidebar-' + o.sidebar_position, o.mobile_bottom_nav ? 'gx-has-bottom-nav' : '', o.sticky_header ? 'gx-sticky-header' : ''].join(' ');
	return (
		<html lang={(config.site.language || 'id').split('-')[0]} data-wp={config.site.wpUrl || undefined} suppressHydrationWarning>
			<head>
				<script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js');" + darkBoot(o) }} />
				{config.fontsUrl ? <><link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" /><link rel="stylesheet" href={config.fontsUrl} /></> : null}
				<style dangerouslySetInnerHTML={{ __html: config.css }} />
			</head>
			<body className={bodyClass}>
				<Suspense fallback={null}><NavProgress /></Suspense>
				<Header config={config} />
				<div id="gx-content" className="gx-site-content">{children}</div>
				<Footer config={config} />
				<UiController />
				<RawHtml html={[o.code_head, o.code_body_open, o.code_footer].filter(Boolean).join('\n')} />
			</body>
		</html>
	);
}
