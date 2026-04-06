---
title: libffi.so.7 not found after Linux update
pubDate: 2022-02-16

tags: [linux]
categories: [Programming, Bugfix]
---

# Issue

I recently ran a global update of my system by executing 
```bash
sudo pacman -Syu
```

One of my work `pyenv` environments contained `scipy==1.5.4`\
Running `import scipy.ndimage as nd` produced this error:

```text
ImportError: libffi.so.7: cannot open shared object file: No such file or directory
```

Which meant that the recent Linux update removed `libffi` version 7 from the system.

# Solution
The solution was just to install the version I needed
```bash
git clone https://aur.archlinux.org/libffi7.git
cd libffi7
makepkg -si
```

I found this solution initially on lakur's website: [https://lakur.tech/2021/10/21/arch-linux-cannot-find-shared-library-libffi-so-7/](https://lakur.tech/2021/10/21/arch-linux-cannot-find-shared-library-libffi-so-7/)