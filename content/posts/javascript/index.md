+++
title= "javascript大杂烩"
date = 2011-03-04
description = ""
[taxonomies]
tags = ["programming", "javascript"]
[extra]
giscus = "telescope"
+++

花了点时间学习了下 js 基础，跟大家分享一下，有不到之处，欢迎指出 :)

### 关于对象

#### 对象的创建

```js
var newObj = new Object();
// var newObj = {};
newObj['someValue'] = 'val';
```

#### 一切皆对象

```js
[1,2] instanceof Object // true
{1:2, 3:4} instanceof Object //true
```

但也有些特殊的对象，如 3, 'str', true 等等，但如果用 instanceof 测试的话，会发现

```js
'foo' instanceof Object; // false
3 instanceof Object; // false
true instanceof Object; // false
```

但它们真的也是对象

```js
'foo'.constructor == String // true
true.constructor == Boolean // true
3.constructor == Number // true
```

还有一个理由

```js
Number.prototype.times = function (func) {
  for (var index = 1; index <= this; index++) {
    func(index);
  }
};
(5).times(print);
// 5 .times(print); //also works
// 加上括号是为了避免出现解析错误(js引擎会以为是小数点)
```

就连函数也是一个对象

```js
var fn = function () {};
fn.foo = 'hello world';
fn.bar = function () {
  alert(this.foo);
};
```

#### 对象的初始化

```js
function User(first, last) {
  this.name = first + ' ' + last;
}
var user = new User('John', 'Resig');
// var user = User('John', 'Resig');
```

一个 function，可以看成是一个 Class，也可以看成是一个正常的函数，这就麻烦了，因为无论加不加上 new 这个关键字，function 都能正常运行，虽然结果会不一样。

如果看成 Class，使用 new 关键字初始化，那么 function 里的 this 指向当前的 function。如果不使用 new 关键字，则 function 里的 this 默认指向 Window

有两种解决方法，一个是将 Class function 的首字母大写，如 User，这样就能清楚地知道哪些 function 是 Class。但这样还是避免不了写程序时粗心，忘了加 new 关键字。

另一种方法就是不是用 new 关键字，在 function 里自动判断，保证返回的一定是当前对象

```js
function User(first, last) {
  if (this instanceof User) {
    this.name = first + ' ' + last;
  } else return new User(first, last);
}
```

更通用的方法是创建一个 makeClass 方法

```js
// makeClass - By John Resig (MIT Licensed)
function makeClass() {
  return function (args) {
    if (this instanceof arguments.callee) {
      if (typeof this.init == 'function')
        this.init.apply(this, args.callee ? args : arguments);
    } else return new arguments.callee(arguments);
  };
}
```

因为函数名未知，所以使用了 arguments.callee 来实现。

makeClass 的使用

```js
var User = makeClass();
User.prototype.init = function (first, last) {
  this.name = first + ' ' + last;
};
var user = User('John', 'Resig');
user.name;
// => "John Resig"
```

#### 对象的继承

每个 function 都有一个特殊的变量"prototype"，当实例化对象时，这个变量上的各个属性也会被附加到对象上

```js
function Car(model, year, miles) {
  this.model = model;
  this.year = year;
  this.miles = miles;
}

Car.prototype = {
  info: function () {
    return this.model + this.year + this.miles;
  },
};

var car = new Car('Benz', 3, 1500);
alert(car.info());
```

如果不使用 new 关键字，prototype 就失效了

prototype 属性也有一个特殊的属性"constructor"，通过它我们就能实现继承了

```js
Object.prototype.inObj = 1;

function A() {
  this.inA = 2;
}

A.prototype.inAProto = 3;

B.prototype = new A(); // Hook up A into B's prototype chain
B.prototype.constructor = B;
function B() {
  this.inB = 4;
}

B.prototype.inBProto = 5;

x = new B();
```

### 闭包与模块化

闭包是一种现象，通常是因为一个 function 返回了一个内部的 function，如

```js
function f1() {
  n = 2011;
  return function f2() {
    alert(n); // 2011
  };
}
```

可以看到内部 function f2 成功地得到了 f1 的 local 变量，又因为 n 被 f2 使用，所以变量 n 就常驻内存了
从这个角度上说，如果把 f1 看成一个 class，n 就变成了私有变量，而 f2 成为了公共方法，所以就有了模块化的概念

```js
var myNamespace = (function () {
  var myPrivateVar = 0;
  var myPrivateMethod = function (someText) {
    console.log(someText);
  };

  return {
    myPublicVar: 'foo',
    myPublicFunction: function (bar) {
      myPrivateVar++;
      myPrivateMethod(bar);
    },
  };
})();
```

### 其他

#### 避免命名污染的方法

```js
// self executing
// if you want some var global accessable, put "window." ahead
(function () {
  var myVar = 2;
  alert(myVar);
  window.globalVar = 3;
})();
```

#### 强大的 prototype

```js
Array.prototype.contains = function (value) {
  for (var i = 0; i < this.length; i++) {
    if (this[i] == value) return true;
  }
  return false;
};

var stringArray = ['foo', 'bar', 'foobar'];
stringArray.contains('foobar');
```

#### 方便的"+"

```js
// Quick hex to dec conversion:
+'0xFF'; // -> 255

// Get a timestamp for now, the equivalent of `new Date().getTime()`:
+new Date();

// Safer parsing than parseFloat()/parseInt()
parseInt('1,000'); // -> 1, not 1000
+'1,000'; // -> NaN, much better for testing user input
parseInt('010'); // -> 8, because of the octal literal prefix
+'010'; // -> 10, `Number()` doesn't parse octal literals

// A use case for this would be rare, but still useful in cases
// for shortening something like if (someVar === null) someVar = 0;
+null; // -> 0;

// Boolean to integer
+true; // -> 1;
+false; // -> 0;

// Other useful tidbits:
+'1e10'; // -> 10000000000
+'1e-4'; // -> 0.0001
+'-12'; // -> -12
```

注意：如果是字符串与数字相加的话，结果还是字符串，如"hello" + 3，结果为"hello3"

#### 通过[]来获取/设置 Object 的属性

```js
a = {};
a['class'] = 'hello'; // access reversed property
a['have space'] = 'world'; // has space
a['.class .subclass'] = 'value'; // can have .
```

#### String 的 split 和 replace 可以包含正则

```js
'hello world   with  spaces'.split(/\s+/g);
//returns an array: ["hello", "world", "with", "spaces"]

var i = 1;
'foo bar baz '.replace(/\s+/g, function () {
  return i++;
});
//returns "foo1bar2baz3"
```

#### 函数定义式与函数表达式

```js
alert(typeof eve); //结果:function
alert(typeof walle); //结果:undefined
function eve() {
  //函数定义式
  alert('I am Laruence');
}
var walle = function () {
  //函数表达式
};
alert(typeof walle); //结果:function
```

对于函数定义式，会将函数定义提前，而对于函数表达式，只有在执行过程中才会计算

#### 作用域

对于下面的 demo

```js
var name = 'laruence';
function echo() {
  alert(name);
  var name = 'eve';
  alert(name);
  alert(age);
}
echo();
```

输出结果为

```js
undefined;
eve[ReferenceError];
```

原因是 js 在执行函数之前，会有一个预编译的过程，这个过程中会把局部变量提取出来，放到 scope chain 中，value 都为 undefined(不包括传递过来的参数)，所以在执行 echo 函数时，name 的值在设置为"eve"前，为 undefined

参考：

- <a href="http://ejohn.org/blog/simple-class-instantiation/">simple class instantiation/</a>
- <a href="http://stackoverflow.com/q/61088/94962">hidden features of javascript</a>
- <a href="http://mckoss.com/jscript/object.htm">Object Oriented Programming in JavaScript</a>
- <a href="http://yuiblog.com/blog/2007/06/12/module-pattern/">module pattern</a>
- <a href="http://www.laruence.com/2009/05/28/863.html">javascript 的作用域原理</a>
