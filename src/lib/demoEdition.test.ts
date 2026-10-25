import { describe, expect, it } from "vitest";
import { applyDemoEdition } from "./demoEdition";

describe("Demo edition visual gate", () => {
	it("enables the Pip palette only for the Pip build", () => {
		const root = { dataset: {} as DOMStringMap };
		applyDemoEdition(root, "pip");
		expect(root.dataset.edition).toBe("pip");

		applyDemoEdition(root, "baseline");
		expect(root.dataset.edition).toBe("baseline");
	});

	it("fails closed to the neutral baseline for missing or unknown editions", () => {
		const root = { dataset: {} as DOMStringMap };
		applyDemoEdition(root, undefined);
		expect(root.dataset.edition).toBe("baseline");

		applyDemoEdition(root, "unexpected");
		expect(root.dataset.edition).toBe("baseline");
	});
});
