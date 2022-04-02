+++
title= "同步twitter到新浪微博的php脚本(不需要twitter密码)"
date = 2010-12-08
description = ""
[taxonomies]
tags = ["programming", "project"]
[extra]
giscus = "telescope"
+++

我不用新浪微博，有好友想要此功能，于是就上网看了下有没有现成的，果然有一个<a href="http://iamsure.org/archives/169">twitter2weibo 的 php 脚本</a>，但打开一看还是基于 Basic Auth 的，自然不能用，只能自己写一个了。(发布新浪微博部分，借鉴了原先的 twitter2weibo)

### 使用说明

- 打开 config.php，在里面填入一组或多组信息(twitter_username/sina_email/sina_pwd)
- 在当前目录下新建一个 data 文件夹，并设置为可写入
- 设置 cron 为每 3 分钟执行一次脚本

```bash
crontab -e
*/3 * * * * php /path/to/twitter2weibo.php
```

可以先试运行一下看看是否正常

### 新加的特性

- 支持多用户(在 config.php 里配置)
- 多线程同步(只支持 linux)。如果是 windows 主机，可以去掉 pcntl_fork 方法，直接调用 sync 方法
- 保存用户 cookie，避免多次读取
- 用户删除某条/某些 tweet 后，不会出现异常同步

### 下载

<a href="https://github.com/limboy/twitter2weibo">https://github.com/limboy/twitter2weibo</a>
