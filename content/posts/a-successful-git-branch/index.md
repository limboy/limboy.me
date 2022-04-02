+++
title= "(译)Git开发管理之道"
date = 2010-10-30
description = ""
[taxonomies]
tags = ["git", "translation"]
[extra]
giscus = "telescope"
+++

Git 的强大是众所周知的，本文要分享的是关于"使用 Git 的分支和合并功能来进行版本管理的开发模型"。以下是译文，<a href="http://nvie.com/posts/a-successful-git-branching-model/">原文地址</a>

这篇文章我想介绍一下一年前就提到过的我所有项目(工作/私有)都在使用的开发模式，经过事实验证，确实非常可行。很早就想写了，一直没腾出时间。我不会涉及项目的细节，只是谈谈分支的使用策略和发布管理。

<img src="http://nvie.com/img/git-model@2x.png" />

上图是使用 Git 这个版本控制工具来管理所有源码的。

### 为什么使用 Git

如果要看详细的 Git 与集中式源码管理工具的优势与劣势，可以参见<a href="http://git.or.cz/gitwiki/GitSvnComparsion">这篇文章</a>，那里有很多口水仗。作为一个开发人员，所有的源码管理工具中，我最喜欢 Git。Git 从根本上改变了开发人员对分支和合并的使用，传统的 CVS/SVN，分支和合并都是高级话题，而且使用起来稍显麻烦，隔一段时间才会用一次。但是有了 Git，这些操作就成了家常便饭。

由于使用简单，方便重复操作，分支和合并不再是让人望而生畏的操作，版本管理工具应该尽可能地对分支/合并提供最好的支持。

工具谈得差不多了，回到开发上。我待会要讲到的模型其实是一些每个开发人员都应该遵守的步骤，如果想管理好软件的开发流程的话。

### 分布式但集中化

我们要使用的仓库是一个"中心库"，当然这个中心库只是被认为是这样(因为 Git 是分布式的，从技术层面上来说是没有中心库的)，我们将把这个仓库叫做"origin"，因为 Git 用户都熟悉这个名字。

<img src="http://nvie.com/img/centr-decentr@2x.png" />

每个开发者 pull 和 push 到 origin，但除了中心化的 push-pull 关系外，每个开发者还可以从其他开发者那 pull changes。比如说，对于一个比较大的新特性，在把代码提交到 origin 之前，很可能会安排 2 个或多个开发者。上图中有几个小团队：Alice 和 Bob，Alice 和 David，Clair 和 David。

从技术角度来说，其实就是 Alice 定义了一个叫 Bob 的 Git remote，指向到 Bob 的仓库。

### main 分支

中心仓库有两个分支：

- master
- develop

origin 上的 master 分支，Git 用户应该很熟悉，跟 master 并行的有一个 develop 分支

<img src="http://nvie.com/img/main-branches@2x.png" />

我们把 origin/master 作为主要分支，源码的 HEAD 总是表示 production-ready(可随时部署)状态。而 origin/develop 上的代码是为下一次的代码发布准备的。每日构建也是基于此分支。

当 develop 分支达到了一个稳定状态并准备发布时，所有的改变都要合并到 master 分支，并标上版本号。如何实现的下面细说。

这样每次与 master 合并都会有新的部署发布。这点可以自动化，如使用 Git hook 脚本来实现自动部署代码到线上。

### 支持(supporting)分支

我们的开发模型使用了一些支持分支放在 master 和 develop 分支的旁边，方便开发小组之间的并行开发。不像 main 分支，这些分支是有时间限制的，因为他们最终都会被移除。

我们会使用到的不同的分支

- Feature branches
- Release branches
- Hotfix branches

每个分支都有各自的作用，并且有严格的规定，如：只能从哪个分支上去新开分支，只能合并到那个分支。这个待会细说。

### Feature branches

<img src="http://nvie.com/img/fb@2x.png" />

继承分支: develop
合并分支：develop
命名规范：除了 master,develop,release-_,hotfix-_

Feature branches 是用来开发新特性的(短期，远期都可以)。当开始开发新特性时，很可能不知道这个特性会出现在哪个目标版本。一旦开发完成就可以合并到 develop，当然如果开发失败，就可以抛弃。

### 创建一个 Feature branch

当要创建一个新特性时，从 develop 分支上再进行分支

```bash
$ git checkout -b myfeature develop
Switched to a new branch "myfeature"
```

新特性完成时，可以合并到 develop

```bash
$ git checkout develop
Switched to branch 'develop'
$ git merge --no-ff myfeature
Updating ea1b82a..05e9557
(Summary of changes)
$ git branch -d myfeature
Deleted branch myfeature (was 05e9557).
$ git push origin develop
```

{% aside(level="info") %}
--no-ff (译者注：no fast foward)标签，使得每一次的合并都创建一个新的 commit 记录。即使这个 commit 只是 fast-foward，这样可以避免丢失信息
{% end %}

<img src="http://nvie.com/img/merge-without-ff@2x.png" />

不幸的是，我没有找到让--no-ff 成为 commit 默认参数的方法(译者注：修改.consolerc?)，但确实应该提供一个方法。

### Release branch

```
继承分支: develop
合并分支：develop 和 master
命名规范：release-\*
```

Release branch 是为新的 production release 准备的(译者注：相当于 RC 版)，可以有一些小的 bug，并为发布准备一些元数据(版本号，构建日期等等)。把所有的这些工作都放到 Release branch，develop branch 就能更清晰地知道下一个版本要开发哪些特性。

从 develop 分支合并到 release 分支的关键因素是:develop 分支达到了 release 分支所要求的状态。至少所有针对该 release 的特性要被合并。至于那些将来会有的特性可以先放一放。然后就是为接下来即将要发布的版本分配一个版本号。

### 创建一个 Release branch

Release branch 是通过 develop 分支而创建。举个例子，假如 1.1.5 是当前的 production release，然后会有一个比较大的版本发布。develop 的状态已经可以发布版本了，经过商榷后，决定发布为 1.2 版本(而不是 1.1.6 或 2.0)，所以我们创建一个 release 分支，并给这个分支一个新的版本号

```bash
$ git checkout -b release-1.2 develop
Switched to a new branch "release-1.2"
$ ./bump-version.sh 1.2
Files modified successfully, version bumped to 1.2.
$ git commit -a -m "Bumped version number to 1.2"
[release-1.2 74d9424] Bumped version number to 1.2
1 files changed, 1 insertions(+), 1 deletions(-)
```

这个新分支可能会存在一定的时间，直到可以被合并到 production branch。这段时间内，bug 修补可以在这个分支上进行(而不是 develop 分支)。添加新特性(尤其比较大的)是不允许的。最后还是要被合并到 develop，然后继续在 develop 分支上开发，直到下一个版本。

### 完成一个 release branch

当 release branch 已经准备就绪，需要做几件事。首先，release 分支被合并到 master 分支上(每一个提交到 master 上的 commit 都是一个新版本，切记)。然后 master 上的 commit 都要添加 tag，方便将来查看和回滚。最后 release 上所做的修改必须合并到 develop 分支上，保证 bug 已被修补。

前两个步骤：

```bash
$ git checkout master
Switched to branch 'master'
$ git merge --no-ff release-1.2
Merge made by recursive.
(Summary of changes)
$ git tag -a 1.2
```

为了把 release 上的改变保存到 develop，我们需要合并到 develop

```bash
$ git checkout develop
Switched to branch 'develop'
$ git merge --no-ff release-1.2
Merge made by recursive.
(Summary of changes)
```

这个步骤可能会导致冲突，如果这样的话，解决冲突，然后再提交。

现在一切都完成了，可以把 release branch 干掉了。

```bash
$ git branch -d release-1.2
Deleted branch release-1.2 (was ff452fe).
```

### Hotfix branch

```
继承分支: master
合并分支：develop 和 master
命名规范：hotfix-\*
```

Hotfix branch 和 Release branch 有几分相似，都是为了新的 production release 而准备的。比如运行过程中发现了 bug，就必须快速解决，这时就可以创建一个 Hotfix branch，解决完后合并到 master 分支上。好处是开发人员可以继续工作，有专人来负责搞定这个 bug。

### 创建 Hotfix branch

<img src="http://nvie.com/img/hotfix-branches@2x.png" />

Hotfix 是从 master 分支上创建的。假如当前运行版本是 1.2，然后发现有 bug，但是 develop 还在开发中，不太稳定，这时就可以新开一个 Hotfix branch，然后开始解决问题。

```bash
$ git checkout -b hotfix-1.2.1 master
Switched to a new branch "hotfix-1.2.1"
$ ./bump-version.sh 1.2.1
Files modified successfully, version bumped to 1.2.1.
$ git commit -a -m "Bumped version number to 1.2.1"
[hotfix-1.2.1 41e61bb] Bumped version number to 1.2.1
1 files changed, 1 insertions(+), 1 deletions(-)
```

解决问题，一次或几次 commit

```bash
$ git commit -m "Fixed severe production problem"
[hotfix-1.2.1 abbe5d6] Fixed severe production problem
5 files changed, 32 insertions(+), 17 deletions(-)
```

### 完成 Hotfix branch

当结束时，bugfix 要被合并到 master，同时也要合并到 develop，保证下个版本发布时该 bug 已被修复。这跟 release branch 完成时一样。

首先更新 master 和 tag release

```bash
$ git checkout master
Switched to branch 'master'
$ git merge --no-ff hotfix-1.2.1
Merge made by recursive.
(Summary of changes)
$ git tag -a 1.2.1
```

接下来与 develop 合并

```bash
$ git checkout develop
Switched to branch 'develop'
$ git merge --no-ff hotfix-1.2.1
Merge made by recursive.
(Summary of changes)
```

有一个例外，就是当一个 release branch 存在时，bugfix 要被合并到 release 而不是 develop，因为 release 最终会被合并到 develop。

最后移除 branch

```bash
$ git branch -d hotfix-1.2.1
Deleted branch hotfix-1.2.1 (was abbe5d6).
```

### 总结

这个开发模型其实没有什么新颖的，一开始提到的"大图"确实在我们的项目起到了非常大的作用。这是很优雅的一个模型，很容易实现，也容易在团队成员之间达成一致。

PS:需要这个模型大图的，可以去<a href="http://nvie.com/posts/a-successful-git-branching-model/">原文地址</a>下载
