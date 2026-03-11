import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), 'VITE_');

	const testServerPort = env.VITE_TESTSERVER_PORT;
	if (!testServerPort) {
		throw new Error('VITE_TESTSERVER_PORT is not defined in .env');
	}

	return {
		plugins: [
			react(),
			tailwindcss(),
			viteStaticCopy({
				targets: [
					{
						src: 'public/manifest.json',
						dest: '.',
					},
					{
						src: 'public/icons/*',
						dest: 'icons',
					},
				],
			}),
		],
		resolve: {
			alias: {
				'@': path.resolve(__dirname, './src'),
			},
			dedupe: ['react', 'react-dom'],
		},
		server: {
			proxy: {
				'/api': {
					target: `http://localhost:${testServerPort}`,
					changeOrigin: true,
				},
			},
		},
		build: {
			outDir: 'build',
			rollupOptions: {
				input: {
					main: './index.html',
					background: './src/background.ts',
				},
				output: {
					entryFileNames: (chunkInfo) => {
						if (chunkInfo.name === 'background') return 'background.js';
						return 'assets/[name]-[hash].js';
					},
				},
			},
		},
	};
});
