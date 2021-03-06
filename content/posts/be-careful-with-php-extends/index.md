+++
title= "小心PHP的类定义顺序与继承的问题"
date = 2011-06-15
description = ""
[taxonomies]
tags = ["programming", "php"]
[extra]
giscus = "telescope"
+++

以下代码的运行环境均为 PHP5.3.4

先来看一段代码

```php
<?php
class A extends B {}
class B {}
```

代码很简单，也可以正常运行。看起来 PHP 的类定义与顺序无关。

再来看下面一段代码

```php
<?php
class A extends B {}
class B extends C {}
class C {}
```

猜猜结果会怎样？有点出乎意料，代码报 Fatal Error。

这就奇怪了，上一段代码也是在后面声明的类 B，正常。多了一层继承关系后，就报错了，错误信息是"Fatal Error: class 'B' not found "。 这又不能理解了，为什么会说找不到类 B 呢。

再来尝试一下新的组合

```php
<?php
class A extends B {}
class C {}
class B extends C {}
```

好了，又正常了。

再来尝试一下 namespace

```php
<?php
namespace A {
	class A extends \B\B {}
}

namespace B {
	class B extends \C\C{}
}

namespace C {
	class C {}
}
```

结果跟不是用 ns 是一样的。

这种时候，只能看看官方是怎么说的了 <a href="http://php.net/manual/en/keyword.extends.php">http://php.net/manual/en/keyword.extends.php</a>

> bq. Classes must be defined before they are used! If you want the class Named_Cart to extend the class Cart, you will have to define the class Cart first. If you want to create another class called Yellow_named_cart based on the class Named_Cart you have to define Named_Cart first. To make it short: the order in which the classes are defined is important.

说得很明确，类必须先定义后使用，哪怕是在一个文件里。但这又无法解释第一段代码为什么可以正常运行。所以基本可以认为这是一个 php 的 bug。

好在有 autoload 机制，这种情况完全可以避免。不过对那些想通过把许多类文件合并成一个来提高 PHP 运行效率的童鞋们来说，这就有点麻烦咯。
