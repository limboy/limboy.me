+++
title= "数据分离并快速显示网页"
date = 2010-09-02
description = ""
[taxonomies]
tags = ["programming"]
[extra]
giscus = "telescope"
+++

传统网站一般都是用户发出一个 http 请求，服务端接收到请求后开始业务逻辑的处理，然后把处理后的数据渲染到模板页，最后把内容输出到用户的浏览器。

这个过程有个问题: 如果服务端处理的时间过长(比如某个费时的 SQL 语句)，那么用户将看不到任何内容，即使有些数据已经处理完毕。

解决办法很简单，就是使用 php 的<a href="http://php.net/flush">flush</a>方法，它可以将内容立刻输出到用户的浏览器。也就是处理完哪些就输出哪些，这样即使卡在了某个操作，用户也能看到已经处理完的结果。

### flush 的实现原理

正常的 http 返回头信息里会包含"Content-Length"一项，标明本次传输的字节数。http 1.1 新增了"Transfer-Encoding"选项，可以指定为"chunked"，这样就不用理会"Content-Length"选项了(因为不知道到底会传输多少字节)。服务端按照 chunked 标准输出内容，客户端收到"Transfer-Encoding:chunked"头信息后，也会按照 chunked 标准去解析内容。

举个例子，有一条河，河的一边着火了，需要到河的另一边找人救火，然后你迅速架了一座桥(TCP/IP)，然后跑到对岸(发送 http 请求)，跟那里的村长说明了情况(服务器收到 http 请求)，以前的做法是村长到各家各户召集劳动力(服务器集群)，等把劳动力都召集完了，统一过河去救火(发送处理完的结果)。但在召集的过程中，某家正在干架，这时村长得先苦口婆心地做思想工作，等工作做完了，再把男人召集出来，但这段时间里，河对岸的火依旧在着(用户漫长的等待，可能真的要火了)，所以很可能由于某家或某几家的特殊情况导致延误了救火的最佳时机。现在的做法是只要召集到人了，马上过河去救火，把平常最容易出状况的几户人家留到最后去召集(负担比较重的几台服务器)，这样火被扑灭的可能性就大大增加了。

flush 就好比是服务端推(push)，ajax 是客户端拉(pull)。推的话可以利用已经建立的 http 连接，如果是拉的话，每拉一次就要建立一次 http 连接，代价还是比较大的。

### 使用 REST 和 Client Template

flush 解决了内容的即时显示问题，如果要做到数据与结构分离，可以使用 REST(当然其他的 web service 也没有问题，REST 只是个人喜好)。REST 作为数据源，Controller 收到请求后，先通过 REST 去取数据，取到数据后，封装到一段 js 里，然后 flush 给客户端，循环此过程，直到客户端需要的所有数据都传输完毕。

```php
<?php
// controller
class Controller_Post extends Controller
{
	// 显示某篇具体的文章
	public function action_index($id)
	{
		// 输出页面模板
		$this->template->content = View::factory('post_index');
		echo $this->template;
		flush();

		// 开始获取REST数据，并flush
		$post_info = REST_Post::get($id);
		js_render('post', json_encode($post_info));

		// 获取该文章的评论
		$comments = REST_Comment::get($id);
		js_render('comments', json_encode($comments));
	}
}

//js_render方法，定义在其他文件
/**
 * @param string $id 页面的dom id
 * @param array $data 使用到的数据
 */
function js_render($id, $data)
{
	// 模板页已经定义了js的render方法
	echo "<script>render('"{$id}"', $data)</script>\n";
	flush();
}
```

再来看看模板页

```html
<html>
  <head>
    <script src="http://ajax.googleapis.com/ajax/libs/jquery/1/jquery.min.js"></script>
    <!-- 模板引擎 -->
    <script src="http://trimpath.googlecode.com/files/trimpath-template-1.0.38.js"></script>
    <script>
      // 这个就是在js_render方法里用到的render方法
      function render(id, data) {
        var result = TrimPath.processDOMTemplate(id, data);
        $('#' + id).replaceWith(result);
      }
    </script>
  </head>

  <textarea id="post" style="display:none">
<h1>${title}</h1>
<div class="content">
${content}
</div>
</textarea
  >
</html>
```

这个模板页没有`</body>`和`</html>`，因为我们之后还要往这个页面里输入内容，最后渲染完的页面大概是这样

```html
<html>
  <head>
    <!-- //... -->

    <textarea id="post" style="display:none">
// template here
</textarea
    >

    <!-- more textarea template -->

    <!-- 这些是flush出来的 -->
    <script>
      render('post', {
        title: 'hello world',
        content: 'what a wonderful life',
      });
    </script>
    <script>
      render('comments', {[content:'blah blah', created:'2010-09-20'], [content:'blah blah', created:'2010-09-30']});
    </script>
  </head>
</html>
```

这样服务端只提供数据，客户端负责解析这些数据，并显示到页面。将来如果开放 API，或者要针对手机开发，也很方便了，因为网站本身用的就是 API，而手机的话，只要换个显示的模板就行了。
