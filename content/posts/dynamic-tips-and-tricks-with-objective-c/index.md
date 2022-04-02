+++
title= "(译)Objective-C的动态特性"
date = 2013-08-03
description = ""
[taxonomies]
tags = ["programming", "translation"]
[extra]
giscus = "telescope"
+++

这是一篇译文，原文[在此](http://pilky.me/view/21)，上一篇文章就是受这篇文章启发，这次干脆都翻译过来。

过去的几年中涌现了大量的 Objective-C 开发者。有些是从动态语言转过来的，比如 Ruby 或 Python，有些是从强类型语言转过来的，如 Java 或 C#，当然也有直接以 Objective-C 作为入门语言的。也就是说有很大一部分开发者都没有使用 Objective-C 太长时间。当你接触一门新语言时，更多地会关注基础知识，如语法和特性等。但通常有一些更高级的，更鲜为人知又有强大功能的特性等待你去开拓。

这篇文章主要是来领略下 Objective-C 的运行时(runtime)，同时解释是什么让 Objective-C 如此动态，然后感受下这些动态化的技术细节。希望这回让你对 Objective-C 和 Cocoa 是如何运行的有更好的了解。

## The Runtime

Objective-C 是一门简单的语言，95%是 C。只是在语言层面上加了些关键字和语法。真正让 Objective-C 如此强大的是它的运行时。它很小但却很强大。它的核心是消息分发。

### Messages

如果你是从动态语言如 Ruby 或 Python 转过来的，可能知道什么是消息，可以直接跳过进入下一节。那些从其他语言转过来的，继续看。

执行一个方法，有些语言，编译器会执行一些额外的优化和错误检查，因为调用关系很直接也很明显。但对于消息分发来说，就不那么明显了。在发消息前不必知道某个对象是否能够处理消息。你把消息发给它，它可能会处理，也可能转给其他的 Object 来处理。一个消息不必对应一个方法，一个对象可能实现一个方法来处理多条消息。

在 Objective-C 中，消息是通过`objc_msgSend()`这个 runtime 方法及相近的方法来实现的。这个方法需要一个 target，selector，还有一些参数。理论上来说，编译器只是把消息分发变成`objc_msgSend`来执行。比如下面这两行代码是等价的。

```m
[array insertObject:foo atIndex:5];
objc_msgSend(array, @selector(insertObject:atIndex:), foo, 5);
```

### Objects, Classes, MetaClasses

大多数面向对象的语言里有 classes 和 objects 的概念。Objects 通过 Classes 生成。但是在 Objective-C 中，classes 本身也是 objects(译者注：这点跟 python 很像)，也可以处理消息，这也是为什么会有类方法和实例方法。具体来说，Objective-C 中的 Object 是一个结构体(struct)，第一个成员是`isa`，指向自己的 class。这是在 objc/objc.h 中定义的。

```m
typedef struct objc_object {
	Class isa;
} *id;
```

object 的 class 保存了方法列表，还有指向父类的指针。但 classes 也是 objects，也会有`isa`变量，那么它又指向哪儿呢？这里就引出了第三个类型: `metaclasses`。一个 metaclass 被指向 class，class 被指向 object。它保存了所有实现的方法列表，以及父类的 metaclass。如果想更清楚地了解 objects,classes 以及 metaclasses 是如何一起工作地，可以阅读[这篇文章](http://www.sealiesoftware.com/blog/archive/2009/04/14/objc_explain_Classes_and_metaclasses.html)。

### Methods, Selectors and IMPs

我们知道了运行时会发消息给对象。我们也知道一个对象的 class 保存了方法列表。那么这些消息是如何映射到方法的，这些方法又是如何被执行的呢？

第一个问题的答案很简单。class 的方法列表其实是一个字典，key 为 selectors，IMPs 为 value。一个 IMP 是指向方法在内存中的实现。很重要的一点是，selector 和 IMP 之间的关系是在运行时才决定的，而不是编译时。这样我们就能玩出些花样。

IMP 通常是指向方法的指针，第一个参数是 self，类型为 id，第二个参数是\_cmd，类型为 SEL，余下的是方法的参数。这也是`self`和`_cmd`被定义的地方。下面演示了 Method 和 IMP

```m
- (id)doSomethingWithInt:(int)aInt{}

id doSomethingWithInt(id self, SEL _cmd, int aInt){}
```

### 其他运行时的方法

现在我们知道了 objects,classes,selectors,IMPs 以及消息分发，那么运行时到底能做什么呢？主要有两个作用：

1. 创建、修改、自省 classes 和 objects
2. 消息分发

之前已经提过消息分发，不过这只是一小部分功能。所有的运行时方法都有特定的前缀。下面是一些有意思的方法：

#### class

class 开头的方法是用来修改和自省 classes。方法如`class_addIvar`, `class_addMethod`, `class_addProperty`和`class_addProtocol`允许重建 classes。`class_copyIvarList`, `class_copyMethodList`, `class_copyProtocolList`和`class_copyPropertyList`能拿到一个 class 的所有内容。而`class_getClassMethod`, `class_getClassVariable`, `class_getInstanceMethod`, `class_getInstanceVariable`, `class_getMethodImplementation`和`class_getProperty`返回单个内容。

也有一些通用的自省方法，如`class_conformsToProtocol`, `class_respondsToSelector`, `class_getSuperclass`。最后，你可以使用`class_createInstance`来创建一个 object。

#### ivar

这些方法能让你得到名字，内存地址和 Objective-C type encoding。

#### method

这些方法主要用来自省，比如`method_getName`, `method_getImplementation`, `method_getReturnType`等等。也有一些修改的方法，包括`method_setImplementation`和`method_exchangeImplementations`，这些我们后面会讲到。

#### objc

一旦拿到了 object，你就可以对它做一些自省和修改。你可以 get/set ivar, 使用`object_copy`和`object_dispose`来 copy 和 free object 的内存。最 NB 的不仅是拿到一个 class，而是可以使用`object_setClass`来改变一个 object 的 class。待会就能看到使用场景。

#### property

属性保存了很大一部分信息。除了拿到名字，你还可以使用`property_getAttributes`来发现 property 的更多信息，如返回值、是否为 atomic、getter/setter 名字、是否为 dynamic、背后使用的 ivar 名字、是否为弱引用。

#### protocol

Protocols 有点像 classes，但是精简版的，运行时的方法是一样的。你可以获取 method, property, protocol 列表, 检查是否实现了其他的 protocol。

#### sel

最后我们有一些方法可以处理 selectors，比如获取名字，注册一个 selector 等等。

现在我们对 Objective-C 的运行时有了大概的了解，来看看它们能做哪些有趣的事情。

## Classes And Selectors From Strings

比较基础的一个动态特性是通过 String 来生成 Classes 和 Selectors。Cocoa 提供了`NSClassFromString`和`NSSelectorFromString`方法，使用起来很简单：

```m
Class stringclass = NSClassFromString(@"NSString");
```

于是我们就得到了一个 string class。接下来：

```m
NSString *myString = [stringclass stringWithString:@"Hello World"];
```

为什么要这么做呢？直接使用 Class 不是更方便？通常情况下是，但有些场景下这个方法会很有用。首先，可以得知是否存在某个 class，`NSClassFromString` 会返回 nil，如果运行时不存在该 class 的话。比如可以检查`NSClassFromString(@"NSRegularExpression")`是否为 nil 来判断是否为 iOS4.0+。

另一个使用场景是根据不同的输入返回不同的 class 或 method。比如你在解析一些数据，每个数据项都有要解析的字符串以及自身的类型（String，Number，Array）。你可以在一个方法里搞定这些，也可以使用多个方法。其中一个方法是获取 type，然后使用 if 来调用匹配的方法。另一种是根据 type 来生成一个 selector，然后调用之。以下是两种实现方式：

```m
- (void)parseObject:(id)object {
    for (id data in object) {
        if ([[data type] isEqualToString:@"String"]) {
            [self parseString:[data value]];
        } else if ([[data type] isEqualToString:@"Number"]) {
            [self parseNumber:[data value]];
        } else if ([[data type] isEqualToString:@"Array"]) {
            [self parseArray:[data value]];
        }
    }
}
- (void)parseObjectDynamic:(id)object {
    for (id data in object) {
    	[self performSelector:NSSelectorFromString([NSString stringWithFormat:@"parse%@:", [data type]]) withObject:[data value]];
    }
}
- (void)parseString:(NSString *)aString {}
- (void)parseNumber:(NSString *)aNumber {}
- (void)parseArray:(NSString *)aArray {}
```

可一看到，你可以把 7 行带 if 的代码变成 1 行。将来如果有新的类型，只需增加实现方法即可，而不用再去添加新的 else if。

## Method Swizzling

之前我们讲过，方法由两个部分组成。Selector 相当于一个方法的 id；IMP 是方法的实现。这样分开的一个便利之处是 selector 和 IMP 之间的对应关系可以被改变。比如一个 IMP 可以有多个 selectors 指向它。

而 Method Swizzling 可以交换两个方法的实现。或许你会问“什么情况下会需要这个呢？”。我们先来看下 Objective-C 中，两种扩展 class 的途径。首先是 subclassing。你可以重写某个方法，调用父类的实现，这也意味着你必须使用这个 subclass 的实例，但如果继承了某个 Cocoa class，而 Cocoa 又返回了原先的 class(比如 NSArray)。这种情况下，你会想添加一个方法到 NSArray，也就是使用 Category。99%的情况下这是 OK 的，但如果你重写了某个方法，就没有机会再调用原先的实现了。

Method Swizzling 可以搞定这个问题。你可以重写某个方法而不用继承，同时还可以调用原先的实现。通常的做法是在 category 中添加一个方法(当然也可以是一个全新的 class)。可以通过`method_exchangeImplementations`这个运行时方法来交换实现。来看一个 demo，这个 demo 演示了如何重写`addObject:`方法来纪录每一个新添加的对象。

```m
#import  <objc/runtime.h>

@interface NSMutableArray (LoggingAddObject)
- (void)logAddObject:(id)aObject;
@end

@implementation NSMutableArray (LoggingAddObject)

+ (void)load {
    Method addobject = class_getInstanceMethod(self, @selector(addObject:));
    Method logAddobject = class_getInstanceMethod(self, @selector(logAddObject:));
    method_exchangeImplementations(addObject, logAddObject);
}

- (void)logAddObject:(id)aobject {
    [self logAddObject:aObject];
    NSLog(@"Added object %@ to array %@", aObject, self);
}

@end
```

我们把方法交换放到了`load`中，这个方法只会被调用一次，而且是运行时载入。如果指向临时用一下，可以放到别的地方。注意到一个很明显的递归调用`logAddObject:`。这也是 Method Swizzling 容易把我们搞混的地方，因为我们已经交换了方法的实现，所以其实调用的是`addObject:`

![Method Swizzling](http://pilky.me/static/blogmedia/objcdynamictips_methodswizzling.png)

## 动态继承、交换

我们可以在运行时创建新的 class，这个特性用得不多，但其实它还是很强大的。你能通过它创建新的子类，并添加新的方法。

但这样的一个子类有什么用呢？别忘了 Objective-C 的一个关键点：object 内部有一个叫做`isa`的变量指向它的 class。这个变量可以被改变，而不需要重新创建。然后就可以添加新的 ivar 和方法了。可以通过以下命令来修改一个 object 的 class

```m
object_setClass(myObject, [MySubclass class]);
```

这可以用在 Key Value Observing。当你开始 observing an object 时，Cocoa 会创建这个 object 的 class 的 subclass，然后将这个 object 的 isa 指向新创建的 subclass。点击[这里](http://www.mikeash.com/pyblog/friday-qa-2009-01-23.html)查看更详细的解释。

## 动态方法处理

目前为止，我们讨论了方法交换，以及已有方法的处理。那么当你发送了一个 object 无法处理的消息时会发生什么呢？很明显，"it breaks"。大多数情况下确实如此，但 Cocoa 和 runtime 也提供了一些应对方法。

首先是**动态方法处理**。通常来说，处理一个方法，运行时寻找匹配的 selector 然后执行之。有时，你只想在运行时才创建某个方法，比如有些信息只有在运行时才能得到。要实现这个效果，你需要重写`+resolveInstanceMethod:` 和/或 `+resolveClassMethod:`。如果确实增加了一个方法，记得返回 YES。

```m
+ (BOOL)resolveInstanceMethod:(SEL)aSelector {
    if (aSelector == @selector(myDynamicMethod)) {
        class_addMethod(self, aSelector, (IMP)myDynamicIMP, "v@:");
        return YES;
    }
    return [super resolveInstanceMethod:aSelector];
}
```

那 Cocoa 在什么场景下会使用这些方法呢？Core Data 用得很多。NSManagedObjects 有许多在运行时添加的属性用来处理 get/set 属性和关系。那如果 Model 在运行时被改变了呢？

## 消息转发

如果 resolve method 返回 NO，运行时就进入下一步骤：消息转发。有两种常见用例。1) 将消息转发到另一个可以处理该消息的 object。2) 将多个消息转发到同一个方法。

消息转发分两步。首先，运行时调用`-forwardingTargetForSelector:`，如果只是想把消息发送到另一个 object，那么就使用这个方法，因为更高效。如果想要修改消息，那么就要使用`-forwardInvocation:`，运行时将消息打包成 NSInvocation，然后返回给你处理。处理完之后，调用`invokeWithTarget:`。

Cocoa 有几处地方用到了消息转发，主要的两个地方是代理(Proxies)和响应链(Responder Chain)。NSProxy 是一个轻量级的 class，它的作用就是转发消息到另一个 object。如果想要惰性加载 object 的某个属性会很有用。NSUndoManager 也有用到，不过是截取消息，之后再执行，而不是转发到其他的地方。

响应链是关于 Cocoa 如何处理与发送事件与行为到对应的对象。比如说，使用 Cmd+C 执行了 copy 命令，会发送`-copy:`到响应链。首先是 First Responder，通常是当前的 UI。如果没有处理该消息，则转发到下一个`-nextResponder`。这么一直下去直到找到能够处理该消息的 object，或者没有找到，报错。

## 使用 Block 作为 Method IMP

iOS 4.3 带来了很多新的 runtime 方法。除了对 properties 和 protocols 的加强，还带来一组新的以 imp 开头的方法。通常一个 IMP 是一个指向方法实现的指针，头两个参数为 object(self)和 selector(\_cmd)。iOS 4.0 和 Mac OS X 10.6 带来了 block，`imp_implementationWithBlock()` 能让我们使用 block 作为 IMP，下面这个代码片段展示了如何使用 block 来添加新的方法。

```m
IMP myIMP = imp_implementationWithBlock(^(id _self, NSString *string) {
	NSLog(@"Hello %@", string);
});
class_addMethod([MYclass class], @selector(sayHello:), myIMP, "v@:@");
```

如果想知道这是如何实现的，可以查看[这篇文章](http://www.friday.com/bbum/2011/03/17/ios-4-3-imp_implementationwithblock/)

可以看到，Objective-C 表面看起来挺简单，但还是很灵活的，可以带来很多可能性。动态语言的优势在于在不扩展语言本身的情况下做很多很灵巧的事情。比如 Key Value Observing，提供了优雅的 API 可以与已有的代码无缝结合，而不需要新增语言级别的特性。

希望这篇文章能让你更深入地了解 Objective-C，在开发 app 时也能开阔思路，考虑更多的可能性。
