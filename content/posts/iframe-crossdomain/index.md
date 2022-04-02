+++
title= "通过iframe实现跨域通信"
date = 2019-02-16
description = ""
[taxonomies]
tags = ["html"]
[extra]
giscus = "telescope"
+++

iframe 还是很强大的，不仅能实现同域通信，还可以跨域通信，甚至跨协议通信(如 file/http)，如果再结合 jsonp，那就有很多种玩法了。不过有几条原则需要记住：

# 当前层级中的任何 Window 都可以获取其他 Window(iframe 也是一个 Window)

# 只有同域 Window 才可以互相操作

# 当前层级下的任何 Window 可以设置其他 Window 的 location，即使是不同的域

# 当你改变 url 的 hashtag(#后面的东东)时，页面不会刷新

举例来说，有这么个页面

```html
<!DOCTYPE html>
<html>
  <head>
    <meta http-equiv="content-type" content="text/html;charset=utf-8" />
    <script src="http://ajax.googleapis.com/ajax/libs/jquery/1.4.2/jquery.min.js"></script>
  </head>

  <body>
    <!-- 不同域的iframe页面 -->
    <iframe src="http://www.domain.com/foo" name="foo" id="foo"></iframe>
    <iframe src="http://www.domain.com/bar" name="bar" id="bar"></iframe>
  </body>
</html>
```

_可以在当前页面设置 proxy iframe 的 location(原则 1,3,4)_

```js
// 添加了一个hashtag，这样该iframe就不会刷新
$('#foo').attr('src', 'http://www.domain.com/foo#tag');
```

_iframe foo 操作 iframe bar(原则 1,2)_

```js
// in http://www.domain.com/foo
$(parent.frames['bar'].document).find('#someid').html('message from foo');
```

所以跨域通信其实很简单，在 iframe 和主页里都不断地检测 hashtag 有没有变化，一旦有变化，就做出相应的改变。

```js
setInterval(function () {
  var hashVal = window.location.hash.substr(1);
  document.body.style.backgroundColor = hashVal;
}, 1000);
```

这么做的问题就是，需要不断地去检测 hashtag 是否改变，效率有点低，如果能通过原生的监听来实现，就会更加高效和优雅。这里就涉及到另一个 iframe 特性：可以设置其他 iframe 的大小，即使是不同域的。而页面的 resize 事件是可以监听的，所以就有了下面这个模型。

{{img(path="/posts/iframe-crossdomain/crossdomain.png")}}

主页面先把消息附加到 hashtag，然后改变一个隐藏的(或者页面外的)iframe 的 size。这个 iframe 会监听 resize 事件，同时捕获到 hashtag。捕获到 hashtag 后(也就是所需的数据)，再对 hashtag 做进一步的处理。处理完后把数据传到主页内的一个 iframe，或者直接操作该 iframe。这样就比较优雅地完成了跨域操作。

### demo

将以下代码拷贝到本地的一个 html 文件，然后双击在浏览器中打开，看看能不能查单词。(ajax 无法跨协议，这是 iframe 比 ajax 强大的地方)

```html
<!DOCTYPE html>
<html>
  <head>
    <meta http-equiv="content-type" content="text/html;charset=utf-8" />
    <script src="http://ajax.googleapis.com/ajax/libs/jquery/1.4.2/jquery.min.js"></script>
    <script>
      $(function () {
        $('#btn').click(function () {
          $proxy = $('#proxy');
          var src = $proxy.attr('src').split('#')[0];
          $proxy.attr('src', src + '#' + $('input[name=it]').val());
          $proxy.css('width', $proxy.width() + 1 + 'px');
        });
      });
    </script>
  </head>

  <body>
    <input type="text" name="it" /> <button id="btn">Translate</button>
    <p></p>
    <iframe
      src="http://demo.leezhong.com/crossdomain/proxy.html"
      name="proxy"
      id="proxy"
      style="position:absolute; top:-10px; width:1px; height:1px"
    ></iframe>
    <iframe
      src="http://demo.leezhong.com/crossdomain/show.html"
      name="show"
      id="show"
      style="width:60%;height:300px"
    ></iframe>
  </body>
</html>
```

更多玩法，可以参考这篇文章: <a href="Cross-Domain Communication with IFrames">Cross-Domain Communication with IFrames</a>
