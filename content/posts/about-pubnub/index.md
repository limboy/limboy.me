+++
title= "说说 pubnub"
date = 2010-12-05
description = ""
[taxonomies]
tags = ["programming"]
[extra]
giscus = "telescope"
+++

<a href="http://www.pubnub.com/">pubnub</a>是一个云端即时消息服务，通过它我们可以很方便地创建自己的即时应用。

我们只需在客户端/服务端调用 subscribe 和 publish 方法即可。

```js
// LISTEN FOR MESSAGES
PUBNUB.subscribe({
  channel: 'hello_world',
  callback: function (message) {
    log(message);
  },
});

// SEND MESSAGE
PUBNUB.publish({
  channel: 'hello_world',
  message: 'hi',
});
```

pubnub 有以下几大特点

### 多语言，跨平台

pubnub 支持多种语言：`php/ruby/python/perl/erlang/js`。支持多种客户端：Mobile/Browser/XBOX 等等。你在本地运行一段 js publish 脚本，服务器端如果正在监听这个 channel，就会收到 js 传送的信息，然后作进一步处理。也可以在本地命令行运行一段 python subscribe 程序，等服务器端有更新时，publish 一下，python 程序就会收到结果，而且是即时的。可以是多个程序/多种语言向同一个 channel 发送/接收信息。

### 安全

前面说了，每个应用程序都可以向特定的 channel 发送消息，那如何才能保证 channel 的私密性呢？

如果要使用 pubnub 服务，就需要先注册，注册完后会有 pub key/sub key/secret key，如果要使用相应的服务，则需使用相应的 key。比如要发送消息，要使用 pub key，此时的 channel 只对该 pub key 有效。如果有其他的应用也使用了该 channel 名称，但因为 pub key 不同，所以不会互相干扰。

此外，pubnub 也支持 SSL，保证数据的安全性。

### 效率

- pubnub 是用 C 写的，运行在 Amazon EC2 和 Rackspace 上，通过 GAE 来远程监控。
- pubnub 的消息传送速度是纳妙级的，当断网重连后，消息会重新传递

### 其他

可惜的是这么好的服务是收费的，庆幸的是有免费版，每天可以免费发送 5000 条消息，对于个人的应用来说应该够用了。如果不够用，也可以买消息，5$可以买 100,000 条消息。

PS:pubnub 规定每条消息不能超过 1800 字节，所以不要指望传送大量数据。

因为有被 Qiáng 的风险，所以国内的企业可以自己实现一套类似的即时消息系统，对于应用之间的解耦也大有帮助。
