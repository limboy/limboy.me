+++
title= "用php5.3的namespace实现类的无痛继承"
date = 2011-03-24
description = ""
[taxonomies]
tags = ["programming", "php"]
[extra]
giscus = "telescope"
+++

标题有点怪异，先来说说正常的继承会有什么问题。假设你一个应用的 Controller 多次用到了 View 类，就像这样

```php
<?php

class Controller_Hello
{
	public function action_index()
	{
		//...
		$view = new View('index.tpl');
		$view->render();
	}

	public function action_edit($id）
	{
		//...
		$view = new View('edit.tpl');
		$view->render();
	}

	//...
}
```

这个 View 是框架提供的，假如某一天发现 View 类需要新添加一个方法，最常用的就是新建一个自定义的 View 类继承框架的 View 类

```php
<?php

class My_View extends View
{
	public function newMethod()
	{
		//...
	}
}
```

这时以前使用 View 类的地方就要全部变成 My_View，这是比较恐怖的。很多框架也都提供了解决方法，大体有三种

### eval

这是 Kohana2 采用的方法，就是系统类命名为 XXX_Core，然后调用的时候在 autoload 处，动态 eval 出一个 XXX class，就像这样

```php
<?php
// system class
class View_Core
{
	//...
}

// autoload
public function autoload($class)
{
	// first look into app dir
	// then look into modules dir
	// last look into system dir
	require '/path/to/'.$class.'.php';
	eval('class '.$class.' extends '.$class.'_Core');
}
```

如果用户需要对该类添加新的方法，可以在 app/classes 里定义新的 View 类，同时继承 View_Core 类，这样使用时，因为优先级的原因，View 类名可以保持不变

```php
<?php

class View extends View_Core
{
	public function newMethod()
	{
		//...
	}
}
```

因为使用了 eval，所以不够优雅，而且有安全隐患

### 空壳法

这是 Kohana3 的做法，具体如下

```php
<?php

// system/classes/view.php
// 是的，就这么一句话
class View extends Kohana_View {}

// system/classes/kohana/view.php
class Kohana_View
{
	//...
}
```

根据优先级，最后会找到 system/classes/view.php 定义的 View 类。如果需要自己扩展 Kohana_View 类，可以在 app/classes 目录里新建一个 view.php

```php
<?php

class View extends Kohana_View
{
	// add your method
}
```

这样框架就会先找到 app/classes/view.php 而不是 system/classes/view.php，自定义 View 类生效，同时原先使用的 View 类也不需要做调整

这么做的缺点就是 system/classes 目录下会有大量的空壳类，有点累赘

### attach behavior

这是 yii 采用的方法，简单说来就是通过 attachBehavior 方法，动态地给某个类添加新的功能

```php
<?php

class SomeComponent extends Component
{
	//...
}

class SomeBehavior extends CBehavior
{
	public function addWidth($width)
	{
		$this->Owner->width += $width;
	}
}

$sc = new SomeComponent();
$sc->attachBehavior('sb', 'SomeBehavior');
$sc->addWidth(100);
```

需要实例化后动态调用 attachBehavior 方法，有点麻烦。而且不能使用父类的 protected 属性和方法。

### 用 namespace 实现无痛继承

所谓的无痛继承就是不用修改原先的类名，没有多余的空壳类，没有 eval，不用 attachBehavior，只要修改'use'就行了。代码如下

```php
<?php

// app/lib1.php
namespace App\Lib1;

class Controller
{
	public function before()
	{
		echo 'lib1\'s before';
	}
}
```

定义了一个 Controller 类，使用时：

```php
<?php

require 'lib/lib1.php';

use App\Lib1\Controller;

$c = new Controller();
$c->before();

// output: lib1's before
```

现在要有一个新的 controller 继承 lib1.php 的 Controller，如下

```php
<?php

namespace App\Lib2;
use App\Lib1;

class Controller extends Lib1\Controller
{
	public function before()
	{
		echo 'lib2\'s before';
	}
}
```

使用时，只要将 use App\Lib1\Controller 改为 use App\Lib2\Controller 就行了

```php
<?php
// 可以通过设置autoload来解决require的问题
require 'lib/lib1.php';
require 'lib/lib2.php';

use App\Lib2\Controller;

$c = new Controller();
$c->before();
```

是不是很方便
