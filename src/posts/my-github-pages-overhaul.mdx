---
title: Fixing my website after a recent Github Pages overhaul
pubDate: 2023-10-26

tags: [website]
categories: [Programming, Bugfix]
---

So recently I started being a bit more active with personal projects &mdash; I did a paid project on the side, I decided to make a C++ hand tracking app on top of Mediapipe for fun, I started upgrading my Obsidian scripts again, I became just a bit more active with my posts on Telegram.

So I decided to check out my Github Pages website that I made like 1.5 years ago, and then completely forgot about. \
TLDR: it wasn't up, even though I didn't change **anything** in those 1.5 years.

Well, turns out about a year ago Github [updated their default guidelines](https://github.com/orgs/community/discussions/29250#discussioncomment-3384692) for releasing Github Pages websites. It shouldn't have broken anything, but I guess some vulnerabilities & other issues accumulated in my build workflow, and the workflow re-ran at some point and broke.


Github has good tutorials for pretty much everything, even for setting up [your own Github Pages workflow](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages). \
However, the GitHub actions used in these examle tutorials, in particular `actions/upload-pages-artifact` and `actions/deploy-pages` were barely explained in the article, neither can you make sense of them while looking at their respective repositories \
They provide all their examples assuming you build with Jekyll, which wasn't the case for me &mdash; my website is built with Eleventy, and I didn't find any tutorials on how to combine Eleventy with the new Github Pages. So I had to **actually understand** how these `actions/upload-pages-artifact` and `actions/deploy-pages` worked.

So, I'll quickly break down the key concepts that were hard for me to pick up while figuring out the new workflows:

- The `actions/deploy-pages` that needs to be run at the end of your publishing workflow operates with some kind of artifact called `github-pages`. 
- You **do not** need to know how this artifact system works &mdash; you only need to know that any artifact is produced via the special `actions/upload-artifact` action. 
- `actions/upload-pages-artifact` makes a call to `actions/upload-artifact` inside
- `actions/upload-pages-artifact` takes in a parameter called `path` which should have your built static website in it. For me it was "docs/", so the root of my website was in "docs/index.html". This action converts your built static website into just the `github-pages` artifact that `actions/deploy-pages` needs.

With this in mind, it should be clear that the sequence of steps `upload-pages-artifact` -> `deploy-pages` just publishes your website built at `path` to Github Pages.

Hope this clears things up!