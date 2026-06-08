import { IoFemale, IoMale, IoMaleFemale } from 'react-icons/io5';

export default function GenderIcon({ gender }: { gender: string }) {
	const className = 'h-4 w-4';
	switch (gender.toLowerCase()) {
		case 'man':
			return <IoMale className={className} />;
		case 'vrouw':
			return <IoFemale className={className} />;
		default:
			return <IoMaleFemale className={className} />;
	}
}
