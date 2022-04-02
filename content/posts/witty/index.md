+++
title= "发布一款PHP模块系统——Witty"
date = 2011-01-17
description = ""
[taxonomies]
tags = ["programming", "project"]
[extra]
giscus = "telescope"
+++

关于<a href="http://witty.leezhong.com">Witty</a>，有太多想说的了。

先来说说名字。本来一直想往 KISS 上靠，但是 KISSPHP 已经有了，Kissy 也被淘宝前端团队用了，绞尽脑汁也想不出优雅的跟 KISS 相关的名字，于是先作罢。后来在看书时，无意中看到了"Witty"，看着，念着都很舒服，意思也挺靠谱(风趣的；巧妙的；机智的)，就决定用她了。

再来说说开发 Witty 的初衷。这个是受 python 启发，python 可以把自己开发的类库上传到<a href="http://pypi.python.org/pypi">pypi</a>，这样就可以通过 easy_install 或 pip 安装了，甚是方便。而且这些库都可以独立使用(即使有依赖关系，easy_install/pip 也会自动处理)。本来这件事应该是 pear 来做的，但 pear 的开发规范太复杂，安装也比较麻烦，略显重量级。很多框架其实自带了很多好用的类库，但一般都需要依赖框架本身。Zend Framework 可以把类库单独拿出来，但也有不少问题，比如配置不统一、没有统一的初始化方法、每个模块没有放到单独的文件夹里、没有命令行安装功能等等。于是创建 Witty 的想法就这么诞生了。

Witty 官网架在 GAE 上，这也是我第一次使用 GAE，python+gae 的组合开发一些小项目真是太方便了。

### 什么是 Witty

Witty 想做的事很简单：方便模块开发，方便上传，方便安装，方便使用。

Witty 提供了一些简单的模块开发标准，程序员可以按照这些标准写自己的模块，然后上传到网站，这样其他用户就可以通过简单的命令下载，使用该模块了。

### Witty 的安装和使用

```php
# install
wget http://witty.leezhong.com/static/witty
chmod +x witty
./witty install

# install module
./witty install http

# usage
require_once '/path/to/witty.php';
Witty::init();

$http = Witty::instance('Http');
$http->execute('http://www.douban.com');
```

Witty 类提供了两个初始化方法 instance 和 factory，所以模块不需要自己实现单例和工厂。

如果模块有一些配置参数，可以在 instance 或 factory 时传入，如

```php
<?php
$config = array(
	'redirect' => false,
);
$http = Witty::instance('Http', $config);
```

只要 Http 类继承了 Config 类就行了。

也可以指定文件夹，让 Witty 自己去找 config 文件，然后传入参数。

```php
<?php
require_once '/path/to/witty.php';
Witty::init();
Witty::set_config_dir('/path/to/config');

// /path/to/config/http.PHP
// <?php
//
// return array(
// 	'Http' => array( //Http为类名
// 		'redirect' => false,
// 	),
// );

// 虽然没有传参数，但因为设置了config文件夹，Witty会先找到config/http.php
// 然后找到Http key，传入该key对应的value
$http = Witty::instance('Http');
```

更多详情，请浏览<a href="http://witty.leezhong.com/doc">Witty 官网</a>

PS: E 文水平有限，欢迎指出有语病的语句，如果太多的话，可以 Email(healdream#gmail.com)我。
