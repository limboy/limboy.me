+++
title= "php程序员是否该学习python"
date = 2010-09-08
description = ""
[taxonomies]
tags = ["programming", "php", "python"]
[extra]
giscus = "telescope"
+++

其实标题可以变为"xx 程序员是否该学习 yy"，xx 和 yy 可以是任何编程语言，而答案总是"应该"。因为我本身跟 php 打了不少年的交道，同时 python 也学习了一段时间，所以就把这两种语言串起来了。

php 和 python 上手都很容易，php 基本上是"大把函数任你抓，抓来就能做项目"，python 是"大把模块任你选，事半功倍全靠它"。双方都有强大的第三方扩展，很少需要自己费力去写一个，除非进行二次封装。

先来看看 PHP 比较爽的几个特性

### array

php 的<a href="http://php.net/manual/en/language.types.array.php">数组</a>几乎是所有语言中最强大的，同时扮演了 list, dictionary, stack, queue 甚至更多(相信这也是许多人喜欢 PHP 的一个重要原因)。而且使用还挺方便，提供了<a href="http://cn2.php.net/manual/en/ref.array.php">77 个数组相关方法</a>(这也不可避免地产生了另一个问题，下面会提到)。

### 与 html 的亲密结合

这也是其他语言少有的特性，php 本身就是一个模板引擎，可以与 html 天然融合。不过也有弊端，如 html 不应该包含复杂的业务逻辑，而且 php 与 html 混杂实在不够美观。

### 齐全的函数和丰富的第三方类库

函数是 php 的核心，这也是 php 容易上手的一个重要原因。要完成什么功能，只要找到该函数即可，从这个方面来说，php 更适合脚本化编程(貌似这也是 php 的初衷)。随着 php 的流行，第三方类库也开始丰富起来，甚至可以为 php 写插件来增强 php 的功能。

### 对 OOP 的完美支持

php4 虽然也可以进行 oop 编程，但语言本身不给力，只能努力往 OOP 方向去靠。到了 php5，情况就有了很大的好转，支持 PPP(private, protected, public) method 和 property，以及 static/final 等语法。php5.3 还支持 LSB(late static bindings)，虽然我觉得支持得很不到位。

### 魔术方法

<pre>__get/__set/__call/__toString</pre>等等，这些魔术方法给类带来了很大的便利，随便找个流行的框架，查看源码都会发现这些魔术方法的影踪，仿佛一下子变得无所不能。

再来看看 PHP 几个让人不爽的地方

### 变量被赋值，但却不使用

不太好理解，写段代码就知道了

```php
<?php
error_reporting(-1);
$str = 'hello world';
// 下面这段代码会报NOTICE ERROR，但事实上$str_arr已经被赋值，只是current方法没有使用这个变量
// 这段代码的运行过程是执行explode方法，然后将结果赋给$str_arr，然后将结果作为参数传递给current方法
// 也就是说整个过程没$str_arr什么事，$str_arr收到结果后就被踢走了
// 但有时候，只能使用变量而不能使用函数的返回值，如empty
$hello = current($str_arr = explode(' ', $str));
```

### 不能在函数/方法后跟[]

还是不太好理解，继续上代码

```php
<?php
function arr() {
	return array('hello', 'world');
}

// 会报错，于是只能先把结果赋给变量，再从这个变量去获取相应值，用完之后再unset该变量
echo arr()[0];
```

### 混乱的命名

上面说的几点只是小问题，这个就严重了。php 的命名几乎没有规律可循，随便举几个例子

```php
<?php
// 其中一个单词缩写，中间没有分割符
strpos();
tempnam();

// 两个单词没有缩写，其中有一个分割符
str_repeat();
file_exists();

// 驼峰命名
__toString();

// 下划线连接
__set_state();

// 这个太恐怖了，强烈怀疑是酒后编程
mysql_real_escape_string()
```

### 难记的参数

这个是很要命的，有些方法，我是用一次，看一次手册，比如 strpos/in_array/basename/...，完全没有套路可循。有些把$needle放到前面，$haystack 放到后面(如 explode)，有些正好倒过来(如 strpos)，太影响写程序的效率了。怪不得写 PHP 的基本都需要一个强大的 IDE(如 Zend/NetBeans)。

### 命名空间的缺失

就好像一大堆能人异士挤在一个房子里，要用到什么功能了，就抓一个出来，如果要往这个房间加人的话，还得保证不能跟已有的重名。如果有命名空间的话，就方便了，新建一个屋子，只要这个屋子不跟别的屋子重名就行，屋子里的人爱起什么名起什么名，完全不用担心冲突。好在 php5.3 加入了命名空间，虽然用起来还是挺别扭。

下面来说说 python 吧，其实 python 的职能是跨平台软件开发，但也可以用做 web 开发，而且出现了不少优秀的 web 框架，所以就不可避免地与 php 正面交锋(php 虽然也可以用来开发 gui 软件，但多少有点旁门左道的感觉)。

python 给我的感觉是简洁，强大且优雅。

### 简洁

- 半个单词能搞定的就不用整个单词，如 def/elif/iter
- 一行能搞定的就不用多行

```py
#generator expressions
sum(i*i for i in range(10))
```

- 同时对多个变量赋值

```py
a, b = ('hello', 'world')
```

### 强大

- 内置了 3 种常用数据结构：tuple/list/dictionary
- 支持匿名函数
- 多线程
- 函数的参数(可以不按顺序传参，这是个亮点)
- ...(php 有的，python 基本也少不了)

### 优雅

- 一切皆对象
- 一切皆引用
- 模块机制
- 独特的书写风格(这个因人而异吧，觉得换行+tab 很别扭的也大有人在)
- 自我说明(docstring+pydoc)

当然 python 也非完美，不爽的地方也挺多的，如参数的默认值如果是 mutable(可变的)，只会在第一次调用时初始化；class 的方法至少要传一个 self 参数等等。但瑕不掩瑜，php 程序员还是应该了解一下 python，即使不是全面转向 python。

对了，使用 python 还有一个很重要的原因是：GAE(我知道有 SAE，但~~~)

参考：

- http://ioreader.com/2007/08/19/12-things-you-should-dislike-about-php/
- http://ioreader.com/2007/08/17/11-cool-things-about-php-that-most-people-overlook
- http://wiki.python.org/moin/PythonVsPhp
- http://stackoverflow.com/questions/1486608/is-switching-from-php-to-python-worth-the-trouble
- http://stackoverflow.com/questions/3319261/php-devs-that-moved-to-python-is-the-experience-better
