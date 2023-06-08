import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';
import { searchForWorkspaceRoot } from 'vite';

export default defineConfig({
	plugins: [
		sveltekit(),
		tsconfigPaths({
			root: '../../'
		})
	],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}']
	},
	server: {
		fs: {
			allow: [searchForWorkspaceRoot(process.cwd()), 'shared/trpc']
		}
	}
	// ssr: {
	// 	noExternal: ['pg']
	// }
});
