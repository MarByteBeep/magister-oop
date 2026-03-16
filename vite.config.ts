import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import { apiPlugin } from './vite-plugin-api';

export default defineConfig(() => {
	return {
		plugins: [
			react(),
			tailwindcss(),
			apiPlugin(),
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
					{
						src: 'public/_locales/**',
						dest: '_locales',
					},
				],
			}),
		],
		resolve: {
			alias: {
				'@': path.resolve(__dirname, './src'),
				'@data': path.resolve(__dirname, 'testserver/data'),
			},
			dedupe: ['react', 'react-dom'],
		},
		server: {},
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
