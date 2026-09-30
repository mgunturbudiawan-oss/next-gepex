import { SkPage, SkCardList } from './Skeleton';

export default function SkArchive() {
	return (
		<SkPage>
			<div className="gx-archive-head sk-wrap"><span className="sk" style={{ width: '12rem', height: '1.6rem' }} /></div>
			<SkCardList count={6} />
		</SkPage>
	);
}
