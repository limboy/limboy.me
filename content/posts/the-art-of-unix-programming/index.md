+++
title= "Unix编程艺术——Unix哲学"
date = 2010-12-21
description = ""
[taxonomies]
tags = ["programming", "book"]
[extra]
giscus = "telescope"
+++

<a href="http://book.douban.com/subject/1467587/">Unix 编程艺术</a>主要介绍了 Unix 系统领域中的设计和开发哲学、思想文化体系、原则与经验。此文大致摘录了 Unix 的哲学。

web 程序员也应该看看此书，软件开发和 web 开发很多地方都是相通的。看完之后，我甚至觉得 Unix 哲学对于做人也有很大的参考价值。

### 模块原则 (使用简洁的接口拼合简单的部件)

计算机编程的本质就是控制复杂度

要编写复杂软件而又不至于一败涂地的唯一方法就是降低其整体复杂度——用清晰的接口把若干简单的模块组合成一个复杂的软件。如此一来，多数问题只会局限于某个局部，那么就还有希望对局部进行改进而不至牵动全身。

### 清晰原则 (清晰胜于技巧)

维护成本是高昂的，在写程序时，要想到你不是写给执行代码的计算机看的，而是给人——将来阅读维护源码的人，包括你自己看的。

在 Unix 传统中，这个建议不仅意味着代码注释。良好的 Unix 实践同样信奉在选择算法和实现时就应该考虑到将来的可扩展性。为了取得程序一丁点性能的提升就大幅增加技术的复杂性和晦涩性，这个买卖做不得——这不仅仅是因为复杂的代码容易滋生 bug，也因为它会使日后的阅读和维护工作更加艰难。

### 组合原则 (设计时考虑拼接组合)

如果程序彼此之间不能有效通信，那么软件就难免会陷入复杂度的泥淖。

在输入方面，Unix 传统极力提倡采用简单、文本化、面向流、设备无关的格式。在经典的 Unix 下，多数程序都尽可能采用简单过滤器的形式，即将一个简单的文本输入流处理为一个简单的文本流输出。

Unix 程序员偏爱这种做法并不是因为它们仇视视图界面，而是因为如果程序不采用简单的文本输入输出流，它们就极难衔接。

要想让程序具有组合性，就要使程序彼此独立。在文本流这一端的程序应该尽可能不要考虑到文本流另一端的程序。

### 分离原则 (策略同机制分离，接口同引擎分离)

把策略同机制揉成一团有两个负面影响：一来会使策略变得死板，难以适应用户需求的改变，二来也意味着任何策略的改变都可能会动摇机制。

可以将应用程序分成可以协作的前端和后端进程，通过 socket 专用应用协议进行通讯。这种双端设计方法大大降低了整体复杂度，bug 有望减少。

### 简洁原则 (设计要简洁，复杂度能低就低)

来自多方面的压力常常会让程序变得复杂(bug 更多)，其中一种压力就是来自技术上的虚荣心理。Unix 程序员相互比的是谁能够做到"简洁而漂亮"并以此为荣。

更为常见的是，过度的复杂性往往来自于项目的需求，要避免这种状况，就需要鼓励一种软件文化，以简洁为美，人人对庞大复杂的东西群起而攻之。

### 吝啬原则 (除非确无它法，不要编写庞大的程序)

"大"有两重含义：体积大，复杂程度高。程序大了，维护起来就困难。由于人们对花费了大量精力才做出来的东西难以割舍，结果导致在庞大的程序中把投资浪费的注定要失败或者并非最佳的方案上。

### 透明原则 (设计要可见，以便审查和调试)

软件系统的透明性是指你一眼就能够看出软件是在做什么以及怎样做的。显示性是指程序带有监视和显示内部状态的功能。

设计时如果充分考虑到这些要求会给整个项目全过程都带来好处。至少，调试选项的设置应该尽量不要在事后，而应该在设计之初便考虑进去。这是考虑到程序不但应该能够展示其正确性，也应该能够把原开发者解决问题的思维模型告诉后来者。

程序如果要展示其正确性，应该使用足够简单的输入输出格式，这样才能保证很容易地检验有效输入和正确输出之间的关系是否正确。

出于充分考虑透明性和显见性的目的，还应该提倡接口简洁，以方便其他程序对它进行操作。

### 健壮原则 (健壮源于透明与简洁)

软件的健壮性指软件不仅能在正常情况下运行良好，而且在超出设计者设想的意外条件下也能够运行良好。

大多数软件禁不起磕碰，毛病很多，就是因为过于复杂，很难通盘考虑。如果不能够正确理解一个程序的逻辑，就不能确信其是否正确，也就不能在出错时修复它。

这也就带来了让程序健壮的方法，就是让程序的内部逻辑更易于理解。要做到这一点主要有两种方法：透明化和简洁化。

上面曾说过，软件的透明性就是指一眼就能够看出是怎么回事，即人们不需要绞尽脑汁就能够推断出所有可能的情况，那么这个程序就是简洁的。程序越简洁，越透明，也就越健壮。

### 表示原则 (把知识代入数据以求逻辑质朴而健壮)

数据要比程序逻辑更容易驾驭。所以如果要在复杂数据和复杂代码中选择一个，宁愿选择前者。更进一步：在设计中，应该主动将代码的复杂度转移到数据中去。

### 通俗原则 (接口避免标新立异)

最易用的程序就是用户需要学习新东西最少的程序，换句话说最易用的程序就是最切合用户已有知识的程序。

### 缄默原则 (无话可说？那就沉默)

行为良好的程序应该默默工作，绝不唠唠叨叨，碍手碍脚。沉默是金。

简洁是 Unix 程序的核心风格。一旦程序的输出成为另一个程序的输入，就要很容易把需要的数据挑出来。站在人的角度上来说，重要的信息不应该混杂在冗长的程序内部行为信息中。

### 补救原则 (出现异常时，马上退出并给出足够错误信息)

软件在发生错误时也应该与在正常操作的情况下一样，有透明的逻辑。最理想的情况当然是软件能够适应和应付非正常操作；而如果补救措施明明没有成功，却悄无声息地埋下崩溃的隐患，这就是最坏的情况了。

宽容地收，谨慎地发。就算输入的数据很不规范，一个设计良好的程序也会尽量领会其中的意义，以尽量与别的程序协作。然后要么抛出异常，要么为工作链的下一环程序输出一个严谨干净正确的数据。

### 经济原则 (宁花机器一分，不花程序员一秒)

随着技术的发展，开发公司和大多数用户都能得到廉价的机器，所以这一准则的合理性就显然不用多说了。

如果我们在软件开发中严格遵循这条原则的话，大多数的应用场合应该使用高级语言，如 Perl,Python,Java,Php,甚至 Shell——这些语言可以将程序员从自行管理内存的负担中释放出来。

### 生成原则 (避免手工 hack,尽量编写程序去生成程序)

人类很不善于干辛苦的细节工作。因此程序中任何手工 hacking 都是滋生错误和延误的温床。程序规格越简单越抽象，设计者就越容易做对。

### 优化原则 (过早优化是万恶之源)

还不知道瓶颈所在就匆忙进行优化，这可能是唯一一个比乱加功能更加损害设计的错误。从畸形的代码到杂乱无章的数据布局，牺牲透明性和简洁性而片面追求速度、内存或者磁盘使用的后果随处可见。

先制作原型，再精雕细琢。优化之前先确保能用。"极限编程"宗师 Kent Beck 从另一种不同的文化将这点有效地扩展为：先求运行，再求正确，最后求快。

借助原型化找出哪些功能不必实现，有助于对性能进行优化；那些不用写的代码显然无须优化。

### 多样原则 (绝不相信所谓"不二法门"的断言)

Unix 传统有一点很好，即从不相信任何所谓的"不二法门"。Unix 奉行的是广泛采用多种语言、开放的可扩展系统和用户定制机制。

### 扩展原则 (设计着眼未来，未来总比预想来得快)

要为数据格式和代码留下扩展的空间，否则就会发现自己常常被原先不明智选择捆住了手脚，因为你无法既要改变它们又要维持对原来的兼容性。

设计协议或是文本格式时，应使其具有充分的自描述性以便可以扩展。要么包含进一个版本号，要么采用独立、自描述的语句、按照可以随时插入新的而不会搞乱格式读取代码的方法组织格式。

### Unix 哲学一言以蔽之

{{img(path="/posts/the-art-of-unix-programming/kiss.png")}}
