+++
title= "我的前端学习路线"
date = 2022-04-04
[taxonomies]
tags = ["programming", "frontend"]
[extra]
+++

## 为什么要学习前端

前端开发，开发的到底是什么呢？严格来说是运行于浏览器（或者与 Native 结合的混合式架构）之上的图形化交互页面（GUI）。可以是一个网站，也可以是一个单页面应用（如 [Worlde](https://www.nytimes.com/games/wordle/index.html)），基于 WegGL 还能做出很[炫酷的效果](https://stars.chromeexperiments.com)，或者接近 Native 的体验（如 [Figma](https://figma.com)），借助跨平台框架（如 [React Native](https://reactnative.dev/)，[Electron](https://www.electronjs.org/), [Tarui](https://tauri.studio/)）能够让前端页面与 Native 深度结合。

所以前端开发有较多的落地场景，相比其他的编程类别，前端开发更贴近用户，门槛也相对低一些（仅仅是门槛，要做到出类拔萃难度还是挺高的），这让那些对创作有热情，但计算机基础又不是那么牢固的人（比如我）可以有一个不错的创作空间。除此之外以下几点也是选择前端开发的重要原因：

### 开发体验佳

得益于 IDE、包管理工具、浏览器及其他开发工具的持续迭代和优化，前端的开发体验已越发舒适。比如 [vite](https://vitejs.dev/) 让代码改动（即使代码量很大）能实时反映在浏览器（这不仅能提高开发效率，对于保持心流状态也很重要），VS Code 良好的代码编写体验和丰富的插件，[pnpm](https://pnpm.io) 对 `node_modules` （如包的平行罗列，文件夹 size 大等）的改善，Chrome 在性能和调试能力上的不断优化和改进，TypeScript 也降低了编写易维护代码的门槛。

### 天然跨平台

只要一个 URL，就能在不同的设备访问，而且保持相同的体验，这个感觉太棒了。

### 上线快且不会被卡

如果是移动端 App，不可避免地要与审核人员打交道，被打回也是常事。如果线上出了问题，iOS 平台只能重新发版走审核流程，前端则没有这个问题。

### 发展蓬勃

经常会看到有人吐槽前端开发变化太快了，一个工具还没玩明白，新的工具又出来了。我觉得这是好事，说明有活力又尚未完全成熟，这不就是进入这个行业的好时机么？

<a href="https://2021.stateofjs.com/en-US/opinions">{{img(path="/posts/frontend-learning/frontend-happiness.jpg")}}</a>

### 故障影响小

当然这是相对的，前端也可以出现很严重的故障，只是相比后端，跟用户的数据打交道，前端犯错的可容忍性和可恢复性会高一些。我甚至觉得同是编程，前端和后端是两种类型的人，前者更 Creative，后者则更需要考虑细致和沉稳。

## 我的前端学习路线

前端涉及到的内容会很多，如果没有 Roadmap 很容易迷失（尤其是对刚入门的新手），以下是我整理的一张表格，作为自己的 Roadmap。

<a href="/posts/frontend-learning/frontend-roadmap.jpg">{{img(path="/posts/frontend-learning/frontend-roadmap.jpg")}}</a>

划分为 7 大板块：

- **Computer Science** (基础，无论从事哪类编程都要了解)
- **Software Engineering**（软件工程，也属于基础，但更贴近实战）
- **Nice to Have**（Optional，如果掌握这些技能可以加分）
- **Frontend Tooling**（前端的工具集）
- **Framework & Libraries**（前端相关的开发框架和类库）
- **Web Related**（Web 相关的知识点）
- **Toolkit**（开发环境相关）

然后根据 **Know in General**（知道大概原理），**Familiarity with Usage**（熟练使用）和 **Know in Detail**（了解实现细节）来设置每一块的学习目标，比如对于 Computer Science 来说，知道大概原理即可，不需要牢记细节。而对于日常会使用的 Framework 和 Library 则需要深入了解实现，甚至能手动写一个。

每个板块里的内容，会按照我自己的喜好来学习，比如包管理工具我更喜欢 `pnpm`，Computer Science 里学习操作系统相关的内容会选择 [OSTEP](https://pages.cs.wisc.edu/~remzi/OSTEP/) 这本书等等。

有了这张图，学习起来会更有底：自己目前大概到了哪个阶段，哪块需要重点补强一下，优先学习哪个（感觉跟「皇室战争」升级建筑一样一样的 😂）。

---

2022/06/21 更新了更全的学习内容

## Career

- Building a Career in Software
- The Passionate Programmer
- Unwritten Laws of Engineering
- The Clean Coder: A Code of Conduct for Professional Programmers

## Inspire

- [Book] The Design of the UNIX Operating System
- [Book] UNIX: A History and a Memoir
- [Book] How Linux Works
- [Book] Mastering Bitcoin: Programming the Open Blockchain
- [Book] Software Engineering at Google
- [Paper] Peer-to-peer networking with BitTorrent
- [Paper] state charts: a visual formalism for complex systems
- [Paper] How to share a secret
- [Paper] Kademlia: A Peer-to-peer Information System Based on the XOR Metric
- [Paper] Out of the Tar Pit
- [Paper] On the criteria to be used in decomposing systems into modules
- [Paper] Build systems à la carte: Theory and practice
- [Paper] In Search of an Understandable Consensus Algorithm
- [Article] Solving Every Sudoku Puzzle
- [Article] How to Write a Spelling Corrector
- [Lecture] Distributed Systems (via Martin Kleppmann)
- [Presentation] Inventing on principle

## Computer Science

- OSTEP
- 图解 TCP/IP
- 网络是怎样连接的
- 剑指 offer
- Algorithm Design Manual
- 编程之美
- SCIPJS
- Pearls of Functional Algorithm Design
- System Design Interview

## Maintainable and Reliable Code

- How to Design a Good API and Why it Matters
- Philosophy of Software Design
- The Pragmatic Programmer
- Refactoring: Improving the Design of Existing Code
- Clean Code: A Handbook of Agile Software Craftsmanship
- Test-Driven Development: By Example
- Microservices Patterns
- Composing Software
- Concepts, Techniques, and Models of Computer Programming
- Fundamentals of Software Architecture: An Engineering Approach
- Software Architecture: The Hard Parts

## Frontend

### Dev Mate

- VS Code
- Chrome
- Git
- Docker

### Languages

- JavaScript
- TypeScript

### Web

- HTML
- CSS
- Web API

### Tools and Libraries

- Next.js
- Jest
- Windi CSS
- Prisma
- Vite
- pnpm
- fastify
- React
  - React Testing Library
  - React Query
  - React Router
  - Zustand
  - Immer
  - Mantine
  - Framer Motion

### Learn

- css-doodle
- Turborepo
- Preact
- SolidJS
- million
- alpine
- swr
- vite
- rollup
- patterns.dev
- browser.engineering
