export type HookInput = {
	command?: string;
};

export type HookOutput =
	| { permission: 'allow' }
	| {
			permission: 'ask';
			user_message?: string;
			agent_message?: string;
	  }
	| {
			permission: 'deny';
			user_message?: string;
			agent_message?: string;
	  };

export type ShellType = 'powershell' | 'cmd' | 'bash' | 'unknown';
export type RuleLevel = 'hard' | 'soft';
export type Rule = { re: RegExp; reason: string };
export type ImplicitMatch = { reason: string; level: RuleLevel };

/**
 * Matches rm/cp/mv only at command position (start of line, or after ; | && ||).
 * Avoids false positives like `echo rm file`.
 */
export const UNIX_FILE_OP_AS_COMMAND = /(?:^\s*(?:rm|cp|mv)\s+|(?:;\s*|&&\s*|\|\|\s*|\|\s*)(?:rm|cp|mv)\s+)/i;

export function detectShell(command: string): ShellType {
	const shellEnv = (process.env.SHELL || '').toLowerCase();
	const comspec = (process.env.ComSpec || '').toLowerCase();

	// Outer POSIX `bash -c "..."` / `sh -c` must win over a nested `powershell` substring.
	if (/\b(bash|zsh|dash)\s+-c\b/i.test(command)) return 'bash';
	if (/\bsh\s+-c\b/i.test(command)) return 'bash';

	if (/\b(pwsh|powershell)\b/i.test(command)) return 'powershell';
	if (/\bcmd\.exe\b|\bcmd\s*\/c\b/i.test(command)) return 'cmd';
	if (/\bbash\b|\bzsh\b/i.test(command)) return 'bash';

	if (/\b(pwsh|powershell)\b/i.test(comspec)) return 'powershell';
	if (/\bcmd\.exe\b/i.test(comspec)) return 'cmd';
	if (/\b(bash|zsh|sh)\b/i.test(shellEnv)) return 'bash';

	return 'unknown';
}

export function inferIntent(command: string): string | null {
	if (/\brm\b/i.test(command)) return 'delete file';
	if (/\bcp\b|\bCopy-Item\b/i.test(command)) return 'copy file';
	if (/\bmv\b|\bMove-Item\b/i.test(command)) return 'move/rename file';
	if (/\bcat\b|\bGet-Content\b/i.test(command)) return 'read file';
	if (/\bmkdir\b|\bNew-Item\b/i.test(command)) return 'create directory';
	if (/\bchmod\b|\bchown\b/i.test(command)) return 'change permissions';
	return null;
}

/**
 * Implicit shell mismatch: command text suggests the wrong family for the detected shell.
 * Returns matches with their own level (soft by default — these are ambiguous, not certain errors).
 */
export function findImplicitMismatchRules(shell: ShellType, command: string): ImplicitMatch[] {
	const out: ImplicitMatch[] = [];
	if (shell === 'powershell' || shell === 'cmd') {
		if (UNIX_FILE_OP_AS_COMMAND.test(command)) {
			out.push({
				reason: 'Looks like Unix `rm`/`cp`/`mv` usage while the detected shell is PowerShell/CMD.',
				level: 'soft',
			});
		}
	}
	if (shell === 'bash') {
		if (/\b(Remove-Item|Copy-Item|Move-Item|Get-Content|Set-Content|Invoke-Expression)\b/i.test(command)) {
			out.push({
				reason: 'Looks like PowerShell cmdlets while the detected shell is bash-like.',
				level: 'soft',
			});
		}
	}
	return out;
}

export const WINDOWS_HARD_RULES: Rule[] = [
	{ re: /(^|\s)sudo(\s|$)/i, reason: 'Uses `sudo` (bash/Unix idiom).' },
	{ re: /(^|\s)(apt-get|apt|yum|dnf|apk|pacman|brew)\b/i, reason: 'Uses a Linux package manager.' },
	{ re: /<<\s*[-\w]+/i, reason: 'Uses heredoc (`<<`) syntax.' },
	{ re: /(^|\s)(chmod|chown)\b/i, reason: 'Uses `chmod`/`chown` (Unix permissions).' },
	{ re: /\/(tmp|var|etc|home|root)\//i, reason: 'Uses Unix absolute paths (`/tmp`, `/etc`, ...).' },
];

export const WINDOWS_SOFT_RULES: Rule[] = [
	{ re: /\b(cat|grep|sed|awk|tail|head)\b/i, reason: 'Uses common Unix text tools.' },
	{ re: /\b(export|source)\b/i, reason: 'Uses shell builtins (`export`, `source`).' },
];

export const RULES: Record<ShellType, { hard: Rule[]; soft: Rule[] }> = {
	powershell: { hard: WINDOWS_HARD_RULES, soft: WINDOWS_SOFT_RULES },
	cmd: { hard: WINDOWS_HARD_RULES, soft: WINDOWS_SOFT_RULES },
	bash: {
		hard: [
			{ re: /\b(pwsh|powershell|cmd\.exe|cmd\s*\/c)\b/i, reason: 'Invokes PowerShell/CMD from bash.' },
			{ re: /(?<![a-zA-Z])[a-zA-Z]:\\/i, reason: 'Uses Windows drive paths (`C:\\...`).' },
			{ re: /\\\\[^\\]+\\[^\\]+/m, reason: 'Uses UNC paths (`\\\\server\\share`).' },
		],
		soft: [
			{ re: /\bdir\b/i, reason: 'Uses `dir` (Windows shell idiom).' },
			{ re: /\b(copy|move|del|rmdir)\b/i, reason: 'Uses Windows file commands (copy/move/del/rmdir).' },
		],
	},
	unknown: {
		hard: [
			{ re: UNIX_FILE_OP_AS_COMMAND, reason: 'Uses `rm`/`cp`/`mv` with Unix-style invocation.' },
			{ re: /(^|\s)(apt-get|apt|yum|dnf|apk|pacman|brew)\b/i, reason: 'Uses a Linux package manager.' },
			{ re: /<<\s*[-\w]+/i, reason: 'Uses heredoc (`<<`) syntax.' },
		],
		soft: [
			{
				re: /\b(pwsh|powershell|cmd\.exe|cmd\s*\/c)\b/i,
				reason: 'Looks like PowerShell/CMD, but shell is unknown.',
			},
			{ re: /^[a-zA-Z]:\\/m, reason: 'Looks like a Windows path, but shell is unknown.' },
		],
	},
};

export function findMatches(command: string, rules: Rule[]): string[] {
	return rules.filter((r) => r.re.test(command)).map((r) => r.reason);
}

export function dedupe(reasons: string[]): string[] {
	return [...new Set(reasons)];
}

export function formatReasonList(reasons: string[]): string {
	if (reasons.length === 0) return '';
	if (reasons.length === 1) return reasons[0];
	return reasons.map((r) => `- ${r}`).join('\n');
}

const WINDOWS_REWRITE_HINTS =
	`Structured rewrite hints (PowerShell):\n` +
	`- rm -> Remove-Item\n` +
	`- cp -> Copy-Item (-Recurse for trees)\n` +
	`- mv -> Move-Item\n` +
	`- cat -> Get-Content\n` +
	`- mkdir -> New-Item -ItemType Directory`;

const UNIX_REWRITE_HINTS =
	`Structured rewrite hints (bash/zsh):\n` +
	`- Remove-Item -> rm\n` +
	`- Copy-Item -> cp\n` +
	`- Move-Item -> mv\n` +
	`- Get-Content -> cat`;

export function buildHookOutput(args: {
	permission: 'ask' | 'deny';
	command: string;
	shell: ShellType;
	level: RuleLevel;
	allReasons: string[];
}): HookOutput {
	const { permission, command, shell, level, allReasons } = args;

	const confidence = level === 'hard' ? 'high' : shell === 'unknown' ? 'low' : 'medium';
	const intent = inferIntent(command);

	const prefix = level === 'hard' ? 'Blocked' : 'Suspicious';
	const user_message =
		allReasons.length === 1 ? `${prefix}: ${allReasons[0]}` : `${prefix}: ${allReasons.length} issues detected`;

	const isWindowsShell = shell === 'powershell' || shell === 'cmd';
	const hints = isWindowsShell ? WINDOWS_REWRITE_HINTS : UNIX_REWRITE_HINTS;
	const targetShellLabel = isWindowsShell ? 'Windows PowerShell' : 'a Unix shell (bash/zsh)';
	const reasonBlock = formatReasonList(allReasons);
	const intentLine = intent ? `Inferred intent: ${intent}\n` : '';
	const confidenceLine = `Confidence: ${confidence}\n`;

	const agent_message =
		level === 'hard'
			? `This command is invalid for this platform.\n\n` +
				`Detected shell: ${shell}\n` +
				confidenceLine +
				intentLine +
				`\n${reasonBlock}\n\n` +
				`Original:\n${command}\n\n` +
				`Rewrite the command for ${targetShellLabel}.\n\n` +
				`${hints}\n\n` +
				`Now rewrite:\n${command}\n\n` +
				`Do NOT reuse ${isWindowsShell ? 'bash' : 'Windows/PowerShell-specific'} syntax.`
			: shell === 'unknown'
				? `Ambiguous shell context (${shell}); please confirm before running.\n\n` +
					confidenceLine +
					intentLine +
					`\n${reasonBlock}\n\n` +
					`Command:\n${command}\n\n` +
					`If this is intentional (Docker/CI/remote), confirm and proceed.\n\n` +
					`${hints}`
				: `This command might not match the detected shell (${shell}).\n\n` +
					confidenceLine +
					intentLine +
					`\n${reasonBlock}\n\n` +
					`Command:\n${command}\n\n` +
					`If this is intentional, you can confirm and proceed.\n\n` +
					`${hints}`;

	return { permission, user_message, agent_message };
}

export function checkCommand(command: string): HookOutput {
	const shell = detectShell(command);
	const patterns = RULES[shell];
	const implicit = findImplicitMismatchRules(shell, command);

	const hardReasons = dedupe([
		...findMatches(command, patterns.hard),
		...implicit.filter((i) => i.level === 'hard').map((i) => i.reason),
	]);

	const softReasons = dedupe([
		...findMatches(command, patterns.soft),
		...implicit.filter((i) => i.level === 'soft').map((i) => i.reason),
	]);

	if (hardReasons.length > 0) {
		return buildHookOutput({
			permission: 'deny',
			command,
			shell,
			level: 'hard',
			allReasons: dedupe([...hardReasons, ...softReasons]),
		});
	}

	if (softReasons.length > 0) {
		return buildHookOutput({
			permission: 'ask',
			command,
			shell,
			level: 'soft',
			allReasons: softReasons,
		});
	}

	return { permission: 'allow' };
}

// --- stdin bootstrap (only runs when executed directly, not when imported) ---

async function readStdinJson(): Promise<HookInput> {
	try {
		const buf = await new Promise<string>((resolve, reject) => {
			let data = '';
			process.stdin.setEncoding('utf8');
			process.stdin.on('data', (chunk: string) => {
				data += chunk;
			});
			process.stdin.on('end', () => resolve(data));
			process.stdin.on('error', reject);
		});
		const trimmed = buf.trim();
		return trimmed ? (JSON.parse(trimmed) as HookInput) : {};
	} catch {
		return {};
	}
}

if (import.meta.main) {
	readStdinJson()
		.then((input) => {
			const command = typeof input.command === 'string' ? input.command : '';
			const out: HookOutput = command ? checkCommand(command) : { permission: 'allow' };
			process.stdout.write(`${JSON.stringify(out)}\n`);
		})
		.catch(() => {
			process.stdout.write(`${JSON.stringify({ permission: 'allow' })}\n`);
		});
}
