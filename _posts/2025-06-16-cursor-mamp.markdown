---
layout: post
title: Cursor's MAMP moment
author: emmetc
---

I bear no ill will towards my fellow nerds who treat their little computer setup as some sort of shrine, a little bonsai project in your laptop to be lovingly tended. Tend on, friend. I am with you in spirit.

But! I am a designer, and thus I take joy in finding faults in all things. And since I've been spending much of my free time prodding at the New Thing just to see what it does, I can no longer avoid the fact: while AI-assisted coding products are indeed marvels, using them still kinda sucks.

I'm not talking about the true vibe coding products like Lovable, Bolt, V0, Figma Make. These are great from what they are trying to do. But in real use I have so far found them to be much more about the ✨vibes✨. The code in these products is secondary, presented like more of a progress indicator than anything you're seriously expected to interact with.

![Hovering art director](http://thoughtwax.com/uploads/2025/cursor-hovering-art-director.gif)
*Vibe coding: the return of the notorious Hovering Art Director.*

The "last 20%" problem for these tools will therefore likely persist for a little while at least, and I have not yet managed myself to use them to create anything that feels finished to me. Bad vibes.

**Complexity as a feature**

I am rather talking instead about using Claude Code to work on code locally on my own computer. Claude Code's Opus 4 is a beast. It can handle everything from _“Read this detailed PRD and start building”_ to _“Fix this bug.”_ It goes beyond code generation: it has unnerving levels of root access, it runs scripts, pushes to GitHub, controls tools via MCP. And it has a charming and clever ASCII interface that makes me smile.

I am, as stated up top, a nerd. But I've never had this level of ability. I have some preexisting knowledge of code, and I generally enjoy doing things on the computer. I've done a bunch of tweaking to get my setup just the way I want it. In that spirit, here is my current setup, with Claude Code running *inside* of Cursor:

![Screenshot of Claude Code running inside Cursor](http://thoughtwax.com/uploads/2025/cursor-with-claude.png)
*(To set this up: run `claude` from the terminal inside of Cursor, which will install Cursor's native Claude Code plugin. Alternatively you can just run Claude Code directly from Cursor's terminal.)*

Isn't this fun? I mean sure, it's kind of a lot! But feels powerful and complete: like a single-window power-user cockpit for doing pretty much anything. Everything is in one place (that'll be the I in IDE): my project on the left, the open subject in the middle (often just the PRD), my AI Agent on the right, and a terminal for running servers at the bottom. This is kinda what I imagine a future agentic operating system might feel like: a command centre for managing and observing multiple parallel tasks.

But/and. Isn't this also kind of... **bad**? Look at it! Complex, intimidating, inscrutable. A normal person would never figure it out. It looks like an airplane cockpit for god's sake!

(War story: I once travelled all the way to Mountain View to nervously present my early design proposal for Google Flight Search in a design review with Marissa Mayer, who was running Search back then. Her very first comment was, "Well, I guess it's appropriate that this looks like an airplane cockpit!" followed by several minutes of hysterical laughter.)

How is this apparent contradiction possible? Why is the design of Cursor both perfect and terrible?

It's because the TAM for "people who might reasonably be considered programmers" has grown orders of magnitude overnight, and in the process that group has suddenly transformed a radically more diverse group. Lots of new and different-thinking people are here now. The discipline of software engineering is about to experience its own version of [Eternal September](https://en.wikipedia.org/wiki/Eternal_September).

This newly misshapen market is therefore massively over-served with complex incumbent power user tools like Cursor. If this is already your natural habitat: as you were, this product is already highly optimised for neckbeards like you (and me). You are like a pilot who already knows how to fly the plane, and for whom an airplane cockpit is therefore the optimal interface.

**Here comes the new guard**

But lots of people just want to fly drones without needing to train as a pilot.

This new market will soon see new, more accessible IDEs that abstract away a bunch of the plumbing and constant breakage -- all of the `npm package update` this and `node server start` that -- and make it simpler and better. We have already established that there is a time and place for hobbyist tinkering, but it is not fixing package management when you're just trying to get on with the pressing business of the day (an app that adds googly eyes to pictures of dogs).

The whole stack is a lumpy contradiction: incredibly powerful, impossibly fragile.

PHP and MySQL had a similar problem back in the day. Web designers could see that adding a bit of extra code to their HTML looked pretty easy. But setting up the LAMP stack was hard too. The coding part felt achievable, it was the infrastructure that was the hard part.

Then along came MAMP:

![Screenshot of MAMP](http://thoughtwax.com/uploads/2025/cursor-mamp.png)

Ahh, that's better. Look at the friendly little traffic lights there. And actual buttons for common tasks like starting and stopping your server.

Here's what the equivalent task looks like today 25 years later, in Cursor (valuation: a cool $10b):

![Screenshot of Claude Code running inside Cursor](http://thoughtwax.com/uploads/2025/cursor-terminal.png)
*Running a couple of local servers should be easier than this.*

Cursor needs its MAMP moment. MAMP made web development accessible to people who didn’t want to wrestle with system config files or error messages. The power is there but the ease-of-adoption is exactly what most non-vibe AI coding environments are still missing. Coding remains very unevenly distributed for now.

Some of the things I'd like to see in a gentler IDE are practical: ability to manage multiple projects, an easy way to see and manage local development servers, automatic or simple source control wrapping, better native support for image and voice input.

But also, if you'll allow me, the vibes could also be better. Think of a local, cozy, joyful studio space where ideas can manifest and break without consequence.

The models and vibes are here. What’s missing is the scaffolding that makes building feel like play again.