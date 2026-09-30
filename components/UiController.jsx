'use client';
// Interaksi global memakai delegasi event (tetap berfungsi setelah navigasi Next.js):
// mode gelap, menu kanal mobile, menu desktop menempel & bisa digeser, salin tautan, lightbox, kembali ke atas, carousel topik.
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

function toast(msg) {
	const el = document.createElement('div');
	el.className = 'gx-toast';
	el.setAttribute('role', 'status');
	el.textContent = msg;
	document.body.appendChild(el);
	setTimeout(() => el.remove(), 2200);
}

function setMenu(open, focusSearch) {
	const menu = document.getElementById('gx-mobile-menu');
	const overlay = document.querySelector('.gx-overlay');
	if (!menu) return;
	menu.hidden = !open;
	if (overlay) overlay.hidden = !open;
	document.body.classList.toggle('gx-menu-open', open);
	document.querySelectorAll('[data-gx-menu-toggle]').forEach((b) => b.setAttribute('aria-expanded', open ? 'true' : 'false'));
	if (open && focusSearch) setTimeout(() => menu.querySelector('input[type=search]')?.focus(), 50);
}

// Desktop: bilah menu menempel di atas saat topbar tergulir keluar layar.
const DESKTOP = '(min-width: 1024px)';

function updateNavArrows() {
	document.querySelectorAll('[data-gx-nav]').forEach((box) => {
		const l = box.querySelector('.gx-nav__list');
		if (!l) return;
		const max = l.scrollWidth - l.clientWidth;
		box.classList.toggle('gx-can-prev', l.scrollLeft > 2);
		box.classList.toggle('gx-can-next', l.scrollLeft < max - 2);
	});
}

function updateStuck() {
	const wrap = document.querySelector('[data-gx-navwrap]');
	const header = document.getElementById('gx-header');
	if (!wrap || !header) return;
	const stuck = window.matchMedia(DESKTOP).matches && wrap.getBoundingClientRect().top < 0;
	if (stuck === header.classList.contains('gx-header--stuck')) return;
	// Kunci tinggi pembungkus agar konten tidak melompat saat menu jadi fixed.
	wrap.style.height = stuck ? `${wrap.offsetHeight}px` : '';
	header.classList.toggle('gx-header--stuck', stuck);
	if (!stuck) document.querySelector('.gx-search--nav')?.classList.remove('gx-open');
	updateNavArrows();
}

let lightbox = null;
function closeLightbox() {
	if (lightbox) { lightbox.remove(); lightbox = null; document.body.style.overflow = ''; }
}

export default function UiController() {
	const pathname = usePathname();

	useEffect(() => {
		setMenu(false);
		closeLightbox();
		// Tandai menu aktif & geser agar terlihat.
		document.querySelectorAll('.gx-nav__list a, .gx-drop__grid a').forEach((a) => {
			const href = a.getAttribute('href') || '';
			const active = href === '/' ? pathname === '/' : href.startsWith('/') && pathname.startsWith(href);
			if (active) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
		});
		document.querySelector('.gx-nav__list a[aria-current]')?.scrollIntoView({ inline: 'center', block: 'nearest' });
		updateStuck();
		updateNavArrows();
	}, [pathname]);

	useEffect(() => {
		const root = document.documentElement;
		const onClick = (e) => {
			const t = e.target;
			// Cari di menu menempel: ikon membuka/menutup kotak input; kirim bila sudah terisi.
			const navSearch = document.querySelector('.gx-search--nav');
			if (navSearch) {
				if (t.closest('.gx-search--nav button')) {
					const input = navSearch.querySelector('input');
					if (!navSearch.classList.contains('gx-open') || !input.value.trim()) {
						e.preventDefault();
						const open = navSearch.classList.toggle('gx-open');
						if (open) input.focus();
					}
					return;
				}
				if (!t.closest('.gx-search--nav')) navSearch.classList.remove('gx-open');
			}
			const dark = t.closest('[data-gx-dark]');
			if (dark) {
				const on = root.classList.toggle('dark');
				try { localStorage.setItem('theme', on ? 'dark' : 'light'); } catch (err) { /* abaikan */ }
				return;
			}
			if (t.closest('[data-gx-menu-toggle]')) {
				setMenu(document.getElementById('gx-mobile-menu')?.hidden);
				return;
			}
			if (t.closest('[data-gx-menu-close]')) { setMenu(false); return; }
			if (t.closest('[data-gx-search-open]')) {
				const header = document.getElementById('gx-header-search');
				if (header && header.offsetParent) header.focus(); else setMenu(true, true);
				return;
			}
			const copy = t.closest('[data-gx-copy]');
			if (copy) {
				const val = copy.getAttribute('data-gx-copy');
				(navigator.clipboard ? navigator.clipboard.writeText(val) : Promise.reject()).then(() => toast('Tautan disalin')).catch(() => {});
				return;
			}
			const navScroll = t.closest('[data-gx-nav-scroll]');
			if (navScroll) {
				const l = navScroll.closest('[data-gx-nav]')?.querySelector('.gx-nav__list');
				if (l) l.scrollBy({ left: parseInt(navScroll.getAttribute('data-gx-nav-scroll'), 10) * l.clientWidth * 0.7, behavior: 'smooth' });
				return;
			}
			const scroll = t.closest('[data-gx-scroll]');
			if (scroll) {
				const track = scroll.closest('section')?.querySelector('[data-gx-track]');
				if (track) track.scrollBy({ left: parseInt(scroll.getAttribute('data-gx-scroll'), 10) * track.clientWidth * 0.8, behavior: 'smooth' });
				return;
			}
			if (t.closest('[data-gx-totop]')) { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
			const lb = t.closest('[data-gx-lightbox], .gx-content a[href$=".jpg"], .gx-content a[href$=".jpeg"], .gx-content a[href$=".png"], .gx-content a[href$=".webp"]');
			if (lb && lb.querySelector('img')) {
				e.preventDefault();
				lightbox = document.createElement('div');
				lightbox.className = 'gx-lightbox';
				lightbox.setAttribute('role', 'dialog');
				lightbox.innerHTML = '<img alt=""><button type="button" class="gx-iconbtn" aria-label="Tutup">&times;</button>';
				lightbox.querySelector('img').src = lb.href;
				lightbox.addEventListener('click', closeLightbox);
				document.body.appendChild(lightbox);
				document.body.style.overflow = 'hidden';
				return;
			}
			if (lightbox && t.closest('.gx-lightbox')) closeLightbox();
		};
		const onKey = (e) => { if (e.key === 'Escape') { setMenu(false); closeLightbox(); document.querySelector('.gx-search--nav')?.classList.remove('gx-open'); } };
		let ticking = false;
		const onScroll = () => {
			if (ticking) return;
			ticking = true;
			requestAnimationFrame(() => {
				const top = document.querySelector('[data-gx-totop]');
				if (top) top.hidden = window.scrollY < 600;
				updateStuck();
				ticking = false;
			});
		};
		// Geser menu dengan seret mouse (sentuh & trackpad sudah bisa bawaan).
		let drag = null;
		let blockClick = false;
		const onDown = (e) => {
			if (e.pointerType !== 'mouse' || e.button !== 0) return;
			const l = e.target.closest('.gx-nav__list');
			if (!l || l.scrollWidth <= l.clientWidth) return;
			drag = { l, x: e.clientX, left: l.scrollLeft, moved: false };
		};
		const onMove = (e) => {
			if (!drag) return;
			const dx = e.clientX - drag.x;
			if (!drag.moved && Math.abs(dx) > 5) { drag.moved = true; drag.l.classList.add('gx-dragging'); }
			if (drag.moved) drag.l.scrollLeft = drag.left - dx;
		};
		const onUp = () => {
			if (!drag) return;
			if (drag.moved) { blockClick = true; setTimeout(() => { blockClick = false; }, 0); }
			drag.l.classList.remove('gx-dragging');
			drag = null;
		};
		// Batalkan klik tautan setelah menyeret (fase capture, sebelum Next.js menanganinya).
		const onClickCapture = (e) => { if (blockClick) { e.preventDefault(); e.stopPropagation(); blockClick = false; } };
		const onDragStart = (e) => { if (e.target.closest?.('.gx-nav__list')) e.preventDefault(); };
		const onInnerScroll = (e) => { if (e.target.classList?.contains('gx-nav__list')) updateNavArrows(); };
		const onResize = () => { updateStuck(); updateNavArrows(); };
		document.addEventListener('click', onClick);
		document.addEventListener('keydown', onKey);
		window.addEventListener('scroll', onScroll, { passive: true });
		window.addEventListener('resize', onResize);
		window.addEventListener('click', onClickCapture, true);
		document.addEventListener('pointerdown', onDown);
		document.addEventListener('pointermove', onMove);
		document.addEventListener('pointerup', onUp);
		document.addEventListener('pointercancel', onUp);
		document.addEventListener('dragstart', onDragStart);
		document.addEventListener('scroll', onInnerScroll, { capture: true, passive: true });
		onResize();
		return () => {
			window.removeEventListener('resize', onResize);
			window.removeEventListener('click', onClickCapture, true);
			document.removeEventListener('pointerdown', onDown);
			document.removeEventListener('pointermove', onMove);
			document.removeEventListener('pointerup', onUp);
			document.removeEventListener('pointercancel', onUp);
			document.removeEventListener('dragstart', onDragStart);
			document.removeEventListener('scroll', onInnerScroll, { capture: true });
			document.removeEventListener('click', onClick);
			document.removeEventListener('keydown', onKey);
			window.removeEventListener('scroll', onScroll);
		};
	}, []);

	return null;
}
