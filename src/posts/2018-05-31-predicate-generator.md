---
title: Predicate Generator
pubDate: 2018-05-31

tags: [math]
categories: [Programming, Projects]
---

This algorithm can be used to **generate mathematical expressions**.\
*Pretty cool, right?*

- The Github repo: [https://github.com/Xallt/PredicateGenerator](https://github.com/Xallt/PredicateGenerator)

It's a generator of logical expressions with the ability to translate them to a given *language*. 

### Examples

All the output is translated to LaTeX:

|     |     |     |
|:---:|:---:|:---:|
|*Basic*|*Mathematical*|*English*|
|![](../assets/img/predicate-generator/BasicScreenshot.png)|![](../assets/img/predicate-generator/MathScreenshot.png)|![](../assets/img/predicate-generator/EngNaturalScreenshot.png)|

Adjacent expressions are similar because the algorithm outputs the lines in lexigraphic order

Here are actually interesting generated "statements" (not all of them are true)\
In this context variables are only non-negative integers


![The first generated predicates](../assets/img/predicate-generator/MathFirstScreenshot.png)

**1)** 2 is a prime number\
**2)** <del>Every single number is prime</del>\
**3)** Prime numbers exist **!**\
**5)** Every number is equal to itself\
**6)** There are numbers which are equal to themselves\
**7)** Not all numbers are prime\
**8)** <del>Prime numbers don't exist</del>\