---
layout: post
title: Prompt flags
author: emmetc
---

A good chunk of time spent LLM prompting goes into patiently cajoling it to use the appropriate response format: 

* *“Write an exhaustive response in detailed, clear prose.”*
* *"Make it a concise bullet point summary; use multiple levels of nesting if needed."*
* *“Ask me any clarifying questions that will help improve your response.”*

Repeatedly appending output instructions at the end of each prompt like this reminded me of [Unix command line flags](http://www.catb.org/esr/writings/taoup/html/ch10s05.html): short codes that you tack onto the end of your command to tell it how to format the output. For example, if you want to simply list the contents of a directory you’d use the `ls` command:
![Unix command: ls](http://thoughtwax.com/uploads/2025/ls.png)
But if you add some prompt flags the output will be modified. Adding the `-l` and `-a` flags (which you can express together as `ls -la`) combines two features: `-l` shows a detailed list format, while `-a` includes hidden files in the list:
![Unix command: lsla](http://thoughtwax.com/uploads/2025/lsla.png)
I've found that this concept translates well to LLM prompting.

I asked ChatGPT to remember some prompt flags that represent the common things I find myself typing out again and again (you can just paste them into any chat and ChatGPT will remember these commands):

```
-s (short): Concise, clear responses.
-l (long): Detailed, in-depth responses.
-b (bullet points): Organized, bullet-pointed responses.
-q (clarifying questions): Ask any questions needed to provide a complete response.
-m (add to memory): Saves relevant context or information to ChatGPT's Memory.
-8 (explain it to an eight-year-old): Use simple and accessible language and concepts.
--help (help): Display this list of commands.
```

So now I can write LLM prompts that include handy little command-line flags:
![Prompt example with flags](http://thoughtwax.com/uploads/2025/prompt1.png)
Once committed to muscle memory I've found these very useful. It’s also smart enough to recognise standalone flags as a follow up to the previous command; so if you don’t like the output you just got, you just reply with a flag for a revised version. I find this is how I use these flags most often so far, when I want to interrupt a response and ask for a revision.
![Prompt example with follow up flags](http://thoughtwax.com/uploads/2025/prompt2.png) 

The received wisdom at the moment is that we'll soon get new more powerful user interfaces for working with AI. In the meantime, there's fun to be had with existing chat paradigms, including ideas from Command Line Interfaces. LMK if you come up with your own useful prompt flag ideas!