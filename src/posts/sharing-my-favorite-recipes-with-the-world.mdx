---

title: Sharing my favorite recipes with the world
pubDate: 2024-03-05

tags:
  - cooking
  - website
categories:
  - Programming
  - Projects
---
I made a dumb thing in like 4 hours. And I love it.

I just suddenly had the urge of adding *something* to my website. And I have a notion table of recipes with some notes. And I don't like using Notion a lot, even though it has a pretty convenient interface for databases.

Long story short, I now have [xallt.github.io/recipes/](https://xallt.github.io/recipes/) with all the recipes pulled from that Notion database.

[Notion APi](https://developers.notion.com/) was easy to figure out, what wasn't as easy -- nail down the Jekyll plugin system.

In the file for the `recipes` tab you can see I just made a custom [Jekyll tag](https://jekyllrb.com/docs/plugins/tags/) that generates the whole list of recipe links. [Here's the file](https://jekyllrb.com/docs/plugins/tags/)

Also I kinda wanted to make it nice, so I made a [separate repository](https://github.com/Xallt/NotionRecipeCollector) for holding the recipe-retrieval code. I first wrote some test code in Python with the GET requests for the Notion API, then used ChatGPT to translate that to Ruby code (that Jekyll uses).

Imported the Ruby module from a separate repo [like this](https://github.com/Xallt/xallt.github.io/blob/main/Gemfile#L26), added the basic [Jekyll tag template](https://jekyllrb.com/docs/plugins/tags/), tested that everything works.

I deployed that first version, then updated it to also pull my notes, not just the recipe names.

---
I think it's my first time I just randomly wanted to script a very simple but satisfying thing, and actually completed it in a way that doesn't require my attention anymore. Feels nice!

Also, a piece of advice if you want to not burn out while making cool things.

a) Learn to make things simple. \
I could've made a whole framework around pulling tables from Notion, turning that into python objects. That's something I would probably do a year ago because I always sought "nice code" and "nice architecture". No use for that -- you want to make a useful thing and fast, before you burn out. So just get used to the fact it's not going to be "nice". Instead, you'll actually make useful things.

b) Test small hypotheses. \
In my case that meant instead of immediately making a separate Ruby repo:
1. First use the Jekyll custom tag template to make one that just returns a simple string
2. Make a very basic template Ruby module without any functions / classes, check that a boilerplate Ruby `main.rs` file runs
3. Then test that including that line in the Gemfile doesn't crash everything
4. Then test that if I import the included module, everything compiles
5. Make a trivial function that returns a string in the module, use the result of that function for the Jekyll tag
6. Now as a final step, I can actually use the code for querying and returning the Notion recipe info, and process that info in the website Jekyll recipe tag class
I test that everything works and compiles after each of these steps. And there were certainly a lot more steps then just these 6.

This eliminates the need for A LOT OF DEBUGGING which occurs when I make big changes at once. This does complicate the process because I have to separate it into small steps. But this approach certainly helped me a lot both in my own home-cooked projects, and in work.