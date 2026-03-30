import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import { apiPlugin } from './vite-plugin-api';

function manifestVersionFromPackage(): Plugin {
	return {
		name: 'manifest-version-from-package',
		apply: 'build',
		closeBundle() {
			const manifestPath = path.resolve(__dirname, 'public/manifest.json');
			const pkgPath = path.resolve(__dirname, 'package.json');
			const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as {
				version: string;
			};
			const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as { version: string };
			manifest.version = pkg.version;
			const json = `${JSON.stringify(manifest, null, '\t')}\n`;
			writeFileSync(manifestPath, json, 'utf8');
			writeFileSync(path.resolve(__dirname, 'build/manifest.json'), json, 'utf8');
		},
	};
}

export default defineConfig(() => {
	return {
		plugins: [
			react(),
			tailwindcss(),
			apiPlugin(),
			manifestVersionFromPackage(),
			viteStaticCopy({
				targets: [
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
