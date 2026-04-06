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

export interface Stuff {
	name: string;
	description: string;
	/** Full URL, e.g. https://o3d.xallt.dev or https://xallt.dev/noise-texture-generator */
	href: string;
	/** Vite glob key: `/src/assets/...` (jpeg, jpg, png, or gif), or null */
	image: string | null;
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

/** Listed services from site deploy config (`listed: true`), links on xallt.dev */
export const stuff: Stuff[] = [
	{
		name: "3D Typer",
		description: "Just type, and characters come out",
		href: "https://o3d.xallt.dev",
		image: null,
	},
	{
		name: "3D Books",
		description: "Interactive 3D books, with actual contents + VR",
		href: "https://lib3d.xallt.dev",
		image: null,
	},
	{
		name: "Noise Texture Generator",
		description: "In-browser procedural noise textures.",
		href: "https://xallt.dev/noise-texture-generator",
		image: "/src/assets/img/stuff-preview/NoiseGeneration.png",
	},
	{
		name: "Tic80 Carts",
		description: "TIC-80 cartridges and a small player UI.",
		href: "https://xallt.dev/tic80-carts",
		image: "/src/assets/gif/tic-carts/solar_system.gif",
	},
	{
		name: "Wikinator",
		description: "Wiki-oriented Flask app and experiments.",
		href: "https://wikinator.xallt.dev",
		image: "/src/assets/img/stuff-preview/Wikinator.png",
	},
	{
		name: "Love2D things",
		description: "LÖVE2D games and prototypes.",
		href: "https://xallt.dev/love2d",
		image: null,
	},
	{
		name: "Predicate Generator",
		description: "Prediction workflows with a FastAPI backend and web UI.",
		href: "https://predgen.xallt.dev",
		image: null,
	},
	{
		name: "My reviews",
		description: "Short personal reviews and notes.",
		href: "https://xallt.dev/reviews",
		image: null,
	},
	{
		name: "Shadertoy",
		description: "Shadertoy experiments, just some fun",
		href: "https://www.shadertoy.com/user/KavabONga",
		image: null,
	}
];
