+++
title= "关于代码的注释"
date = 2010-10-25
description = ""
[taxonomies]
tags = ["programming"]
[extra]
giscus = "telescope"
+++

怎样的注释才是合理的？关于这个问题，首先要回答的问题是：为什么要注释？

注释通常是为了方便其他程序员阅读源码，让他能够明白这个变量是做什么用的，这段代码是为了完成什么任务等等，不至于三更半夜系统出现了 bug，结果在程序里翻山越岭，跋山涉水，还没有找到出问题的代码，好不容易找到了，又不知道如何修改。

那是不是注释越多越详细越好呢？也不是。因为程序是会经常变动的，这加个参数，那改个变量是很正常的，稍不注意就会忘了更新注释。而且从程序员的角度来说，也不愿去更新注释，一个是因为懒，另一个是因为知道将来还可能会变，索性等将来再说。以后维护该程序的人，看着注释和程序就会很纠结。

所以不愿写注释是程序员的天性，行云流水地写完一段代码，这种感觉多爽啊。时时刻刻想着要写注释，就不能全身心地投入到代码的实现上。不过倒是可以等爽完之后，再把注释加上，这就牵扯到一个问题: 应该在哪些地方加注释？

_先来看这段代码_

```m
float a, b, c; a=9.81; b=5; c= .5*a*(b^2);
```

代码很简洁，但就是不知道 a,b,c 代表什么，将来如果要维护这样的程序，会抑郁的。

_再来看看这段代码_

```m
const float a = 9.81; //gravitational force
float b = 5; //time in seconds
float c = (1/2)*a*(b^2) //multiply the time and gravity together to get displacement.
```

是不是好一点，至少知道这些变量代表着什么。但如果下面还会用到这些代码，依旧会崩溃。

_再改进一下_

```m
const float gravitationalForce = 9.81;
float timeInSeconds = 5;
float displacement = (1 / 2) * gravitationalForce * (timeInSeconds ^ 2)
```

这就好多了，每个变量名都是自解释类型，看着名就知道什么意思，阅读起来也不会有障碍。但最后的公式还是有点不知所云。

_加上合理的注释_

```m
/* compute displacement with Newton's equation x = vₒt + ½at² */
const float gravitationalForce = 9.81;
float timeInSeconds = 5;
float displacement = (1 / 2) * gravitationalForce * (timeInSeconds ^ 2)
```

_当然也可以再从命名上作文章，避免注释，同时又不影响阅读_

```m
const float accelerationDueToGravity = 9.81;
float timeInSeconds = 5;
float displacement = NewtonianPhysics.CalculateDisplacement(accelerationDueToGravity, timeInSeconds);
```

所以合格的代码应该是自解释的，再加上合理的注释。所谓合理的注释就是在可能会引起混淆或不太好理解的地方加上说明。如果你的程序太依赖注释，那就该重构了。

PS: 如果你对 comment 文化有兴趣的话，可以看看 stackoverflow 上的<a href="http://stackoverflow.com/q/184618/94962">这篇文章</a>
