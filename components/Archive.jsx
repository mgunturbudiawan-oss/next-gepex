import { CardOverlay, CardList, CardGrid, SectionTitle } from './Cards';
import LoadMore from './LoadMore';
import { PageLayout, Breadcrumbs } from './Layout';
import Icon from './Icon';

/** `className` = kelas tambahan halaman (mis. tema kategori), `listTitle` = judul di atas daftar berita. */
export default function Archive({ config, data, query, heading, crumbs, headlineAllowed = true, className = '', listTitle = '' }) {
	const o = config.options;
	const layout = o.archive_layout === 'grid' ? 'grid' : 'list';
	const C = layout === 'grid' ? CardGrid : CardList;
	let posts = data.posts || [];
	let head = null;
	if (headlineAllowed && o.archive_headline && posts.length > 1) {
		head = posts[0];
		posts = posts.slice(1);
	}
	return (
		<PageLayout config={config} className={className}>
			<Breadcrumbs items={crumbs} />
			{heading}
			{head ? <CardOverlay post={head} opts={o} eager className="gx-card--hero gx-mb" /> : null}
			{posts.length ? (
				<div id="gx-post-list">
					{listTitle ? <SectionTitle title={listTitle} /> : null}
					<div className={`gx-list gx-list--${layout}`}>{posts.map((p) => <C key={p.id} post={p} opts={o} excerpt={o.show_excerpt} />)}</div>
					{data.totalPages > 1 ? <LoadMore query={query} totalPages={data.totalPages} layout={layout} opts={o} excerpt={o.show_excerpt} /> : null}
				</div>
			) : !head ? (
				<div className="gx-empty"><Icon name="newspaper" className="gx-empty__icon" /><p>Belum ada berita di sini.</p></div>
			) : null}
		</PageLayout>
	);
}
