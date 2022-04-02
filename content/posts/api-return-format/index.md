+++
title= "API的返回值形式"
date = 2011-05-04
description = ""
[taxonomies]
tags = ["programming"]
[extra]
giscus = "telescope"
+++

假设我们有一个 rest 服务，该 rest 服务会返回 json 格式的信息，以 twitter 为例：访问`http://api.twitter.com/1/users/show.json?user_id=12345`会得到如下结果：

```js
{
	id_str: "12345"
	is_translator: false
	following: null
	profile_text_color: "333333"
	description: "ID 12345"
	status: {
		coordinates: null
		text: "Follow @ha
	}
	//...
}
```

这是一个正常用户的信息，如果访问一个不存在用户，会返回类似下面的结果

```js
{
  request: '/1/users/show.json?user_id=12345111';
  error: 'Not found';
}
```

有没有发现，两次请求只是 userid 不一样，但返回形式却截然不同，这其实也不是什么大问题，客户端只要先检查一下是否有 error 这个 key，就能知道这次请求是否出错。不过我想了个另一个方法，能让返回形式有相同的结构。

借鉴了一下 http 协议，把返回结果分为 header 和 body 两部分，一个正常的请求会返回如下的信息

```js
{
	'status' => 'ok',
	'content' =>
	{
		'blah' => 'blah',
		//...
	}
}
```

status 相当于 http 的 status 头信息，通过检查该信息可以知道请求是否正常，如果是'ok'则为正常，如为'error'则不正常，如果返回出错，则会在 content 字段里包含足够的错误信息

```js
{
	'status' => 'error',
	'content' =>
	{
		'request' => 'http://...',
		'code' => 404,
		'message' => 'file not found',
	}
}
```

这里只包含了最基本的 3 项信息，request 指代的是本次请求的 url，code 类似 http 状态码，message 指代出错信息。

这样是不是更优雅些？
