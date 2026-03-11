import type React from 'react';
import { Button } from '@/components/ui/button';

const ReloadButton: React.FC = () => {
	const handleClick = async () => {
		const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
		if (tabs.length > 0 && tabs[0].id != null) {
			chrome.tabs.reload(tabs[0].id);
		}
	};

	return (
		<Button onClick={handleClick} variant="outline">
			Herlaad pagina
		</Button>
	);
};

export default ReloadButton;
