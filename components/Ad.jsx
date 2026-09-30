import RawHtml from './RawHtml';

export default function Ad({ config, slot, className = '' }) {
	const html = config.options[`ad_${slot}`];
	if (!html) return null;
	const label = config.options.ad_label;
	return (
		<div className={`gx-ad gx-ad--${slot} ${className}`.trim()}>
			{label ? <span className="gx-ad__label">{label}</span> : null}
			<RawHtml html={html} />
		</div>
	);
}
