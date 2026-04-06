---
title: How I made this color palette
pubDate: 2023-10-27

tags: [website]
categories: [Programming, How-to]
---

UPD: I already updated my website, so it doesn't use this black-gold palette anymore, but here's the screenshot:

![The look of the old website with the black-gold palette](../assets/img/color-palette/old-blackgold-palette.png){: w="500" }
_It was based on the [Eleventy-Duo](https://github.com/yinkakun/eleventy-duo) theme_

So I wanted to redesign my personal website, because previously it looked exactly like the default [Eleventy-Duo](https://github.com/yinkakun/eleventy-duo) look.

I'm no front-end engineer / designer whatsoever, and I know nothing about color theory. But I do have some ideas that simplify the process.

- Try to have a CSS file with like 5-7 color variables that will define your palette (background color, link color, text color, etc.), and use these CSS variables to set all the colors on your website. You can see an example of this in [Eleventy-Duo's CSS files](https://github.com/yinkakun/eleventy-duo/blob/master/src/css/variable.css)
- You can just go to [vscodethemes.com](https://vscodethemes.com/) and search for color palletes you like there
- I used Chrome's extension [ColorPick Eyedropper](https://chrome.google.com/webstore/detail/colorpick-eyedropper/ohcpnigalekghcmgcdcenkpelffpdolg/related) to get the colors from the theme that I liked (for me it was [Blackgold](https://vscodethemes.com/e/saigowthamr.black-gold/blackgold))
- Maybe you remember any websites/personal blogs with color palettes you like. You can use the color picker to get the colors from there too ([Inigo Quilez's blog](https://iquilezles.org/) was an inspiration)

In the end, I have a `variable.css` file that looks like this:

```css
:root {
  --link-color: #FFD700;
  --link-accent: color-mod(var(--link-color) a(90%));
  
  --background: #1A1818; 
  --color: #F8F6F6;       
  --color-subtle: #D6E3F2;
  --hard-highlight: #FF628C;
  
  --code-text: #FFC107;
  --code-bg: color-mod(var(--code-text) a(15%));
  --main-width: 50rem;
}

```