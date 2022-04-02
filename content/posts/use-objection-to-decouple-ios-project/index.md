+++
title= "使用objection来模块化开发iOS项目"
date = 2014-04-15
description = ""
[taxonomies]
tags = ["programming", "iOS"]
[extra]
giscus = "telescope"
+++

[objection](https://github.com/atomicobject/objection) 是一个轻量级的依赖注入框架，受[Guice](https://code.google.com/p/google-guice/)的启发，[Google Wallet](http://www.google.com/wallet/) 也是使用的该项目。「依赖注入」是面向对象编程的一种设计模式，用来减少代码之间的耦合度。通常基于接口来实现，也就是说不需要 new 一个对象，而是通过相关的控制器来获取对象。2013 年最火的 PHP 框架 [laravel](http://laravel.com) 就是其中的典型。

假设有以下场景：ViewControllerA.view 里有一个 button，点击之后 push 一个 ViewControllerB，最简单的写法类似这样：

```m
- (void)viewDidLoad
{
    [super viewDidLoad];
    UIButton *button = [UIButton buttonWithType:UIButtonTypeSystem];
    button.frame = CGRectMake(100, 100, 100, 30);
    [button setTitle:@"Button" forState:UIControlStateNormal];
    [button addTarget:self action:@selector(buttonTapped) forControlEvents:UIControlEventTouchUpInside];
    [self.view addSubview:button];
}

- (void)buttonTapped
{
	ViewControllerB *vc = [[ViewControllerB alloc] init];
    [self.navigationController pushViewController:vc animated:YES];
}
```

这样写的一个问题是，ViewControllerA 需要 import ViewControllerB，也就是对 ViewControllerB 产生了依赖。依赖的东西越多，维护起来就越麻烦，也容易出现循环依赖的问题，而 objection 正好可以处理这些问题。

实现方法是：先定义一个协议(protocol)，然后通过 objection 来注册这个协议对应的 class，需要的时候，可以获取该协议对应的 object。对于使用方无需关心到底使用的是哪个 Class，反正该有的方法、属性都有了(在协议中指定)。这样就去除了对某个特定 Class 的依赖。也就是通常所说的「面向接口编程」。

```m
JSObjectionInjector *injector = [JSObjection defaultInjector]; // [1]
UIViewController <ViewControllerAProtocol> *vc = [injector getObject:@protocol(ViewControllerAProtocol)]; // [2]
vc.backgroundColor = [UIColor lightGrayColor]; // [3]
UINavigationController *nc = [[UINavigationController alloc] initWithRootViewController:vc];
self.window.rootViewController = nc;
```

- [1] 获取默认的 injector，这个 injector 已经注册过`ViewControllerAProtocol`了。
- [2] 获取`ViewControllerAProtocol`对应的 Object。
- [3] 拿到 VC 后，设置它的某些属性，比如这里的 backgroundColor，因为在`ViewControllerAProtocol`里有定义这个属性，所以不会有 warning。

可以看到这里没有引用 ViewControllerA。再来看看这个`ViewControllerAProtocol`是如何注册到 injector 中的，这里涉及到了`Module`，对 Protocol 的注册都是在 Module 中完成的。Module 只要继承`JSObjectionModule`这个 Class 即可。

```m
@interface ViewControllerAModule : JSObjectionModule
@end

@implementation ViewControllerAModule
- (void)configure
{
    [self bindClass:[ViewControllerA class] toProtocol:@protocol(ViewControllerAProtocol)];
}
@end
```

绑定操作是在`configure`方法里进行的，这个方法在被添加到 injector 里时会被自动触发。

```m
JSObjectionInjector *injector = [JSObjection defaultInjector]; // [1]
injector = injector ? : [JSObjection createInjector]; // [2]
injector = [injector withModule:[[ViewControllerAModule alloc] init]]; // [3]
[JSObjection setDefaultInjector:injector]; // [4]
```

- [1] 获取默认的 injector
- [2] 如果默认的 injector 不存在，就新建一个
- [3] 往这个 injector 里注册我们的 Module
- [4] 设置该 injector 为默认的 injector

这段代码可以直接放到 `+ (void)load`里执行，这样就可以避免在 AppDelegate 里 import 各种 Module。

因为我们无法直接获得对应的 Class，所以必须要在协议里定义好对外暴露的方法和属性，然后该 Class 也要实现该协议。

```m
@protocol ViewControllerAProtocol <NSObject>
@property (nonatomic) NSUInteger currentIndex;
@property (nonatomic) UIColor *backgroundColor;
@end

@interface ViewControllerA : UIViewController <ViewControllerAProtocol>
@end
```

通过 objection 实现依赖注入后，就能更好地实现 SRP(Single Responsibility Principle)，代码更简洁，心情更舒畅，生活更美好。拿 Pinterest 来说，下面的页面就可以划分为 3 个 Section。

{{img(path="/posts/use-objection-to-decouple-ios-project/demo_4_objection.png")}}

各个 Section 可以由不同的人负责，然后串到一起就行，也能一定程度地避免 MVC(Mess View Controller)的出现。

总体来说，这个 lib 还是挺靠谱的，已经维护了两年多，也有一些项目在用，对于提高开发成员的效率也会有不少的帮助，可以考虑尝试下。

---- update (2014-04-30) ----

写了个壁纸的 demo，[https://github.com/limboy/bizhi](https://github.com/limboy/bizhi)
