+++
title= "软件设计的哲学"
date = 2021-06-30
description = ""
[taxonomies]
tags = ["programming", "book"]
[extra]
giscus = "telescope"
+++

今天要推荐的书是「[A Philosophy of Software Design](https://www.amazon.com/Philosophy-Software-Design-John-Ousterhout/dp/1732102201)」，作者是 Tcl 语言的设计者，也是斯坦福大学的教授：John Ousterhou。他也在 Google 做了一个[相关的分享](https://www.youtube.com/watch?v=bmSAYlu0NcY)。作为一个还在从事编程的大佬，看看他是怎么理解软件开发的哲学的。

> **一切都是关于复杂度**

在作者看来，「复杂度」是核心，如果无法处理好复杂度，就很难构建大型/复杂的系统。

### 复杂度的定义

复杂度有没有简单的定义呢，作者认为复杂度就是理解和修改系统的成本。比如是否容易理解某一段代码是怎么工作的，如何跟上下游衔接的，处于架构中的哪个部分，改动它会对那些模块产生影响。如果这些都比较模糊，那就是复杂的。

还有一点是「Unknown unknowns」，比如为了完成某个 Feature，不知道哪些地方的代码需要做调整，或者需要知道哪些上下文，这种情况是最糟糕的。所以好的设计一定是「显式」的。

### 复杂度的来源

依赖和模糊。依赖是指一段代码无法被独立理解和修改，必须参照/修改相关代码。我们无法摆脱依赖，但可以让依赖尽量简单和显式。模糊就是一些重要的信息不够突出，比如用了一个通用的变量名，或者时间单位没有说明等。

复杂度也不是孤立的，平时如果不注意，日积月累之后想要再降下去就会比较难了。

### 处理复杂度的心态：战术编程与战略编程

战术编程就是只关注眼前需求，没有太考虑需求的本质和将来的演进。这样可能会让需求完成地更快，但也会给系统增加复杂度，进而带来更大的维护成本，于是就产生了「技术债」。

战略编程要意识到「Working code isn't enough」，「a great design, which happens to work」才是目标，这需要投入时间去思考去雕琢。

### 处理复杂度的手段：分解与封装

分解就是将一个复杂系统拆分为多个相对独立的子系统，子系统之间也会产生依赖，处理依赖的方式是将子系统拆分为 interface 和 implementation。interface 里的内容是供消费方使用的，也就是 what，implementation 对应的是 how。interface 尽量简洁，把复杂度包在 implementation 里内部消化，形成 Deep Module。

![](https://user-images.githubusercontent.com/35974/123841170-d08dfd00-d941-11eb-9e3f-dc0b110bb040.png)

这个 interface 的提炼就涉及到抽象能力了，抽象就是去掉不重要的细节，留下最核心的本质。比如一个文件系统，不需要在 interface 里把文件存储的 block 等细节暴露出来，这样会增加使用者的负担，也会增加复杂度（将来如果换了一种实现，就要修改接口了）。

作者在视频中举了一个 Unix file I/O 的例子

![](https://user-images.githubusercontent.com/35974/123841203-da176500-d941-11eb-918f-82edd6bb9463.png)

封装就是信息隐藏，将具体怎么实现的都放到 implementation 里，使用方不需要关心，甚至可以随时更换实现，这样即使内部很复杂，因为没有上游依赖，所以不会将复杂度扩散出去。

### 其他降低复杂度的方式：优雅地设计错误

只要不符合预期就抛一个 Exception，这是最简单的处理，但对使用方可能不太友好，比如取数组的 Range 时，Index 超过长度抛一个 Exception；文件在使用时请求删除抛一个 Exception；参数校验不通过抛一个 Exception。如果多为使用方想一下，这些 Exception 都是必须要抛的么？有没有可能通过改变语义或设计来避免 Error？

作者举了一个 `unset` 的例子，一个开始他把 `unset` 定义为：移除一个变量，这样如果传入的变量不存在就要抛异常，这样导致外面使用方要通过 try catch 的方式去使用这个方法，后来他把 `unset` 定义为：让一个变量不可用，如果传入的变量已经不可用了，那就不需要做处理。对比 Windows 和 Unix 对文件删除的不同处理方式（后者在运行时删除不抛出 error），也可以达到减少 Error 的效果。

---

### 一个例子

> 写一个程序，输出从 1 到 n 数字的字符串表示。
>
> 1. 如果  n  是 3 的倍数，输出“Fizz”；
> 2. 如果  n  是 5 的倍数，输出“Buzz”；
> 3. 如果  n  同时是 3 和 5 的倍数，输出 “FizzBuzz”。

如果采用「战术编程」的话，很快就能写出一段可以 work 的代码

```js
fizzbuzz = (n) => {
  for (let i = 1; i < n; i++) {
    if (i % 5 == 0 && i % 3 == 0) {
      console.log('FizzBuzz');
    } else if (i % 3 == 0) {
      console.log('Fizz');
    } else if (i % 5 == 0) {
      console.log('Buzz');
    } else {
      console.log(i);
    }
  }
};

fizzbuzz(100);
```

完全符合题意，也能正确运行，但调整空间太小了

- 如果条件变了，不是 5 而是 7 怎么办
- 如果不是输出 Fizz，Buzz 怎么办

考虑到这两点，我们再来调整下代码：

```js
fizzbuzz_v2 = (n, triggers) => {
  for (let i = 1; i < n; i++) {
    let result = '';
    triggers.forEach((trigger) => {
      result += i % trigger.divisor == 0 ? trigger.text : '';
    });
    console.log(result ? result : i);
  }
};

fizzbuzz_v2(100, [
  { text: 'Fizz', divisor: 3 },
  { text: 'Buzz', divisor: 5 },
]);
```

将变量抽了出来，这样将来调整时，不需要动实现，只需改参数即可。

如果又来了个新需求：小于 10 的都要在前面补 0。如果求快，采用战术编程的话，直接在方法内部加入这个判断分支即可。但可以有更好的解法，比如将计算逻辑放到外面，方法内部只需要判断计算结果即可。

```js
fizzbuzz_v3 = (n, triggers) => {
  for (let i = 1; i < n; i++) {
    let result = '';
    triggers.forEach((trigger) => {
      result += trigger.predicate(i) ? trigger.text : '';
    });
    console.log(result ? result : i);
  }
};

fizzbuzz_v3(100, [
  { text: '0', predicate: (i) => i < 10 },
  { text: 'Fizz', predicate: (i) => i % 3 == 0 },
  { text: 'Buzz', predicate: (i) => i % 5 == 0 },
]);
```

接下来还可以有更多的演变，比如要输出到文件而不是 console，要具备可测性等等。可以看到一个简单的需求，战术编程和战略编程会带来很大的差异。这种思维和能力上的转变对于写出优雅的代码也会有帮助。
