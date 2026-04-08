---

categories:
  - Programming
  - How-to
pubDate: 2025-07-05 12:55:02 +0400
title: C++ Programming setup for noobs
tags:
  - cmake
  - c++
  - clangd
  - devtools
---
Setting up my dev environment for C++ a few months ago was unsurprisingly non-trivial, so I wanted to share the things that would've helped me get it started much faster.

> Some parts may vary for non-Mac users. More on this in the [clangd](#linting-clangd) section
{:.prompt-warning}

Table of contents:
- [IDE](#ide-vscode--cursor)
- [CMake](#cmake)
- [Linting](#linting-clangd)
- [Debugging](#debugging)

## IDE: VSCode / Cursor
In the past I've worked with: [Eclipse](https://eclipseide.org/), [CLion](https://www.jetbrains.com/clion/), [Visual Studio](https://visualstudio.microsoft.com/), [Vim](https://www.vim.org/) -- and [VSCode](https://code.visualstudio.com/) is the best in terms of versatility + ease of setting up.

*Though tbh the main reason I initially switched from Vim to VSCode was proper [Jupyter Notebook](https://jupyter.org/) support.*

But it's easy to have a very pleasant setup that doesn't require me to really tweak much:
- [CodeLLDB](https://open-vsx.org/extension/vadimcn/vscode-lldb) for debugging
- [Clangd](https://open-vsx.org/extension/llvm-vs-code-extensions/vscode-clangd) for language support - more on that in this section
- [CMake](https://open-vsx.org/extension/twxs/cmake) - syntax highlighting for `CMakeLists.txt` files

And **Monokai** as my Color Theme of choice

![IDE screenshot](../assets/img/c-programming-setup/vscode-screenshot.png)
_How my IDE setup looks_

> My other must-have is the [Vim](https://marketplace.visualstudio.com/items?itemName=vscodevim.vim) extension —  if you're not familiar, I believe the speedup is worth investing a ~week of your life into developing the muscle memory for it. \
> [LearnVim](https://github.com/iggredible/Learn-Vim) is probably a good starting point if you're interested
{:.prompt-tip}

## CMake
[CMake](https://cmake.org/) initially isn't a nice build system to use, but it's the most widespread & well-adopted for C/C++, so it's worth to stick to it. Also, it's [turing-complete](https://64.github.io/cmake-raytracer/) (*is that a good thing? lol*), basically meaning you can do anything with it.

I've taken a look at [Bazel](https://bazel.build/) for C++ -- the syntax is definitely much nicer, but then again, it's mostly only used in Google projects (for example, I've had to battle with [its usage in Mediapipe](/posts/connecting-mediapipe-cmake)), and the syntax sugar leads to abstractions that are hard to debug once something goes wrong.

The very minimal example of `CMakeLists.txt`:
```cmake
cmake_minimum_required(VERSION 3.10)
project(lib)

include_directories(${CMAKE_SOURCE_DIR})
file(GLOB SOURCES *.cpp)

add_executable(cct_tests ${SOURCES})
```

This works in a file setup like:
```
- main.cpp
- lib.hpp
- lib.cpp
- CMakeLists.txt
```

> Understanding CMake basics is not trivial -- I only actually grasped it after a month of close work with it (and wrote [some notes](https://xallt.github.io/posts/cmake-is-a-pain-in-the-ass/) about it). But I believe you can achieve this understanding *much faster*. \
> I found this article about [CMake Basics](https://cliutils.gitlab.io/modern-cmake/chapters/basics.html) that seems to be written in a more human way than usual, might be a good starting point.
{:.prompt-info}

For convenience, in all my C++ projects I have a `build.sh` that looks like this:
```bash
ADDITIONAL_FLAGS="-DCMAKE_EXPORT_COMPILE_COMMANDS=1"
BUILD_TYPE="Release"
if [ "$DEBUG" = "1" ] || [ "$DEBUG" = "true" ]; then
    ADDITIONAL_FLAGS="$ADDITIONAL_FLAGS -DCMAKE_CXX_FLAGS='-fsanitize=address' -DCMAKE_C_FLAGS='-fsanitize=address' -DCMAKE_EXE_LINKER_FLAGS='-fsanitize=address'"
    BUILD_TYPE="Debug"
fi

mkdir build
cd build
cmake .. -DCMAKE_BUILD_TYPE=$BUILD_TYPE $ADDITIONAL_FLAGS
make -j$(nproc)
```
What this does is:
- By default, running `./build.sh` will simply build your project, and also generate a `compile_commands.json` (about which I'll talk in the [clangd](#linting-clangd) section)
- Running it like `DEBUG=1 ./build.sh` will enable running the debugger on the compiled executable, and enable the [sanitizer](https://en.wikipedia.org/wiki/Code_sanitizer)

## Linting: clangd
[Clangd](https://clangd.llvm.org/) is a [language server](https://microsoft.github.io/language-server-protocol/) for C/C++ (and more) which integrates well if you're using [clang](https://clang.llvm.org/) for compilation (which I kinda recommend)

> If you are using [GCC](https://gcc.gnu.org/) as your compiler, you can either:
> - Configure [clangd to work with gcc](https://stackoverflow.com/questions/62624352/can-i-use-gcc-compiler-and-clangd-language-server)
> - Use [Intellisense](https://code.visualstudio.com/docs/editing/intellisense) which also [uses compile_commands.json](https://code.visualstudio.com/docs/cpp/configure-intellisense#_compilecommandsjson-file) the wonders of which I'll explain below
{:.prompt-warning}

A very common issue that I encountered while setting up C++ projects -- the linter just doesn't understand where to search for your header `.h`/`.hpp` files / where to find the libraries.
![Linter Issue](../assets/img/c-programming-setup/linter-issue.png){: w="600"}
_Some examples of things that the linter gets weirdly wrong_

But your compiler can provide your linter with those hints -- just add `-DCMAKE_EXPORT_COMPILE_COMMANDS=1` to your CMake flags (as in the `build.sh` script in the [CMake section](#cmake)), and then setup a `.clangd` at the root of your project with 

```
CompileFlags:
  CompilationDatabase: build/
```

And *voila*, your linter perfectly understands your codebase! (*Given that it actually compiles*)

Clangd also has [clangd-tidy](https://clangd.llvm.org/features#clang-tidy-checks) with advanced code checks -- to enable, add this to the `.clangd` file:
```
CompileFlags:
  CompilationDatabase: build/
  ClangdTidy:
    Add: modernize-*
```
All available **clangd-tidy** checks are [here](https://clang.llvm.org/extra/clang-tidy/checks/list.html).

> After every `.clangd` update or major change to the build setup, you'll need to **reload** the IDE for the linter to see the changes
{:.prompt-tip}

## Debugging
As mentioned, the [CodeLLDB](https://open-vsx.org/extension/vadimcn/vscode-lldb) provides very simple debugging support. However, in VSCode for debugging you need to set up a `launch.json` file -- my template is:

```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "run_script",
            "type": "lldb",
            "request": "launch",
            "program": "${workspaceFolder}/build/run_script", 
            "args": [
                "--input",
                "lalala"
            ],
        },
    ]
}
```

![Debugger screenshot](../assets/img/c-programming-setup/debugger-screenshot.png)
_How the debugger looks. Very convenient, and snappy fast for C++_