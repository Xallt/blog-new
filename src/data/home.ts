export interface NavItem {
	label: string;
	href: string;
}

/** Icons: https://fontawesome.com/ (Font Awesome loaded in BaseLayout) */
export type SocialLinkType =
	| "github"
	| "twitter"
	| "linkedin"
	| "telegram"
	| "rss"
	| "email"
	| "mastodon";

export interface SocialLink {
	type: SocialLinkType;
	icon: string;
	/** Used when the type does not build a URL from username/email */
	url?: string;
	/** For `github` / `twitter` when `url` is omitted */
	username?: string;
	/** For `email` */
	email?: string;
	/** If true, open in same tab (no `target="_blank"`) */
	noblank?: boolean;
}

export function resolveSocialHref(link: SocialLink): string | null {
	switch (link.type) {
		case "github":
			return link.username ? `https://github.com/${link.username}` : link.url ?? null;
		case "twitter":
			return link.username ? `https://twitter.com/${link.username}` : link.url ?? null;
		case "email":
			return link.email ? `mailto:${link.email}` : link.url ?? null;
		case "rss":
			return link.url ?? "/feed.xml";
		default:
			return link.url ?? null;
	}
}

export function socialLinkRel(link: SocialLink): string | undefined {
	const parts: string[] = [];
	if (!link.noblank) {
		parts.push("noopener", "noreferrer");
	}
	if (link.type === "mastodon") {
		parts.push("me");
	}
	return parts.length ? parts.join(" ") : undefined;
}

export interface HeroData {
	name: string;
	title: string;
	bio: string;
	socialLinks: SocialLink[];
	neko: boolean
}

export interface Post {
	title: string;
	tags: string[];
	category: string;
	/** Display as DD.MM.YYYY */
	date: string;
}

export type CardMedia =
	| { kind: "squiggle" }
	| { kind: "text"; text: string }
	| { kind: "avatar" };

export interface Card {
	media: CardMedia;
	title: string;
	excerpt: string;
}

export const navItems: NavItem[] = [
	{ label: "Home", href: "/" },
	{ label: "Posts", href: "/posts" },
	{ label: "Stuff", href: "/stuff" },
	{ label: "About", href: "/about" },
];

export const hero: HeroData = {
	name: "Dmitry Shabat",
	neko: true,
	title: "Computer Vision Engineer",
	bio: "Enthusiastic about 3D Reconstruction, Computer Graphics, Math generally",
	socialLinks: [
		{ type: "github", icon: "fab fa-github", username: "Xallt" },
		{ type: "twitter", icon: "fa-brands fa-twitter", username: "Xallt" },
		{
			type: "linkedin",
			icon: "fab fa-linkedin",
			url: "https://www.linkedin.com/in/shabat-dmitry/",
		},
		{ type: "telegram", icon: "fa-brands fa-telegram", url: "https://t.me/Xallt" },
		{ type: "rss", icon: "fas fa-rss", noblank: true },
	],
};

export const posts: Post[] = [
	{
		title: "Post 1 — about fycking lalala lululu",
		tags: ["math", "stuff", "idk"],
		category: "Stuff1",
		date: "25.02.2026",
	},
	{
		title: "Post 2 — about something else idk",
		tags: [],
		category: "Stuff2",
		date: "13.03.2027",
	},
	{
		title: "Post 3 — and this one completely different",
		tags: [],
		category: "Stuff3",
		date: "01.01.1970",
	},
];

export const cards: Card[] = [
	{
		media: { kind: "squiggle" },
		title: "Fun thing",
		excerpt: "So what I did here is that I had a little experiment and it turned out interesting.",
	},
	{
		media: { kind: "text", text: "Tralala Prapapapa" },
		title: "Fun thing",
		excerpt: "Some funsies",
	},
	{
		media: { kind: "avatar" },
		title: "Literally me",
		excerpt: "Some funsies",
	},
	{
		media: { kind: "text", text: "Tralala Prapapapa" },
		title: "Fun thing",
		excerpt: "some funsies",
	},
];
