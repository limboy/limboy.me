+++
title= "做完猜电影的一点感想"
date = 2011-05-30
description = ""
[taxonomies]
tags = ["essay", "project"]
[extra]
giscus = "telescope"
+++

如果你认真，持续地去做了一件事，几乎不可能没有收获。<a href="http://iguess.me">猜电影</a>这个业余项目也断断续续进行了将近 20 天，从 GAE 到 VPS，从 python 到 PHP，反正就是各种折腾，现在成品基本上出来了，当然还有很多需要完善和改进的，<a href="http://iguess.me">欢迎访问</a> :)。以下是一些我的小感想

### 你能在凌晨 4 点半起来吗？

早起其实不难，如果你对这一天充满了期待，或者急不可耐地想要去做一件事。做这个项目的时候，经常会有一些有意思的想法，然后就恨不得马上去实现，但是太晚了，而且工作了一天后，晚上的效率也不高。于是只能放到凌晨，我清楚地记得那天给自己定了 4 点半的闹钟，结果 3 点醒来后，就再也睡不着了，于是从 3 点一直开发到早上 7 点多，再睡一个小回笼觉到 8 点多，就屁颠屁颠地上班去了。上班时的感觉也很好，因为一块大石头已经放到杯子里，有底了。

记得当年从时光网辞职后，在家帮朋友开发一个手机社区，也有过一阵类似的感觉，当然那时自由多了，想几点起就几点起，起床后可以痛快地做自己的项目，现在还真有点怀念。

37signals 的招聘中写到：认同一个伟大的工作并驱动自己，这非常重要。不知道大家对自己的工作还有没有激情，有没有憧憬，有没有感觉到挑战，如果没有或者比较少，又是如何释放自己的激情，为什么不到一个更广阔的空间？

国内有梦想的公司不少，或者说，每个公司都应该有自己的梦想吧，或大或小，或远或近而已。但你真的能够认同吗？你发自肺腑地希望公司能够蒸蒸日上吗？在公司最困难的时候，你愿意留下来吗？答案很可能是否定的。公司不是我们的归宿，她只是与我们进行着一笔交易，她出钱，我们出时间和技能。最危险的是我们会渐渐地习惯这个交易，以为人生本应如此，梦想这玩意不现实。呵呵，有点扯远了。

### 表面看起来简单的事，做起来真不简单

这也是我喜欢苹果的一个原因，她可以让一个操作尽量简单，易懂，一用就会，但是易用的背后往往包含着很复杂的处理过程。这才是用户至上。写猜电影的时候，我常常会想: 这个功能应该怎样在页面上体现，应该怎样交互用户才不会迷茫，是否有必要加一个提交按钮，loading 效果怎样做才看着比较舒服等等。当然，如果只是想实现这个功能就没必要费这个周折了。

前期只需要完成最核心的功能，让用户可以无障碍地使用，功能尽量少，但每个功能都要做到看着舒服，用着流畅。功能越少，用户越不容易迷茫，后期再推出新功能时，也更加能接受。好比税收一样，一下子扣去一年的税和分月扣，虽然结果是一样的，但哪个更能接受？

要有追求完美的心态。就拿那个投票来说吧，看上去很简单的上下箭头加上中间的数字，其实要考虑的因素有不少：是否已登入？是否之前投过票？投过票的话是否要高亮显示？是否是自己发的帖子？如何防止多次投票？等等。要做到完美并不容易。

### 记得重构

一开始为了能尽快出第一个版本，往往对代码的质量就不那么讲究，这很正常，说正确也无妨。敏捷嘛，就是要讲究快速发布版本，但庞大的函数，一段又一段又一段的 if else 判断，臃肿的类，无意义的数字、变量，重复的代码等等，这些虽然成功地帮助你实现了最基本的功能，但如果放任不管，将来开发新功能，或修改 bug 时就够你受的了，这也严重影响了下一版本的发布。

如果代码量已经挺大了，且可重构部分还不少，那就有点不妙了，不过好在自己写的代码最熟悉，多费点时间还是可以重构地差不多的。不过更好的方法是持续重构，也就是隔三差五地让自己的代码变得更优雅。软件开发就是与熵的战斗，如果不用心，熵就会很大，结果嘛，你懂的:)

### 不要给自己贴标签

我是个 PHP 程序员，不会设计，不会 js，不会前端交互，无法独立完成一个网站。
我是个编辑，要我使用 SQL 语句，天哪，杀了我吧(我从朋友的口中得知，他们公司有如此 BT 的编辑存在)。
我是个产品经理，我不需要动那些具体的技术细节，我只要把我的想法表达清楚就好了。

老罗当年招了好几茬设计都没有一个合适的，到最后不也是自己上嘛，那可是老罗啊，一个相声表演艺术家，自学设计，貌似效果还不错。

爱给自己贴标签的人，往往在他自己的领域也难有太大的建树，因为如果你是一个 PHP 程序员，你可以拒绝学习 linux，mysql，nginx，设计模式，等等，也可以拒绝了解 PHP 内部的运行机制，因为你可以告诉自己：我是一个普通的 php 程序员，不需要了解这些。其实说白了，还是对自己学习能力的不自信，没有刨根问底的精神，没有探索未知领域的意愿。

### 想得稍微长远一点

比如，花了很长的时间，终于把你的作品熬出来了，然后呢？怎么让目标用户知道并且喜欢上你的作品？哎，我是个天真的程序员，总是幻想着，我把一个 idea 实现了，慢慢地就会有人来用，然后慢慢地他们会口口相传。我的目标不是有多少用户数，我只在乎我的这个应用能为多少人带来便利，能为多少人解决问题。虽然如此，看着自己消耗了那么多的 ATP，做出来的东西没人用，难免会有点伤感。

所以除非只是想练练手，不然最好想一下如何去推广，除非你在该领域有足够的影响力或资源。

### 小结

鉴于我懒得推广，又想做点能够影响一批人的东东，所以我打算以后多花点时间在正事上，把基本功练好，加入一个靠谱的团队。十个巴掌怎么也比一个巴掌拍得响。

有不少人担心程序员是吃青春饭的，过了 30，就会力不从心，到时要么做管理要么转行。有了这个想法后，就更不可能用心地去写程序，去思考。恶性循环就这么产生了。我倒愿意相信，各行各业之间是相通的。计算机系统是如此地神奇，算法是如此地考验脑力，linux 是如此地优雅。如果真的把程序搞得很明白透彻了，其间你所收获的知识，经验一定可以运用到(至少是部分)其他领域，这也是达芬奇老人家能够精通多门领域的一个原因吧。
