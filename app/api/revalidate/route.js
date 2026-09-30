import { revalidatePath, revalidateTag } from 'next/cache';

// Dipanggil otomatis oleh WordPress saat berita/pengaturan disimpan.
export async function POST(req) {
	const form = await req.formData().catch(() => null);
	const secret = form ? form.get('secret') : new URL(req.url).searchParams.get('secret');
	if (!process.env.REVALIDATE_SECRET || secret !== process.env.REVALIDATE_SECRET) {
		return Response.json({ ok: false }, { status: 401 });
	}
	revalidateTag('wp', 'max');
	revalidatePath('/', 'layout');
	return Response.json({ ok: true, at: Date.now() });
}
