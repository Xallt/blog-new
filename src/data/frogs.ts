export interface Frog {
	/** Filename in /src/assets/img/frogs/ */
	file: string;
	name: string;
	/** Optional origin/provenance, shown as muted subcaption. */
	origin?: string;
}

export const familyImage = "family-17-05-2026.jpg";

export const frogs: Frog[] = [
	{ file: "big-plush.jpg", name: "Comfy plush", origin: "Gift from my wife" },
	{ file: "small-knit-cute.jpg", name: "Small cute knit frog" },
	{ file: "masha-gift-masterpiece.jpg", name: "Masterpiece cup", origin: "Absolutely beautiful cup handmade by my wife" },
	{ file: "i-made-this-ceramic.jpg", name: "Ceramic frog, by me", origin: "Handmade by me. First try. I'm impressed myself" },
	{ file: "glass-jerusalem-pricey-as-fuck.jpg", name: "Glass frog", origin: "Jerusalem — I was scammed for a crazy price for this one" },
	{ file: "almaty-street-market.jpg", name: "Cute toy frog", origin: "From a handmade market in Almaty, Kazakhstan, in 2024" },
	{ file: "london-christmas.jpg", name: "Christmas frog", origin: "From our 2025 London trip" },
	{ file: "magnet-barcelona-aquarium.jpg", name: "Magnet tiny frog", origin: "From L’Aquàrium de Barcelona, 2025" },
	{ file: "tbilisi-toy.jpg", name: "Cute small toy frog", origin: "From Tbilisi, Georgia" },
	{ file: "wood-cut-northern-london.jpg", name: "Wood frog", origin: "From a handmade store in Northern London, 2025" },
	{ file: "tea-brewer-temu.jpg", name: "Tea brewer (didn't work well)", origin: "Temu" },
	{ file: "small-anton-gift.jpg", name: "Tiny knit frog with a sweater", origin: "Gift from Antosha" },
	{ file: "earrings-goblins.jpg", name: "Gobliny earrings", origin: "From Aliexpress. I expected them to look more like frogs, but this will do" },
	{ file: "magic-sticker.jpg", name: "Magic frog sticker" },
	{ file: "muscle-pin.jpg", name: "Musclular pin" },
	{ file: "salt-pepper-shakers.jpg", name: "Salt & pepper shakers", origin: "Gift from parents" },
	{ file: "rubber-unknown.jpg", name: "Rubber frog" },
	{ file: "tiny-rubber-unknown.jpg", name: "Tiny rubber frog" },
	{ file: "small-ceramic-unknown.jpg", name: "Small ceramic frog" },
	{ file: "small-coin.jpg", name: "Frog on tiny coin" },
	{ file: "small-water-grown.jpg", name: "Water-grown frog", origin: "Gift from my wife. Came in one of those sets where it's an egg you put in water, and something pops out of it" },
	{ file: "tadpole-unknown.jpg", name: "Tiny knit tadpole" },
];
