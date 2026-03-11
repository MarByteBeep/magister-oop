import { cn } from '@/lib/utils';

interface PhoneNumberProps extends React.HTMLAttributes<HTMLDivElement> {
	phoneNumber: string;
}

function formatNumber(number: string) {
	// Remove everything except digits
	const digits = number.replace(/\D/g, '');

	if (digits.length < 10) return number;

	// Check if it's a 06 number
	if (digits.startsWith('06')) {
		const part1 = digits.slice(0, 2); // 06
		const part2 = digits.slice(2, 5); // XXX
		const part3 = digits.slice(5, 8); // XXX
		const part4 = digits.slice(8, 10); // XX
		return `${part1} - ${part2} ${part3} ${part4}`;
	}

	// Area codes sorted by length (longest first) to match longest prefix first
	// biome-ignore format: keep array compact
	const areaCodes = [
		'0118', '0117', '0115', '0114', '0113', '0111', '0168', '0167', '0166', '0165', '0164', '0162', '0161',
		'0187', '0186', '0184', '0183', '0182', '0181', '0180', '0174', '0172', '0229', '0228', '0227', '0226',
		'0224', '0223', '0222', '0299', '0297', '0294', '0255', '0252', '0251', '0321', '0320', '0348', '0347',
		'0346', '0345', '0344', '0343', '0342', '0341', '0318', '0317', '0316', '0315', '0314', '0313', '0418',
		'0416', '0413', '0412', '0411', '0478', '0475', '0488', '0487', '0486', '0485', '0481', '0499', '0497',
		'0495', '0493', '0492', '0519', '0518', '0517', '0516', '0515', '0514', '0513', '0512', '0511', '0529',
		'0528', '0527', '0525', '0524', '0523', '0522', '0521', '0548', '0547', '0546', '0545', '0544', '0543',
		'0541', '0578', '0577', '0575', '0573', '0572', '0571', '0570', '0566', '0562', '0561', '0599', '0598',
		'0597', '0596', '0595', '0594', '0593', '0592', '0591',
		'010', '011', '013', '015', '016', '017', '018', '020', '022', '023', '024', '025', '026', '029', '030',
		'031', '032', '033', '034', '035', '036', '038', '040', '041', '043', '045', '046', '047', '048', '049',
		'050', '051', '052', '053', '054', '055', '056', '057', '058', '059', '070', '071', '072', '073', '074',
		'075', '076', '077', '078', '079',
	];

	// Find matching area code (longest match first)
	let areaCode = '';
	let remainingDigits = '';

	for (const code of areaCodes) {
		if (digits.startsWith(code)) {
			areaCode = code;
			remainingDigits = digits.slice(code.length);
			break;
		}
	}

	// If no area code found, use first 2-3 digits as area code
	if (!areaCode) {
		// Try 3 digits first, then 2 digits
		if (digits.length >= 3) {
			areaCode = digits.slice(0, 3);
			remainingDigits = digits.slice(3);
		} else {
			areaCode = digits.slice(0, 2);
			remainingDigits = digits.slice(2);
		}
	}

	// Format remaining digits based on area code length
	const part1 = remainingDigits.slice(0, 3);
	const part2 = remainingDigits.slice(3);
	return `${areaCode} - ${part1} ${part2}`.trim();
}

export function PhoneNumber({ className, phoneNumber }: PhoneNumberProps) {
	return <span className={cn('text-sm', className)}>{phoneNumber && formatNumber(phoneNumber)}</span>;
}
