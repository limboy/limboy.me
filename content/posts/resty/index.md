+++
title= "写了一款REST框架——RESTY"
date = 2010-12-04
description = ""
[taxonomies]
tags = ["programming", "project", "php"]
[extra]
giscus = "telescope"
+++

关于 REST 的介绍可以参考<a href="http://blog.leezhong.com/tech/2010/11/14/rest.html">我之前的文章</a>，总体说来，REST 是 web 发展的趋势，而 PHP 是 web 开发的利器，但我找了一遍，只找到了两个 PHP REST 框架(不包括那些以 MVC 为核心，同时又支持 REST 的框架)，一个是<a href="http://peej.github.com/tonic/">Tonic</a>，架构理念我比较认同，但代码质量实在不敢恭维。还有一个是<a href="http://www.recessframework.org/">Recess</a>，在我看来，它有点复杂化了，把不该 rest 做的事也做了。在这种情况下，我只能自己动手，丰衣足食了。

### RESTY 简介

RESTY 的流程很简单，获取 Request 单例，然后执行 exec 方法，该方法里会调用 Route 来解析 URI 获取相应的 Resource，然后实例化 Resource，触发相应的 HTTP 方法，最后返回一个 Response 对象，Response 执行 output 方法就输出了结果。听起来好像一点都不简单，哈哈，还是来大概看一下代码吧

index.php

```php
<?php
try {
	Request::instance()->exec()->output();
} catch (Route_Exception $e) {
	Response::instance()
		->set_status(404)
		->set_body(array(
			'error' => 'Resource Not Found',
			'Request' => $_SERVER['REQUEST_URI'],
		))
		->output()
		;
}
```

request.php

```php
<?php
public function exec()
{
	$class_name = 'Resource_'.str_replace('/', '_', $this->get_resource());
	$class = new ReflectionClass($class_name);
	$resource = $class->newInstance($this);
	$class->getMethod('before')->invoke($resource);
	$class->getMethod($this->request_method)->invoke($resource);
	$class->getMethod('after')->invoke($resource);

	$response = Response::instance();
	$response->set_body($resource->get_data());
	return $response;
}
```

response.php

```php
<?php
public function output()
{
	$this->_content_encoding();
	header('Content-type:application/json;charset=utf-8');
	header('Status:'.$this->_status.' '.$this->_messages[$this->_status]);
	header('Content-Length: '.strlen($this->_body));
	foreach($this->_header as $key => $val)
	{
		header($key.':'.$val);
	}
	echo $this->_body;
}
```

### RESTY 特性

### 轻量级

RESTY 包含了核心的 Request/Resource/Response/Route/Config/Validation 功能，没有其他多余的部件，如 Controller/View 等等，很纯粹。一个工具应该把一件事做好，同时提供接口，这也是 RESTY 的哲学。

### 使用方便

使用时，只需定义好 uri 对应的 Resource，然后编写 Resource 就行了，其他的事 RESTY 会帮你搞定。

config/resource.php demo

```php
<?php

return array(
	'/example/(?<id>[0-9]+)' => 'example',
	'/example/foo/(?<name>[a-zA-Z_0-9]+)' => 'example/foo',
);
```

可以看到 uri 支持正则，没错，原生的 php 正则。resource 部分对应 resource 文件的路径(不包括后缀)

resource/example.php

```php
<?php
class Resource_Example extends Resource
{
	public function get()
	{
		/* set etag
		Response::instance()
			->if_none_match(md5('hello'))
			->add_etag(md5('hello'))
			;
		//*/
		if ($this->validate())
		{
			$this->_data = $this->get_data();
		}
		else
		{
			$this->_data = array('error' => implode(',', $this->getErrors()), 'request' => $_SERVER['REQUEST_URI']);
		}
	}

	public function post()
	{
		$this->_data = array_merge($this->get_data(), array('type' => 'post'));
	}
}
```

每一个资源对应 4 个 http 方法。RESTY 还很贴心地提供了 Validation 部件(基本上是直接从 Kohana 中 K 过来的)，方便对数据进行校验。

### 易扩展

system/classes 文件夹下的类文件，都可以在 app/classes 文件夹下扩展，而且使用时不用做任何修改。假设你之前已经写了不少 Resource，忽然想到要扩展系统的 Resource 类，正常的做法是定义一个 MY_Resource 之类的类文件来扩展系统的 Resource 类，然后使用时使用 MY_Resource 而不是 Resource。但这样就会有个问题，之前使用的 Resource 类都要做修改了，可谓牵一发而动全身。RESTY 就方便了，同样要扩展 Resource 类，只要在 app/classes 下新建一个 resource.php 文件，然后扩展 Resty_Resource 类即可。

```php
<?php

class Resource extends Resty_Resource
{
	public function foo()
	{
		//...
	}
}
```

这样使用时还是一样的 Resource 类，但却多了 foo 方法。这也是从 Kohana 学到的无缝扩展大法（题外话：Kohana 真是个不错的框架，各位不妨一试）。原理就是在类自动加载时会先去 app/classes 文件夹下去找，如果没找到的话再去 system/classes 下找。

### 验证功能

作为一个比较完整的 REST 框架，Validation 还是不能少的，为了不重复制造轮子，直接把 Kohana 的验证类搬了过来，稍作修改。

配置：config/validation.php

```php
<?php
return array(
	'example' => array(
		'get' => array(
			'filters' => array(
				'id' => array(
					'trim' => null,
				),
			),
			'rules' => array(
				'id' => array(
					'not_empty' => null,
					'min_length' => array(2),
					'digit' => null,
				),
			),
		),
	),
);
```

错误提示：config/message.php

```php
<?php
return array(
	'example' => array(
		'id' => array(
			'digit' => 'id必须是数字',
			'not_empty' => 'id不能为空',
			'min_length' => 'id长度至少为:value',
		),
	),
);
```

### Config 功能

config 文件如上面所示，就是返回一个数组。使用也很简单:

```php
// 获取config/message.php文件的example key对应的内容
Config::get('message.example');

// 设置config(不会写入到文件，只在一个http request有效)
Config::set('message.example.id.digit', 'id can be anything');
```

### 下载

<a href="https://github.com/limboy/resty">https://github.com/limboy/resty</a>

欢迎使用，并反馈:)
