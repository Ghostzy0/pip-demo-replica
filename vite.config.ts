import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import electron from "vite-plugin-electron/simple";
import { resolveDemoBuildProfileFromEnv } from "./scripts/demo-build-profiles.mjs";
import { includeNativePlugin, reloadExistingShell } from "./scripts/dev-electron-policy";

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
	const profile = resolveDemoBuildProfileFromEnv({
		...loadEnv(mode, __dirname, "VITE_"),
		...process.env,
	});
	const profileDefine = { __DEMO_PROFILE__: JSON.stringify(profile) };
	return {
		// Vite's dependency cache defaults to `node_modules/.vite`, and in this repo every
		// worktree's `node_modules` is a JUNCTION to the main checkout's — so the main repo
		// and every worktree share ONE cache directory. Running two dev servers at once
		// (routine here) then has them re-optimising into each other's cache: the second run
		// rewrites `deps/` while the first has already handed the browser URLs stamped with
		// the previous `?v=` token, so the renderer ends up holding two generations of the
		// same dependency at once — "Invalid hook call / more than one copy of React",
		// `useState` null, blank editor. Same symptom as the `dedupe` note below, different
		// cause: that one is about resolution, this one about a cache with several writers.
		// Keeping the cache beside the checkout that owns it (NOT under `node_modules`, which
		// is the junction) makes concurrent servers independent.
		cacheDir: path.resolve(__dirname, ".vite-cache"),
		define: profileDefine,
		plugins: [
			react(),
			...(includeNativePlugin(command, process.env)
				? [
						electron({
							main: {
								entry: "electron/main.ts",
								onstart({ startup }) {
									if (process.env.NO_ELECTRON) {
										console.log("NO_ELECTRON is set, skipping Electron startup.");
										return;
									}
									const env = { ...process.env };
									delete env.ELECTRON_RUN_AS_NODE;
									return startup(["."], { env });
								},
								vite: {
									define: profileDefine,
									build: {},
									// The main process runs code from `src/lib` too (the agent's tools, the MCP
									// server): it resolves `@/` as the renderer does, or every such import fails
									// the build.
									resolve: {
										alias: {
											"@": path.resolve(__dirname, "src"),
										},
									},
								},
							},
							preload: {
								input: path.join(__dirname, "electron/preload.ts"),
								onstart({ reload }) {
									const child = (
										process as NodeJS.Process & {
											electronApp?: { pid?: number; exitCode?: number | null };
										}
									).electronApp;
									if (child?.exitCode == null && reloadExistingShell(child?.pid, process.env))
										reload();
								},
							},
							renderer: process.env.NODE_ENV === "test" ? undefined : {},
						}),
					]
				: []),
		],
		resolve: {
			alias: {
				"@": path.resolve(__dirname, "src"),
			},
			// This checkout is a git worktree nested under the main repo, and its
			// node_modules is incomplete (e.g. zustand is absent), so bare deps that
			// aren't present here resolve UP into the main repo's node_modules and drag
			// in a SECOND copy of React — "Invalid hook call / more than one copy of
			// React" → blank editor. Force every importer (app + hoisted deps like
			// zustand) onto this checkout's single React copy. Harmless in a normal
			// full install (already a single copy there); required to run from a worktree.
			dedupe: ["react", "react-dom", "react/jsx-runtime"],
		},
		server: {
			watch: {
				// Nested worktrees (`.claude/worktrees/**`) and delegate task checkouts
				// (`.cc-delegate/**`) each carry their own full copy of the repo, including
				// their own vite/tsconfig files. Without this, deleting/touching one (e.g.
				// `git worktree remove`) fires hundreds of change events across the main
				// dev server, forcing repeated full-reloads unrelated to any real source
				// change — observed as the running app going unresponsive/stale mid-session.
				//
				// `crates/thirdparty/**` is the vendored ffmpeg tree the Rust compositor
				// builds against (see crates/.cargo/config.toml). It is gitignored but still
				// watched: several thousand files, including a doc/ directory full of HTML,
				// whose extraction fires the same reload storm.
				ignored: ["**/.claude/worktrees/**", "**/.cc-delegate/**", "**/crates/thirdparty/**"],
			},
		},
		build: {
			target: "esnext",
			minify: "terser",
			terserOptions: {
				compress: {
					drop_console: true,
					drop_debugger: true,
					pure_funcs: ["console.log", "console.debug"],
				},
			},
			rollupOptions: {
				output: {
					manualChunks(id) {
						if (id.includes("react-dom") || id.includes("/react/")) return "react-vendor";
						if (
							id.includes("mediabunny") ||
							id.includes("mp4box") ||
							id.includes("fix-webm-duration")
						)
							return "video-processing";
					},
				},
			},
			chunkSizeWarningLimit: 1000,
		},
	};
});
