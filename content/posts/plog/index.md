+++
title= "写了一款php日志系统——plog"
date = 2010-12-06
description = ""
[taxonomies]
tags = ["project"]
[extra]
giscus = "telescope"
+++

日志是一个应用程序的重要组成部分，今天在看 pylons 对日志的处理时，受到启发，于是 plog 就诞生了。

很多 php 框架都忽略了日志的重要性(如 kohana)，往往只是能用，自定义和可扩展性不够，等到程序出了问题，再想找原因时就比较麻烦了。

### plog 简介

plog 是一款轻量级，易定制，易使用，易扩展的 php 日志系统。可以很方便地添加日志处理工具、自定义输出格式、自定义日志类型等等。

### plog 使用

使用 plog 很简单，在每个要加日志的文件里，输入以下代码

```php
<?php
// 载入plog类
require '../../plog/classes/plog.php';

// 设置config，config文件位置可以自定义
// 对于单入口文件，这两段代码可以放在入口文件处
Plog::set_config(include 'path/to/config.php');

// 把下面这段代码放到对应的文件里
$log = Plog::factory(__FILE__);

// 使用
$log->debug('this is debug message');
$log->info('this is info message');
{{< / highlight >}}

### plog的配置

plog的配置很灵活，下面是个demo config

{{< highlight php >}}
<?php
return array(
	// 设置日志的类型，如有些是系统日志，有些是应用日志
	'loggers' => array(
		// base是个特殊变量，会自动添加到其他配置的前面
		'base' => dirname(dirname(__FILE__)).DIRECTORY_SEPARATOR.'demo'.DIRECTORY_SEPARATOR,
		'system' => 'system', // key为日志类型，value为文件夹路径，base路径会被自动添加
		'app' => 'app' // 同上
	),
	// 日志的等级
	'levels' => array('DEBUG', 'INFO', 'ERROR', 'WARN', 'FATAL'),
	// 日志处理工具，可以添加多个，设置enabled为true表示已启用
	'handlers' => array(
		'file' => array(
			// 处理引擎
			'driver' => 'file',
			// 记录哪种类型的日志
			'level' => array('DEBUG'),
			// 日志格式，可以在formatters处添加
			'formatter' => 'generic',
			// 是否启用该引擎
			'enabled' => true,
			// 针对该handler的特处配置
			'config' => array(
				'dir' => dirname(dirname(__FILE__)).'/demo/var/log',
			),
		),
	),
	// 日志格式
	'formatters' => array(
		'generic' => '{time} {level} [{logger}] {uri} """{message}"""',
	),
);
```

### 几点说明

- levels 项，每一个值都是一个方法，不过是小写的，如$log->debug('message')。如果某个方法不在这些 levels 里会触发异常。
- 日志格式的可选变量在 plog/formatter.php 里，每一个 get 开头的方法就是，如果觉得不够用，可以自己添加。

### 日志内容

日志内容取决于日志格式，下面是 demo

```bash
2010/12/07 16:00:26 DEBUG [app.test] /projects/os/plog/demo/app/test.php?id=1 """hello world"""
2010/12/07 16:00:26 INFO [app.test] /projects/os/plog/demo/app/test.php?id=1 """今晚打老虎"""
2010/12/07 16:01:17 DEBUG [system.core] /projects/os/plog/demo/system/core.php?_profiler=1 """heal the world"""
2010/12/07 16:37:29 DEBUG [system.core] /projects/os/plog/demo/system/core.php?_profiler=1 """heal the world"""
```

### 下载

<a href="https://github.com/limboy/plog">https://github.com/limboy/plog</a>
