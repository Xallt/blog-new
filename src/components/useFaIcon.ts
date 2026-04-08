import circleExclamation from "@fortawesome/fontawesome-free/svgs/solid/circle-exclamation.svg?url";
import triangleExclamation from "@fortawesome/fontawesome-free/svgs/solid/triangle-exclamation.svg?url";
import lightbulb from "@fortawesome/fontawesome-free/svgs/regular/lightbulb.svg?url";

/** Chirpy-style paths → bundled SVG URLs for CSS `mask-image`. */
const FA_ICON_URLS: Record<string, string> = {
	"regular/lightbulb": lightbulb,
	"solid/circle-exclamation": circleExclamation,
	"solid/triangle-exclamation": triangleExclamation,
};

export function useFaIcon(iconPath: string): string {
	const url = FA_ICON_URLS[iconPath];
	if (url === undefined) {
		console.warn(
			`useFaIcon: unknown icon "${iconPath}", using circle-exclamation`,
		);
		return circleExclamation;
	}
	return url;
}
