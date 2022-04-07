+++
title= "刚好够用的简易前端工具集"
date = 2022-04-07
description = ""
[taxonomies]
tags = ["programming", "frontend"]
[extra]
+++

前端构建工具总给人一种很 magic 很复杂的感觉，理解它需要花一番工夫，不理解直接用的话，总觉得心里不踏实，出问题或者加需求不一定能搞定。我习惯用 React，官方推荐用 [Create React App](https://create-react-app.dev/) 来创建项目，但它给我的感觉太黑盒了，而且新建一个项目就会添加 1000 多个 package，也不知道这 1000 多个 package 是干啥用的。

```
$ npx create-react-app demo

Creating a new React app in ...

Installing packages. This might take a couple of minutes.
Installing react, react-dom, and react-scripts with cra-template...

added 1354 packages in 18s
```

如果用 webpack 的话，挑战也很大，首先要捋清它的工作模式就要费一番工夫，文档都啃下来也不简单，同时它又很灵活，提供了几十个 Hook，每个 Hook 都对应不同的时机，有自己的参数，文档上也没有详细说明这些 Hook 具体的时机和适合的使用场景。插件很丰富，但挑起来也很累，配置项很多，大约有 10086 个（当然，此处用了夸张手法），有些 Plugin 如 [html-webpack-plugin](https://github.com/jantimon/html-webpack-plugin) 还有自己的 Plugin。对于前端新人真的很劝退。

如果是自己的前端项目，能实现以下几点就可以了：

1. js 这块能通过 `npm install` 安装依赖，打出一个 js 包（最好支持 tree-shaking）
2. css 这块能支持类似 tailwind 的使用姿势
3. 维护方便，部署方便

对于第 1 点，可以使用 [esbuild](https://esbuild.github.io/)，这是一个用 go 写的 js bundler（可以把相关的 js 文件合并成一个浏览器可以识别和运行的 js 文件），足够快，功能也够用，虽然还未到 1.0，但已被一些知名项目使用（如 vite / snowpack）。

对于第 2 点，可以使用 [windicss](https://windicss.org/)，相比 [tailwind](https://tailwindcss.com/) 更轻量，性能也更好。

对于第 3 点，我预期的目录结构是这样的：

```
|- dist/
|- assets/
|- styles/
|- layouts/
  |- index.html
|- scripts/
  |- index.jsx
  |- components/
    |- App.jsx
|- package.json
```

- `dist` 是待发布的目录，运行 `npm build` 命令后所有的文件都会在这个目录下。
- `assets` 用来放资源文件（如图片）
- `styles` css 文件
- `layouts` html 文件
- `scripts` react 等 js 文件

每个目录的职能都很清晰，也没有各种 config 文件，维护起来比较方便（为什么是按 function 来分，而不是 feature，可以看下[这篇文章](https://www.joshwcomeau.com/react/file-structure/)），部署也很简单。

{% aside(level="info") %}
关于 HMR（Hot Module Replacement），我觉得是 Plus，不是 Essential，如果能在（几乎）不增加复杂度的前提下提供这个功能，自然可以有，但如果因此增加了复杂度和理解成本，那就先放一放。
{% end %}

`index.html` 是入口页，这里会引用最终的 css 和 js 文件

```html
<head>
  <link rel="stylesheet" href="/assets/index.css" />
  <link rel="icon" href="https://fav.farm/👻" />
</head>

<body>
  <div id="root"></div>
  <script src="/assets/index.js"></script>
</body>
```

`index.jsx` 是 js 的入口文件

```js
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './components/App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(App());
```

`package.json` 的核心内容大概是这样的：

```json
{
  "scripts": {
    "dev-js": "cp -r layouts/* dist && cp -r assets dist && esbuild scripts/index.jsx --servedir=dist --outdir=dist/assets --bundle",
    "dev-css": "windicss './layouts/**/*.html' './scripts/**/*.{js,jsx}' -o dist/assets/index.css --dev",
    "dev": "concurrently -g 'npm:dev-*'",
    "build-js": "cp -r layouts/* dist && cp -r assets dist && esbuild scripts/index.jsx --bundle --minify --outfile=dist/assets/index.js",
    "build-css": "windicss './layouts/**/*.html' './scripts/**/*.{js,jsx}' -o dist/assets/index.css --minify",
    "build": "concurrently -g 'npm:build-*'"
  },
  "dependencies": {
    "esbuild": "^0.14.32",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "windicss": "^3.5.1"
  },
  "devDependencies": {
    "concurrently": "^7.1.0"
  }
}
```

简单说明下 `scripts` 栏下的几个命令:

- `dev-js`: 把相关内容复制到 dist 目录下，然后让 `esbuild` 来 serve 这个目录，当 js 文件有变化时，再次请求页面，就会得到最新的 js 文件。
- `dev-css`: `windicss` 监控特定目录下的文件，有变化时会自动生成新的 css 文件。
- `dev`: 通过 [concurrently](https://www.npmjs.com/package/concurrently) 一并执行 `dev-js` 和 `dev-css`。
- `build-js`: 通过 `esbuild` 命令把 js 文件打包成一个（minify 之后）。
- `build-css`: 通过 `windicss` 命令扫描项目中的关键字，并生成 minify 后的 css 文件。
- `build`: 通过 [concurrently](https://www.npmjs.com/package/concurrently) 一并执行 `build-js` 和 `build-css` 。

之后如果想要新增依赖，用 `npm install` 或 `pnpm add` 就行了，相比 `create-react-app` 或者 `webpack`，能力上肯定会弱一些，但也更容易理解。

这就是我目前的「刚好够用的简易前端工具集」的尝试，用来写简单的页面应该够用了，如果你有别的想法，也欢迎交流～
