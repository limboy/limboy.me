+++
title= "Alpine, Tailwind, Deno, SQLite 我的本地服务四件套"
date = 2022-07-02
[taxonomies]
tags = ["programming"]
[extra]
+++

有时会想要写一些本地服务来满足自己特定的需求。这个本地服务需要支持 GUI，可以读写本地文件。如果写一个命令行工具，在交互和展示上会有一定限制。[Next.js](https://nextjs.org) / [Electron](https://www.electronjs.org/) / [Tauri](https://tauri.studio/) 这样的全功能解决方案又显得太重。不想引入编译，不想看到 `node_modules`。

这么看下来，一个前端页面结合本地的后端服务是比较合适的。对于前端页面，如果选择 `React` 或 `Vue`，则不可避免地要引入一整套编译工具，以及 `node_modules`。使用 `jQuery` 又过于 Old School。[Alpine](https://alpinejs.dev/) 则刚刚好，使用姿势上跟 `Vue` 类似，但更轻量，不需要编译。CSS 使用了 [Tailwind](https://tailwindcss.com/) 后，就很难回去了，方便起见，就直接使用了 Tailwind 的 CDN 文件。

```html
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <script defer src="https://unpkg.com/alpinejs@3.x.x/dist/cdn.min.js"></script>
  <link
    href="https://unpkg.com/tailwindcss@^2/dist/tailwind.min.css"
    rel="stylesheet"
  />
</head>
```

后端服务的话，如果用 `node`，就要用到 npm 等包管理工具，就会有 `node_modules`。如果用 `python`，也要在众多的包管理工具中找一个合适的，还要适应它的使用姿势，可能还要结合 `pyenv`，对一个简单的本地服务来说还是太复杂了。而 [deno](https://deno.land/) 正好可以解决这些问题：内置了包管理功能，不需要额外的 `package.json` 或类似的 package 声明文件；原生支持 JavaScript、TypeScript；自带了很多开箱即用的功能（batteries-included）；周边生态也还可以。

数据库的话，SQLite 再合适不过了，功能强大，足够 Solid，单文件，不需开启额外的进程。

假如要写一个本地的密码管理工具，只需要 3 个文件：

```
- LocalPass.html
- LocalPass.js
- LocalPass.db
```

在 `LocalPass.js` 里，如果要引入三方 Lib，只需：

```js
import {
  Application,
  Router,
  helpers,
} from 'https://deno.land/x/oak@v10.6.0/mod.ts';
import * as sqlite from 'https://deno.land/x/sqlite@v3.4.0/mod.ts';
```

开发模式下，可以使用 `deno run -A --watch LocalPass.js`，这样只要 `LocalPass.js` 文件有变动，就会自动 restart。对一个简单的服务来说，开发效率还是挺高的，而且维护起来也很方便。  开放给其他人使用的话，只要对方安装好 `deno` 就可以了，一个命令直接跑。

以下是[该项目](https://github.com/limboy/localpass)的一个演示效果：

{{video(src="/posts/local-services-tools/LocalPassDemo.mp4")}}

如果你了解一些前端，想要写一个本地服务（比如给命令行工具 [youtube-dl](https://youtube-dl.org/) 写一个更友好的界面）时，可以试一下这套配搭，还是挺方便的。
