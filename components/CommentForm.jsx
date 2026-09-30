'use client';
import { useState } from 'react';

export default function CommentForm({ postId, parent = 0 }) {
	const [state, setState] = useState({ status: 'idle', message: '' });

	async function submit(e) {
		e.preventDefault();
		const f = new FormData(e.currentTarget);
		setState({ status: 'sending', message: '' });
		try {
			const res = await fetch('/api/comment/', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ post: postId, parent, author: f.get('author'), email: f.get('email'), content: f.get('comment') }),
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.message || 'Gagal mengirim komentar');
			setState({ status: 'done', message: data.message });
			e.target.reset();
		} catch (err) {
			setState({ status: 'error', message: err.message });
		}
	}

	return (
		<div className="comment-respond">
			<h3 className="gx-form__title">Tulis komentar</h3>
			<form className="gx-form" onSubmit={submit}>
				<p className="gx-form__note">Email Anda tidak akan dipublikasikan. Kolom bertanda * wajib diisi.</p>
				<p className="gx-field gx-field--full"><label htmlFor="gx-c-text">Komentar <span className="gx-req">*</span></label><textarea id="gx-c-text" name="comment" rows="4" required maxLength={65525} placeholder="Tulis tanggapan Anda tentang berita ini" /></p>
				<p className="gx-field"><label htmlFor="gx-c-name">Nama <span className="gx-req">*</span></label><input id="gx-c-name" name="author" type="text" required maxLength={245} autoComplete="name" /></p>
				<p className="gx-field"><label htmlFor="gx-c-mail">Email <span className="gx-req">*</span></label><input id="gx-c-mail" name="email" type="email" required maxLength={100} autoComplete="email" /></p>
				<p className="gx-form__submit-wrap">
					<button type="submit" className="gx-btn gx-btn--primary" disabled={state.status === 'sending'}>{state.status === 'sending' ? 'Mengirim...' : 'Kirim komentar'}</button>
				</p>
				{state.message ? <p className="gx-form__note gx-field--full" role="status">{state.message}</p> : null}
			</form>
		</div>
	);
}
