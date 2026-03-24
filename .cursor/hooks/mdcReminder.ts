type HookOutput = {
	permission: 'ask';
	user_message: string;
	agent_message: string;
};

function buildReminderOutput(): HookOutput {
	return {
		permission: 'ask',
		user_message: 'MDC rule check',
		agent_message:
			'Before finalizing, verify MDC compliance. Did you apply all active MDC rules for this workspace? ' +
			'Answer briefly with: 1) yes/no, 2) which rule files were considered, 3) any deviations and why.',
	};
}

if (import.meta.main) {
	const out = buildReminderOutput();
	process.stdout.write(`${JSON.stringify(out)}\n`);
}
