+++
title= "简单说说iOS的图形和动画"
date = 2013-06-08
description = ""
[taxonomies]
tags = ["programming", "iOS"]
[extra]
giscus = "telescope"
+++

### Core Graphics

Core Graphics 是一组用来绘制 2D 图形的 API，使用 CPU 进行计算。 新建一个项目时，模板已经自动载入了 CoreGraphics.framwork。

### Core Animation

Core Animation 包含于 QuartzCore.framwork 中，是一组自由度更大的图形绘制和动画 API，但实现起来也会比 Core Graphics 麻烦一点。iOS 上的 UIKit 和动画效果大部分都是通过 Core Animation 实现的。

### Core Image

Core Image 是一组用于图像、视频处理的 API，如添加滤镜之类的。

### OpenGL / OpenGL ES

底层的图形绘制 API，自由度最大，但学习成本也很高。如果不是做大型游戏，推荐使用更高层的 API。

### 硬件加速

硬件加速是指用到了 GPU 的 API，以下这些情况不会用到硬件加速

- 所有在 drawRect 中完成的图形绘制。
- shouldRasterize 属性为 YES 的 CALayer。
- 用到了 mask 或 drop shadow 的 CALayer。
- Text (包括 UILabels, CATextLayers, Core Text, 等等)。
- 使用 CGContexts 绘制的图形

## Core Animation

虽然是 Animation，但实际上它也干 Drawing 的活，这就需要 CALayer 的帮助。iOS 中，所有的 UIView 都自带了一个 CALayer（可以通过 UIView.layer 访问），UIView 的渲染和动画最终也是通过 layer 来实现的。从这个意义上说，UIView 就是简单的一层壳，把图形绘制需要的信息传递给 layer。当然 UIView 还有一个重要的功能就是处理事件，如点击按钮，滑动等等。

事实上 layer 也是一层壳(Model Tree)，背后还有呈现树(Presenting Tree)和渲染树(Render Tree)，渲染树对呈现树的数据进行渲染。

跟 view 一样，layer 也存在着一个树状结构。可以直接创建，或通过 view.layer 获取。

layer 有很多的动画属性，如 anchorPoint(view 没有这个属性)、frame、transform 等等，详细的属性列表[见此](http://developer.apple.com/library/ios/#documentation/Cocoa/Conceptual/CoreAnimation_guide/AnimatableProperties/AnimatableProperties.html#//apple_ref/doc/uid/TP40004514-CH11-SW1)。配合 Core Animation 的 API 可以实现很多 UIView Animation 无法实现的效果，比如 3D 动画。

## UIView Animation

这个是我们经常会用到的，它对 Core Animation 做了更高层的封装，方便使用，当然自由度也降低了。

```m
+ (void)animateWithDuration:(NSTimeInterval)duration delay:(NSTimeInterval)delay options:(UIViewAnimationOptions)options animations:(void (^)(void))animations completion:(void (^)(BOOL finished))completion
```

animation block 里可以设置 view 的动画属性的终止值，如 frame, rotation 等。options 可以设置动画的相关选项，如下：

```m
enum {
    UIViewAnimationOptionLayoutSubviews            = 1 <<  0,
    UIViewAnimationOptionAllowUserInteraction      = 1 <<  1,
    UIViewAnimationOptionBeginFromCurrentState     = 1 <<  2,
    UIViewAnimationOptionRepeat                    = 1 <<  3,
    UIViewAnimationOptionAutoreverse               = 1 <<  4,
    UIViewAnimationOptionOverrideInheritedDuration = 1 <<  5,
    UIViewAnimationOptionOverrideInheritedCurve    = 1 <<  6,
    UIViewAnimationOptionAllowAnimatedContent      = 1 <<  7,
    UIViewAnimationOptionShowHideTransitionViews   = 1 <<  8,

    UIViewAnimationOptionCurveEaseInOut            = 0 << 16,
    UIViewAnimationOptionCurveEaseIn               = 1 << 16,
    UIViewAnimationOptionCurveEaseOut              = 2 << 16,
    UIViewAnimationOptionCurveLinear               = 3 << 16,

    UIViewAnimationOptionTransitionNone            = 0 << 20,
    UIViewAnimationOptionTransitionFlipFromLeft    = 1 << 20,
    UIViewAnimationOptionTransitionFlipFromRight   = 2 << 20,
    UIViewAnimationOptionTransitionCurlUp          = 3 << 20,
    UIViewAnimationOptionTransitionCurlDown        = 4 << 20,
    UIViewAnimationOptionTransitionCrossDissolve   = 5 << 20,
    UIViewAnimationOptionTransitionFlipFromTop     = 6 << 20,
    UIViewAnimationOptionTransitionFlipFromBottom  = 7 << 20,
};
typedef NSUInteger UIViewAnimationOptions;
```

所以一般的动画 view animation 都可以应付。

## TableView 优化

TableView 是 iOS 中非常重要的组成部分，如果处理不当，就很容易出现不流畅的现象。比如一个 TableViewCell 中有多个 subview。上面说过一个 view 对应了一个 layer，多个 view 自然也就对应多个 layer，好比 photoshop 的图层。滑动时 GPU 需要分别对每一个 layer 进行处理，如果不能在短时间内完成，就容易掉帧。

要保证 TableView 的流畅，首先 TableViewCell 的生成时间要短（少于 1/60 秒），其次移动时帧频尽量保持在 60（也就是每秒 60 帧）。前者取决于 CPU，后者取决于 GPU。

以 twitter 为例，可以通过 subviews 来实现，不过性能会有点影响，但实现起来简单。

{{img(path="/posts/ios-graphic-animation/twitter_tvc_subviews.jpg")}}

因为 cell 在形态上不会经常改变，所以也可以通过 drawRect 直接绘制，只要这个时间足够短就可以。好处是 layer 不用处理多个子 layer 的组合和叠加，就像一张 jpg 图片一样，滑动会更流畅。

{{img(path="/posts/ios-graphic-animation/twitter_tvc_drawrect.png")}}

### 参考

- [http://geeklu.com/2012/09/animation-in-ios/](http://geeklu.com/2012/09/animation-in-ios/)
- [http://robots.thoughtbot.com/post/33427366406/designing-for-ios-taming-uibutton](http://robots.thoughtbot.com/post/33427366406/designing-for-ios-taming-uibutton)
- [https://news.ycombinator.com/item?id=4645585](https://news.ycombinator.com/item?id=4645585)
- [http://stackoverflow.com/q/6731545/94962](http://stackoverflow.com/q/6731545/94962)
- [http://giorgiocalderolla.com/blog.html#customizing-uitableviewcells-a-better-way](http://giorgiocalderolla.com/blog.html#customizing-uitableviewcells-a-better-way)
- [https://blog.twitter.com/2012/simple-strategies-smooth-animation-iphone](https://blog.twitter.com/2012/simple-strategies-smooth-animation-iphone)
- [layer trees vs flat drawing graphics performance across ios device generations](http://floriankugler.com/blog/2013/5/24/layer-trees-vs-flat-drawing-graphics-performance-across-ios-device-generations)
