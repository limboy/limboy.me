+++
title= "使用github作为博客引擎"
date = 2010-08-25
description = ""
[taxonomies]
tags = ["essay", "github"]
[extra]
giscus = "telescope"
+++

在介绍之前，先普及一下基础知识，大鸟们直接跳过。

### 什么是 git

git 是一个分布式版本控制工具(DVCS)，不需要服务端软件支持(即使在地铁里也可以正常 commit)，Linux 内核开发用的版本控制工具就是它。

常用的 SVN 属于集中式版本控制工具(CVCS)，需要在服务端开启 SVN 服务，然后客户端 checkout,commit,update。

更详细的介绍请参考<a href="http://en.wikipedia.org/wiki/Git_(software)">维基百科</a>

### 什么是 github

"github":http://github.com/ 的标语是："secure source code hosting and collaborative development"。一个基于 git 的类似 google code 的代码仓库，付费版的用户可以创建私有仓库，支持多人开发。很多项目都选择了 github 来保存代码，如"jQuery/reddit/RoR/CakePHP/Redis"等等。

### github pages

先说说 pages 功能，blog 就是在 pages 的基础上搭建的。如果英文不错的话，可以直接<a href="http://pages.github.com/">浏览此页</a>

创建一个用户的页面很简单，假设你的用户名为 foo

1. 新建一个仓库(repository)，名称填"foo.github.com"，创建
2. 在本地新建一个文件夹，假如为 foo,在 foo 里面新建一个 index.html 页面，随便输入点内容
3. `git init` 初始化，`git add .` 把 index.html 加入到仓库中，`git commit` 提交修改
4. 添加 github 的分支 `git remote add origin git@github.com:foo/foo.github.com.git`
5. 提交到 github 分支 `git push origin master`

过 1 分钟左右，浏览 foo.github.com，就可以看到刚刚创建的 index.html 文件了。

除了创建用户页面，还可以针对每个项目单独创建项目的主页，这不是本文的重点，有兴趣的可以<a href="http://pages.github.com/">浏览此页</a>

### 创建 blog

终于扯到正题上了(-,-)，前面已经说过如何创建 html 页面，其实已经可以写博客了，创建一个 index.html 页面，在里面列出写过的文章，点击标题进去后又是一个手动创建的 html 页。就是太麻烦了，一点都不酷，说不定还会被 MM 鄙视。

github 当然知道这个问题，所以他们创建了<a href="http://github.com/mojombo/jekyll">jekyll 模板引擎</a> 。简单来说，就是你可以用<a href="http://www.textism.com/tools/textile/?sample=2">textile</a> 或者<a href="http://daringfireball.net/projects/markdown/syntax">markdown</a>语法来写博客，提交到 github 后，会自动转换成 html。

<a href="http://wiki.github.com/mojombo/jekyll/sites">这里</a>有很多网站/博客，都是基于 github 的 jekyll 模板开发的，如果觉得哪个不错，可以查看 source。

先来看看<a href="http://github.com/mojombo/mojombo.github.com">这个仓库</a>，里面有一些特殊的文件/文件夹：

### \_config.yml

存储了一些设置，大部分的设置都可以通过命令行指定，但放到配置文件里更方便些

#### \_layouts

\_layouts 文件夹存放的是模板文件，文章会被渲染到这些模板里，{{ content }}变量指代的是文章内容

#### \_posts

这里就是真正存放博客文章的地方了，文件命名要遵守这种格式:year-month-day-title.markup

#### \_site

这个文件夹是程序生成的，如果本地没有安装 jekyll 的话，是不会有这个文件夹的，如果想要先本地预览一下，再提交到 github，最好通过.gitignore 把这个文件夹排除。

#### index.html

这个文件也有一个<a href="http://wiki.github.com/mojombo/jekyll/yaml-front-matter">yaml 前缀</a> ，可以指定使用哪个模板，标题等等，所有根文件夹下的.html/.htm/.textile/.markdown 都会被解析。

#### other files/folders

上面没有列出的文件/文件夹都会被 jekyll 放到\_site 文件夹下，如 css/image/script 等等。

### jekyll 的安装

参考<a href="http://wiki.github.com/mojombo/jekyll/install">安装页</a> ，如果使用时提示"liquid requires RubyGems version >= 1.3.7"，可以在<a href="http://rubyforge.org/frs/?group_id=126">这里</a> 下载对应的文件，安装即可。

安装完之后，为了避免路径调用问题，可以在 apache/nginx 里给对应的文件夹(/path/to/\_site)绑定一个本地域名，如"lc.foo.github.com"，在终端里输入"jekyll --pygments"，然后就可以用该域名访问本地博客了，如果一切正常，再提交到 github

PS:如果你之前的博客是基于 wordpress/movable type/typo 4+，可以参考这篇<a href="http://wiki.github.com/mojombo/jekyll/blog-migrations">迁移指南</a>

### 绑定域名

这个就更简单了，新建一个 CNAME 文本文件，在里面输入域名，如"blog.leezhong.com"，然后在域名提供商里，指定该域名的 CNAME 为"foo.github.com"，搞定

### 添加评论功能

使用<a href="http://disqus.com">disqus</a> ，整个注册和使用流程还是挺清晰易懂的，这里就不多说了。

### 参考文章

- "jekyll wiki": [http://wiki.github.com/mojombo/jekyll/](http://wiki.github.com/mojombo/jekyll/)
- "github blog": [http://github.com/blog/272-github-pages](http://github.com/blog/272-github-pages)
- "publishing a blog with github and jekyll": [http://blog.envylabs.com/2009/08/publishing-a-blog-with-github-pages-and-jekyll/](http://blog.envylabs.com/2009/08/publishing-a-blog-with-github-pages-and-jekyll)

### 后记

之前一直用的 wordpress，但是太臃肿了，而且有安全隐患，还得有一个 PHP 空间，访问速度也得不到保证。平时 github 用得比较多，正好他们提供"博客"服务，正合我意，初步使用下来，没有什么问题，能在本地用 vim 写 textile 语法的博客是一件多么爽的事情啊，还可以本地预览最终效果，数据也不会轻易丢失。

最后再次感谢 github 提供了这么好的服务，如果对 github 的创业历程感兴趣，可以参考<a href="http://tom.preston-werner.com/2008/10/18/how-i-turned-down-300k.html">这篇文章</a>
