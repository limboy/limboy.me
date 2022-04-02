+++
title= "PHP特性小结"
date = 2010-08-27
description = ""
[taxonomies]
tags = ["programming", "php"]
[extra]
giscus = "telescope"
+++

其实就是总结了一下<a href="http://stackoverflow.com/questions/61401/hidden-features-of-php">这个帖子</a>

### 文档

PHP 文档的特点：

- 浏览方便
- 用户评论是一大亮点
- 要查询某个函数，输入：www.php.net/function 就会跳转到该函数的具体页

### 数组

PHP 的数组是我用过的语言中最强大的，其实就是个有序映射表(ordered map)，并为各种使用作了优化。可以看作列表、哈希表、字典、集合、栈、队列。

### 流处理

可以扩展文件流，比如<a href="http://www.phpclasses.org/browse/package/1919.html">excel 流处理</a>，可以通过下面的语句来创建一个 excel 文件

```php
<?php
$fp = fopen("xlsfile://tmp/test.xls", "wb");
if (!is_resource($fp)) {
    die("Cannot open excel file");
}

$data= array(
    array("Name" => "Bob Loblaw", "Age" => 50),
    array("Name" => "Popo Jijo", "Age" => 75),
    array("Name" => "Tiny Tim", "Age" => 90)
);

fwrite($fp, serialize($data));
fclose($fp);
```

### 魔术方法

```php
<?php
	public function __get($key) { ... }
	public function __set($key, $value) { ... }
	public function __call($func, $args) { ... }
	public function __toString() { ... }
	//...
```

### or/and

```php
<?php
isset($foo) OR print '$foo is not defined';
```

### spl_autoload_register

使用 spl_autoload_register，而不是\_\_autoload，因为 spl_autoload_register 允许设置多个实例，而不会覆盖。

```php
<?php
spl_autoload_register('autoloader');
function autoloader($class)
{
	//这里可以对$class进行处理
}
```

### set_include_path

设置引用路径，比如引用 zend 的 libraries 时。

```php
<?php
set_include_path(get_include_path() . PATH_SEPARATOR . '../libs/');`
```

### 处理远程文件/url

```php
<?php
$fp = fopen('http://example.com');
$str = file_get_contents('http://example.com/file');
$imageInfo = getimagesize('ftp://user:password@ftp.example.com/image/name.jpg');
```

虽然这些函数的健壮性和稳定性不如 curl，但毕竟使用方便。

### strtr

使用方便，效率高，用来替换字符串内的特定值。有点类似 str_replace，但更灵活。

```php
<?php
echo strtr('hello world', array('world' => 'hell'));
```

### extract

顾名思义，释放一个数组内的元素，构造模板引擎的时候尤为有用

```php
<?php
$arr = array('foo' => 'bar');
extract($arr);
echo $foo; // output 'bar'
```

### func_get_args

获取传递过来的参数

```php
<?php
function test() {
    $args = func_get_args();
    echo $args[2]; // will print 'd'
    echo $args[1]; // will print 3
}

test(1,3,'d',4);
```

### cli

command line interface，可以在命令行里运行 php 脚本，用来处理日常任务也非常方便。对了别忘了一个非常有用的参数 -a，进入交互模式

```php
<?php
php -a

Interactive shell
php >
```

### 载入的文件可以有返回值

这个比.ini 文件更加灵活，你可以在文件里运行一段程序后，返回运行结果

```php
<?php
// config.php
return array(
    'db' => array(
	'host' => $_SERVER['HTTP_HOST'] == '127.0.0.1'?'localhost':'example.org',
        'user' => 'usr',
        // ...
    ),
    // ...
);

// index.php
$config = include 'config.php';
echo $config['db']['host']; // example.org
```

### 在函数内定义静态变量

把类的特性移植到函数里了，比如有一些运算量较大的函数，可以把运算结果放到这个静态变量，下次调用时检查一下该变量是否已经被赋值。

```php
<?php
function foo($arg1)
{
    static $cache;

    if( !isset($cache[md5($arg1)]) )
    {
        // Do the work here
        $cache[md5($arg1)] = $results;
    }

    return $cache[md5($arg1)];
}
```

### heredoc

不用再为引号发愁了

```php
<?php
echo <<<EOM
  <div id="someblock">
    <img src="{$file}" />
  </div>
EOM;
```

### 把字符串"当作"数组

```php
<?php
$str = 'hell o World';
echo $str; //outputs: "hell o World"

$str[0] = 'H';
echo $str; //outputs: "Hell o World"

$str[4] = null;
echo $str; //outputs: "Hello World"
```

### 快速注释/反注释一段代码

这个确实很有意思

```php
<?php
//*
	echo 'blah';
	die('not commented');
//*/


/*
	echo 'blah';
	die('commented');
//*/
```

### 函数参数类型提示

相对于其他编程语言(java/c#)，php 这块比较弱，只能判断数组和对象

```php
<?php
function foo ( array $param0, stdClass $param1 );
```

### 数组合并

不用 array_merge，而是使用'+'，使用更方便，也更易理解。在处理默认值和用户定义值时尤为方便。

```php
<?php
// Set the normal defaults.
$control_defaults = array( 'type' => 'text', 'size' => 30 );

$control = $control_defaults + array( 'name' => 'surname', 'size' => 40 );
```

### 输出缓冲

使用 ob_start，关键是 ob_start 还支持 callback，真是太贴心了。

```php
<?php
function censor($text) {
	strtr($text, array('胡萝卜' => '***'));
}

ob_start(censor);
echo '小白兔最爱吃胡萝卜';
ob_end_flush();

//输出：小白兔最爱吃***
```

### 反射

<a href="http://ca.php.net/manual/en/book.reflection.php">reflection</a>，很强大，基本上能还原一个类的实际面貌。

### ctype function

```php
<?php
ctype_alnum //是否为字母和数字的组合
ctype_digit //是否为数字
ctype_alpha //是否为字母
...
```

### 快速向数组添加元素

如果是追加一个元素的话，推荐使用这种方法，而不是 array_push

```php
<?php
$arr = array();
$arr[] = 'foo';
$arr[] = 'bar';
```

### 其他

### 序列化/反序列化

```php
<?php
serialize / unserialize
```

### json 支持

```php
<?php
json_encode / json_decode
```

### 获取对象的类

```php
<?php
get_class($obj)
```

### 动态调用函数/方法

```php
<?php
call_user_func_array
```

### 错误/异常处理

```php
<?php
set_error_handler / set_exception_handler
```

<br />

### 网友提供

### array_walk (via cloudchen)

array_walk() 能让结构化数据的处理逻辑更清晰.
实现接近 js 的传入函数 as 参数

```php
<?php
function create_sth($walked_value, $key, $other_arg) {
	//...
}
function delete_sth(& $walked_value, $key, $other_arg) {
	//...
}

$contents = fetch_directory_contents($folder);

array_walk($contents, 'create_sth', $other_arg);
array_walk($contents, 'delete_sth', $other_arg);
```
