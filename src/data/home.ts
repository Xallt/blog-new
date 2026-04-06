import type { CollectionEntry } from "astro:content";

export interface NavItem {
	label: string;
	href: string;
}

/** Icons: https://fontawesome.com/ (Font Awesome loaded in BaseLayout) */
export interface SocialLink {
	icon: string;
	url: string;
	/** If true, open in same tab (no `target="_blank"`) */
	noblank?: boolean;
}

export function socialLinkRel(link: SocialLink): string | undefined {
	if (link.noblank) return undefined;
	return "noopener noreferrer";
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
	/** Display as DD.MM.YYYY */
	date: string;
	slug: string;
}

function formatDisplayDate(d: Date): string {
	const dd = String(d.getUTCDate()).padStart(2, "0");
	const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
	const yyyy = d.getUTCFullYear();
	return `${dd}.${mm}.${yyyy}`;
}

export function parsePost(post: CollectionEntry<"posts">): Post {
	return {
		title: post.data.title,
		tags: post.data.tags,
		date: formatDisplayDate(post.data.pubDate),
		slug: post.id,
	};
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
		{ icon: "fab fa-github", url: "https://github.com/Xallt" },
		{ icon: "fa-brands fa-twitter", url: "https://twitter.com/Xallt" },
		{ icon: "fab fa-linkedin", url: "https://www.linkedin.com/in/shabat-dmitry/" },
		{ icon: "fa-brands fa-telegram", url: "https://t.me/Xallt" },
		{ icon: "fas fa-envelope", url: "mailto:mitya.shabat@gmail.com", noblank: true },
	],
};

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
