import { ICONS } from '@/lib/icons-data';

export default function Icon({ name, className = '', label }) {
	const icon = ICONS[name];
	if (!icon) return null;
	const a11y = label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': 'true', focusable: 'false' };
	return (
		<svg className={`gx-icon ${className}`.trim()} viewBox={icon[0]} {...a11y}>
			<path fill="currentColor" d={icon[1]} />
		</svg>
	);
}
