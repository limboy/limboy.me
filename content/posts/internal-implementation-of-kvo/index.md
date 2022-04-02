+++
title= "(译)KVO的内部实现"
date = 2013-08-15
description = ""
[taxonomies]
tags = ["programming", "iOS", "translation"]
[extra]
giscus = "telescope"
+++

09 年的[一篇文章](http://www.mikeash.com/pyblog/friday-qa-2009-01-23.html)，比较深入地阐述了 KVO 的内部实现。

KVO 是实现 Cocoa Bindings 的基础，它提供了一种方法，当某个属性改变时，相应的 objects 会被通知到。在其他语言中，这种观察者模式通常需要单独实现，而在 Objective-C 中，通常无须增加额外代码即可使用。

###概览
这是怎么实现的呢？其实这都是通过 Objective-C 强大的运行时(runtime)实现的。当你第一次观察某个 object 时，runtime 会创建一个新的继承原先 class 的 subclass。在这个新的 class 中，它重写了所有被观察的 key，然后将 object 的`isa`指针指向新创建的 class（这个指针告诉 Objective-C 运行时某个 object 到底是哪种类型的 object）。所以 object 神奇地变成了新的子类的实例。

这些被重写的方法实现了如何通知观察者们。当改变一个 key 时，会触发`setKey`方法，但这个方法被重写了，并且在内部添加了发送通知机制。（当然也可以不走 setXXX 方法，比如直接修改 iVar，但不推荐这么做）。

有意思的是：苹果不希望这个机制暴露在外部。除了 setters，这个动态生成的子类同时也重写了`-class`方法，依旧返回原先的 class！如果不仔细看的话，被 KVO 过的 object 看起来和原先的 object 没什么两样。

###深入探究
下面来看看这些是如何实现的。我写了个程序来演示隐藏在 KVO 背后的机制。

```m
// gcc -o kvoexplorer -framework Foundation kvoexplorer.m

#import <Foundation/Foundation.h>
#import <objc/runtime.h>

@interface TestClass : NSObject
{
int x;
int y;
int z;
}
@property int x;
@property int y;
@property int z;
@end

@implementation TestClass
@synthesize x, y, z;
@end

static NSArray *ClassMethodNames(Class c)
{
NSMutableArray *array = [NSMutableArray array];
unsigned int methodCount = 0;
Method \*methodList = class_copyMethodList(c, &methodCount);
unsigned int i;
for(i = 0; i < methodCount; i++)
[array addObject: NSStringFromSelector(method_getName(methodList[i]))];
free(methodList);
return array;
}

static void PrintDescription(NSString *name, id obj)
{
NSString *str = [NSString stringWithFormat:
@"%@: %@\n\tNSObject class %s\n\tlibobjc class %s\n\timplements methods <%@>",
name,
obj,
class_getName([obj class]),
class_getName(obj->isa),
[ClassMethodNames(obj->isa) componentsJoinedByString:@", "]];
printf("%s\n", [str UTF8String]);
}

int main(int argc, char \**argv)
{
[NSAutoreleasePool new];
TestClass *x = [[TestClass alloc] init];
TestClass *y = [[TestClass alloc] init];
TestClass *xy = [[TestClass alloc] init];
TestClass \*control = [[TestClass alloc] init];
[x addObserver:x forKeyPath:@"x" options:0 context:NULL];
[xy addObserver:xy forKeyPath:@"x" options:0 context:NULL];
[y addObserver:y forKeyPath:@"y" options:0 context:NULL];
[xy addObserver:xy forKeyPath:@"y" options:0 context:NULL];
PrintDescription(@"control", control);
PrintDescription(@"x", x);
PrintDescription(@"y", y);
PrintDescription(@"xy", xy);
printf("Using NSObject methods, normal setX: is %p, overridden setX: is %p\n",
[control methodForSelector:@selector(setX:)],
[x methodForSelector:@selector(setX:)]);
printf("Using libobjc functions, normal setX: is %p, overridden setX: is %p\n",
method_getImplementation(class_getInstanceMethod(object_getClass(control),
@selector(setX:))),
method_getImplementation(class_getInstanceMethod(object_getClass(x),
@selector(setX:))));
return 0;
}
```

我们从头到尾细细看来。

首先定义了一个`TestClass`的类，它有 3 个属性。

然后定义了一些方便调试的方法。`ClassMethodNames`使用 Objective-C 运行时方法来遍历一个 class，得到方法列表。注意，这些方法不包括父类的方法。`PrintDescription`打印 object 的所有信息，包括 class 信息（包括`-class`和通过运行时得到的 class），以及这个 class 实现的方法。

然后创建了 4 个`TestClass`实例，每一个都使用了不同的观察方式。`x`实例有一个观察者观察`x`key，`y`, `xy`也类似。为了做比较，`z`key 没有观察者。最后`control`实例没有任何观察者。

然后打印出 4 个 objects 的 description。

之后继续打印被重写的 setter 内存地址，以及未被重写的 setter 的内存地址做比较。这里做了两次，是因为`-methodForSelector:`没能得到重写的方法。KVO 试图掩盖它实际上创建了一个新的 subclass 这个事实！但是使用运行时的方法就原形毕露了。

###运行代码
看看这段代码的输出

```m
control: <TestClass: 0x104b20>
NSObject class TestClass
libobjc class TestClass
implements methods <setX:, x, setY:, y, setZ:, z>
x: <TestClass: 0x103280>
NSObject class TestClass
libobjc class NSKVONotifying_TestClass
implements methods <setY:, setX:, class, dealloc, \_isKVOA>
y: <TestClass: 0x104b00>
NSObject class TestClass
libobjc class NSKVONotifying_TestClass
implements methods <setY:, setX:, class, dealloc, \_isKVOA>
xy: <TestClass: 0x104b10>
NSObject class TestClass
libobjc class NSKVONotifying_TestClass
implements methods <setY:, setX:, class, dealloc, \_isKVOA>
Using NSObject methods, normal setX: is 0x195e, overridden setX: is 0x195e
Using libobjc functions, normal setX: is 0x195e, overridden setX: is 0x96a1a550
```

首先，它输出了`control`object，没有任何问题，它的 class 是`TestClass`，并且实现了 6 个 set/get 方法。

然后是 3 个被观察的 objects。注意`-class`仍然显示的是`TestClass`，使用`object_getClass`显示了这个 object 的真面目：它是`NSKVONotifying_TestClass`的一个实例。这个`NSKVONotifying_TestClass`就是动态生成的 subclass！

注意，它是如何实现这两个被观察的 setters 的。你会发现，它很聪明，没有重写`-setZ:`，虽然它也是个 setter，因为它没有被观察。同时注意到，3 个实例对应的是同一个 class，也就是说两个 setters 都被重写了，尽管其中的两个实例只观察了一个属性。这会带来一点效率上的问题，因为即使没有被观察的 property 也会走被重写的 setter，但苹果显然觉得这比分开生成动态的 subclass 更好，我也觉得这是个正确的选择。

你会看到 3 个其他的方法。有之前提到过的被重写的`-class`方法，假装自己还是原来的 class。还有`-dealloc`方法处理一些收尾工作。还有一个`_isKVOA`方法，看起来像是一个私有方法。

接下来，我们输出`-setX:`的实现。使用`-methodForSelector:`返回的是相同的值。因为`-setX:`已经在子类被重写了，这也就意味着`methodForSelector:`在内部实现中使用了`-class`，于是得到了错误的结果。

最后我们通过运行时得到了不同的输出结果。

作为一个优秀的探索者，我们进入 debugger 来看看这第二个方法的实现到底是怎样的：

```m
(gdb) print (IMP)0x96a1a550
$1 = (IMP) 0x96a1a550 <\_NSSetIntValueAndNotify>
```

看起来是一个内部方法，对`Foundation`使用`nm -a`得到一个完整的私有方法列表：

```m
0013df80 t __NSSetBoolValueAndNotify
000a0480 t __NSSetCharValueAndNotify
0013e120 t __NSSetDoubleValueAndNotify
0013e1f0 t __NSSetFloatValueAndNotify
000e3550 t __NSSetIntValueAndNotify
0013e390 t __NSSetLongLongValueAndNotify
0013e2c0 t __NSSetLongValueAndNotify
00089df0 t __NSSetObjectValueAndNotify
0013e6f0 t __NSSetPointValueAndNotify
0013e7d0 t __NSSetRangeValueAndNotify
0013e8b0 t __NSSetRectValueAndNotify
0013e550 t __NSSetShortValueAndNotify
0008ab20 t __NSSetSizeValueAndNotify
0013e050 t __NSSetUnsignedCharValueAndNotify
0009fcd0 t __NSSetUnsignedIntValueAndNotify
0013e470 t __NSSetUnsignedLongLongValueAndNotify
0009fc00 t __NSSetUnsignedLongValueAndNotify
0013e620 t __NSSetUnsignedShortValueAndNotify
```

这个列表也能发现一些有趣的东西。比如苹果为每一种 primitive type 都写了对应的实现。Objective-C 的 object 会用到的其实只有`__NSSetObjectValueAndNotify`，但需要一整套来对应剩下的，而且看起来也没有实现完全，比如`long dobule`或`_Bool`都没有。甚至没有为通用指针类型(generic pointer type)提供方法。所以，不在这个方法列表里的属性其实是不支持 KVO 的。

KVO 是一个很强大的工具，有时候过于强大了，尤其是有了自动触发通知机制。现在你知道它内部是怎么实现的了，这些知识或许能帮助你更好地使用它，或在它出错时更方便调试。

如果你打算使用 KVO，或许可以看一下我的另一篇文章[Key-Value Observing Done Right](http://www.mikeash.com/?page=pyblog/key-value-observing-done-right.html)
