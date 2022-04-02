+++
title= "说说ReactiveCocoa 2"
date = 2013-12-27
description = ""
[taxonomies]
tags = ["programming", "RAC", "iOS"]
[extra]
giscus = "telescope"
+++

[ReactiveCocoa](https://github.com/ReactiveCocoa/ReactiveCocoa)是[Github](https://github.com/blog/1107-reactivecocoa-for-a-better-world)开源的一款 cocoa FRP 框架，我在[之前的文章](http://blog.leezhong.com/ios/2013/06/19/frp-reactivecocoa.html)里有过介绍(当时还是 1.x 版本，2.x 版本有了新的变化，API 也有部分不兼容) 这里再简单地提一下。

Native app 有很大一部分的时间是在等待事件发生，然后响应事件，比如等待网络请求完成，等待用户的操作，等待某些状态值的改变等等，等这些事件发生后，再做进一步处理。 但是这些等待和响应，并没有一个统一的处理方式。Delegate, Notification, Block, KVO, 常常会不知道该用哪个最合适。有时需要 chain 或者 compose 某几个事件，就需要多个状态变量，而状态变量一多，复杂度也就上来了。为了解决这些问题，Github 的工程师们开发了 ReactiveCocoa。

## 几个常见的概念

在阅读 ReactiveCocoa(以下简称 RAC)的相关文章或代码时，经常会出现一些名词，理解它们对于理解 RAC 有很大的帮助，下面就简要来说说这些常见的概念。

### Signal and Subscriber

这是 RAC 最核心的内容，这里我想用插头和插座来描述，插座是 Signal，插头是 Subscriber。想象某个遥远的星球，他们的电像某种物质一样被集中存储，且很珍贵。插座负责去获取电，插头负责使用电，而且一个插座可以插任意数量的插头。当一个插座(Signal)没有插头(Subscriber)时什么也不干，也就是处于冷(Cold)的状态，只有插了插头时才会去获取，这个时候就处于热(Hot)的状态。

Signal 获取到数据后，会调用 Subscriber 的 sendNext, sendComplete, sendError 方法来传送数据给 Subscriber，Subscriber 自然也有方法来获取传过来的数据，如：[signal subscribeNext:error:completed]。这样只要没有 sendComplete 和 sendError，新的值就会通过 sendNext 源源不断地传送过来，举个简单的例子：

```m
[RACObserve(self, username) subscribeNext: ^(NSString *newName){
	NSLog(@"newName:%@", newName);
}];
```

`RACObserve`使用了 KVO 来监听 property 的变化，只要 username 被自己或外部改变，block 就会被执行。但不是所有的 property 都可以被`RACObserve`，该 property 必须支持 KVO，比如 NSURLCache 的 currentDiskUsage 就不能被`RACObserve`。

Signal 是很灵活的，它可以被修改(map)，过滤(filter)，叠加(combine)，串联(chain)，这有助于应对更加复杂的情况，比如：

```m
RAC(self.logInButton, enabled) = [RACSignal
        combineLatest:@[
            self.usernameTextField.rac_textSignal,
            self.passwordTextField.rac_textSignal,
            RACObserve(LoginManager.sharedManager, loggingIn),
            RACObserve(self, loggedIn)
        ] reduce:^(NSString *username, NSString *password, NSNumber *loggingIn, NSNumber *loggedIn) {
            return @(username.length > 0 && password.length > 0 && !loggingIn.boolValue && !loggedIn.boolValue);
        }];
```

这段代码看起来有点复杂，来细细说一下，首先是左边的`RAC(...)`，它的作用是将`self.logInButton.enabled`属性与右边的 signal 的 sendNext 值绑定。也就是如果右边的 reduce 的返回值为 NO，那么 enabled 就为 NO。右边的`combineLatest`是获取这 4 个 signal 的 next 值。其中可以看到`self.usernameTextField.rac_textSignal`这么个东东，`rac_textSignal`是 RAC 为 UITextField 添加的 category，只要 usernameTextField 的值有变化，这个值就会被返回(sendNext)。combineLatest 需要每个 signal 至少都有过一次 sendNext。reduce 的作用是根据接收到的值，再返回一个新的值，这里是@(YES)和@(NO)，必须是 object。

上面这段代码用到了 Signal 的组合，想象一下，如果是传统的方式，写起来还是挺复杂的，而且随着功能的增加，调整起来会更加麻烦。

### 冷信号(Cold)和热信号(Hot)

上面提到过这两个概念，冷信号默认什么也不干，比如下面这段代码

```m
RACSignal *signal = [RACSignal createSignal:^ RACDisposable * (id<RACSubscriber> subscriber) {
	NSLog(@"triggered");
	[subscriber sendNext:@"foobar"];
    [subscriber sendCompleted];
    return nil;
}];
```

我们创建了一个 Signal，但因为没有被 subscribe，所以什么也不会发生。加了下面这段代码后，signal 就处于 Hot 的状态了，block 里的代码就会被执行。

```m
[signal subscribeCompleted:^{
    NSLog(@"subscription %u", subscriptions);
}];
```

或许你会问，那如果这时又有一个新的 subscriber 了，signal 的 block 还会被执行吗？这就牵扯到了另一个概念：Side Effect

### Side Effect

还是上面那段代码，如果有多个 subscriber，那么 signal 就会又一次被触发，控制台里会输出两次`triggered`。这或许是你想要的，或许不是。如果要避免这种情况的发生，可以使用 `replay` 方法，它的作用是保证 signal 只被触发一次，然后把 sendNext 的 value 存起来，下次再有新的 subscriber 时，直接发送缓存的数据。

## Cocoa Categories

为了更加方便地使用 RAC，RAC 给 Cocoa 添加了很多 category，与系统集成地越紧密，使用起来自然也就越方便。下面是我认为比较常用的 categories。

### UIView Categories

上面看到的`rac_textSignal`是加在 UITextField 上的(UITextField+RACSignalSupport.h)，其他常用的 UIView 也都有添加相应的 category，比如 UIAlertView，就不需要再用 Delegate 了。

```m
UIAlertView *alertView = [[UIAlertView alloc] initWithTitle:@"" message:@"Alert" delegate:nil cancelButtonTitle:@"YES" otherButtonTitles:@"NO", nil];
[[alertView rac_buttonClickedSignal] subscribeNext:^(NSNumber *indexNumber) {
	if ([indexNumber intValue] == 1) {
		NSLog(@"you touched NO");
	} else {
		NSLog(@"you touched YES");
	}
}];
[alertView show];
```

有了这些 Category，大部分的 Delegate 都可以使用 RAC 来做。或许你会想，可不可以 subscribe NSMutableArray.rac_sequence.signal，这样每次有新的 object 或旧的 object 被移除时都能知道，UITableViewController 就可以根据 dataSource 的变化，来 reloadData。但很可惜这样不行，因为 RAC 是基于 KVO 的，而 NSMutableArray 并不会在调用 addObject 或 removeObject 时发送通知，所以不可行。不过可以使用 NSArray 作为 UITableView 的 dataSource，只要 dataSource 有变动就换成新的 Array，这样就可以了。

说到 UITableView，再说一下 UITableViewCell，RAC 给 UITableViewCell 提供了一个方法：`rac_prepareForReuseSignal`，它的作用是当 Cell 即将要被重用时，告诉 Cell。想象 Cell 上有多个 button，Cell 在初始化时给每个 button 都`addTarget:action:forControlEvents`，被重用时需要先移除这些 target，下面这段代码就可以很方便地解决这个问题：

```m
[[[self.cancelButton
	rac_signalForControlEvents:UIControlEventTouchUpInside]
	takeUntil:self.rac_prepareForReuseSignal]
	subscribeNext:^(UIButton *x) {
	// do other things
}];
```

还有一个很常用的 category 就是`UIButton+RACCommandSupport.h`，它提供了一个 property：`rac_command`，就是当 button 被按下时会执行的一个命令，命令被执行完后可以返回一个 signal，有了 signal 就有了灵活性。比如点击投票按钮，先判断一下有没有登录，如果有就发 HTTP 请求，没有就弹出登陆框，可以这么实现。

```m
voteButton.rac_command = [[RACCommand alloc] initWithEnabled:self.viewModel.voteCommand.enabled signalBlock:^RACSignal *(id input) {
	// Assume that we're logged in at first. We'll replace this signal later if not.
	RACSignal *authSignal = [RACSignal empty];

	if ([[PXRequest apiHelper] authMode] == PXAPIHelperModeNoAuth) {
		// Not logged in. Replace signal.
		authSignal = [[RACSignal createSignal:^RACDisposable *(id<RACSubscriber> subscriber) {
			@strongify(self);

			FRPLoginViewController *viewController = [[FRPLoginViewController alloc] initWithNibName:@"FRPLoginViewController" bundle:nil];
			UINavigationController *navigationController = [[UINavigationController alloc] initWithRootViewController:viewController];

			[self presentViewController:navigationController animated:YES completion:^{
				[subscriber sendCompleted];
			}];

			return nil;
		}]];
	}

	return [authSignal then:^RACSignal *{
		@strongify(self);
		return [[self.viewModel.voteCommand execute:nil] ignoreValues];
	}];
}];
[voteButton.rac_command.errors subscribeNext:^(id x) {
	[x subscribeNext:^(NSError *error) {
		[SVProgressHUD showErrorWithStatus:[error localizedDescription]];
	}];
}];
```

这段代码节选自 AshFurrow 的[FunctionalReactivePixels](https://github.com/AshFurrow/FunctionalReactivePixels)，有删减。

### Data Structure Categories

常用的数据结构，如 NSArray, NSDictionary 也都有添加相应的 category，比如`NSArray`添加了`rac_sequence`，可以将`NSArray`转换为`RACSequence`，顺便说一下`RACSequence`, `RACSequence`是一组 immutable 且有序的 values，不过这些 values 是运行时计算的，所以对性能提升有一定的帮助。`RACSequence`提供了一些方法，如`array`转换为`NSArray`，`any:`检查是否有 Value 符合要求，`all:`检查是不是所有的 value 都符合要求，这里的符合要求的，block 返回 YES，不符合要求的就返回 NO。

### NotificationCenter Category

`NSNotificationCenter`, 默认情况下`NSNotificationCenter`使用`Target-Action`方式来处理 Notification，这样就需要另外定义一个方法，这就涉及到编程领域的两大难题之一：起名字。有了 RAC，就有 Signal，有了 Signal 就可以 subscribe，于是`NotificationCenter`就可以这么来处理，还不用担心移除 observer 的问题。

```m
[[[NSNotificationCenter defaultCenter] rac_addObserverForName:@"MyNotification" object:nil] subscribeNext:^(NSNotification *notification) {
	NSLog(@"Notification Received");
}];
```

### NSObject Categories

NSObject 有不少的 Category，我觉得比较有用的有这么几个

#### NSObject+RACDeallocating.h

顾名思义就是在一个 object 的 dealloc 被触发时，执行的一段代码。

```m
NSArray *array = @[@"foo"];
[[array rac_willDeallocSignal] subscribeCompleted:^{
	NSLog(@"oops, i will be gone");
}];
array = nil;
```

#### NSObject+RACLifting.h

有时我们希望满足一定条件时，自动触发某个方法，有了这个 category 就可以这么办

```m
- (void)test
{
    RACSignal *signalA = [RACSignal createSignal:^RACDisposable *(id<RACSubscriber> subscriber) {
        double delayInSeconds = 2.0;
        dispatch_time_t popTime = dispatch_time(DISPATCH_TIME_NOW, (int64_t)(delayInSeconds * NSEC_PER_SEC));
        dispatch_after(popTime, dispatch_get_main_queue(), ^(void){
            [subscriber sendNext:@"A"];
        });
        return nil;
    }];

    RACSignal *signalB = [RACSignal createSignal:^RACDisposable *(id<RACSubscriber> subscriber) {
        [subscriber sendNext:@"B"];
        [subscriber sendNext:@"Another B"];
        [subscriber sendCompleted];
        return nil;
    }];

    [self rac_liftSelector:@selector(doA:withB:) withSignals:signalA, signalB, nil];
}

- (void)doA:(NSString *)A withB:(NSString *)B
{
    NSLog(@"A:%@ and B:%@", A, B);
}
```

这里的`rac_liftSelector:withSignals` 就是干这件事的，它的意思是当 signalA 和 signalB 都至少 sendNext 过一次，接下来只要其中任意一个 signal 有了新的内容，`doA:withB`这个方法就会自动被触发。

如果你有兴趣，可以想想上面这段代码会输出什么。

#### NSObject+RACSelectorSignal.h

这个 category 有`rac_signalForSelector:`和`rac_signalForSelector:fromProtocol:` 这两个方法。先来看前一个，它的意思是当某个 selector 被调用时，再执行一段指定的代码，相当于 hook。比如点击某个按钮后，记个日志。后者表示该 selector 实现了某个协议，所以可以用它来实现 Delegate。

## MVVM

RAC 带来的变化还不仅仅是这些，它还带来了架构层面的变化。我们都知道苹果推荐的是 MVC 架构，那 MVVM 又是什么呢？

![](https://f.cloud.github.com/assets/432536/867984/291ed380-f760-11e2-9106-d3158320af39.png)

跟 MVC 最大的区别是多了个`ViewModel`，它直接与 View 绑定，而且对 View 一无所知。拿做菜打比方的话，ViewModel 就是调料，它不关心做的到底是什么菜。这不是跟`Model`很像吗？是的，它可以扮演 Model 的职责，但其实它是 Model 的中介，这样当 Model 的 API 有变化，或者由本地存储变为远程 API 调用时，ViewModel 的 public API 可以保持不变。

使用 ViewModel 的好处是，可以让 Controller 更加简单和轻便，而且 ViewModel 相对独立，也更加方便测试和重用。那 Controller 这时又该做哪些事呢？在 MVVM 体系中，Controller 可以被看成 View，所以它的主要工作是处理布局、动画、接收系统事件、展示 UI。

MVVM 还有一个很重要的概念是 `data binding`，view 的呈现需要 data，这个 data 就是由 ViewModel 提供的，将 view 的 data 与 ViewModel 的 data 绑定后，将来双方的数据只要一方有变化，另一方就能收到。[这里](https://github.com/ReactiveCocoa/ReactiveViewModel)有 Github 开源的一个 ViewModel Base Class。

## 其他

RAC 在使用时有一些注意事项，可以参考官方的[DesignGuildLines](https://github.com/ReactiveCocoa/ReactiveCocoa/blob/master/Documentation/DesignGuidelines.md)，这里简单说一下。

当一个 signal 被一个 subscriber subscribe 后，这个 subscriber 何时会被移除？答案是当 subscriber 被 sendComplete 或 sendError 时，或者手动调用[disposable dispose]。

当 subscriber 被 dispose 后，所有该 subscriber 相关的工作都会被停止或取消，如 http 请求，资源也会被释放。

Signal events 是线性的，不会出现并发的情况，除非显示地指定 Scheduler。所以`-subscribeNext:error:completed:`里的 block 不需要锁定或者 synchronized 等操作，其他的 events 会依次排队，直到 block 处理完成。

Errors 有优先权，如果有多个 signals 被同时监听，只要其中一个 signal sendError，那么 error 就会立刻被传送给 subscriber，并导致 signals 终止执行。相当于 Exception。

生成 Signal 时，最好指定 Name, `-setNameWithFormat:` 方便调试。

block 代码中不要阻塞。

## 小结

尽管洋洋洒洒写了这么多，也只是对 RAC 有了个大概的了解，如果要更深入地了解 RAC 还是需要多读文档、代码和相关项目。

RAC 学习起来稍显吃力，且相关的文章目前还不多，中文的就更少了，希望这篇文章能带给你些帮助。

以下是我觉得还不错的 RAC 相关资源

- [FunctionalReactivePixels](https://github.com/AshFurrow/FunctionalReactivePixels) 作者同时还出了一本 FRP 相关的书，个人觉得看源码就足够了。
- [GroceryList](https://github.com/jspahrsummers/GroceryList) RAC 的作者之一 jspahrsummers 的一个项目
- [ReactiveCocoa Essentilas: Understanding and Using RACCommand](http://codeblog.shape.dk/blog/2013/12/05/reactivecocoa-essentials-understanding-and-using-raccommand/) 介绍了 RACCommand 的使用，同时也涉及了 RAC 相关的一些点。
- [Transparent OAuth Token Refresh Using ReactiveCocoa](http://codeblog.shape.dk/blog/2013/12/02/transparent-oauth-token-refresh-using-reactivecocoa/) 这篇文章讲了如何使用 RAC 来透明地获取 Access Token，然后继续发送请求。
- [BNR: An Introduction to ReactiveCocoa](http://vimeo.com/78749139)(视频)
