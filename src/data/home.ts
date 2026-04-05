export interface NavItem {
	label: string;
	href: string;
}

export interface HeroData {
	name: string;
	handle: string;
	title: string;
	bio: string;
	dotCount: number;
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
	handle: "neko",
	title: "Computer Vision Engineer",
	bio: "Enthusiastic about 3D Reconstruction, Computer Graphics, Math generally",
	dotCount: 5,
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
