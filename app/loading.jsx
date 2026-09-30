import { SkPage, SkHeadline, SkTitle, SkCardList } from '@/components/Skeleton';

export default function Loading() {
	return (
		<SkPage head={<SkHeadline />}>
			<SkTitle w="11rem" />
			<SkCardList count={5} />
		</SkPage>
	);
}
