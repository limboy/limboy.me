+++
title= "开发新版花瓣iPhone客户端"
date = 2014-03-23
description = ""
[taxonomies]
tags = ["programming", "huaban"]
[extra]
giscus = "telescope"
+++

花瓣主客户端已经有些日子没有更新了，这次的新版 iPhone 客户端会带来不少的变动和改进，于是索性重新开个项目，从头开始。虽还没开发完成，但有些东西还是想跟大家分享下。

### 如何让多人开发更加高效

如果是一个人开发，那怎么折腾都行。不用考虑冲突、不用考虑代码风格的差异、完全按自己的喜好设置目录结构、甚至在接口的设计上也可以自由一些。但参与的人一多这些问题就会暴露出来，如果处理不好，有可能会出现 1+1<2，甚至 1+1<1 的情况。

正好在前些日子看到了这篇「[使用 CocoaPods 来进行模块化开发](http://dev.hubspot.com/blog/architecting-a-large-ios-app-with-cocoapods)」文章，细细品了几遍，发现通过这种方式确实可以弥补多人开发带来的一些问题。简单说来就是把一个大项目按照功能模块划分为多个子项目，然后在一个主项目里，通过 CocoaPods 把这些子项目串起来，就变成了一个完整的 Project。

### 基本架构

{{img(path="/posts/huaban-app-redesign/huaban-app-arch.png")}}

其中最底层是其他项目也会引用的基础类库。`HBToolkit`包含了一些常用、好用的 Categories，如图片缩放、UIView Layout 等等；`HBBussiness`是跟业务相关的一些类库，如弹出新版本提示、登录等等；`HBAPI`是花瓣主站点的 API 接口。这些类库都是私有的 pod 源，可以通过`pod install`安装。

`AppCommon`是一个 xcode project，包含了该项目会用到的一些公共内容，如颜色值、按钮样式、图片、APIKey 等等，同样，也是私有 pod 源。

再上层就是各个 sub app 了。所谓 sub app，就是功能单一，可独立运行的 app。同样，每个 sub app 会提供相应的 podspec 文件，可以在这个 podspec 里指定最后会用到的 Classes。

{{img(path="/posts/huaban-app-redesign/huaban-app-subapps.png")}}

进去之后会是这样

{{img(path="/posts/huaban-app-redesign/huaban-app-subapp-index.png")}}

对于使用者来说，可以通过查看 demo，很快地了解接口的使用。对测试人员，也可以在 App 还没有开发完成的情况下，对各个子模块进行测试。

各个 sub app 都完成了的话，就可以组装成最终的 App 了，这里用到了一个 URL Route 类：[JLRoutes](https://github.com/joeldev/JLRoutes)，它的作用是让按钮的点击像网页里的链接一样，只是触发了某个 URL，而没有像 pushViewController 这样的行为。这样如果点击 A 模块的某个按钮，会 push 一个 B 模块的 ViewController，也不需要在 A 模块里 import 模块 B 的 ViewController，而只是`[JLRoutes routeURL:parameters]`即可，也就实现了解耦。

每个 sub app 需要注册自己感兴趣的 URL，这样当某个 URL 被触发时，就能捕获到并做适当的处理。如果注册的行为统一放到最终的 App 里去做，会不够灵活，且显得杂乱。所以最好是在类加载的过程中就完成注册。 而 Class 正好有一个`+ (void)load`方法，会在该 Class 被加入到运行时触发，且只触发一次。

#### Tips

每次新建一个 sub project 还蛮麻烦的，比如要新建 podfile，然后执行`pod install`(真心慢啊)，然后要写`XXX.podspec`，等等。于是写了一个 template project，并提供了脚本安装，然后每次要新建一个 project 时，只需执行`genproj XXX`就好了。

开发过程中，经常会出现依赖的 pod 有更新（比如 Common 又添加了一些图片素材），然后就得再执行一次`pod update`，于是所有依赖的 pod 都得 update 一下，这个过程有点慢，目前还没想到太好的办法。

#### 2014/03/25 更新

用`pod update --verbose` 看了下，主要的时间都是花在了获取第三方 pod 的 meta 信息上，所以，使用时加上` --no-repo-update`就很快了。

### ReactiveCocoa

这次改版的另一个尝试就是使用 RAC 和 MVVM，还是挺有些挑战的。之前的学习更多的是理论，并没有太多实际的使用，所以也遇到了不少问题。比如何时使用 property，何时使用 signal；多个 Controller 共用一个 VM，但其中一个又有一些独有的 property；潜意识里会使用原有的 cocoa 编程模式；出现问题，调试起来有点麻烦等等。尽管如此，RAC 还是很值得尝试的，就像一匹烈马，很难被驯服，但一旦被驾驭，这种成就感也是无可比拟的。

### 其他

- 使用 levelDB 来做持久化，放弃 CoreData。
- 使用[类族(class cluster)](http://blog.leezhong.com/ios/2014/01/04/class-cluster.html)来实现结构和功能基本一样，但数据源不同的场景。
- 无意中发现[Facebook](https://www.youtube.com/watch?v=OJ94KqmsxiI)也用了类似的架构，不过是通过 workspace 来实现的。
