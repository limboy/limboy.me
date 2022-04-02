+++
title= "ReactiveCocoa2实战"
date = 2014-06-06
description = ""
[taxonomies]
tags = ["programming", "RAC"]
[extra]
giscus = "telescope"
+++

之前已经写过两篇关于 ReactiveCocoa(以下简称 RAC)的文章了，但主要也是在阐述基本的概念和使用，这篇文章将会从实战的角度来看看 RAC 到底解决了哪些问题，带来了哪些方便，以及遇到的一些坑。

### 概述

#### 为什么要使用 RAC？

一个怪怪的东西，从 Demo 看也没有让代码变得更好、更短，相反还造成理解上的困难，真的有必要去学它么？相信这是大多数人在接触 RAC 时的想法。RAC 不是单一功能的模块，它是一个 Framework，提供了一整套解决方案。其核心思想是「响应数据的变化」，在这个基础上有了 Signal 的概念，进而可以帮助减少状态变量(可以参考 jspahrsummers 的[PPT](https://github.com/jspahrsummers/enemy-of-the-state))，使用 MVVM 架构，统一的异步编程模型等等。

为什么 RAC 更加适合编写 Cocoa App？说这个之前，我们先来看下 Web 前端编程，因为有些相似之处。目前很火的 AngularJS 有一个很重要的特性：数据与视图绑定。就是当数据变化时，视图不需要额外的处理，便可正确地呈现最新的数据。而这也是 RAC 的亮点之一。RAC 与 Cocoa 的编程模式，有点像 AngularJS 和 jQuery。所以要了解 RAC，需要先在观念上做调整。

以下面这个 Cell 为例

{{img(path="/posts/deep-into-reactivecocoa2/rac-demo.png")}}

正常的写法可能是这样，很直观。

```m
- (void)configureWithItem:(HBItem *)item
{
	self.username.text = item.text;
	[self.avatarImageView setImageWithURL: item.avatarURL];
	// 其他的一些设置
}
```

但如果用 RAC，可能就是这样

```m
- (id)init
{
	if (self = [super init]) {
		@weakify(self);
		[RACObserve(self, viewModel) subscribeNext:^(HBItemViewModel *viewModel) {
			@strongify(self);
			self.username.text = viewModel.item.text;
			[self.avatarImageView setImageWithURL: viewModel.item.avatarURL];
			// 其他的一些设置
		}];
	}
}
```

也就是先把数据绑定，接下来只要数据有变化，就会自动响应变化。在这里，每次 viewModel 改变时，内容就会自动变成该 viewModel 的内容。

#### Signal

Signal 是 RAC 的核心，为了帮助理解，画了这张简化图

{{img(path="/posts/deep-into-reactivecocoa2/rac-signal.png")}}

这里的数据源和 sendXXX，可以理解为函数的参数和返回值。当 Signal 处理完数据后，可以向下一个 Signal 或 Subscriber 传送数据。可以看到上半部分的两个 Signal 是冷的(cold)，相当于实现了某个函数，但该函数没有被调用。同时也说明了 Signal 可以被组合使用，比如`RACSignal *signalB = [signalA map:^id(id x){return x}]`，或`RACSignal *signalB = [signalA take:1]`等等。

当 signal 被 subscribe 时，就会处于热(hot)的状态，也就是该函数会被执行。比如上面的第二张图，首先 signalA 可能发了一个网络请求，拿到结果后，把数据通过`sendNext`方法传递到下一个 signal，signalB 可以根据需要做进一步处理，比如转换成相应的 Model，转换完后再`sendNext`到 subscriber，subscriber 拿到数据后，再改变 ViewModel，同时因为 View 已经绑定了 ViewModel，所以拿到的数据会自动在 View 里呈现。

还有，一个 signal 可以被多个 subscriber 订阅，这里怕显得太乱就没有画出来，但每次被新的 subscriber 订阅时，都会导致数据源的处理逻辑被触发一次，这很有可能导致意想不到的结果，需要注意一下。

当数据从 signal 传送到 subscriber 时，还可以通过`doXXX`来做点事情，比如打印数据。

通过这张图可以看到，这非常像中学时学的函数，比如 `f(x) = y`，某一个函数的输出又可以作为另一个函数的输入，比如 `f(f(x)) = z`，这也正是「函数响应式编程」(FRP)的核心。

有些地方需要注意下，比如把 signal 作为 local 变量时，如果没有被 subscribe，那么方法执行完后，该变量会被 dealloc。但如果 signal 有被 subscribe，那么 subscriber 会持有该 signal，直到 signal sendCompleted 或 sendError 时，才会解除持有关系，signal 才会被 dealloc。

#### RACCommand

`RACCommand`是 RAC 很重要的组成部分，可以节省很多时间并且让你的 App 变得更 Robust，[这篇文章](http://codeblog.shape.dk/blog/2013/12/05/reactivecocoa-essentials-understanding-and-using-raccommand/)可以帮助你更深入的理解，这里简单做一下介绍。

`RACCommand` 通常用来表示某个 Action 的执行，比如点击 Button。它有几个比较重要的属性：executionSignals / errors / executing。

- `executionSignals`是 signal of signals，如果直接 subscribe 的话会得到一个 signal，而不是我们想要的 value，所以一般会配合`switchToLatest`。
- `errors`。跟正常的 signal 不一样，`RACCommand`的错误不是通过`sendError`来实现的，而是通过`errors`属性传递出来的。
- `executing`表示该 command 当前是否正在执行。

假设有这么个需求：当图片载入完后，分享按钮才可用。那么可以这样：

```m
RACSignal *imageAvailableSignal = [RACObserve(self, imageView.image) map:id^(id x){return x ? @YES : @NO}];
self.shareButton.rac_command = [[RACCommand alloc] initWithEnabled:imageAvailableSignal signalBlock:^RACSignal *(id input) {
	// do share logic
}];
```

除了与`UIControl`绑定之外，也可以手动执行某个 command，比如双击图片点赞，就可以这么实现。

```m
// ViewModel.m
- (instancetype)init
{
    self = [super init];
    if (self) {
        void (^updatePinLikeStatus)() = ^{
            self.pin.likedCount = self.pin.hasLiked ? self.pin.likedCount - 1 : self.pin.likedCount + 1;
            self.pin.hasLiked = !self.pin.hasLiked;
        };

        _likeCommand = [[RACCommand alloc] initWithSignalBlock:^RACSignal *(id input) {
            // 先展示效果，再发送请求
            updatePinLikeStatus();
            return [[HBAPIManager sharedManager] likePinWithPinID:self.pin.pinID];
        }];

        [_likeCommand.errors subscribeNext:^(id x) {
            // 发生错误时，回滚
            updatePinLikeStatus();
        }];
    }
    return self;
}

// ViewController.m
- (void)viewDidLoad
{
	[super viewDidLoad];
	// ...
    @weakify(self);
    [RACObserve(self, viewModel.hasLiked) subscribeNext:^(id x){
        @strongify(self);
        self.pinLikedCountLabel.text = self.viewModel.likedCount;
        self.likePinImageView.image = [UIImage imageNamed:self.viewModel.hasLiked ? @"pin_liked" : @"pin_like"];
    }];

    UITapGestureRecognizer *tapGesture = [[UITapGestureRecognizer alloc] init];
    tapGesture.numberOfTapsRequired = 2;
    [[tapGesture rac_gestureSignal] subscribeNext:^(id x) {
        [self.viewModel.likeCommand execute:nil];
    }];
}
```

再比如某个 App 要通过 Twitter 登录，同时允许取消登录，就可以这么做 ([source](https://github.com/ReactiveCocoa/ReactiveCocoa/issues/1326))

```m
_twitterLoginCommand = [[RACCommand alloc] initWithSignalBlock:^(id _) {
      @strongify(self);
      return [[self
          twitterSignInSignal]
          takeUntil:self.cancelCommand.executionSignals];
    }];

RAC(self.authenticatedUser) = [self.twitterLoginCommand.executionSignals switchToLatest];
```

### 常用的模式

#### map + switchToLatest

`switchToLatest:` 的作用是自动切换 signal of signals 到最后一个，比如之前的 command.executionSignals 就可以使用`switchToLatest:`。

`map:`的作用很简单，对`sendNext`的 value 做一下处理，返回一个新的值。

如果把这两个结合起来就有意思了，想象这么个场景，当用户在搜索框输入文字时，需要通过网络请求返回相应的 hints，每当文字有变动时，需要取消上一次的请求，就可以使用这个配搭。这里用另一个 Demo，简单演示一下

```m
NSArray *pins = @[@172230988, @172230947, @172230899, @172230777, @172230707];
__block NSInteger index = 0;

RACSignal *signal = [[[[RACSignal interval:0.1 onScheduler:[RACScheduler scheduler]]
						take:pins.count]
						map:^id(id value) {
							return [[[HBAPIManager sharedManager] fetchPinWithPinID:[pins[index++] intValue]] doNext:^(id x) {
								NSLog(@"这里只会执行一次");
							}];
						}]
						switchToLatest];

[signal subscribeNext:^(HBPin *pin) {
	NSLog(@"pinID:%d", pin.pinID);
} completed:^{
	NSLog(@"completed");
}];

// output
// 2014-06-05 17:40:49.851 这里只会执行一次
// 2014-06-05 17:40:49.851 pinID:172230707
// 2014-06-05 17:40:49.851 completed
```

#### takeUntil

`takeUntil:someSignal` 的作用是当 someSignal sendNext 时，当前的 signal 就`sendCompleted`，someSignal 就像一个拳击裁判，哨声响起就意味着比赛终止。

它的常用场景之一是处理 cell 的 button 的点击事件，比如点击 Cell 的详情按钮，需要 push 一个 VC，就可以这样：

```m
[[[cell.detailButton
	rac_signalForControlEvents:UIControlEventTouchUpInside]
	takeUntil:cell.rac_prepareForReuseSignal]
	subscribeNext:^(id x) {
		// generate and push ViewController
}];
```

如果不加`takeUntil:cell.rac_prepareForReuseSignal`，那么每次 Cell 被重用时，该 button 都会被`addTarget:selector`。

#### 替换 Delegate

出现这种需求，通常是因为需要对 Delegate 的多个方法做统一的处理，这时就可以造一个 signal 出来，每次该 Delegate 的某些方法被触发时，该 signal 就会`sendNext`。

```m
@implementation UISearchDisplayController (RAC)
- (RACSignal *)rac_isActiveSignal {
    self.delegate = self;
    RACSignal *signal = objc_getAssociatedObject(self, _cmd);
    if (signal != nil) return signal;

    /* Create two signals and merge them */
    RACSignal *didBeginEditing = [[self rac_signalForSelector:@selector(searchDisplayControllerDidBeginSearch:)
                                        fromProtocol:@protocol(UISearchDisplayDelegate)] mapReplace:@YES];
    RACSignal *didEndEditing = [[self rac_signalForSelector:@selector(searchDisplayControllerDidEndSearch:)
                                      fromProtocol:@protocol(UISearchDisplayDelegate)] mapReplace:@NO];
    signal = [RACSignal merge:@[didBeginEditing, didEndEditing]];


    objc_setAssociatedObject(self, _cmd, signal, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
    return signal;
}
@end
```

代码源于[此文](http://spin.atomicobject.com/2014/02/03/objective-c-delegate-pattern/)

#### 使用 ReactiveViewModel 的 didBecomActiveSignal

[ReactiveViewModel](https://github.com/ReactiveCocoa/ReactiveViewModel)是另一个 project， 后面的 MVVM 中会讲到，通常的做法是在 VC 里设置 VM 的`active`属性(RVMViewModel 自带该属性)，然后在 VM 里 subscribeNext `didBecomActiveSignal`，比如当 Active 时，获取 TableView 的最新数据。

#### RACSubject 的使用场景

一般不推荐使用`RACSubject`，因为它过于灵活，滥用的话容易导致复杂度的增加。但有一些场景用一下还是比较方便的，比如 ViewModel 的 errors。

ViewModel 一般会有多个`RACCommand`，那这些 commands 如果出现 error 了该如何处理呢？比较方便的方法如下：

```m
// HBCViewModel.h

#import "RVMViewModel.h"

@class RACSubject;

@interface HBCViewModel : RVMViewModel
@property (nonatomic) RACSubject *errors;
@end



// HBCViewModel.m

#import "HBCViewModel.h"
#import <ReactiveCocoa.h>

@implementation HBCViewModel

- (instancetype)init
{
    self = [super init];
    if (self) {
        _errors = [RACSubject subject];
    }
    return self;
}

- (void)dealloc
{
    [_errors sendCompleted];
}
@end

// Some Other ViewModel inherit HBCViewModel

- (instancetype)init
{
	_fetchLatestCommand = [RACCommand alloc] initWithSignalBlock:^RACSignal *(id input){
		// fetch latest data
	}];

	_fetchMoreCommand = [RACCommand alloc] initWithSignalBlock:^RACSignal *(id input){
		// fetch more data
	}];

	[self.didBecomeActiveSignal subscribeNext:^(id x) {
		[_fetchLatestCommand execute:nil];
	}];

	[[RACSignal
		merge:@[
				_fetchMoreCommand.errors,
				_fetchLatestCommand.errors
				]] subscribe:self.errors];

}
```

#### rac_signalForSelector

`rac_signalForSelector:` 这个方法会返回一个 signal，当 selector 执行完时，会 sendNext，也就是当某个方法调用完后再额外做一些事情。用在 category 会比较方便，因为 Category 重写父类的方法时，不能再通过`[super XXX]`来调用父类的方法，当然也可以手写 Swizzle 来实现，不过有了`rac_signalForSelector:`就方便多了。

`rac_signalForSelector: fromProtocol:` 可以直接实现对 protocol 的某个方法的实现（听着有点别扭呢），比如，我们想实现 UIScrollViewDelegate 的某些方法，可以这么写

```m
[[self rac_signalForSelector:@selector(scrollViewDidEndDecelerating:) fromProtocol:@protocol(UIScrollViewDelegate)] subscribeNext:^(RACTuple *tuple) {
    // do something
}];

[[self rac_signalForSelector:@selector(scrollViewDidScroll:) fromProtocol:@protocol(UIScrollViewDelegate)] subscribeNext:^(RACTuple *tuple) {
	// do something
}];

self.scrollView.delegate = nil;
self.scrollView.delegate = self;
```

注意，这里的 delegate 需要先设置为 nil，再设置为 self，而不能直接设置为 self，如果 self 已经是该 scrollView 的 Delegate 的话。

有时，我们想对 selector 的返回值做一些处理，但很遗憾 RAC 不支持，如果真的有需要的话，可以使用[Aspects](https://github.com/steipete/Aspects)

### MVVM

这是一个大话题，如果有耐心，且英文还不错的话，可以看一下 Cocoa Samurai 的这[两篇](http://cocoasamurai.blogspot.fr/2013/03/basic-mvvm-with-reactivecocoa.html)[文章](http://cocoamanifest.net/articles/2013/10/mvc-mvvm-frp-and-building-bridges.html)。PS: Facebook Paper 就是基于 MVVM 构建的。

MVVM 是 Model-View-ViewModel 的简称，它们之间的关系如下

![](https://camo.githubusercontent.com/3999b9fdff783edb6cee9117a08524f3b2e7c653/68747470733a2f2f662e636c6f75642e6769746875622e636f6d2f6173736574732f3433323533362f3836373938342f32393165643338302d663736302d313165322d393130362d6433313538333230616633392e706e67)

可以看到 View(其实是 ViewController)持有 ViewModel，这样做的好处是 ViewModel 更加独立且可测试，ViewModel 里不应包含任何 View 相关的元素，哪怕换了一个 View 也能正常工作。而且这样也能让 View/ViewController「瘦」下来。

ViewModel 主要做的事情是作为 View 的数据源，所以通常会包含网络请求。

或许你会疑惑，ViewController 哪去了？在 MVVM 的世界里，ViewController 已经成为了 View 的一部分。它的主要职责是将 VM 与 View 绑定、响应 VM 数据的变化、调用 VM 的某个方法、与其他的 VC 打交道。

而 RAC 为 MVVM 带来很大的便利，比如`RACCommand`, UIKit 的 RAC Extension 等等。使用 MVVM 不一定能减少代码量，但能降低代码的复杂度。

以下面这个需求为例，要求大图滑动结束时，底部的缩略图滚动到对应的位置，并高亮该缩略图；同时底部的缩略图被选中时，大图也要变成该缩略图的大图。

{{img(path="/posts/deep-into-reactivecocoa2/rac-mvvm.png")}}

我的思路是横向滚动的大图是一个 collectionView，该 collectionView 是当前页面 VC 的一个 property。底部可以滑动的缩略图是一个 childVC 的 collectionView，这两个 collectionView 共用一套 VM，并且各自 RACObserve 感兴趣的 property。

比如大图滑到下一页时，会改变 VM 的 indexPath 属性，而底部的 collectionView 所在的 VC 正好对该 indexPath 感兴趣，只要 indexPath 变化就滚动到相应的 Item

```m
// childVC

- (void)viewDidLoad
{
	[super viewDidLoad];

	@weakify(self);
	[RACObserve(self, viewModel.indexPath) subscribeNext:^(NSNumber *index) {
        @strongify(self);
        [self scrollToIndexPath];
    }];
}

- (void)scrollToIndexPath
{
    if (self.collectionView.subviews.count) {
        NSIndexPath *indexPath = self.viewModel.indexPath;
        [self.collectionView scrollToItemAtIndexPath:indexPath atScrollPosition:UICollectionViewScrollPositionCenteredHorizontally animated:YES];
        [self.collectionView.subviews enumerateObjectsUsingBlock:^(UIView *view, NSUInteger idx, BOOL *stop) {
            view.layer.borderWidth = 0;
        }];
        UIView *view = [self.collectionView cellForItemAtIndexPath:indexPath];
        view.layer.borderWidth = kHBPinsNaviThumbnailPadding;
        view.layer.borderColor = [UIColor whiteColor].CGColor;
    }
}
```

当点击底部的缩略图时，上面的大图也要做出变化，也同样可以通过 RACObserve indexPath 来实现

```m
// PinsViewController.m
- (void)viewDidLoad
{
	[super viewDidLoad];
	@weakify(self);
    [[RACObserve(self, viewModel.indexPath)
        skip:1]
        subscribeNext:^(NSIndexPath *indexPath) {
            @strongify(self);
            [self.collectionView scrollToItemAtIndexPath:indexPath atScrollPosition:UICollectionViewScrollPositionCenteredHorizontally animated:YES];
    }];
}
```

这里有一个小技巧，当 Cell 里的元素比较复杂时，我们可以给 Cell 也准备一个 ViewModel，这个 CellViewModel 可以由上一层的 ViewModel 提供，这样 Cell 如果需要相应的数据，直接跟 CellViewModel 要即可，CellViewModel 也可以包含一些 command，比如 likeCommand。假如点击 Cell 时，要做一些处理，也很方便。

```m
// CellViewModel已经在ViewModel里准备好了
- (UICollectionViewCell *)collectionView:(UICollectionView *)collectionView cellForItemAtIndexPath:(NSIndexPath *)indexPath
{
    HBPinsCell *cell = [collectionView dequeueReusableCellWithReuseIdentifier:cellIdentifier forIndexPath:indexPath];
    cell.viewModel = self.viewModel.cellViewModels[indexPath.row];
    return cell;
}

- (void)collectionView:(UICollectionView *)collectionView didSelectItemAtIndexPath:(NSIndexPath *)indexPath
{
    HBCellViewModel *cellViewModel = self.viewModel.cellViewModels[indexPath.row];
	// 对cellViewModel执行某些操作，因为Cell已经与cellViewModel绑定，所以cellViewModel的改变也会反映到Cell上
	// 或拿到cellViewModel的数据来执行某些操作
}
```

#### ViewModel 中 signal, property, command 的使用

初次使用 RAC+MVVM 时，往往会疑惑，什么时候用 signal，什么时候用 property，什么时候用 command？

一般来说可以使用 property 的就直接使用，没必要再转换成 signal，外部 RACObserve 即可。使用 signal 的场景一般是涉及到多个 property 或多个 signal 合并为一个 signal。command 往往与 UIControl/网络请求挂钩。

### 常见场景的处理

#### 检查本地缓存，如果失效则去请求网络数据并缓存到本地

[来源](https://github.com/ReactiveCocoa/ReactiveCocoa/issues/1166)

```m
- (RACSignal *)loadData {
    return [[RACSignal
        createSignal:^(id<RACSubscriber> subscriber) {
            // If the cache is valid then we can just immediately send the
            // cached data and be done.
            if (self.cacheValid) {
                [subscriber sendNext:self.cachedData];
                [subscriber sendCompleted];
            } else {
                [subscriber sendError:self.staleCacheError];
            }
        }]
        // Do the subscription work on some random scheduler, off the main
        // thread.
        subscribeOn:[RACScheduler scheduler]];
}

- (void)update {
    [[[[self
        loadData]
        // Catch the error from -loadData. It means our cache is stale. Update
        // our cache and save it.
        catch:^(NSError *error) {
            return [[self updateCachedData] doNext:^(id data) {
                [self cacheData:data];
            }];
        }]
        // Our work up until now has been on a background scheduler. Get our
        // results delivered on the main thread so we can do UI work.
        deliverOn:RACScheduler.mainThreadScheduler]
        subscribeNext:^(id data) {
            // Update your UI based on `data`.

            // Update again after `updateInterval` seconds have passed.
            [[RACSignal interval:updateInterval] take:1] subscribeNext:^(id _) {
                [self update];
            }];
        }];
}
```

#### 检测用户名是否可用

[来源](https://github.com/ReactiveCocoa/ReactiveCocoa/issues/1236)

```m
- (void)setupUsernameAvailabilityChecking {
    RAC(self, availabilityStatus) = [[[RACObserve(self.userTemplate, username)
                                      throttle:kUsernameCheckThrottleInterval] //throttle表示interval时间内如果有sendNext，则放弃该nextValue
                                      map:^(NSString *username) {
                                          if (username.length == 0) return [RACSignal return:@(UsernameAvailabilityCheckStatusEmpty)];
                                          return [[[[[FIBAPIClient sharedInstance]
                                                getUsernameAvailabilityFor:username ignoreCache:NO]
                                              map:^(NSDictionary *result) {
                                                  NSNumber *existsNumber = result[@"exists"];
                                                  if (!existsNumber) return @(UsernameAvailabilityCheckStatusFailed);
                                                  UsernameAvailabilityCheckStatus status = [existsNumber boolValue] ? UsernameAvailabilityCheckStatusUnavailable : UsernameAvailabilityCheckStatusAvailable;
                                                  return @(status);
                                              }]
                                             catch:^(NSError *error) {
                                                  return [RACSignal return:@(UsernameAvailabilityCheckStatusFailed)];
                                              }] startWith:@(UsernameAvailabilityCheckStatusChecking)];
                                      }]
                                      switchToLatest];
}
```

可以看到这里也使用了`map` + `switchToLatest`模式，这样就可以自动取消上一次的网络请求。

`startWith`的内部实现是`concat`，这里表示先将状态置为 checking，然后再根据网络请求的结果设置状态。

#### 使用 takeUntil:来处理 Cell 的 button 点击

这个上面已经提到过了。

#### token 过期后自动获取新的

开发 APIClient 时，会用到 AccessToken，这个 Token 过一段时间会过期，需要去请求新的 Token。比较好的用户体验是当 token 过期后，自动去获取新的 Token，拿到后继续上一次的请求，这样对用户是透明的。

```m
RACSignal *requestSignal = [RACSignal createSignal:^RACDisposable *(id<RACSubscriber> subscriber) {
        // suppose first time send request, access token is expired or invalid
        // and next time it is correct.
        // the block will be triggered twice.
        static BOOL isFirstTime = 0;
        NSString *url = @"http://httpbin.org/ip";
        if (!isFirstTime) {
            url = @"http://nonexists.com/error";
            isFirstTime = 1;
        }
        NSLog(@"url:%@", url);
        [[AFHTTPRequestOperationManager manager] GET:url parameters:nil success:^(AFHTTPRequestOperation *operation, id responseObject) {
            [subscriber sendNext:responseObject];
            [subscriber sendCompleted];
        } failure:^(AFHTTPRequestOperation *operation, NSError *error) {
            [subscriber sendError:error];
        }];
        return nil;
    }];

    self.statusLabel.text = @"sending request...";
    [[requestSignal catch:^RACSignal *(NSError *error) {
        self.statusLabel.text = @"oops, invalid access token";

        // simulate network request, and we fetch the right access token
        return [[RACSignal createSignal:^RACDisposable *(id<RACSubscriber> subscriber) {
            double delayInSeconds = 1.0;
            dispatch_time_t popTime = dispatch_time(DISPATCH_TIME_NOW, (int64_t)(delayInSeconds * NSEC_PER_SEC));
            dispatch_after(popTime, dispatch_get_main_queue(), ^(void){
                [subscriber sendNext:@YES];
                [subscriber sendCompleted];
            });
            return nil;
        }] concat:requestSignal];
    }] subscribeNext:^(id x) {
        if ([x isKindOfClass:[NSDictionary class]]) {
            self.statusLabel.text = [NSString stringWithFormat:@"result:%@", x[@"origin"]];
        }
    } completed:^{
        NSLog(@"completed");
    }];
```

### 注意事项

RAC 我自己感觉遇到的几个难点是: 1) 理解 RAC 的理念。 2) 熟悉常用的 API。3) 针对某些特定的场景，想出比较合理的 RAC 处理方式。不过看多了，写多了，想多了就会慢慢适应。下面是我在实践过程中遇到的一些小坑。

#### ReactiveCocoaLayout

有时 Cell 的内容涉及到动态的高度，就会想到用 Autolayout 来布局，但 RAC 已经为我们准备好了[ReactiveCocoaLayout](https://github.com/ReactiveCocoa/ReactiveCocoaLayout)，所以我想不妨就拿来用一下。

`ReactiveCocoaLayout`的使用好比「批地」和「盖房」，先通过`insetWidth:height:nullRect`从某个 View 中划出一小块，拿到之后还可以通过`divideWithAmount:padding:fromEdge` 再分成两块，或`sliceWithAmount:fromEdge`再分出一块。这些方法返回的都是 signal，所以可以通过`RAC(self.view, frame) = someRectSignal` 这样来实现绑定。但在实践中发现性能不是很好，多批了几块地就容易造成主线程卡顿。

所以`ReactiveCocoaLayout`最好不用或少用。

#### 调试

{{img(path="/posts/deep-into-reactivecocoa2/rac-debug.png")}}

刚开始写 RAC 时，往往会遇到这种情况，满屏的调用栈信息都是 RAC 的，要找出真正出现问题的地方不容易。曾经有一次在使用`[RACSignal combineLatest: reduce:^id{}]`时，忘了在 Block 里返回 value，而 Xcode 也没有提示 warning，然后就是莫名其妙地挂起了，跳到了汇编上，也没有调用栈信息，这时就只能通过最古老的注释代码的方式来找到问题的根源。

不过写多了之后，一般不太会犯这种低级错误。

#### strongify / weakify dance

因为 RAC 很多操作都是在 Block 中完成的，这块最常见的问题就是在 block 直接把 self 拿来用，造成 block 和 self 的 retain cycle。所以需要通过`@strongify`和`@weakify`来消除循环引用。

有些地方很容易被忽略，比如`RACObserve(thing, keypath)`，看上去并没有引用 self，所以在`subscribeNext`时就忘记了 weakify/strongify。但事实上`RACObserve`总是会引用 self，即使 target 不是 self，所以只要有`RACObserve`的地方都要使用 weakify/strongify。

### 小结

以上是我在做花瓣客户端和 side project 时总结的一些经验，但愿能带来一些帮助，有误的地方也欢迎指正和探讨。

推荐一下 jspahrsummers 的[这个 project](https://github.com/jspahrsummers/GroceryList)，虽然是用 RAC3.0 写的，但很多理念也可以用到 RAC2 上面。

最后感谢 Github 的 iOS 工程师们，感谢你们带来了 RAC，以及在 Issues 里的耐心解答。
