---

categories:
- Programming
- How-to
tags:
    - cmake
    - c++
pubDate: 2025-06-11 21:57:06 +0400
math: true
title: CMake is a pain in the ass
---

I really dislike [CMake](https://cmake.org/). Until recently — when I started using it more, fought through the things that were confusing me, and now I dislike it *only moderately*.

I gathered some insights, a few of them generally about C++ development.  Here's an unordered list of my recommendations for your CMake journey.
- **Don't try to start from scratch.** A `CMakeLists.txt` file is not something you can write from scratch. You NEED a starting point. Example from online / something an LLM will generate for you initially. It's a waste of time to try to work from first principles - you need to have a working starting point to modify to adapt it to your needs.
- **Learn how compiling works.** Important concept — ALL code that the computer runs has to be compiled. If its your code, then all of it has to be referenced in your CMakeLists.txt. If there's a library, you have to understand that the code of the library HAS to be somehow included in your final output
- **There is no "correct" way.** Just do things that worked. You HAVE to learn from examples, copy-paste their solutions, and NEVER think that "oh I did this in a dirty unsustainable way…" — NO. Stop that. EVERY way is dirty
- **Copy-paste works.** Just dump the code from libraries' repos into your proejct. Hell, its even ok if you just copy the full source code of a library into a subdirectory of your repository. You can then cut out things you don't need, simplify the compilation process, etc etc. It's normal. 
You're not working with [cargo](https://news.ycombinator.com/item?id=19295253) — you won't do it in a "clean" way.

- **[clangd](https://clangd.llvm.org/) as LSP** (Language Server Protocol). Ask your LLMs (wherever you get them) how to set up [compile_commands.json](https://clangd.llvm.org/design/compile-commands) and you will never have any issues with linting
- **The `find_package` command IS confusing.** It IS black magic. You WILL have problems with it. Main recommendation — be very thorough when making sure the version of the library CMake is looking for is compatible with the one installed in your system
- **How to find libraries in your system?** Google and google and google where they *could* lie in your system. For some reason it's hard to find library installations every time.
- **Uhhh how do you *install* these libraries?** Well if you're lucky, you can do something like `brew install opencv` or whatever your package manager is. But also. Just build it. It does seem scary and like overkill, but turns out its much easier than trying to find the right version in your package manager.
- **Yes, the syntax is terrible.** Yes, the documentation is hideous. At this point, I never read the docs, it's only a waste of time there. Just accept it and move on - ask LLMs, look for examples on github, etc.
- **A `build.sh` script.** Have it do all the cmake commands for you, highly recommend. Easy to then expand it with downloading other libraries / setting some CMake flags related to debugging  / etc
- **You're a builder, don't try to do things "nice".** CMake is one of those tools -- you tweak until it works, forget it, until you quickly need to tweak something again. If you think something is ugly about how your build is set up, then soon enough you'll see the cracks show. And  **that's** when you'll actually understand the architecturally sound way to fix that. Don't try to over-engineer in the beginning
