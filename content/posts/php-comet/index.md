+++
title= "php实现实时通信"
date = 2011-03-21
description = ""
[taxonomies]
tags = ["programming", "php"]
[extra]
giscus = "telescope"
+++

如果英文 ok 的话，可以直接看<a href="http://gonzalo123.wordpress.com/2011/03/14/real-time-notifications-with-php/">这篇文章</a>

实现实时通信一般有两种方式:
socket 或 comet。socket 是比较好的解决方案，问题在于不是所有的浏览器都兼容，服务器端实现起来也稍微有点麻烦。相比之下，comet(基于 HTTP 长连接的"服务器推")实现起来更加方便，而且兼容所有的浏览器。所以这次就来说说 comet 的 php 实现。

comet 也有好几种实现方式，如 iframe, http long request，二者的区别可以参考<a href="http://www.ibm.com/developerworks/cn/web/wa-lo-comet/">这篇文章</a>。本文主要探讨 http long request 实现实时通信。

先说说 http 长链接是怎么回事，通俗点讲就是服务器不是一收到请求就直接吐数据，而是在那憋啊憋，一直憋到憋不住了，才告诉你执行结果。

```php
<?php

$count = 10;

for($i=0; $i<$count; $i++)
{
	// do something ...
	sleep(2);
}

echo '憋死我了';
```

至于憋多长时间，就看具体应用了，如果憋太久的话，服务器资源的占用也会是个问题。

现在我们就要通过这种方法来实现实时通信(其实是准实时)，先说一下原理：

1. 客户端发起一个 ajax 长链接查询，然后服务端就开始执行代码，主要是检查某个文件是否被更新，如果没有，睡一会(sleep)，醒来接着检查
2. 如果客户端又发起了一个查询链接(正常请求)，服务端收到后，处理请求，处理完毕后更新某个特定文件的 modify time
3. 这时第一次 ajax 查询的后台代码还在执行，发现某个文件被更新，说明来了新请求，输出对应的结果
4. 第一次 ajax 查询的 callback 被触发，更新页面，然后再发起一个新的 ajax 长链接

### 实战

#### 客户端

```html
<html>
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <title>Comet Test</title>
  </head>
  <body>
    <p><a class="customAlert" href="#">publish customAlert</a></p>
    <p><a class="customAlert2" href="#">publish customAlert2</a></p>
    <script
      src="http://ajax.googleapis.com/ajax/libs/jquery/1.5/jquery.min.js"
      type="text/javascript"
    ></script>
    <script src="NovComet.js" type="text/javascript"></script>
    <script type="text/javascript">
      NovComet.subscribe('customAlert', function (data) {
        console.log('customAlert');
        //console.log(data);
      }).subscribe('customAlert2', function (data) {
        console.log('customAlert2');
        //console.log(data);
      });

      $(document).ready(function () {
        $('a.customAlert').click(function (event) {
          NovComet.publish('customAlert');
        });

        $('a.customAlert2').click(function (event) {
          NovComet.publish('customAlert2');
        });
        NovComet.run();
      });
    </script>
  </body>
</html>
```

这段代码说的是，有个 NovComet 的 Object，注册了 customAlert 和 customAlert2 事件，当页面载入完成时，对两个按钮又加了监听事件，当点击时 NovComet 会发布 customAlert 或 customAlert2 事件，然后 NovComet 执行了 run 方法。

#### NovComet

```js
//NovComet.js
NovComet = {
  sleepTime: 1000,
  _subscribed: {},
  _timeout: undefined,
  _baseurl: 'comet.php',
  _args: '',
  _urlParam: 'subscribed',

  subscribe: function (id, callback) {
    NovComet._subscribed[id] = {
      cbk: callback,
      timestamp: NovComet._getCurrentTimestamp(),
    };
    return NovComet;
  },

  _refresh: function () {
    NovComet._timeout = setTimeout(function () {
      NovComet.run();
    }, NovComet.sleepTime);
  },

  init: function (baseurl) {
    if (baseurl != undefined) {
      NovComet._baseurl = baseurl;
    }
  },

  _getCurrentTimestamp: function () {
    return Math.round(new Date().getTime() / 1000);
  },

  run: function () {
    var cometCheckUrl = NovComet._baseurl + '?' + NovComet._args;
    for (var id in NovComet._subscribed) {
      var currentTimestamp = NovComet._subscribed[id]['timestamp'];

      cometCheckUrl +=
        '&' + NovComet._urlParam + '[' + id + ']=' + currentTimestamp;
    }
    cometCheckUrl += '&' + NovComet._getCurrentTimestamp();
    $.getJSON(cometCheckUrl, function (data) {
      switch (data.s) {
        case 0: // sin cambios
          NovComet._refresh();
          break;
        case 1: // trigger
          for (var id in data['k']) {
            NovComet._subscribed[id]['timestamp'] = data['k'][id];
            NovComet._subscribed[id].cbk(data.k);
          }
          NovComet._refresh();
          break;
      }
    });
  },

  publish: function (id) {
    var cometPublishUrl = NovComet._baseurl + '?' + NovComet._args;
    cometPublishUrl += '&publish=' + id;
    $.getJSON(cometPublishUrl);
  },
};
```

NovComet 的 run 方法首先把之前注册的几个事件串成一个 url，并且很狡猾地使用了"[]"，类似:
?subscribed[customAlert]=1300016814&subscribed[customAlert2]=1300016814&1300016825，这样 php 收到后，就会得到$\_GET[subscribed]数组，最后那个时间戳是为了避免请求被缓存。如果收到后台传过来的数据 data 的 s 值为 0，说明什么也没发生，隔 1 秒后继续执行；如果 data.s 的值为 1，说明 NovComet 的 publish 事件被触发，则调用对应的 callback。

publish 方法执行后，会构造一个类似: ?publish=customAlert 这样一个 url 发送到后台。后台检测到 pubish 参数，则获取该参数的值，并更新对应文件的 mtime。

#### 服务端

```php
<?php
// comet.php
include('NovComet.php');

$comet = new NovComet();
$publish = filter_input(INPUT_GET, 'publish', FILTER_SANITIZE_STRING);
if ($publish != '') {
    echo $comet->publish($publish);
} else {
    foreach (filter_var_array($_GET['subscribed'], FILTER_SANITIZE_NUMBER_INT) as $key => $value) {
        $comet->setVar($key, $value);
    }
    echo $comet->run();
}
```

如果收到 publish 参数，直接输出，否则执行 run 方法，至于 run 是怎么回事，且看下码。

```php
<?php
// NovComet.php
class NovComet {
    const COMET_OK = 0;
    const COMET_CHANGED = 1;

    private $_tries;
    private $_var;
    private $_sleep;
    private $_ids = array();
    private $_callback = null;

    public function  __construct($tries = 20, $sleep = 2)
    {
        $this->_tries = $tries;
        $this->_sleep = $sleep;
    }

    public function setVar($key, $value)
    {
        $this->_vars[$key] = $value;
    }

    public function setTries($tries)
    {
        $this->_tries = $tries;
    }

    public function setSleepTime($sleep)
    {
        $this->_sleep = $sleep;
    }

    public function setCallbackCheck($callback)
    {
        $this->_callback = $callback;
    }

    const DEFAULT_COMET_PATH = "/dev/shm/%s.comet";

    public function run() {
        if (is_null($this->_callback)) {
            $defaultCometPAth = self::DEFAULT_COMET_PATH;
            $callback = function($id) use ($defaultCometPAth) {
                $cometFile = sprintf($defaultCometPAth, $id);
                return (is_file($cometFile)) ? filemtime($cometFile) : 0;
            };
        } else {
            $callback = $this->_callback;
        }

        for ($i = 0; $i < $this->_tries; $i++) {
            foreach ($this->_vars as $id => $timestamp) {
                if ((integer) $timestamp == 0) {
                    $timestamp = time();
                }
                $fileTimestamp = $callback($id);
                if ($fileTimestamp > $timestamp) {
                    $out[$id] = $fileTimestamp;
                }
                clearstatcache();
            }
            if (count($out) > 0) {
                return json_encode(array('s' => self::COMET_CHANGED, 'k' => $out));
            }
            sleep($this->_sleep);
        }
        return json_encode(array('s' => self::COMET_OK));
    }

    public function publish($id)
    {
        return json_encode(touch(sprintf(self::DEFAULT_COMET_PATH, $id)));
    }
}
```

可以看到 publish 时，创建了一个以$id命名的文件。run时，如果发现该$id 文件存在，且时间戳大于之前保存的该$id对应的时间戳(通过setVar设置的)，说明$id 事件被触发，处理完后把$id放到$out 数组中，然后判断一下$out 数组是否为空，如果不为空，则输出一段 json。

如果一段时间内都没有触发事件(for 循环执行完毕)，也输出一段 json，告诉前端执行完了，但是没有任何新情况。

#### 说明

- 可以在客户端监听/发布多个事件
- 监听事件时，可以传一个 callback，这样收到数据时就会出发该 callback
- 当监听事件时，会传一个时间戳
- 当事件被 publish 时，会向后台发一个请求，并传递一个新的时间戳
- 服务端不会一直执行，如果指定时间内，没有任何请求被触发，则结束运行
- 客户端会重复上述过程(setTimeout & NovComet.run())

最后来一张图说明一下

{{img(path="/posts/php-comet/comet-firebug.png")}}

1. 运行一段时间后，没有收到任何 publish 事件，服务端结束执行
2. 服务端返回一段 json
3. 客户端触发了一个事件，服务端收到事件，返回一段新的 json
4. callback 被触发
5. 客户端进入下一次的 ajax 长链接查询
