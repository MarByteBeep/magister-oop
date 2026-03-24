import { afterEach, describe, expect, test } from 'bun:test';
import { checkCommand, detectShell, inferIntent } from './shellGuard';

// ---------------------------------------------------------------------------
// Helpers to simulate Windows / Linux env
// ---------------------------------------------------------------------------

const ORIGINAL_ENV = { ...process.env };

function setWindowsEnv() {
	process.env.ComSpec = 'C:\\WINDOWS\\system32\\cmd.exe';
	delete process.env.SHELL;
}

function setLinuxEnv() {
	process.env.SHELL = '/bin/bash';
	delete process.env.ComSpec;
}

function clearShellEnv() {
	delete process.env.SHELL;
	delete process.env.ComSpec;
}

afterEach(() => {
	process.env.SHELL = ORIGINAL_ENV.SHELL;
	process.env.ComSpec = ORIGINAL_ENV.ComSpec;
});

// ===========================================================================
// detectShell
// ===========================================================================

describe('detectShell', () => {
	describe('explicit command text takes priority', () => {
		test('bash -c wins over nested powershell', () => {
			expect(detectShell('bash -c "powershell -NoProfile -Command 1"')).toBe('bash');
		});

		test('sh -c is detected as bash', () => {
			expect(detectShell('sh -c "ls -la"')).toBe('bash');
		});

		test('zsh -c is detected as bash', () => {
			expect(detectShell('zsh -c "echo hi"')).toBe('bash');
		});

		test('powershell in command text', () => {
			expect(detectShell('powershell -Command "Get-ChildItem"')).toBe('powershell');
		});

		test('pwsh in command text', () => {
			expect(detectShell('pwsh -Command "ls"')).toBe('powershell');
		});

		test('cmd.exe in command text', () => {
			expect(detectShell('cmd.exe /c dir')).toBe('cmd');
		});

		test('cmd /c in command text', () => {
			expect(detectShell('cmd /c echo hi')).toBe('cmd');
		});

		test('bash in command text', () => {
			expect(detectShell('bash script.sh')).toBe('bash');
		});

		test('.sh extension does NOT trigger bash detection', () => {
			setWindowsEnv();
			expect(detectShell('chmod 755 deploy.sh')).toBe('cmd');
		});
	});

	describe('env var fallback (no shell in command text)', () => {
		test('ComSpec = cmd.exe → cmd', () => {
			setWindowsEnv();
			expect(detectShell('echo hello')).toBe('cmd');
		});

		test('SHELL = /bin/bash → bash', () => {
			setLinuxEnv();
			expect(detectShell('echo hello')).toBe('bash');
		});

		test('SHELL = /bin/zsh → bash', () => {
			process.env.SHELL = '/bin/zsh';
			delete process.env.ComSpec;
			expect(detectShell('echo hello')).toBe('bash');
		});

		test('no env vars → unknown', () => {
			clearShellEnv();
			expect(detectShell('echo hello')).toBe('unknown');
		});
	});
});

// ===========================================================================
// inferIntent
// ===========================================================================

describe('inferIntent', () => {
	test('rm → delete file', () => expect(inferIntent('rm file.txt')).toBe('delete file'));
	test('cp → copy file', () => expect(inferIntent('cp a b')).toBe('copy file'));
	test('Copy-Item → copy file', () => expect(inferIntent('Copy-Item a b')).toBe('copy file'));
	test('mv → move/rename file', () => expect(inferIntent('mv a b')).toBe('move/rename file'));
	test('cat → read file', () => expect(inferIntent('cat README.md')).toBe('read file'));
	test('Get-Content → read file', () => expect(inferIntent('Get-Content file.txt')).toBe('read file'));
	test('mkdir → create directory', () => expect(inferIntent('mkdir foo')).toBe('create directory'));
	test('chmod → change permissions', () => expect(inferIntent('chmod 755 deploy.sh')).toBe('change permissions'));
	test('echo → null', () => expect(inferIntent('echo hello')).toBeNull());
	test('git → null', () => expect(inferIntent('git status')).toBeNull());
});

// ===========================================================================
// checkCommand – Windows environment (ComSpec = cmd.exe)
// ===========================================================================

describe('checkCommand (Windows env)', () => {
	afterEach(() => {
		process.env.SHELL = ORIGINAL_ENV.SHELL;
		process.env.ComSpec = ORIGINAL_ENV.ComSpec;
	});

	describe('hard deny (Unix commands on Windows)', () => {
		test('sudo apt update', () => {
			setWindowsEnv();
			const r = checkCommand('sudo apt update');
			expect(r.permission).toBe('deny');
			expect(r).toHaveProperty('agent_message');
			if ('agent_message' in r) {
				expect(r.agent_message).toContain('Confidence: high');
				expect(r.agent_message).toContain('sudo');
			}
		});

		test('chmod 755 deploy.sh', () => {
			setWindowsEnv();
			const r = checkCommand('chmod 755 deploy.sh');
			expect(r.permission).toBe('deny');
			if ('agent_message' in r) {
				expect(r.agent_message).toContain('chmod');
				expect(r.agent_message).toContain('Inferred intent: change permissions');
			}
		});

		test('heredoc syntax', () => {
			setWindowsEnv();
			const r = checkCommand('cat <<EOF\nhello\nEOF');
			expect(r.permission).toBe('deny');
		});

		test('Unix absolute paths (/tmp)', () => {
			setWindowsEnv();
			const r = checkCommand('ls /tmp/output.log');
			expect(r.permission).toBe('deny');
		});

		test('multiple hard reasons combined', () => {
			setWindowsEnv();
			const r = checkCommand('sudo chmod 755 /tmp/deploy.sh');
			expect(r.permission).toBe('deny');
			if ('user_message' in r) {
				expect(r.user_message).toContain('issues detected');
			}
			if ('agent_message' in r) {
				expect(r.agent_message).toContain('sudo');
				expect(r.agent_message).toContain('chmod');
				expect(r.agent_message).toContain('/tmp');
			}
		});

		test('hard deny includes soft reasons for context', () => {
			setWindowsEnv();
			const r = checkCommand('sudo cat /tmp/file.txt');
			expect(r.permission).toBe('deny');
			if ('agent_message' in r) {
				expect(r.agent_message).toContain('Confidence: high');
				expect(r.agent_message).toContain('Unix text tools');
			}
		});
	});

	describe('soft ask (suspicious on Windows)', () => {
		test('cat README.md', () => {
			setWindowsEnv();
			const r = checkCommand('cat README.md');
			expect(r.permission).toBe('ask');
			if ('agent_message' in r) {
				expect(r.agent_message).toContain('Confidence: medium');
				expect(r.agent_message).toContain('Inferred intent: read file');
			}
		});

		test('grep -r TODO', () => {
			setWindowsEnv();
			const r = checkCommand('grep -r TODO src/');
			expect(r.permission).toBe('ask');
		});

		test('export var', () => {
			setWindowsEnv();
			const r = checkCommand('export NODE_ENV=production');
			expect(r.permission).toBe('ask');
		});

		test('source bashrc', () => {
			setWindowsEnv();
			const r = checkCommand('source ~/.bashrc');
			expect(r.permission).toBe('ask');
		});
	});

	describe('implicit mismatch (soft, not hard)', () => {
		test('rm file.txt is ask, not deny', () => {
			setWindowsEnv();
			const r = checkCommand('rm file.txt');
			expect(r.permission).toBe('ask');
			if ('agent_message' in r) {
				expect(r.agent_message).toContain('Inferred intent: delete file');
			}
		});

		test('cp -r src/ dest/ is ask', () => {
			setWindowsEnv();
			const r = checkCommand('cp -r src/ dest/');
			expect(r.permission).toBe('ask');
		});

		test('chained rm after && is ask', () => {
			setWindowsEnv();
			const r = checkCommand('echo done && rm temp.txt');
			expect(r.permission).toBe('ask');
		});

		test('piped mv is ask', () => {
			setWindowsEnv();
			const r = checkCommand('ls | mv old.txt new.txt');
			expect(r.permission).toBe('ask');
		});
	});

	describe('allow (safe on Windows)', () => {
		test('echo hello', () => {
			setWindowsEnv();
			expect(checkCommand('echo hello')).toEqual({ permission: 'allow' });
		});

		test('npm install', () => {
			setWindowsEnv();
			expect(checkCommand('npm install express')).toEqual({ permission: 'allow' });
		});

		test('git status', () => {
			setWindowsEnv();
			expect(checkCommand('git status')).toEqual({ permission: 'allow' });
		});

		test('bun run check', () => {
			setWindowsEnv();
			expect(checkCommand('bun run check')).toEqual({ permission: 'allow' });
		});

		test('powershell native (ps calling ps)', () => {
			setWindowsEnv();
			expect(checkCommand('powershell -Command "Get-ChildItem -Recurse"').permission).toBe('allow');
		});

		test('pwsh Remove-Item (ps calling ps)', () => {
			setWindowsEnv();
			expect(checkCommand('pwsh -Command "Remove-Item temp.log"').permission).toBe('allow');
		});

		test('echo rm (no false positive on rm in string)', () => {
			setWindowsEnv();
			expect(checkCommand('echo rm file')).toEqual({ permission: 'allow' });
		});

		test('powershell -Command rm (rm inside ps arg)', () => {
			setWindowsEnv();
			expect(checkCommand('powershell -Command "rm file.txt"').permission).toBe('allow');
		});
	});
});

// ===========================================================================
// checkCommand – Linux environment (SHELL = /bin/bash)
// ===========================================================================

describe('checkCommand (Linux env)', () => {
	afterEach(() => {
		process.env.SHELL = ORIGINAL_ENV.SHELL;
		process.env.ComSpec = ORIGINAL_ENV.ComSpec;
	});

	describe('hard deny (Windows commands on Linux)', () => {
		test('bash -c powershell (invokes PS from bash)', () => {
			setLinuxEnv();
			const r = checkCommand('bash -c "powershell -NoProfile -Command 1"');
			expect(r.permission).toBe('deny');
			if ('agent_message' in r) {
				expect(r.agent_message).toContain('Confidence: high');
			}
		});

		test('Windows drive path in bash context', () => {
			setLinuxEnv();
			const r = checkCommand('bash -c "cat C:\\Users\\test\\file.txt"');
			expect(r.permission).toBe('deny');
		});

		test('UNC path in bash context', () => {
			setLinuxEnv();
			const r = checkCommand('bash -c "ls \\\\server\\share\\data"');
			expect(r.permission).toBe('deny');
		});

		test('Windows drive path on Linux (no shell prefix)', () => {
			setLinuxEnv();
			const r = checkCommand('echo C:\\Users\\test\\file.txt');
			expect(r.permission).toBe('deny');
		});

		test('explicit powershell is allowed (PS exists on Linux as pwsh)', () => {
			setLinuxEnv();
			expect(checkCommand('powershell -Command "Get-ChildItem"').permission).toBe('allow');
		});
	});

	describe('soft ask (suspicious on Linux)', () => {
		test('dir (Windows idiom)', () => {
			setLinuxEnv();
			const r = checkCommand('bash -c "dir /s"');
			expect(r.permission).toBe('ask');
		});

		test('del (Windows file command)', () => {
			setLinuxEnv();
			const r = checkCommand('bash -c "del myfile.txt"');
			expect(r.permission).toBe('ask');
		});

		test('Remove-Item in bash (implicit mismatch)', () => {
			setLinuxEnv();
			const r = checkCommand('bash -c "Remove-Item x"');
			expect(r.permission).toBe('ask');
			if ('agent_message' in r) {
				expect(r.agent_message).toContain('Confidence: medium');
			}
		});
	});

	describe('allow (safe on Linux)', () => {
		test('echo hello', () => {
			setLinuxEnv();
			expect(checkCommand('echo hello')).toEqual({ permission: 'allow' });
		});

		test('rm file.txt (normal on Linux)', () => {
			setLinuxEnv();
			expect(checkCommand('rm file.txt')).toEqual({ permission: 'allow' });
		});

		test('cat README.md (normal on Linux)', () => {
			setLinuxEnv();
			expect(checkCommand('cat README.md')).toEqual({ permission: 'allow' });
		});

		test('chmod 755 (normal on Linux)', () => {
			setLinuxEnv();
			expect(checkCommand('chmod 755 deploy.sh')).toEqual({ permission: 'allow' });
		});

		test('sudo apt update (normal on Linux)', () => {
			setLinuxEnv();
			expect(checkCommand('sudo apt update')).toEqual({ permission: 'allow' });
		});

		test('grep -r TODO (normal on Linux)', () => {
			setLinuxEnv();
			expect(checkCommand('grep -r TODO src/')).toEqual({ permission: 'allow' });
		});

		test('export VAR (normal on Linux)', () => {
			setLinuxEnv();
			expect(checkCommand('export NODE_ENV=production')).toEqual({ permission: 'allow' });
		});

		test('sh -c "ls -la"', () => {
			setLinuxEnv();
			expect(checkCommand('sh -c "ls -la"')).toEqual({ permission: 'allow' });
		});

		test('npm install', () => {
			setLinuxEnv();
			expect(checkCommand('npm install express')).toEqual({ permission: 'allow' });
		});

		test('git status', () => {
			setLinuxEnv();
			expect(checkCommand('git status')).toEqual({ permission: 'allow' });
		});
	});
});

// ===========================================================================
// checkCommand – unknown environment (no SHELL, no ComSpec)
// ===========================================================================

describe('checkCommand (unknown env)', () => {
	afterEach(() => {
		process.env.SHELL = ORIGINAL_ENV.SHELL;
		process.env.ComSpec = ORIGINAL_ENV.ComSpec;
	});

	test('apt install → deny (hard)', () => {
		clearShellEnv();
		const r = checkCommand('apt install curl');
		expect(r.permission).toBe('deny');
	});

	test('rm file → deny (hard, unknown treats rm as hard)', () => {
		clearShellEnv();
		const r = checkCommand('rm file.txt');
		expect(r.permission).toBe('deny');
	});

	test('heredoc → deny', () => {
		clearShellEnv();
		const r = checkCommand('cat <<EOF\nhello\nEOF');
		expect(r.permission).toBe('deny');
	});

	test('powershell in command text → allow (detectShell identifies PS)', () => {
		clearShellEnv();
		expect(checkCommand('powershell -Command "ls"').permission).toBe('allow');
	});

	test('Windows path at start → soft ask', () => {
		clearShellEnv();
		const r = checkCommand('C:\\Windows\\System32\\notepad.exe file.txt');
		expect(r.permission).toBe('ask');
		if ('agent_message' in r) {
			expect(r.agent_message).toContain('Confidence: low');
		}
	});

	test('C:\\ path → ask (soft, unknown shell)', () => {
		clearShellEnv();
		const r = checkCommand('C:\\Users\\test\\file.txt');
		expect(r.permission).toBe('ask');
	});

	test('echo hello → allow', () => {
		clearShellEnv();
		expect(checkCommand('echo hello')).toEqual({ permission: 'allow' });
	});

	test('npm install → allow', () => {
		clearShellEnv();
		expect(checkCommand('npm install express')).toEqual({ permission: 'allow' });
	});
});

// ===========================================================================
// user_message formatting
// ===========================================================================

describe('user_message formatting', () => {
	test('single reason: shows the reason text', () => {
		setWindowsEnv();
		const r = checkCommand('ls /tmp/output.log');
		if ('user_message' in r) {
			expect(r.user_message).toBe('Blocked: Uses Unix absolute paths (`/tmp`, `/etc`, ...).');
		}
	});

	test('multiple reasons: shows count', () => {
		setWindowsEnv();
		const r = checkCommand('sudo apt update');
		if ('user_message' in r) {
			expect(r.user_message).toBe('Blocked: 2 issues detected');
		}
	});

	test('soft single reason: shows Suspicious prefix', () => {
		setWindowsEnv();
		const r = checkCommand('cat README.md');
		if ('user_message' in r) {
			expect(r.user_message).toMatch(/^Suspicious:/);
		}
	});
});

// ===========================================================================
// agent_message content
// ===========================================================================

describe('agent_message content', () => {
	test('hard deny includes rewrite hints for PowerShell', () => {
		setWindowsEnv();
		const r = checkCommand('sudo apt update');
		if ('agent_message' in r) {
			expect(r.agent_message).toContain('rm -> Remove-Item');
			expect(r.agent_message).toContain('Do NOT reuse bash syntax');
		}
	});

	test('hard deny on Linux includes Unix rewrite hints', () => {
		setLinuxEnv();
		const r = checkCommand('bash -c "powershell -NoProfile -Command 1"');
		expect(r.permission).toBe('deny');
		expect(r).toHaveProperty('agent_message');
		if ('agent_message' in r) {
			expect(r.agent_message).toContain('Remove-Item -> rm');
			expect(r.agent_message).toContain('Do NOT reuse Windows/PowerShell-specific syntax');
		}
	});

	test('unknown shell soft shows ambiguous context', () => {
		clearShellEnv();
		const r = checkCommand('powershell -Command "ls"');
		if ('agent_message' in r) {
			expect(r.agent_message).toContain('Ambiguous shell context');
			expect(r.agent_message).toContain('Confidence: low');
		}
	});

	test('intent is included when applicable', () => {
		setWindowsEnv();
		const r = checkCommand('cat README.md');
		if ('agent_message' in r) {
			expect(r.agent_message).toContain('Inferred intent: read file');
		}
	});

	test('no intent line for unknown commands', () => {
		setWindowsEnv();
		const r = checkCommand('export NODE_ENV=production');
		if ('agent_message' in r) {
			expect(r.agent_message).not.toContain('Inferred intent:');
		}
	});
});
