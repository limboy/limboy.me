+++
title= "浅谈分布式存储的路由设置"
date = 2010-12-14
description = ""
[taxonomies]
tags = ["programming"]
[extra]
giscus = "telescope"
+++

程序设计中很重要的一个思想是：隔离变化的部分。在开发之前就应该想到哪些部分在不远的将来是可能会变的或一定会变的，开发时，就应该将这些部分隔离出来，同时可以优雅地进行控制。

对于大数据量高并发的网站，存储经常会有变动：添加/移除数据库服务器、分表分库、添加/移除缓存服务器、添加/移除文件存储服务器等等。怎样才能在这些存储设施调整后，代码上只要进行局部的修改就行了，这就是本文要探讨的主题：分布式存储的路由设置。

### 文件存储路由

平时我们操作文件时，一般都会用 file_put_contents/file_get_contents/fopen 之类的文件操作函数，这就需要给出文件的路径，如

```php
<?php
file_get_contents(dirname(__FILE__).DIRECTORY_SEPARATOR.'destfile.txt');
file_put_contents(dirname(__FILE__).DIRECTORY_SEPARATOR.'destfile.txt', 'hello world');
```

确实挺方便，但随着文件数的增多，需要对文件重新规划，如原来是'dir/abcd.txt'，要调整为'dir/ab/abcd.txt'。这时就只能去手动修改代码，结果很有可能改了这，忘了那。比如有些是通过 file_put_contents 方法；有些是通过 fopen 方法；有些不需要调整，有些需要调整等等。

如果有文件路由机制，事情就好办了，看看下面的使用代码

```php
<?php
$file = new File(array(
	'basepath' => DATA_PATH.'file'.DIRECTORY_SEPARATOR,
));
$file->open('test.txt')->write('hello world')->execute() ;
echo $file->open('test.txt')->get()->execute();
```

实例化 File 类后，只需传入文件名，加上要执行的操作，最后 execute()一下就行了，不必关心文件的存储状态。如果要重新调整文件的存储结构，对客户端是透明的，也就是说不用对代码进行任何调整。

调整的规则写在 File 类里

```php
<?php
class File extends Core_File
{
	/**
	 * 自定义文件存储规则，对使用者是透明的。
	 */
	protected function _route()
	{
		// 将abcd.txt保存为ab/cd/abcd.txt
		$pathinfo = pathinfo($this->_filename);
		$extension = empty($pathinfo['extension']) ? '' : '.'.$pathinfo['extension'];
		$fhn = md5($pathinfo['filename']);
		$filepath = $this->_config['basepath'].$fhn[0].$fhn[1].DIRECTORY_SEPARATOR.$fhn[2].$fhn[3].DIRECTORY_SEPARATOR;
		if (!is_dir($filepath))
		{
			mkdir($filepath, 0777, true);
		}
		$this->_filename = $filepath.$fhn.$extension;
	}
}
```

如果要改规则，只要修改\_route 方法就行了。

### 缓存路由

以 memcached 为例，可能会有多个 memcached 服务器，每个 memcached 服务器的职责可能还不一样，还可能经常变动。如果在代码里强行指定连接某台 memcached 服务器，一旦变动，事情就麻烦了。这时可以做个 memcached 路由，如果业务逻辑或 memcached 服务器有变，就在这个路由里做文章。

**使用方式**

```php
<?php
$cache = new Cache_Adapter_Memcache(array(
	'servers' => array(
		'server1' => array(
			'host' => 'localhost',
			'port' => 11211,
			'persistent' => false,
		),
		//array ('server2' => array(
		//	'host' => '192.168.1.100',
		//	'port' => 11211,
		//	'persistent' => false,
		//),
	)
));

$cache->set('bar', 'foo');
echo $cache->get('bar');
```

**自定义路由**

```php
<?php
class Cache_Adapter_Memcache extends Core_Cache_Adapter_Memcache
{
	/**
	 * 自定义规则，根据key来指定memcache服务器，如果不指定的话，memcache会自动从连接池中取一个连接。
	 */
	protected function _route($key)
	{
		// demo
		if(substr($key, 0, 4) == 'sess')
		{
			$server1 = $this->_config['server1'];
			$this->_memcache->connect($server1['host'], $server1['port'], $server1['timeout']);
		}
	}
}
```

将来只要调整\_route 方法即可，调用代码不变。

### 数据库路由

数据库是应用的核心，随着数据量和并发的增大，分表分库是早晚的事，通过路由机制可以实现只修改路由方法，而保持调用的代码不变。为了方便演示，简单封装了一下 PDO。

**使用方式**

```php
<?php
$db = new Database(array(
		'servers' => array(
			'server1' => array(
				'dsn' => 'mysql:dbname=test;host=127.0.0.1',
				'user' => 'root',
				'password' => '123456',
			),
			//'server2' => array(
			//	'dsn' => 'mysql:dbname=test;host=192.168.1.100',
			//	'user' => 'root',
			//	'password' => '123456',
			//),
		),
	)
);

// 实际情况中，SQL都是通过Query Builder或ORM在内部拼接而成的
$rows = $db->query('SELECT * FROM user WHERE `id` = 100000');

foreach ($rows as $row)
{
	echo $row['username'];
}
```

看上去我们好像执行了 query 里的 SQL 语句，但经过\_route 方法转换后就不一定了。

**自定义路由**

```php
<?php
class Database extends Core_Database
{
	/**
	 * 根据SQL的内容，选择不同的数据库服务器，不同的数据库，不同的表
	 */
	protected function _route($sql)
	{
		$sql = strtolower($sql);
		if (strpos($sql, 'from user') !== FALSE)
		{
			preg_match('/`id` = ([0-9]+)/', $sql, $match);
			if (!empty($match[1]))
			{
				$user_id = $match[1];
				if ($user_id > 10000)
				{
					$tbl = 'user1';
				}
				$sql = str_replace('from user', 'from user1', $sql);
			}
		}
		// 如果需要连接到其他的数据库服务器，重写_conn方法
		$this->_conn();
		return $sql;
	}
}
```

这里直接解析 SQL 确实暴力了点，实际使用中应该是解析 Query Builder 或 ORM，不过能够说明问题就行了。这样，业务逻辑改变或者数据库服务器变动都可以在\_route 方法里修改，使用时，代码无须任何改动。

如果规则很复杂，可以单独写一个 route 类，在\_route 方法里调用。

### 源码下载

<a href="https://github.com/limboy/storage-route">https://github.com/limboy/storage-route</a>
