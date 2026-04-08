import type { CollectionEntry } from "astro:content";
import { getCollection } from "astro:content";

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

export async function getAllPosts(): Promise<CollectionEntry<"posts" | "postsMdx">[]> {
	const allPosts = await getCollection("posts");
	const allPostsMdx = await getCollection("postsMdx");
	return [...allPosts, ...allPostsMdx];
}

export function parsePost(post: CollectionEntry<"posts" | "postsMdx">): Post {
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
	listed: boolean;
}

export function getUrl(path: string): string {
	const baseUrl = import.meta.env.BASE_URL;
	if (baseUrl.endsWith("/")) {
		return `${baseUrl}${path}`;
	}
	return `${baseUrl}/${path}`;
}

export function tagPageUrl(tag: string): string {
	return getUrl(`tags/${encodeURIComponent(tag)}`);
}

export const navItems: NavItem[] = [
	{ label: "Home", href: getUrl("") },
	{ label: "Posts", href: getUrl("posts") },
	{ label: "Stuff", href: getUrl("stuff") },
	{ label: "About", href: getUrl("about") },
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
const _allStuff: Stuff[] = [
	{
		name: "Tic80 Carts",
		description: "Games made in TIC-80, a fantasy computer",
		href: "https://xallt.dev/tic80-carts",
		image: "/src/assets/gif/tic-carts/solar_system.gif",
		listed: true,
	},
	{
		name: "My reviews",
		description: "My opinions on various things",
		href: "https://xallt.dev/reviews",
		image: "/src/assets/img/stuff-preview/reviews-screenshot.jpg",
		listed: true,
	},
	{
		name: "Noise Texture Generator",
		description: "Procedural noise textures.",
		href: "https://xallt.dev/noise-texture-generator",
		image: "/src/assets/img/stuff-preview/NoiseGeneration.png",
		listed: true,
	},
	{
		name: "3D Typer",
		description: "3D text powered by 2D polygon triangulation in Rust",
		href: "https://o3d.xallt.dev",
		image: "/src/assets/img/stuff-preview/o3d-screenshot.jpg",
		listed: true,
	},
	{
		name: "3D Books",
		description: "Actual books, made interactive in 3D with Three.js",
		href: "https://lib3d.xallt.dev",
		image: "/src/assets/img/stuff-preview/lib3d-screenshot.jpg",
		listed: true,
	},
	{
		name: "Wikinator",
		description: "Wiki-oriented Flask app and experiments.",
		href: "https://wikinator.xallt.dev",
		image: "/src/assets/img/stuff-preview/Wikinator.png",
		listed: false,
	},
	{
		name: "Love2D things",
		description: "LÖVE2D games and prototypes.",
		href: "https://xallt.dev/love2d",
		image: "/src/assets/gif/stuff-preview/pascal-fractal.gif",
		listed: true,
	},
	{
		name: "Predicate Generator",
		description: "Generating mathematical statements infinitely",
		href: "https://predgen.xallt.dev",
		image: "/src/assets/img/stuff-preview/PredGen.png",
		listed: true,
	},
	{
		name: "Shadertoy",
		description: "Just some fun shaders",
		href: "https://www.shadertoy.com/user/KavabONga",
		image: "/src/assets/gif/stuff-preview/shadertoy.gif",
		listed: true,
	}
];

export const stuff: Stuff[] = _allStuff.filter((s) => s.listed);