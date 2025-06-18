---
layout: post
title: Live-coding music with AI
author: emmetc
---

<iframe width="628" height="353"  src="https://www.youtube.com/embed/fViH4AY5O3U?si=xnt5E97WtCL9IcAI" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe><br>
Here's a little piece of music that I co-created with AI.

First, I prompted Claude with a description of the style I had in mind, and asked it to write some Strudel code. [Strudel](https://strudel.cc) is a simple web-based REPL for live coding; [live coding](https://en.wikipedia.org/wiki/Live_coding) is where you play music by editing code in real time, and as you type the music being played updates accordingly.

![Prompting Claude for Strudel code](http://thoughtwax.com/uploads/2025/strudel.png)

I'd never used Strudel before, but soon figured out that the code from Claude wasn't perfect, e.g. it had hallucinated some sample filenames that don't actually exist. But overall it was a great start, especially considering there is probably very little Strudel-related training data in the world to draw upon. So while each line of code needed to be tweaked manually in some way to dial it in, and a bunch of them were rejects, it was like choosing from a curated bank of samples that I could then whittle down.

Once I started to figure things out, I realised I was mostly commenting in or out chunks of code to build or reduce the mix. So I pasted my latest version back into Claude and asked it to restructure the code for easier live performance.

I ran the Strudel output through an audio interface, into the lovely [Chroma Console](https://www.hologramelectronics.com/chroma-console) effects pedal to add some texture and swoosh (also operated in real time; need more hands!), then back into my computer to record.

I should also give an appreciation for Strudel's cool little visualisations that you can turn on or off for each sound. It's fun and novel to see the output interleaved with the code that creates it, and they reminded me of [Bret Victor's explorable explanations](https://worrydream.com/ExplorableExplanations/).

The video above was my second attempt at actually recording anything. Would I claim this music to be of distinct artistic merit? No. Would I listen to this at home? Also no. But that's got more to do with the dilettantism of the human involved (~4h total effort, including this post) than the fault in the machines. I play music regularly and I'm intigued to keep noodling here.

The clacking of the mechanical keyboard was a mistake, but then seemed appropriate, so I left it in. The Strudel code used in the video above is [on GitHub](https://github.com/thoughtwax/music/blob/main/02.strudel).

This is where I've found AI to be most useful creatively: you can parachute directly into the middle of someplace you've no real business being, and then just start breaking things to see what happens.