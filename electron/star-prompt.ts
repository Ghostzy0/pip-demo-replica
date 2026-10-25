// Stars are the only distribution signal this project has, and most people who use it arrive
// from a search result and never see the repo. The one moment asking is not an interruption is
// straight after an export the user wanted, which is why the ask lives there and nowhere else.
//
// Everything in this file exists to make that ask happen AT MOST ONCE. Nothing here gates a
// feature, and nothing here is reported anywhere: the counters below never leave the machine.

/** The export that earns the ask: the first one. A finished export is the moment the app has
 *  just delivered what the user came for, and waiting for a second would simply never ask the
 *  people who only ever export once — which is most of them. */
export const STAR_PROMPT_AT_EXPORT = 1;

export interface StarPromptState {
	/** Successful exports on this installation, including the one that just finished. */
	successfulExports: number;
	/** Set as soon as the user answers — "No thanks" is an answer, and it is permanent. */
	dismissed: boolean;
	/** A take is running. The prompt must never compete with the encoder, and the editor is not
	 *  the window in front of the user during a recording. */
	recording: boolean;
	/** `--export` and the rest of the CLI: there is no window, so there is nobody to ask. The
	 *  CLI runner drives the native exporter directly rather than through ExportDialog, so this
	 *  is a second lock on a door that is already shut — and the one that keeps holding if a
	 *  later refactor routes the CLI through the dialog. */
	headless: boolean;
}

/** Pure, so the whole matrix pins from a Linux-only CI with no export, no window and no
 *  settings file — the same reason `offersUpdateCheck` and `blockedFromInstalling` are pure.
 *
 *  `===`, not `>=`: the ask fires on exactly one export. A user who closes the dialog without
 *  answering is never asked again, which is the point — re-asking is the failure mode this is
 *  built to avoid, not a fallback to reach for when the first ask goes unanswered. */
export function offersStarPrompt(state: StarPromptState): boolean {
	if (state.dismissed || state.recording || state.headless) return false;
	return state.successfulExports === STAR_PROMPT_AT_EXPORT;
}

/** The repo root — the only page any of this points at. Never Releases and never an asset: on
 *  a Store copy that is the second, parallel install `install-channel.ts` exists to prevent, and
 *  on every other channel it is simply not what the ask is about. Lives here so main, the app
 *  menu and the export prompt cannot drift to three different links. */
import { DEMO_PROFILE } from "./demo-policy";

export const REPO_URL = DEMO_PROFILE.repositoryPageUrl;

// No Store product or review URL exists for this distribution.
