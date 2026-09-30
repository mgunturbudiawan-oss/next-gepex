// Kerangka (skeleton) dengan efek kilau, tampil selama data dimuat.
const Bar = ({ w = '100%', h = '.9rem', r, className = '', style }) => (
	<span className={`sk ${className}`} style={{ width: w, height: h, borderRadius: r, ...style }} aria-hidden="true" />
);

export function SkLine({ lines = 2, last = '60%', h = '.95rem' }) {
	return (
		<span className="sk-stack">
			{Array.from({ length: lines }).map((_, i) => <Bar key={i} h={h} w={i === lines - 1 ? last : '100%'} />)}
		</span>
	);
}

export function SkCardList({ count = 4 }) {
	return (
		<div className="gx-list gx-list--list sk-wrap">
			{Array.from({ length: count }).map((_, i) => (
				<div key={i} className="gx-card gx-card--list">
					<Bar className="gx-card__media" h="auto" />
					<div className="gx-card__body">
						<Bar w="4.5rem" h=".65rem" />
						<SkLine lines={2} />
						<Bar w="45%" h=".65rem" style={{ marginTop: '.5rem' }} />
					</div>
				</div>
			))}
		</div>
	);
}

export function SkGrid({ count = 6 }) {
	return (
		<div className="gx-grid sk-wrap">
			{Array.from({ length: count }).map((_, i) => (
				<div key={i} className="sk-gridcard">
					<Bar h="auto" className="sk-ratio" />
					<SkLine lines={2} />
				</div>
			))}
		</div>
	);
}

export function SkTitle({ w = '9rem' }) {
	return <div className="gx-section-head"><Bar w={w} h="1.2rem" /></div>;
}

export function SkSidebar() {
	return (
		<div className="gx-widget sk-wrap">
			<Bar w="7rem" h="1rem" style={{ marginBottom: '1rem' }} />
			{Array.from({ length: 5 }).map((_, i) => (
				<div key={i} className="sk-row">
					<Bar w="1.4rem" h="1.4rem" />
					<SkLine lines={2} />
				</div>
			))}
		</div>
	);
}

export function SkHeadline() {
	return (
		<div className="sk-wrap sk-headline">
			<div className="sk-special">
				<Bar w="10rem" h="1.4rem" r="999px" />
				<div className="sk-special__row">
					{Array.from({ length: 3 }).map((_, i) => (
						<div key={i} className="sk-row"><Bar w="5.5rem" h="5.5rem" /><SkLine lines={3} last="40%" /></div>
					))}
				</div>
			</div>
			<Bar className="sk-hero" h="auto" />
			<div className="sk-tabs">
				{Array.from({ length: 4 }).map((_, i) => <Bar key={i} className="sk-tab" h="auto" />)}
			</div>
		</div>
	);
}

export function SkArticle() {
	return (
		<div className="sk-wrap sk-article">
			<Bar w="12rem" h=".75rem" />
			<Bar w="5rem" h="1.3rem" style={{ marginTop: '1rem' }} />
			<SkLine lines={3} h="1.9rem" last="70%" />
			<Bar w="55%" h=".8rem" style={{ marginTop: '1rem' }} />
			<Bar className="sk-figure" h="auto" />
			<SkLine lines={4} h="1rem" last="80%" />
			<SkLine lines={4} h="1rem" last="50%" />
			<SkLine lines={3} h="1rem" last="65%" />
		</div>
	);
}

/** Tata letak halaman (konten + sidebar) versi skeleton. */
export function SkPage({ children, head }) {
	return (
		<div className="container-custom gx-page" aria-busy="true" aria-label="Memuat">
			{head}
			<div className="gx-layout gx-layout--right">
				<main className="gx-main">{children}</main>
				<aside className="gx-aside"><SkSidebar /></aside>
			</div>
		</div>
	);
}
