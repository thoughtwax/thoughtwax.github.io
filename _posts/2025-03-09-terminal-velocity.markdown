---
layout: post
title: Terminal velocity
author: emmetc
---

I tooled around with a couple of command line AI things this weekend.

For context, your narrator knows basic command line stuff from the old days, but inevitably gets stymied in the end by relentless errors about things like dependencies and package management that I don’t really understand, and frankly don’t care to.

**[Claude Code](https://www.anthropic.com/news/claude-3-7-sonnet)**

Pretty incredible. I prompted with a short paragraph about a Pinterest-style app that accepts many different media types, and uses AI to analyse and tag all of the content. It basically noodled away for a couple of minutes and essentially got it right first time. (I had some OpenAI API key issues I had to resolve before the AI-powered tagging worked.)

This immediately feels way more capable than using 3.5 Sonnet and Artifacts in the Claude web app. It stepped through everything in a sensible, confident way, and made intelligent proactive choices. It iterated from there in large, meaningful chunks at a time.

The UX is interesting and fun. Claude Code is trying to be a software application of sorts, with things like navigable menus and loading states--but it’s running inside a text-only Terminal. Maybe this feels more familiar if you’re used to things like Vim, but for me it was novel. The little text-only menus were light and fun to use. The colour-coding, one of the few design options available, is clear and tasteful. Also it’s got a sweet ASCII art logo and animated unicode loading spinners, all of which succeeded in making me feel like a cool AI hackerman.

<iframe width="628" height="353" src="https://www.youtube.com/embed/AJpK3YTTKZ4?si=WTtpE_qIQIetg3RH" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe><br>
That said, I did really want it to be able to do more at times. It can’t _see_ the UI it’s building, and you can’t even paste a screenshot into the Terminal; you have to type in a description of the problem. You can't point to a specific element and talk about it. That UX with this capability seems like a point of no return, and a big shift for how we design and build software.

Note that Anthropic already have a lot of the necessary parts here, with tech like [Computer Use](https://www.youtube.com/watch?v=vH2f7cjXjKI) available but not integrated. It will just be a matter of product development time until this is all stitched together, and despite these temporary gaps we can see the overall shape now.

Speaking of gaps, I found myself using Anthropic's rival ChatGPT as a copilot of sorts alongside Claude Code. This is because some of the workflows around the core task writing code (e.g. running a local server, installing databases, source control, etc.) still require complex shenanigans in the Terminal, and currently only ChatGPT can "observe" my Terminal window. Claude Code writes the code, but for now I still needed ChatGPT for easier setup and troubleshooting.

Finally, a broader realisation was that this didn’t just cut out Stack Overflow or Google from my workflow, it completely cut out THE WEB for a couple of hours. That’s the longest time in many years that I’ve used a computer without using the web or in some way feeling online.


**[Ollama](https://ollama.com/)**

This is more of a fun curiosity. I recently got a new Macbook Pro and had wanted to see what I could run locally on it when [James](http://www.jmmcd.net/) told me about Ollama. It’s simple, basically a single command to download and immediately run a Terminal-based chat with a model entirely on your computer.

The most amazing thing to me here is how compressed the information in these models is. I can’t quite fathom it.

The default model is Llama 3.2 3B, and is only 2GB in size. Two gigabytes. The first ever iPod could hold twice that. And yet it’s a fully legit model to converse with about any topic in the entire world.

You can go into Airplane mode and ask it for a plan to terraform Mars or the causes of the Persian Wars and it will generate complete Wikipedia-style answers. You can explain how transformers and on-device inference work all day long, and yet this will remain bewildering and magical to me on some fundamental level.

Ollama has much more capable models available to run on your computer: Llama 3.1 405B is 231GB, and bad-boy newcomer DeepSeek-R1 671B is there weighing in at 404GB. Still, it's insane to think that these world-changing models fit on a cheap thumb drive and run on a regular laptop.


I am a designer by trade, I'm only semi-technical, and am just kicking the tyres on these things. [Other people who I trust](https://x.com/fergal_reid/status/1898514414061375862) on such matters also seem convinced.

The ups and downs of tracking this technology continue. It's still not clear if the entire tech industry is about to ride the next big rollercoaster, or if it's lying on the track of a trolley problem of their own making. How much further will this accelerate?