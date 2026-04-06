---
title: Connecting Mediapipe with CMake for my own Hand Tracking app
pubDate: 2023-11-08

toc: true
tags:
  - computer-vision
  - mediapipe
  - c++
  - cmake
  - bazel
  - hand-tracking
categories:
  - Programming
  - Projects
---
Skip to [here](#whats-so-cool-about-mediapipe) if you want the juicy technical insights right away

## Motivation
When thinking about applications of good Hand Tracking, my imagination is just going all over the place. Stuff like: UI interaction in AR devices (btw Quest 2/3 hand tracking [is fantastic](https://www.youtube.com/watch?v=j77tfU5jfgw)), or [fun filters](https://www.8thwall.com/blog/post/126815603359/wave-hello-to-hand-tracking), or controlling smart home devices with your hands.

it's kind of my dream to eventually work on AR apps, especially those with hand interaction, so I gathered myself and started working on a Hand-Tracking app from scratch (wanted to get *hands-on experience* (lol))

The idea was to create a simple UI to play around with webcam Hand Tracking. Just wanted to get creative -- feel like spiderman (shooting webs?) / a mage (summoning fire?) / control the PC cursor.

I knew about [Mediapipe](https://developers.google.com/mediapipe) for a while now, and knew it had a Python API. So I started there -- and implemented simple Hand Tracking in Python using that API. 
It was a whole other journey for me to implement a tracker in python, because I took the time to make it actually efficient -- have separate processes for:
- reading frames from the camera
- processing them with the API
- displaying the results with `cv.imshow` 
(for some reason I went with multi-processing and not multithreading?). 

It's a whole other journey deserving of its own post.

Doesn't matter -- it was still slow. Python is slow + the Mediapipe Python API only provides CPU inference. And I wanted to squeeze out the maximum FPS I could get by running on the GPU.

So I gathered the courage to work with C++ to get the best performance. My first 4-5 years of programming were all C++ (back in 2015-2019), but then I started doing ML and completely transitioned into Python. And so, my C++ knowledge and muscle memory slowly faded away... but I'm going to get it back, LFG 🚀

This post in particular is about the first stage of the development of this app, where I was setting up Mediapipe's Hand Tracking as a library for my app. \
<del> There *should be* eventually a post about the app itself and the creative things I've done with it.</del> &mdash; Shouldn't make promises like this, I've dropped the project 🙃

## What's so cool about Mediapipe?
> **TLDR:** Mediapipe is a framework for compiling your ML Inference pipelines into binaries runnable on any platform (Android / iOS / Desktop)
{:.prompt-info}

|Visualization of a graph|Snippet of this graph's definition|
|:-:|:-:|
|![Mediapipe handtracking graph](/assets/img/connecting_mediapipe_cmake/mediapipe_handtracking_graph.png)|![how this graph is defined in text](/assets/img/connecting_mediapipe_cmake/handtracking_pbtxt.png)|


> While looking for other Mediapipe tools, I found out you can [upload your profiling log](https://github.com/google/mediapipe/blob/master/docs/tools/tracing_and_profiling.md) to [viz.mediapipe.dev](https://viz.mediapipe.dev) and it will visualize both the graph, all the statistics, and also *all intermediate states of each node?* (not sure). Whatever that does, it looks fantastic


## How do I use Mediapipe in my project?
You can pretty much consider Mediapipe documentation to be **non-existent**. They have instructions how to compile their examples, and explanations of their core concepts, but very little help for creating your own graphs / using Mediapipe as a library.

Well, it kinda doesn't seem like it if you browse their [Calculators Overview](https://developers.google.com/mediapipe/framework/framework_concepts/calculators). But after all that code , it's still not clear how you would integrate your own calculator into a graph, compile that graph, use Tensorflow models other than their own. Or maybe Torch models? 

There's just so many components to consider, and honestly it's not surprising that there is no single well-made documentation.

### Use Mediapipe within Python
If you just need one/some of Mediapipe's examples as a library for your app -- you can use the extremely convenient [Mediapipe Python API](https://developers.google.com/mediapipe/api/solutions/python/mp)!

And they have pretty well-documented examples, for example here's one for running their facial landmark detection: [https://developers.google.com/mediapipe/solutions/vision/face_landmarker/python](https://developers.google.com/mediapipe/solutions/vision/face_landmarker/python)

However, important note:
> The Python `mp` library only provides **CPU** inference of models
{: .prompt-warning }

If your app is in C++ or if you want fast GPU inference, the next section is for you.

### Actually integrating Mediapipe into C++
If you want to have Mediapipe as a dependency in your project in any way, you **WILL** have to read the [Mediapipe source code](https://github.com/google/mediapipe). Sometimes C/C++, sometimes Protobuf `.proto`{: .filepath} files, Bazel `BUILD`{: .filepath} files, sometimes even Java code (idk why). 

And I bet you'll have to make a fork of Mediapipe and add some changes to the internal code/build files. It was inevitable for me, so I accepted the path of tweaking the source code.

When I started experimenting, I encountered this post which is a C++ Mediapipe mini-tutorial: [https://www.it-jim.com/blog/mini-tutorial-on-mediapipe/](https://www.it-jim.com/blog/mini-tutorial-on-mediapipe/) \
It's a short intro that shows how you would run a graph with your own calculator -- helped me in the beginning when I was searching for resources on the topic.

I won't be able to walk you through the whole source code and rid you of the pain that I went through. Or, I actually can -- you can just look at my code:
- [https://github.com/Xallt/HandTrackingProject](https://github.com/Xallt/HandTrackingProject) for the CMake project itself. At the moment of writing this post it's on [this commit](https://github.com/Xallt/HandTrackingProject/tree/5296fa80ca2dd90fb97e1f9ca557bb30e0033f71)
- [https://github.com/Xallt/mediapipe](https://github.com/Xallt/mediapipe) with my mediapipe fork. It's added as a submodule inside of the HandTrackingProject repo

But there still is a chance you need to go through this process by yourself. So here's some insights that were crucial for me, and may be helpful to you, my dear reader:
#### Bazel/CMake
You can either have your project built with [Bazel](https://bazel.build/), which means you can simply add Mediapipe Bazel build files as a dependency in your build files. Or you'll work with a different build system, which means you'll have to figure out how to export a shared library with all the relevant data

I personally wanted to work with [CMake](https://cmake.org/) for this project (because it's widely used and probably the hardest to understand), so I went with the second option, which resulted in about 10 days of pain where I learned a lot about CMake, Bazel, and how C++ compilers work. But I got it to work!! 

<blockquote class="twitter-tweet"><p lang="en" dir="ltr">I WON, I FUCKING WON. <br>I GOT fudging MEDIAPIPE BAZEL-BUILT SHARED LIBRARY TO WORK WITH MY CMAKE PROJECT I&#39;m so happy. <br><br>I started trying to link it together like 10 days ago. And I learned so much trying to make it work. Would definitely make a great post <a href="https://t.co/Za4ElgjvGE">pic.twitter.com/Za4ElgjvGE</a></p>&mdash; Mitya Shabat (@Xallt_) <a href="https://twitter.com/Xallt_/status/1717627719503036667?ref_src=twsrc%5Etfw">October 26, 2023</a></blockquote> <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>
look at how happy I was 

If you want to actually understand the intricacies of C++ linking and Mediapipe, I recommend you go through this painful experience yourself 🙃.

And the rest of the insights stem from this decision of mine (because if I went with Bazel, I probably wouldn't have wasted so much time)

#### Exporting a shared library from Bazel

When looking for existing projects integrating Mediapipe into CMake, I found this one called [LibMP](https://github.com/rajkundu/mediapipe/tree/master). I tried to set it up but it was based off of an old Mediapipe commit (7 months ago) so I didn't want to bother with it. However, [their BUILD file](https://github.com/rajkundu/mediapipe/blob/master/mediapipe/examples/desktop/libmp/BUILD) that exports a shared library gave me lots of hints on how I need to set up my BUILD file.

I wanted to run the GPU inferencing graphs, so my goal was to integrate the `RunMPPGraph()` from [demo_run_graph_main_gpu.cc](https://github.com/google/mediapipe/blob/master/mediapipe/examples/desktop/demo_run_graph_main_gpu.cc) into my app. That's the first step anyway, I'd modify it to give me landmarks instead of images later on.

Initially this source file is treated as a library with a predefined `main()` in the corresponding Bazel [BUILD](https://github.com/google/mediapipe/blob/master/mediapipe/examples/desktop/BUILD) file, but it isn't created as an actual C++ library. 

So, to be able to export the `RunMPPGraph()` function, but also for the Mediapipe hand tracking example to not break down, I did these things in order, checking after each step that everything compiles and runs as usual:
1. **fork** & clone & compile & run Mediapipe with their instructions: 
	- First, the [Hello World example](https://developers.google.com/mediapipe/framework/getting_started/install)
	- Then the [Hand Tracking example](https://developers.google.com/mediapipe/framework/getting_started/cpp)
2. Break up the `demo_run_graph_main_gpu.cc`{: .filepath} file into:
	- `run_graph_main.h`{: .filepath} with header guards & the declaration of the `RunMPPGraph()`
	- `run_graph_main.cc`{: .filepath} with the source code for the `RunMPPGraph()`
	- `demo_run_graph_main_gpu.cc`{: .filepath} with the `main()` from the older version of this file
	- And create an intermediate `cc_library` for `run_graph_main.cc`{: .filepath} inside of this [BUILD](https://github.com/google/mediapipe/blob/master/mediapipe/examples/desktop/BUILD) file accordingly
3. Create a `run_graph_main_linux.so` target in the BUILD file with the Bazel rule `cc_binary` and flags `linkshared=1`, also add `alwayslink=1` to the  `run_graph_main` Bazel target (important for when we'll export the shared library)
4. Also, I changed the output result of `RunMPPGraph()` to be a `bool` instead of `absl::Status` so that I don't have to have Abseil as a dependency in my project

There will be lots of ups & downs in this process, you'll have a fair deal of issues with OpenCV dependencies & other libraries. I have [this section](#wow-following-installation-instructions-is-useful) specifically for that.

`alwayslink=1` has something to do with linking **all** of the files used by the build target. Not exactly sure, you can [read the Bazel docs](https://bazel.build/reference/be/c-cpp#cc_library.alwayslink) for details.

> Bazel isn't capable of compiling static libraries without a main() function, so we are forced to make a **shared** library
{: .prompt-warning}

Ok, at this stage we should have something called `run_graph_main_linux.so`{: .filepath } somewhere in  the `bazel-bin`{: .filepath} directory. Now let's try to link it to our small CMake project

#### Linking the Bazel-built shared library to a CMake project
Now, let's get to actually creating a CMake project with this shared library linked 🚀

> Again, and this is important -- the key to success in these new projects is iterative small changes, `git commit`ting each one after you tested it. 
> 
> Otherwise, while on a rush of excitement you're making lots of changes, one of those will break something. Likely you won't be able to tell what exactly (because C++ error logs are either non-existent or trash), so you'll have to roll everything back, discarding even good changes. Trust me, I've been there.
{: .prompt-info}

Anyway, here's the steps I took:
1. First, create a very simple Hello World `main.py`{: .filepath } -- just to confirm that something trivial compiles
2. Then, with the help of the internet of ChatGPT, create a CMake file that will compile this trivial `main.py`{: .filepath }. CMake boilerplates are impossible to memorize, so yeah.
  Also, here's a great intro post to CMake: [https://www.internalpointers.com/post/modern-cmake-beginner-introduction](https://www.internalpointers.com/post/modern-cmake-beginner-introduction). There's also lots&lots of links to other posts in the bottom, maybe one of those will help you a lot.
3. Add the `run_graph_main.h`{: .filepath} header and `run_graph_main_linux.so`{: .filepath} to CMake, check that it compiles
4. Add `#include "run_graph_gpu.h"`
5. Call `RunMPPGraph()`

The steps 4&5 are the most problematic ones -- all the issues with file positioning, linking problems, etc. will come out here. Also the suddenly the model checkpoint can't be found, the `.pbtxt`{: .filepath} graph definition can't be found, etc.\
Good luck with figuring this out! 🙃

While debugging all the issues with missing libraries and conflicting library versions, two tools helped me out:
- `nm -C {binary or shared library}` lists all of the functions defined in the file
- `ldd {shared library}` lists all references from functions to corresponding libraries installed in your system

General advice about installing libraries [here](#installing-c-libraries).

Also, for some mysterious reason I **had** to have the `bazel-bin`{: .filepath} directory under where my `main`{: .filepath} executable lies? I just made a symlink, but it's still confusing, and I don't understand where in the source code it references `bazel-bin`{: .filepath} specifically:
```bash
ln -s ../dependencies/mediapipe/bazel-bin ./bazel-bin
```

#### Extracting landmarks from the graph
After the previous steps, we should basically get the app as the Mediapipe Hand Tracking example (we literally run the same function). However, we want to play around with the landmarks ourselves.

Essentially, over a few commits I refactored the `RunMPPGraph()` function into a class with this interface:
```cpp
class MPPGraphRunner {
	absl::Status InitMPPGraph(std::string calculator_graph_config_file)
	absl::Status ProcessFrame(cv::Mat &camera_frame, size_t frame_timestamp_us, cv::Mat &output_frame_mat, std::vector<NormalizedLandmarkList> &landmarks, bool &landmark_presence)
	absl::Status RunMPPGraph(std::string calculator_graph_config_file, std::string input_video_path, std::string output_video_path)
}
```

However, there was a problem -- in order to be able to `#include` this class signature, I'd need to have [Abseil](https://abseil.io/) as dependency (`absl::` stands for the Abseil namespace). So I came up with a simple hack:

```cpp
class SimpleMPPGraphRunner {
   public:
    SimpleMPPGraphRunner();
    ~SimpleMPPGraphRunner();
    bool RunMPPGraph(std::string calculator_graph_config_file, std::string input_video_path, std::string output_video_path);
    bool InitMPPGraph(std::string calculator_graph_config_file);
    bool ProcessFrame(cv::Mat &camera_frame, size_t frame_timestamp_us, cv::Mat &output_frame_mat, std::vector<LandmarkList> &landmarks, bool &landmark_presence);

   private:
    void* runnerVoid;
};
```
It's basically a wrapper around the `MPPGraphRunner`, which is now entirely defined in `run_graph_gpu.cc`{: .filepath}, so now `MPPGraphRunner` isn't referenced as a type anywhere in the `run_graph_gpu.h`{: .filepath} file -- this way Abseil also isn't required.

The `runnerVoid` is a pointer to the `MPPGraphRunner` class that I'd handle in the source file `run_graph_gpu.cc` like this:
```cpp
bool SimpleMPPGraphRunner::InitMPPGraph(std::string calculator_graph_config_file) {
    runnerVoid = (void *)new MPPGraphRunner();
    MPPGraphRunner &runner = *(MPPGraphRunner *)runnerVoid;
    // ... rest of the code ...
}
bool SimpleMPPGraphRunner::ProcessFrame(cv::Mat &camera_frame, size_t frame_timestamp_us, cv::Mat &output_frame_mat, std::vector<LandmarkList> &landmarks, bool &landmark_presence) {
    MPPGraphRunner &runner = *(MPPGraphRunner *)runnerVoid;
    // ... rest of the code ...
}
```

#### Polling nonexistent landmarks
One of the painful issues that I encountered when I was also extracting landmarks from the graph instead of just the processed image -- whenever both hands were off-screen, **no packet with landmarks would be produced** by the graph. And polling for the packet like this `poller_landmarks->Next(&packet_landmarks)` would just **freeze the whole app**!

First off -- when this started happening, it probably took me a whole day to debug, because it just quitely freezes (and I didn't do small testable changes back then). So, **do small changes**!

When I figured out the issue was the polling, I found [this issue on Github](https://github.com/google/mediapipe/issues/1532) that addresses this problem exactly. The solution was nice --  add a boolean output in the graph that indicates whether landmarks will be returned this frame.  The solution is basically described in the issue, I won't go into detail here.

Now polling for the landmarks looks like this:
```cpp
poller_landmark_presence->Next(&packet_landmark_presence);
landmark_presence = packet_landmark_presence.Get<bool>();
if (landmark_presence) {
	poller_landmarks->Next(&packet_landmarks);
	landmarks = packet_landmarks.Get<std::vector<NormalizedLandmarkList>>();
}
```

## Issues & insights & friends I made along the way

I'm done with the structured part of the post where I describe how I made stuff work. Now I can get to even more detailed parts of the process -- most notably, what worked and what failed.

### Installing C++ libraries
Lots of the issues you'd come across during the set up of Mediapipe here, or of any other project honestly, look like this:
```bash
could not load dynamic library 'libnvinfer.so.7'
```
or 
```bash
could not load dynamic library 'libopencv_videoio.so.4.2'
```
Well, for some reason it took me **waaaay too long** to realize that most of these are solved by just 
```bash
sudo apt-get install lib{library}-dev
```
Of course, I'm on an Ubuntu-based system, if you're Arch or whatever, can't help you there (but it's probably very similar).

If there's a library like `libcudnn.so`{: .filepath} missing (name starts with `cu`{: .filepath}), which is basically part of CUDA, you'll probably have to go to the Nvidia website and use their installer instructions. For me it was the [CUDA 12.2 Toolkit Downloads](https://developer.nvidia.com/cuda-12-2-0-download-archive).

Sometimes you may even have an issue where none of the library versions from your package manager work -- whatever you install the build process complains that **something is of the wrong version**. \
Aaand you can always just **build from source**! It's a lot easier than I initially assumed.

For example, I had issues with OpenCV versions, so I decided at some point I'd just do an installation from source. It literally looked like this:
```bash
git clone https://github.com/opencv/opencv.git
cd opencv
mkdir build && cd build
cmake ..
make install
```
Of course this may look scary and unreliable at first (it sure did look like that to me). But this series of commands:
```bash
mkdir build && cd build
cmake ..
make install
```
Is one you'll be very familiar with once you work with more CMake projects -- it's THE commands for building C++ libraries and installing them into your system. 

Maybe at some point you learned about `Makefile`{: .filepath}s separately from CMake -- it's a very simple minimalistic build system, which is good for beginners and small projects. CMake is good for bigger projects with dependencies that are harder to manage manually, and all it does -- **it literally just generates Makefiles for your project**. So, the logic is:
1. Create a `build`{: .filepath} directory where the `Makefile`{: .filepath}s will be located together with all the helper files
2. `cd` into it, and call `cmake ..` which just says "generate **Makefile**s in this directory using the `CMakeLists.txt`{: .filepath} from the directory `..`{: .filepath}"
3. Then, run the `install` instruction from the Makefile, that compiles everything, and adds the header files (like `opencv2/videoio.hpp`{: .filepath} which is basically the same as `.h`) and shared libraries (like `libopencv_videoio.so`{: .filepath}) to the directories where they're supposed to be

### Wow, following installation instructions is useful
In Mediapipe installation instructions for C++, there's this [first section of installation instructions](https://developers.google.com/mediapipe/framework/getting_started/install#installing_on_debian_and_ubuntu), and in the 3rd step they specify how you need to change the `opencv_linux.BUILD`{: .filepath} file if you have OpenCV>=4 version.

Now, on a completely unrelated note 🙃 -- when linking the `run_graph_gpu_linux.so`{: .filepath} as described in [this section](#linking-the-bazel-built-shared-library-to-a-cmake-project), and calling `RunMPPGraph()`, I got errors like:
```bash
(...): undefined reference to cv::VideoCapture::VideoCapture(int)

(...): undefined reference to cv::VideoCapture::~VideoCapture()

(...): undefined reference to cv::String::deallocate() ...
```
And I checked with `ldd` that the linking inside of `run_graph_gpu_linux.so`{: .filepath} point to the correct shared OpenCV libraries. At this point I've already looked at the instructions from Mediapipe to change their OpenCV dependency BUILD file, but I scratched that -- it only changed the include directories for the headers, and headers don't contain function definitions, so changing that now won't add any function references that the linking complain about above.

WRONG -- apparently by default (if you have OpenCV>=4) it uses headers of an "older" version, that won't break during compilation of a library, but will notice that something is wrong once you try to link those with functions (some kind of mismatch between older headers and newer libraries' function interfaces?). 

So yeah, setting a different `-I` flag during `gcc`compilation can fix the linking in your cpp app.

I found this post that should serve as a good introduction into what compilation&linking are, if you're new to this: [https://www.learncpp.com/cpp-tutorial/introduction-to-the-compiler-linker-and-libraries/](https://www.learncpp.com/cpp-tutorial/introduction-to-the-compiler-linker-and-libraries/)

### "bazel query" just didn't work
There's one thing that I just gave up on when debugging -- trying to make `bazel query`. It's a tool that is supposed to help you understand the dependencies in your Bazel project.

But it didn't work -- because mediapipe uses a command in Bazel that creates a "local repository", which in this case was used (probably, not sure) for installing files specific for building for/on different systems, like this one:
```python
new_local_repository(
    name = "windows_opencv",
    build_file = "@//third_party:opencv_windows.BUILD",
    path = "C:\\opencv\\build",
)
```
And apparently to run `bazel query` it has to traverse the whole graph, which in this case requires it to run every creation of a local repository. But this one is specifically for windows, which means this command fails! 

I tried just removing this command in particular, but there were just too many problems like this, and I decided to give up on this idea. Which was sad, because having a working `bazel query` could've sped up my debugging process back then.

### Errors not logging from inside "glcontext"
The code for running a graph on the GPU has two instances of entering an "OpenGL context" which is required to move an image from the CPU to the GPU and back. 

The problem was -- there is some Abseil error handling inside of the context, but it just wouldn't work. I manually checked -- and whenever an error was returned, it would just be ignored. Still don't know why, but I had to modify [this line](https://github.com/google/mediapipe/blob/master/mediapipe/examples/desktop/demo_run_graph_main_gpu.cc#L135) to manually check the returned `absl::Status` instead of delegating it to the `MP_RETURN_IF_ERROR` macro.

And oh yeah, the macros in Mediapipe are horrendous.

### Understanding the macros
There's lots of usage of macros in the code, like these ones:
```cpp
MP_RETURN_IF_ERROR(graph.StartRun({}));
```
or 
```cpp
MP_ASSIGN_OR_RETURN(auto gpu_resources, mediapipe::GpuResources::Create());
```
Which are veeery confusing at first. Well, best thing to do in this case -- read the source code! Which here just means -- read what these actually mean. The moment I did that, it became much easier to navigate the code. 

All defined here: [https://github.com/google/mediapipe/blob/master/mediapipe/framework/deps/status_macros.h](https://github.com/google/mediapipe/blob/master/mediapipe/framework/deps/status_macros.h) \
Just had to look for "#define MP_RETURN_IF_ERROR" inside the github

### C++ in VSCode
A couple words about C++ in VSCode -- previously when doing stuff with C++ it was only small projects and I didn't have many issues, but now this one had a pretty large Mediapipe and ImGui dependencies. 

[IntelliSense](https://code.visualstudio.com/docs/editor/intellisense) is the VSCode plugin for C++ IDE features, and mostly it works well, but for me it failed on deeply-positioned files. I complained about it on Twitter, and one of the maintainers actually replied and was nice!

Here's the thread: [https://twitter.com/Xallt_/status/1714777777046503442](https://twitter.com/Xallt_/status/1714777777046503442)\
Didn't report the issue to Github yet, but I *probably* will

And another note -- C++ is generally a harder language to grasp than Python, but the IDE features (at least in VSCode) are a lot nicer, and I was reminded of how nice it is to have actual static types, and catch small issues in the code before you even try to run it.

### ChatGPT is a great help
ChatGPT isn't all that powerful -- many times when asking it questions about the code, about my linking issues, or Bazel features, it didn't respond with anything that was helpful.

However, when I asked it to explain to me about particular concepts either about CMake, or about how the compilation&linking works... it was **ok**. But then I asked dumb questions one after the other, until we both **converged to the exact piece of understanding that I was missing**. 

And lately that's what I find most useful about it -- it suddenly became a lot easier to grasp concepts that you find VERY hard. You just **ask dumb questions one after another** until you either [rubber-duck](https://en.wikipedia.org/wiki/Rubber_duck_debugging) yourself into understanding where you were wrong, or until it points that out itself.

### Some great CLI tools
I either learned, or was reminded of some great CLI tools:
- Already mentioned `ldd` and `nm -C` [here](#linking-the-bazel-built-shared-library-to-a-cmake-project) -- they really were a great help during debugging
- Highly recommend installing `locate` -- it literally just finds a file in your whole system. `locate libopencv` will give you the positions of all your installed OpenCV libraries. Also `sudo updatedb` if you added/removed files, and you want to update the `locate` index. 
- `tldr` is probably the best CLI thing you'll learn ever -- it's a superior version of `man`.  Useful always. More about it here: [https://github.com/tldr-pages/tldr](https://github.com/tldr-pages/tldr)
- `grep -Ril "cv::VideoCapture" .` looks for lines containing this string in all files in your directory (and subdirectories)