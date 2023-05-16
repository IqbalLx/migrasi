import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import ViteTsConfigPathsPlugin from 'vite-tsconfig-paths';


export default defineConfig({
	plugins: [
		sveltekit(), 
		ViteTsConfigPathsPlugin({
			root: '../../',
		})
	],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}']
	}
});
