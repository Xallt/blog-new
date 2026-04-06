---
title: How I prepare for my lectures
pubDate: 2024-04-12
tags:
  - presentation
  - lectures
  - obsidian
categories:
  - Miscellaneous
  - Lecturing
img_path: /assets/img/how-i-prepare-for-lectures
---
Recently I did my 8th lecture, which was named "Diffusion for 3D" and was basically an intro to text-to-3D and 3D-editing approaches, which lately mostly consist of smart NeRF+diffusion model combinations. I record and publish all of them online by the way, [here's the playlist](https://www.youtube.com/playlist?list=PLV30o7re7MVb5Rep09niHU4JILXRgxfei).

![](Pasted%20image%2020240412150729.png)
_One of my random lucky thumbnails_

And on this last one I felt like I had an already established pipeline for preparing my lectures, so I'm gonna share it.
### Research notes
All my notes on papers & tools are in my Obsidian — this way it’s convenient to search over them with *Ctrl+Shift+F* and jump over relevant links. I even wrote a [separate post](/posts/obsidian-useful-scripts/) about my setup, with all my scripts and ideas.

Here’s how my Vault of notes currently looks

![](Pasted%20image%2020240412151128.png){: w="500"}
_niiiice_
### Lecture Planning
After I’ve researched the topic enough, I make a plain bullet list of the overall structure of the lecture and main talking points, which will then drive the structure of the presentation slides.

> For example, for my latest lecture, I just had this separate note in my Obsidian with this exact content: [https://pastebin.com/gNvsYFvZ](https://pastebin.com/gNvsYFvZ).
{:.prompt-info}

### Slides
For the presentation itself, I use [Google Slides](https://docs.google.com/presentation/create). I decided not to have any kind of designed template for the presentations — I had a header with my name & lecture topic on each slide in my earlier lectures, but eventually decided it’s just clutter.

I tried [slides.com](https://slides.com/) and it’s pretty nice, but the free version is limited. If it was fully free, maybe I’d switch to that — it has a nice color palette for coloring text, auto-animations between slides, built-in LaTeX renderer, and some other nice thingies.

> Here’s a [slides.com](https://slides.com/) presentation for my “Meta Quest 2 Hand Tracking” lecture, I’m really proud of how nice and smooth it is
> https://slides.com/xallt/megatrack
{:.prompt-info}

### Crafting the presentation
I have a few preferences when making the presentation:
- Each slide SHOULD have an image that helps the audience connect to the context of the slide. I usually talk about Computer Vision where finding relevant visualizations is easy, but I had a lecture on 3D Data Compression, and when I was talking about classical Compression, I had to work on that a little more.

![](Pasted%20image%2020240412152024.png){: w="500"}
_Even dumb slides like this deserve to have a random funny stock image inserted_

- The first slide has the name of the lecture, and a collage of random images related to the topic just splatted on top. I like the style, and it makes for a fun custom thumbnail

![](Pasted%20image%2020240412152757.png){: w="500"}
_I really like how this one turned out_
- There's an “Introduction” slide where I introduce myself, and tell the audience about my general approach to the current lecture. For example, for my Camera Pose Estimation [presentation](https://docs.google.com/presentation/d/17DCRP9YbjzUzYvMrg-m4B2_KEMfd9GJocJidwqQ-yng/edit?usp=sharing), the intro was that the lecture is about some cool Computer Vision ideas, in chronological order, without diving too deep into each one. And in the Diffusion for 3D [presentation](https://docs.google.com/presentation/d/1mPgLkON4dgCCD-IxoN5oeSRfq8tWXrAgwbyzCW_hWgY/edit?usp=sharing) , I started by saying that there will be a lengthy introduction, but then we’ll look at the actual content.

![](Pasted%20image%2020240412152937.png){: w="500'"}
_Placing stuff wherever it fits, not overcrowding anything. And yeah, sharing links via QR codes is more convenient_

### Useful tools
- [Photopea](https://www.photopea.com/) — free online Photoshop. Really useful
- [Dingboard](https://dingboard.com/) — meme editor at a pretty early development stage from [Yacine](https://twitter.com/yacineMTB), already has AI-segmentation and AI-inpainting. Convenient for fast correction and addition of something to images
- [Mathcha](https://www.mathcha.io/) — convenient online LaTeX-editor. Whenever I want to insert some formulas into the presentation, I just make them there and then make a screenshot.
