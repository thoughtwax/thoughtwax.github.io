---
layout: post
title: Prompt flags
author: emmetc
---

A good chunk of effort that goes into LLM prompting is spent patiently cajoling it into use the appropriate response format: 

* *“Write an exhaustive response in detailed, clear prose”*
* *"Concise bullet point summary; use multiple levels of nesting if needed"*
* *“Ask me any clarifying questions that will help improve your response”*

Repeatedly appending output instructions at the end of each prompt like this reminded me of [Unix command line flags](http://www.catb.org/esr/writings/taoup/html/ch10s05.html): short little codes that you tack onto the end of your command that tell it how to format the output. For example, if you want to simply list the contents of a directory you’d use the ls command:
![Unix command: ls](http://thoughtwax.com/uploads/2025/ls.png)
But if you add some prompt flags the output will be modified. Adding the `-l` and `-a` flags (which you can express together as `ls -la`) combines two features: `-l` shows a detailed list format, while `-a` includes hidden files in the list:
![Unix command: lsla](http://thoughtwax.com/uploads/2025/lsla.png)
I've found that this concept translates well to LLM prompting.

I asked ChatGPT to remember some prompt flags that represent the common things I find myself typing out again and again (you can just paste this into any chat and ChatGPT will remember these commands):

```
-s (short): Concise, clear responses.
-l (long): Detailed, in-depth responses.
-b (bullet points): Organized, bullet-pointed responses.
-q (clarifying questions): Ask any questions needed to provide a complete response.
-m (add to memory): Saves relevant context or information to memory.
-8 (explain to an eight-year-old): Use simple and accessible language and concepts.
--help (help): Display this list of commands.
```

So now I can write LLM prompts with handy command-line-like flags:
![Prompt example with flags](http://thoughtwax.com/uploads/2025/prompt1.png)
Once committed to muscle memory I find these very useful. It’s also smart enough to recognise standalone flags as a follow up to the previous command; so if you don’t like the output you just got, you just reply with a flag. I find this is how I use these flags most often.
![Prompt example with follow up flags](http://thoughtwax.com/uploads/2025/prompt2.png)

The received wisdom at the moment is that we'll soon get new more powerful user interfaces for working with AI. In the meantime, there's a lot of scope to extend the existing chat paradigms, and pulling in ideas from other areas like Command Line Interfaces. LMK if you come up with your own useful prompt flag ideas!