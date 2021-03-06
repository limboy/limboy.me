+++
title= "拼音猜成语"
date = 2022-03-22
description = "「拼音猜成语」是一个受 Wordle 启发的猜词小游戏，通过输入拼音组合，结合系统提示来猜测目标成语。"
[taxonomies]
tags = ["review", "essay", "project"]
[extra]
cover = "/posts/idiom/cover.jpg"
+++

[拼音猜成语](https://pinyincaichengyu.com/) 是我第一款 PV 超过百万的产品，这里就来聊聊它背后的故事。

{{ img(path="/posts/idiom/data.jpg") }}

### 背景

有一段时间在 Twitter 上经常能看到有推友在发各种颜色的方块，原来是一个叫 [Wordle](https://www.nytimes.com/games/wordle/index.html) 的英文猜词小游戏，试玩了后发现还挺不错的，轻量、节制还益智。就拉妹子一起来玩，有时还会在零点一起挑战。但非母语也影响了游戏体验，遇到一些生僻的词就只能束手就擒了。某天走在路上就在想，是不是可以做一个成语版的 Wordle，用拼音？

### 开发

有了方向之后，就开始细化具体的游戏机制，发现只要把成语拆解为拼音组合，就可以像 Wordle 那样猜了。较快地搭了一个原型后，让妹子体验了下，发现可以玩，好像还挺好玩，这也给了我一些信心。之后大概花了 1 个星期的时间完善这个小游戏，从琢磨游戏机制到设计界面和交互，到实现功能、填充词库。这段时间在学习前端，正好可以通过这个项目来练手。

### 内测

其实就是拉人来玩。在常去的咖啡馆也邀请了店员来感受下这个游戏，有表示拼音不太友好的，但也有顺利玩下来并猜到答案的，看起来玩法上应该还 OK，拼音字母可能会是个障碍，但了解了玩法之后应该问题不大。也在小群里让小伙伴们体验了下。

### 上线

开发完上线后，在 [Twitter](https://twitter.com/_limboy/status/1483622557782003712?s=20) 上发了一下，反响还不错，也收到了不少反馈。比如没有对输入做限制可以「作弊」，对字母判定上有一些疑惑，有的同学表示太难了，也有觉得简单的。结合这些反馈做了些调整，比如只能输入有效的拼音组合，对键盘做了字母高亮等，自己玩下来感觉难度正好。

### 传播

经过几天的自然传播后，一天有几千 UV，Twitter 上搜索「pinyincaichengyu.com」也能看到有不少人在玩这个游戏。查看访问统计，一开始 Twitter 的来源最多，几天后从 Facebook、Google 和 Instagram 来的越来越多。有一段时间新加坡的玩家占了大多数。

### 反馈

Side Project 的成就感除了完成作品之外，还有很大一部分是用户的反馈。从来信才知道有不少国外的朋友在通过这个小游戏学习中文，也有教汉语的老师会在课后跟同学们一起玩这个游戏，有在新加坡的电台听到介绍这个游戏的。当然也有反馈游戏 Bug 和 Feature 的，比如词库里「厚积薄发」的「薄」声调被标记成了「bao」，然后那个时间段就收到了不少反馈该问题的来信。

因为游戏反响还不错，有国外的媒体来信希望了解这个游戏更多的信息，如澎湃新闻英文频道、卫报，也有国内媒体，这个确实是意料之外。

### 改进

第一版上线后，代码质量感觉还是不够好，于是从头开始又写了一遍，这次代码设计上更加合理，流程上也更加规范，加入了测试集和 Storybook，顺便把觉得不错的 Feature 如声调提示、统计信息、成语解释等给加上了，对 UI 也做了些优化。

{{ img(path="/posts/idiom/popup.jpg") }}

{% aside(level="info") %}
加入「游戏统计」这块还有点小挑战，因为没有用户系统，只能通过设备来判断，而发给服务器的请求又很容易伪造，所以需要一套防护措施。采用的是客户端加密的方式，`import` 一段加密后的 js，然后生成一个全局变量（用来验证和避免重放攻击），因为这段 js 用到了很多浏览器相关的 API，所以不太好通过 cli 的方式直接引用（当然可以用 headless 工具，不过这也增加了成本）
{% end %}

### 开源

[开源](https://github.com/limboy/idiom)就像是个节点，让这个小游戏的源码出现在了公共区域，虽然不一定会有多少人关注。

### 收获

通过这个项目更加熟悉了前端，包括工程化、React、CSS、JS、Browser API 等等，也感受到了 Side Project 的乐趣，更重要的是对自己的长处和短板有了更清晰的认识，为之后的发展方向选择提供了样本。
