---
title: Slashed zeros
pubDate: 2021-12-25

tags: [website]
categories: [Programming, Bugfix]
---

So when I was starting off creating this website of my own, I encountered a minor problem &mdash; my zeros were slashed

Here's a comparison of before and after:

Markdown table

| With slashed zeros | Without slashed zeros |
|:---:|:---:|
| ![](/assets/img/slashed-zeros/with-slashed-zeros.png) | ![](/assets/img/slashed-zeros/without-slashed-zeros.png) |

----

As I found out, the issue was with the template I was using &mdash; [Eleventy-Duo](https://github.com/yinkakun/eleventy-duo)\
Digging into everything related to fonts, I found this CSS setting in the template:

```css
body {
  font-size: var(--text-lg);
  line-height: 1.54;
  color: var(--color);
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  font-feature-settings: 'liga', 'tnum', 'case', 'calt', 'zero', 'ss01', 'locl';
  font-variant-ligatures: contextual;
  -webkit-overflow-scrolling: touch;
  -webkit-text-size-adjust: 100%;
  font-family: -apple-system,BlinkMacSystemFont,segoe ui,Roboto,Oxygen,Ubuntu,Cantarell,open sans,helvetica neue,sans-serif;
}
```
Pay attention to this:
```css
font-feature-settings: 'liga', 'tnum', 'case', 'calt', 'zero', 'ss01', 'locl';
```

As I found out, `font-feature-settings` is a CSS property for tweaking advanced typographic features

- Link to the resource: [https://developer.mozilla.org/en-US/docs/Web/CSS/font-feature-settings](https://developer.mozilla.org/en-US/docs/Web/CSS/font-feature-settings)

And `zero` is apparently such a feature, made specifically for differentiating between 0 and O (zero and big 'o')\
So if you encountered the same issue &mdash; unwanted slashed zeros, search for **'zero'** in your CSS files