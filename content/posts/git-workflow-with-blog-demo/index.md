+++
title= "git多人协作开发流程(以blog为例)"
date = 2011-02-25
description = ""
[taxonomies]
tags = ["programming", "git"]
[extra]
giscus = "telescope"
+++

时间仓促，能力有限，错误难免(代码没有经过实际验证，所以可能会有问题)，欢迎指正 :)

这个开发流程就是基于<a href="http://nvie.com/posts/a-successful-git-branching-model/">a successful git model</a>这篇文章而来的，如果对英文不感冒的话，我这有<a href="http://blog.leezhong.com/translate/2010/10/30/a-successful-git-branch.html">翻译版</a>

**项目背景：**

```
张三 / 李四 / 王五 打算共同协作，开发一套博客系统
```

**项目分工：**

```
张三 / 李四 负责文章系统
王五负责评论系统
```

### 建立服务端仓库

git 虽然是分布式版本管理工具，但为了方便管理，我们需要建立一个中心仓库，先在服务端建立两条分支

```
master
develop
```

master 保存稳定版(production ready)，开发人员平时的代码都提交到 develop 分支上

### 开发者的 Git 分支

#### 张三的 Git 分支

因为张三和李四同时开发文章系统，所以就有了下面的分支

```bash
# 张三的Git分支
article (local)
lisi/article (via git remote add lisi http://lisi-server/lisi.git)
origin/master (via git remote add origin http://remote-server/blog.git)
origin/develop
```

#### 李四的 Git 分支

跟张三类似，不过 article server 变成了张三的

```bash
# 李四的Git分支
article (local)
zhangsan/article (via git remote add zhangsan http://zhangsan-server/zhangsan.git)
origin/master (via git remote add origin http://remote-server/blog.git)
origin/develop
```

#### 王五的 Git 分支

因为只有王五一个人开发评论系统，所以只要一条远程分支就行了

```bash
# 王五的Git分支
comment (local)
origin/master (via git remote add origin http://remote-server/blog.git)
origin/develop
```

### 开发过程

#### 张三和李四

假设张三负责文章的管理，及前端显示。李四负责文章的分类和标签系统。

张三开发完一部分后(n 次本地 commit)，提交到本地的 git server(也就是李四添加的 http://zhangsan-server/zhangsan.git)。

李四开发完一部分后，因为要与张三开发的部分合并，所以需要执行一下 rebase 或 merge

```bash
# 当前在article分支中
git rebase zhangsan/article
# 提交到本地的git server (也就是张三添加的http://lisi-server/lisi.git)。
git push local/article master
```

这时张三又开发完了一部分，他也会走跟李四一样的流程，rebase & push (如果有冲突，解决之)。

假设由张三统一负责将每日的开发进度提交到 remote develop 分支上，张三在执行了上面所说的流程后，提交到服务端的 develop 分支。但这时很可能王五已经把他写的代码提交了，所以要先执行一下 rebase

```bash
git rebase origin/develop
git push origin develop
```

这样张三和李四的代码就都提交到了服务端的 develop 分支上。王五那边的流程也一样，只是少了本地同步的过程。

### 开发完毕，进入测试阶段

经过几天的开发，各个功能都已基本完成，下面就要进入测试阶段。具体做法是在服务端新添加一个分支，命名为 release，所以这时服务端就有 3 个分支了

```bash
master
develop
release
```

三位同学都在本地新建一个 branch，对应服务端的 release 分支

```bash
git checkout -b release origin/release
```

分别进行测试，如果发现问题，则执行 pull & push

```bash
# 当前在release分支下
git pull origin release
git push origin develop
```

经过几天的测试后，发现没什么问题了，就可以发布稳定版了，假设为 0.1

```bash
git checkout master
git rebase origin/release
git tag 0.1
git push origin master --tags
```

同时别忘了把 release 分支上的代码与 develop 分支合并，保证 develop 分支上不会有遗留的 bug。(没有找到如何直接 merge 两个服务端 branch 的方法)

```bash
git checkout develop
git rebase origin/release
git push origin develop
# 删除服务端的release分支
git push origin :release
```

接下来就可以继续在 develop 分支上进行开发了。

### 添加新特性

博客系统需要添加 archives 功能，这个功能的开发就交给了新来的赵六。此时，在服务端新开一个分支，命名为 feature，这时服务端的分支就变成了这样

```bash
master
develop
feature/archive
```

赵六也在本地建立一个 archive 分支，每天提交到服务端的 feature/archive，赵六的 Git 分支是这样的(不相关的服务端 Git 已省去)

```bash
master
archive
origin/feature/archive
```

等到这个 feature 开发完了，与服务端的 develop 分支执行一下 rebase，然后再提交到服务端的 develop，这样博客的 archive 功能就有了

```bash
git checkout archive
git rebase origin/feature/archive
git push origin feature/archive
# 如果要删除服务端的feature/archive分支的话
git push origin :feature/archive
```

接下来的流程跟上面的一样：开发完毕后，新建 release 分支，在那上面进行 bug 修复，修复完毕后，merge 到服务端的 master 和 develop

### 紧急修复漏洞

博客出现了一个 xss 漏洞，需要尽快修复，这时新建一个 hotfix 分支(现在本地建，然后提交到服务端)，然后对漏洞进行修复，修复完后，提交到服务端的 master 和 develop

```bash
git checkout master
git pull origin master
git checkout -b hotfix
# 漏洞修复...
# 修复完后
git push origin hotfix
git checkout master
git rebase hotfix
git push origin master
git push origin develop
```
