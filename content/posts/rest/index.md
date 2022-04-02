+++
title= "说说REST"
date = 2010-11-14
description = ""
[taxonomies]
tags = ["programming"]
[extra]
giscus = "telescope"
+++

### REST 究竟是什么东东

REST(Representational State Transfer)是 Roy Fielding 在他的博士论文中提出来的。他也是 HTTP 协议的制定者之一。REST 是一种针对网络应用的设计和开发方式，可以降低开发的复杂性，提高系统的可伸缩性。

### REST 的特性

### C/S 架构

客户端主动向服务端发起请求，服务端收到请求后，返回格式化的结果。

### 无状态

每个请求必须包含服务端所需的所有信息，不要指望从服务端"借"点数据。

### 易扩展

如果因为业务需要，要新添加几个资源，可以横向扩展，而不需要改变原来的结构。

### 统一请求类型

GET/POST/PUT/DELETE，实际中以 GET 和 POST 用的最多。

### 资源

服务端要提供资源供客户端调用，每个资源都有独立的 URL。

### 轻量级

使用标准的 http 请求，各个语言几乎都支持，所以由丰富的客户端。

### 方便添加中间层

如代理/集群/缓存等等，对客户端而言它们是透明的。

### 方便测试

不牵扯具体的业务逻辑，而且格式化的数据很容易解析

### DEMO

以 twitter 为例(请自动切换到翻|墙模式)

### 获取信息(GET)

如果要获得某条 tweet 的信息，直接访问 api 即可，如 http://api.twitter.com/1/statuses/show/3657615682838528.json，将会返回如下结果

```json
{
    place: null
    geo: null
    // ...
    created_at: "Sun Nov 14 03:56:58 +0000 2010"
    in_reply_to_status_id_str: null

    user: {
        profile_image_url: http://a2.twimg.com/profile_images/259632038/DuanziLogoBig_normal.jpg
        // ...
        description: "官网：www.JokeCook.com | When that happens.当下那些事儿 | 欢迎回复@duanzi 投稿。"
    }
    truncated: false
    id: 3657615682838528
    in_reply_to_user_id_str: null
    text: "Via @ruoxiaosu: 有时候吧，取消对一个人的关注，...via琦殿"
}
```

省略了部分结果，可以看到是一个包含了很多信息的 json，想怎样展现那就是客户端的事情了。

### 提交信息(POST)

这个就要复杂一点了，因为涉及到用户验证，前面说过了，REST 是无状态的。也就是说，服务端不知道你到底有没有登录，除非出示证件。是的，每次请求都得出示。服务端验证通过后，查询到用户 id，保存 POST 数据，返回提交结果。

```bash
POST /1/statuses/update.json
HOST api.twitter.com

status=blahblah...&oauth_consumer_key=GDdmIQH6jhtm...&oauth_nonce=oElnnMTQIZvqvlfXM56aB...
```

可以看到除了 status，还有 oauth_consumer_key 和 oauth_nonce(还有其他 oauth 相关的参数)，这些就是用来进行身份验证的，如果验证通过了，tweet 就会被正常发布，同时返回该 tweet 的相关信息。

顺便说说用户验证，一般有三种验证方式：Basic Auth/Digest Auth/OAuth(XAuth)，就安全性来说 OAuth 是最高的，用户无须输入密码，但部署起来难度也最大。Basic Auth 安全性最低，部署起来也最方便，用户只需提供用户名和密码即可，但如果第三方记录了这些信息，那就... Digest Auth 的安全性和部署成本介于两者之间。

其他更新内容和删除内容也类似，都是先进行用户验证，再进行权限验证，最后返回执行结果。

### REST 的原则

### 抽象出所有可供调用的资源，越精确越好

如果一个事物可以抽象成资源，那它就是 RESTful，可以通过 URL 进行调用。

### 为每个资源提供一个 URL，且资源应该是名词而不是动词

如，下面这个 url 是不建议采用的

bq. http://www.twitter.com/getUser/10

应该改为这样

bq. http://www.twitter.com/user/10

### 将资源分类

```bash
Tweets resources
	- status/show/:id
	- status/update
	- status/destroy/:id
	- ...
Timeline resources
	- status/public_timeline
	...
User resources
...
```

### 所有 GET 请求都不应该影响数据库内容

GET 顾名思义，就是用来获取某个资源，如果要修改，则应该执行 POST/PUT/DELETE。千万不要因为偷懒，而给 GET 留下后门。

### 返回结果不一定是单独的内容，可以包含相关链接

有时候，这是一种双输的局面：用户不想要那么多的数据，服务端又多了不必要的运算。只要包含可以获取信息的链接即可。

### 明确返回格式

如 json/xml/html 等等，不过目前来看 json 基本是主流。

### 如何使用 REST

REST 不仅仅是一种崭新的架构，它带来的更是一种全新的 Web 开发过程中的思维方式：通过 URL 来设计系统结构。在 REST 中，所有的 URL 都对应着资源，只要 URL 的设计是良好的，那么其呈现的系统结构也就是良好的。这点和 TDD (Test Driven Development)很相似，他是通过测试用例来设计系统的接口，每一个测试用例都表示一系列用户的需求。开发人员不应该一开始就编写功能，而是先细分资源。对资源抽象地越精确，对 REST 的应用来说就更好，这个和传统的 MVC 中基于 Action 的思想差别很大。设计良好的 URL， 不但对于开发人员来说可以更明确的认识系统结构，对使用者来说也方便记忆和识别资源，因为 URL 足够简单和有意义。

REST 对开发者友好。Amazon 和 Ebay 的 service 结果显示：60%的用户使用 REST。提供 REST 服务，开发者可以很容易通过各种语言各种平台来开发一个 app，手机/ipad/网站/cli 等等，这也是 web2.0 的一大特征，想想如果 flickr/twitter/delicious 没有开放简洁易用的 api，其火爆程度肯定大打折扣。

使用 REST 还有一个好处是，可以避免 Controller 直接操作数据。假如是 MVC 模式，Controller 很可能途省事，直接把 ORM 拿过来就开始进行数据操作了，如

```php
<?php
class Controller_Post extends Controller {
	public function actionAdd() {
		if (Validate::check($_POST)) {
			$post = ORM::factory('post');
			$post->title = $_POST['title'];
			$post->content = $_POST['content'];
			//...
			$post->save();
		}
	}
}
```

如果有一天保存的操作改了，如加了一个 status 字段，那就很糟糕了。

实际使用中，可能会发现不是所有的需求都可以抽象为资源，这时可以混用 MVC/MVVM。尽可能地抽象成资源，对其他需求使用 MVC/MVVM 开发。

目前已经有<a href="http://en.wikipedia.org/wiki/Representational_State_Transfer">不少</a>基于/支持 REST 的框架，有兴趣的话不妨尝试一下。也可以看一下<a href="http://www.peej.co.uk/articles/rmr-architecture.html">这篇文章</a>

### 总结

- REST 和 MVC 的关系就好像 Div 和 Table 的关系。在 web 标准没推广前，都是使用 Table 布局，Table 原本是用来做数据展示的，不知是哪一位天才发现对 Table 进行各种改造后，可以用作前端展示，于是就这么流传开了。
- REST 是一种架构风格，不是标准。但使用了很多标准：http/url/mime 等等。
- REST 概念从提出到现在已经有 10 年了，越来越趋于成熟。它是为 http 而生的，而 MVC 最开始是用来开发桌面软件的。
- 如果你的网站有提供 API 的打算，推荐使用 REST 架构，开始可能会麻烦一点，但将来会发现这些付出是值得的。
