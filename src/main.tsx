import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import { I18nProvider } from "./contexts/I18nContext";
import { applyDemoEdition } from "./lib/demoEdition";
import { applyDemoProduct } from "./lib/demoProduct";
import { DEMO_PROFILE } from "./lib/demoProfile";
import { clearStaleSourceCache } from "./lib/exporter/localSourceFile";
import "./hooks/rendererConsoleForwarder";
import "./index.css";

// Set before React mounts so the edition palette is correct on the first frame.
applyDemoEdition(document.documentElement, DEMO_PROFILE.appearance);
applyDemoProduct(document.documentElement, DEMO_PROFILE.product);

// Keep already-open Pip secondary windows in step with the editor's shared
// preference. index.html handles each renderer's first paint; this handles
// later changes from another renderer without affecting Replica or Neutral.
if (DEMO_PROFILE.appearance === "pip") {
	window.addEventListener("storage", (event) => {
		if (event.key !== "openscreen-theme" && event.key !== null) return;
		try {
			if (event.storageArea !== window.localStorage) return;
		} catch {
			return;
		}

		const isDark = event.newValue === "dark";
		if (isDark) {
			document.documentElement.setAttribute("data-theme", "dark");
		} else {
			document.documentElement.removeAttribute("data-theme");
		}
		document.documentElement.classList.toggle("dark", isDark);
	});
}

const windowType = new URLSearchParams(window.location.search).get("windowType") || "";

// Reclaim multi-GB OPFS source copies left behind by a previous session (they
// are only pruned opportunistically during the next large-file load otherwise).
// Nothing is referenced at startup, so everything stale is safe to remove.
if (!windowType) {
	window.setTimeout(() => {
		clearStaleSourceCache().catch(() => undefined);
	}, 5_000);
}
const showNotes = new URLSearchParams(window.location.search).get("showNotes") === "true";
document.title = showNotes ? `${DEMO_PROFILE.productName} - Notes` : DEMO_PROFILE.productName;
if (
	showNotes ||
	windowType === "hud-overlay" ||
	windowType === "source-selector" ||
	windowType === "countdown-overlay"
) {
	document.body.style.background = "transparent";
	document.documentElement.style.background = "transparent";
	document.getElementById("root")?.style.setProperty("background", "transparent");
}

ReactDOM.createRoot(document.getElementById("root")!).render(
	<React.StrictMode>
		<I18nProvider>
			<App />
		</I18nProvider>
	</React.StrictMode>,
);
