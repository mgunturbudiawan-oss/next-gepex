import CommentForm from './CommentForm';

function timeText(iso) {
	const d = new Date(iso);
	const diff = (Date.now() - d.getTime()) / 1000;
	if (diff < 60) return 'baru saja';
	if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
	if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
	if (diff < 604800) return `${Math.floor(diff / 86400)} hari lalu`;
	return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

function Item({ c, all, depth }) {
	const children = all.filter((x) => x.parent === c.id);
	return (
		<li className="gx-comment" id={`comment-${c.id}`}>
			<article className="gx-comment__inner">
				<div className="gx-comment__avatar"><img src={c.avatar} alt="" width={depth > 1 ? 32 : 40} height={depth > 1 ? 32 : 40} loading="lazy" /></div>
				<div className="gx-comment__main">
					<header className="gx-comment__meta">
						<span className="gx-comment__author">{c.author}</span>
						{c.isAuthor ? <span className="gx-comment__badge">Penulis</span> : null}
						<time className="gx-comment__time" dateTime={c.date} suppressHydrationWarning>{timeText(c.date)}</time>
					</header>
					<div className="gx-comment__text" dangerouslySetInnerHTML={{ __html: c.content }} />
				</div>
			</article>
			{children.length ? <ol className="children">{children.map((x) => <Item key={x.id} c={x} all={all} depth={depth + 1} />)}</ol> : null}
		</li>
	);
}

export default function Comments({ post }) {
	const all = post.comments;
	const roots = all.filter((c) => !c.parent || !all.some((x) => x.id === c.parent));
	return (
		<div id="comments" className="gx-comments">
			<h2 className="gx-comments__title">{all.length ? `${all.length} Komentar` : 'Komentar'}</h2>
			{!all.length && post.commentsOpen ? <p className="gx-comments__empty">Belum ada komentar. Jadilah yang pertama memberi tanggapan.</p> : null}
			{roots.length ? <ol className="gx-comment-list">{roots.map((c) => <Item key={c.id} c={c} all={all} depth={1} />)}</ol> : null}
			{post.commentsOpen ? <CommentForm postId={post.id} /> : <p className="gx-comments__closed">Kolom komentar untuk berita ini sudah ditutup.</p>}
		</div>
	);
}
