+++
title= "iframe无刷新跨域上传文件并获取返回值"
date = 2011-05-06
description = ""
[taxonomies]
tags = ["programming", "web"]
[extra]
giscus = "telescope"
+++

通常我们会有一个统一的上传接口，这个接口会被其他的服务调用。如果出现不同域，还需要无刷新上传文件，并且获取返回值，这就有点麻烦了。比如，新浪微博启用了新域名www.weibo.com，但接口还是使用原来的域：picupload.t.sina.com.cn。

研究了一下新浪微博的处理方法，这里大概演示一下。

首先是一个正常的上传页面 upload.html

```html
<script>
  // 这个函数将来会被iframe用到
  function getIframeVal(val) {
    alert(val);
  }
</script>

<!-- 我把upload.com指向了127.0.0.1 -->
<form
  method="post"
  target="if"
  enctype="multipart/form-data"
  action="http://upload.com/playground/js/deal.php?cb=http://localhost/playground/js/deal_cd.html"
>
  <input type="file" name="file" />
  <input type="SUBMIT" value="upload" />
</form>
<iframe id="if" name="if" src="about:blank" frameborder="0"></iframe>
```

这里有一个关键点是 form 的 target 要指向 iframe，同时把 iframe 隐藏起来，这样上传的处理结果就会显示在该 iframe 里。action 里的 cb(callback)参数表示处理完成后要跳转的 url，因为我们的目标是 iframe，所以只会把跳转的页面输出到 iframe，而不会让当前页面跳转。

还有一点，callback url 要和当前页面同域。跨域的 iframe 无法调用父页面的内容。

再来看看 deal.php，也就是 form 的 action

```php
<?php
// deal upload file
// and get file id, you can pass other params either
header('location:'.$_GET['cb'].'?file_id=123');
```

这里可以处理文件，然后入库。操作完成后，把文件的 id 及其他信息都放在 url 里，最后跳转到这个 url。

最后来看看 deal_cd.html，也就是刚刚 deal.php 跳转到的 url，这个文件的内容会填充到页面的 iframe 里。

```html
<script type="text/javascript">
  var rs = window.location.search.split('?').slice(1);
  window.parent.getIframeVal(rs.toString().split('=').slice(1));
</script>
```

这里调用了父窗口的 getIframeVal 方法，这样父页面就获得了文件的 id。
