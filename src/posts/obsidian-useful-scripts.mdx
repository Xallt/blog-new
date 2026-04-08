---
title: Useful Obsidian templates/scripts
pubDate: 2023-10-23

tags:
  - productivity
  - javascript
  - obsidian
categories:
  - Miscellaneous
  - Task Management
---

Alright, in this post I'd like to share some Obsidian templates & scripts that have piled up over the busy year that I had.

![my vault](../assets/img/obsidian_useful_scripts/Pasted%20image%2020231122200039.png){: w="500"}
_My vault :)_

If you want to see the templates right away, go [here](#the-templates).\
If you want to see my other scripts, go [here](#separate-scripts).

Some of my scripts aren’t contained within templates — I made custom ones for certain notes. For example, I store my university-related & work-related “projects” separately from other projects — in the root directory.

Also there’s a “Queries“ file that is the entry point into my Obsidian — it collects all the deadlines & scheduled times of my tasks, and lists all current tasks in all projects.

## Vault structure
For full context, I'll first give an overview of my Vault's structure (I have a single vault for everything, basically a [Zettelkasten](https://writingcooperative.com/zettelkasten-how-one-german-scholar-was-so-freakishly-productive-997e4e0ca125)). I'd say it's simpler than things I've seen online — anyways, I hope this example will be useful for someone out there.

If you spent some time with Obsidian already, you should know that any note is (usually) accompanied with a [YAML Front Matter](https://help.obsidian.md/Editing+and+formatting/Properties), that contains all the metadata for the respective note. All the notes in my Vault are separated into different types (property ‘type‘), which are:

- note — an unstructured note
- project — represents a "project". Basically a group of tasks in some common context + all the info relevant to the project
- link/dataset/library/tool — all of these represent a single note explaining a useful resource. They all have one additional frontmatter property 'link'
- definition — description of some pretty general concept
- paper — represents a scientific paper. Most likely an ML one. Has frontmatter property 'paper' (link to pdf), 'github', 'project-page'

It’s usually pretty clear when to use each non-note type (sometimes I’m not sure whether to use ‘link’ or ‘tool‘, but I just ~randomly pick one and not worry). And when I want to write something that doesn’t fit any type, I just use a ‘note’.

Root directory structure:
```
- Definitions/
- Notes/
- PastedImages/
- Posts/
- Templates/

- Queries.md
- Read-watch.md
- Project - University.md
- Work at Clostra.md
```

“Templates/” contains all the templates, projects & notes go into “Notes/”, papers & links & tools & etc. go into “Definitions/“.  
All the inserted images are configured to be stored in “PastedImages/”, “Posts/” is for long posts I prefer to prepare inside Obsidian.

Yeah some of these structure decisions are confusing, but I’m used to how it is. And anyways, the directory structure isn’t even used for anything anymore, all the filtering and navigation happens through Dataview queries that use ‘type’ properties.

## The setup
So, the primary three Obsidian plugins required for all these snippets to work are:

- [Dataview](https://blacksmithgu.github.io/obsidian-dataview/) — basically Obsidian API within Obsidian. You can create either SQL-like queries to notes/tasks within notes, or write Javascript to extract the information you want
- [Templater](https://silentvoid13.github.io/Templater/introduction.html) — adds the ability to create a note from a template, instead of from scratch. And these templates also have syntax for simple control at creation (like inserting the current date, or moving the note to a directory)
- [Tasks](https://publish.obsidian.md/tasks/Introduction) — similarly to Dataview, provides simple syntax to query notes. But this plugin is focused on tasks specifically. Gives the ability to add metadata to tasks (like ‘due’ / ‘scheduled’ / ‘done‘)

## The templates
The definition template
````
---
created: <% tp.date.now("D MMMM YYYY") %>
type: definition
---
<% await tp.file.move("Definitions/" + tp.file.title) %>

## Notes referring to this definition:
```dataview
LIST FROM [[]]
```
````

![](../assets/img/obsidian_useful_scripts/Pasted%20image%2020231122200616.png){: w="400"}

- - -
The link/tool/dataset/library template (only the type property changes)

```
---
created: <% tp.date.now("D MMMM YYYY") %>
type: link
link: 
---
<% await tp.file.move("Definitions/" + tp.file.title) %>
## Link: `= this.file.frontmatter.link`
```

![](../assets/img/obsidian_useful_scripts/Pasted%20image%2020231122200734.png){: w="400"}

- - -
The "paper" template

````
---
created: <% tp.date.now("D MMMM YYYY") %>
project-page: 
paper: 
github: 
type: paper
---
<% await tp.file.move("Definitions/" + tp.file.title) %>
```dataviewjs
let linkProps = ["project-page", "github", "paper"];
let propNames = ["Project Page", "Github", "Paper"];
let pairs = linkProps
	.map((prop, ind) => [prop, ind])
	.filter((p) => !(dv.current()[p[0]] === null) && (p[0] in dv.current()))
	.map((p) =>  [
		propNames[p[1]], 
		dv.current()[p[0]]
	])
if (pairs.length > 0) {
	const table = dv.markdownTable(
		["", ""], 
		pairs
	);
	dv.paragraph(table);
}
```
````

![](../assets/img/obsidian_useful_scripts/Pasted%20image%2020231122200838.png){: w="400"}

- - -
The project template
```
---
created: <% tp.date.now("D MMMM YYYY") %>
type: project
---
<% await tp.file.move("Notes/" + tp.file.title) %>
### Goal: 
- [ ] 
```

![](../assets/img/obsidian_useful_scripts/Pasted%20image%2020231122200909.png){: w="400"}

## Separate scripts

To list work tasks that I’ve done over the week (so I know what to say on standups):

````
```tasks
done after 7 days ago
filename includes Work at Clostra
hide backlink
hide done date
hide edit button
group by done
```
````

![](../assets/img/obsidian_useful_scripts/Pasted%20image%2020231122200932.png){: w="400"}

- - -
Listing all tasks from all projects (except for those with property “hide: true“ or “completed: true“)

````
```dataview
TASK FROM "Notes" WHERE type="project" AND !completed AND !hide GROUP BY file.link
```
````

---

Now, the big ones.  
Listing all deadlines + showing the parent task:

````
```dataviewjs
const tasks = dv.pages().file.tasks;
const tasks_nc_due = tasks.filter((task) => {return !task.completed & !isNaN(task.due);})
let handler = {
	get(target, name) {
		if (name == 'children') {return None}
		else {return target.name}
	}
}
const tasks_due_subless = tasks_nc_due.map((task) => {
	Object.defineProperty(task, 'children', {
		get: function() {return [];},
		set: function(v) {}
	})
	return task;
})
const tasks_due_grouped = tasks_due_subless.groupBy((task) => task.due);

function getParent(task) {
	return dv.page(task.path).file.tasks.find((t) => t.line == task.parent);
}
const task_markers = "📅⏳✅"
function getParentDescription(task) {
	const parent = getParent(task);
	if (parent) {
		var parent_text = parent.text;
		const task_marker_idx = parent_text.split("").findIndex((c) => task_markers.contains(c));
		if (task_marker_idx != -1) {
			parent_text = parent_text.slice(0, task_marker_idx);
		}
		return parent_text;
	}
	else {
		return parent;
	}
}

for (let i = 0; i < tasks_due_grouped.length; i += 1) {
	const group = tasks_due_grouped[i];
	for (const task of group.rows) {
		const parent_description = getParentDescription(task);
		if (parent_description) {
			task.text += "&nbsp&nbsp&nbsp|&nbsp&nbsp&nbsp" + parent_description;
		}
		
	}
	dv.header(5, group.key.toFormat("LLLL d, cccc"));
	dv.taskList(group.rows, false);
}
```
````

![](../assets/img/obsidian_useful_scripts/Pasted%20image%2020231122201006.png){: w="400"}

---

Listing all tasks that are scheduled

````
```dataviewjs
 const tasks = dv.pages().file.tasks;
 const tasks_nc_due = tasks.filter((task) => {return !task.completed & !isNaN(task.scheduled);})
 const task_by_due = tasks_nc_due.groupBy((task) => {return task.scheduled});

function getParent(task) {
	return dv.page(task.path).file.tasks.find((t) => t.line == task.parent);
}
const task_markers = "📅⏳✅"
function getParentDescription(task) {
	const parent = getParent(task);
	if (parent) {
		var parent_text = parent.text;
		const task_marker_idx = parent_text.split("").findIndex((c) => task_markers.contains(c));
		if (task_marker_idx != -1) {
			parent_text = parent_text.slice(0, task_marker_idx);
		}
		return parent_text;
	}
	else {
		return parent;
	}
}
 
 for (let i = 0; i < task_by_due.length; i += 1) {
 	const group = task_by_due[i];
 	for (const task of group.rows) {
		const parent_description = getParentDescription(task);
		if (parent_description) {
			task.text += "&nbsp&nbsp&nbsp|&nbsp&nbsp&nbsp" + parent_description;
		}
		
	}
 	dv.header(1, group.key.toFormat("LLLL d, cccc"));
 	dv.taskList(group.rows);
 }
 ```
````

![](../assets/img/obsidian_useful_scripts/Pasted%20image%2020231122201028.png){: w="400"}

---

Random leaf task selector from all project tasks (when I have difficulties deciding what to do)

````
project_seed::s
```dataviewjs
const pages = dv.pages('"Notes"').filter((page) => (page.type == "project") & !page.hide);
const leafUncompletedTasks = pages.file.tasks.filter((task) => (task.children.length == 0) && (!task.completed));
function cyrb128(str) {
    let h1 = 1779033703, h2 = 3144134277,
        h3 = 1013904242, h4 = 2773480762;
    for (let i = 0, k; i < str.length; i++) {
        k = str.charCodeAt(i);
        h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
        h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
        h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
        h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
    }
    h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
    h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
    h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
    h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
    return (h1^h2^h3^h4)>>>0;
}
const currentDay = new Date();
const seed = dv.current().project_seed;
const currentDayString = currentDay.toISOString().slice(0, 10);
const generatedNum = cyrb128(currentDayString + seed);
const taskSelectedNum = generatedNum % leafUncompletedTasks.length;
dv.taskList([leafUncompletedTasks[taskSelectedNum]]);
```
````


![](../assets/img/obsidian_useful_scripts/Pasted%20image%2020231122201054.png){: w="400"}