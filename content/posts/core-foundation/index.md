+++
title= "说说Core Foundation"
date = 2013-06-07
description = ""
[taxonomies]
tags = ["programming", "iOS"]
[extra]
giscus = "telescope"
+++

先来说说「Core Foundation」（以下简称 CF）的历史吧。当年乔布斯被自己创办的公司驱逐后，成立了「NeXT Computer」,其实做的还是老本行：卖电脑，但依旧不景气。好在 NeXTSTEP 系统表现还不错，亏损不至于太严重。正好此时苹果的市场份额大跌，急需一个新的操作系统，结果大家都知道了，乔布斯借此收购，重新回到了苹果。

这里就牵扯到了一个问题，如何让旧有的系统（Mac OS 9）和 NeXTSTEP 合成为一个新系统？这就需要一个更为底层的核心库可以供 Mac Toolbox 和 OPENSTEP 双方调用。CF 就这么诞生了。

CF 是由 C 语言实现的，而不是 Objective-C，所以如果用到了 CF，就需要手动管理内存，ARC 是无能为力的。当然因为 CF 和 Foundation 之间的友好关系，它们之间的管理权也是可以移交的，这个后面再说。

CF 提供了基础功能，如 CFString,CFDate,CFNumber 等等，以 CFString 为例，CFString 和 NSString 之间是什么关系？NSString 其实是一个「类簇」，也就是抽象接口，所以 String Objects 并不是 NSString 实例，而是实现了 NSString 方法的私有类的实例，也就是 CFString。

```m
NSLog(NSStringFromClass([@"Some Class" class]));

# output __NSCFConstantString
```

同时 NSStrings 和 CFStrings 之间可以自由转换，也就是「toll free bridging」。比如：

```m
CFStringRef aCFString = (CFStringRef)aNSString;
NSString *aNSString = (NSString *)aCFString;
```

因为编译器无法自动管理 CF 的内存，所以 CF 对象在使用完后，需要手动释放（CFRelease）。如果使用 ARC 来管理内存，苹果提供了 3 种方法来处理：

### \_\_bridge

\_\_bridge 只是在 CF 和 OC 之间传递指针，其他的事啥也没干，所以转换成 CF 时，还是要手动释放内存。

```m
CFStringRef aCFString = CFStringCreateWithCString(NULL, "test", kCFStringEncodingASCII);
NSString *aNSString = (__bridge NSString *)aCFString;

(void)aNSString;

CFRelease(aCFString);
```

### \_\_bridge_retained

`__bridge_retained` 或者 `CFBridgingRetain()`，将 Objective-C 对象转换为 Core Foundation 对象，把对象所有权桥接给 Core Foundation 对象，同时剥夺 ARC 的管理权，后续需要开发者使用 CFRelease 或者相关方法手动来释放对象。

### \_\_bridge_transfer

`__bridge_transfer` 或者 `CFBridgingRelease()` 将非 Objective-C 对象转换为 Objective-C 对象，同时将对象的管理权交给 ARC，开发者无需手动管理内存。

最后，因为 CF 是用 C 实现的，且处于下层，所以执行速度上会比 Foundation 稍微快一点，不过也就是一点点，几乎察觉不到。相比 Foundation 带来的 ARC 内存管理和更多的 API，开发上的效率会大幅提升，所以还是尽量多的使用 OC。

### 参考

- [http://ridiculousfish.com/blog/posts/bridge.html](http://ridiculousfish.com/blog/posts/bridge.html)
- [http://blog.csdn.net/yiyaaixuexi/article/details/8553659](http://blog.csdn.net/yiyaaixuexi/article/details/8553659)
