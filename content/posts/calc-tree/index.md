+++
title= "缩进输出目录结构并计算文件/文件夹大小"
date = 2011-06-10
description = ""
[taxonomies]
tags = ["programming", "php"]
[extra]
giscus = "telescope"
+++

如果把这个命题分开来实现会方便点，比如缩进输出目录结构可以通过先序遍历实现，计算文件夹大小可以通过后续遍历实现，但结合到一块就稍微有点麻烦了。比如我们要得到如下的输出

```php
LICENSE (1.040K)
README.md (0.951K)
UPDATE.ja.md (23.951K)
UPDATE.md (19.390K)
autoload.php.dist (0.875K)
check_cs (3.312K)
phpunit.xml.dist (1.160K)
src (8302.127K) // 文件夹
    Symfony (8302.127K) // 文件夹
        Bridge (84.567K) // 文件夹
...
```

我首先想到的方法是把文件/文件夹的计算和输出分开来实现，不过这样效率不高，因为有些文件会被多次使用 filesize 方法。

```php
<?php
function get_size($file_or_dir)
{
	$filesize = 0;

	if(is_file($file_or_dir))
	{
		$filesize = filesize($file_or_dir);
	}
	else
	{
		$filesize = 0;
		foreach(glob($file_or_dir.'/*') as $file)
		{
			$filesize += get_size($file);
		}
	}

	return $filesize;
}

function tree($prefix, $file_or_dir, $length)
{
	$filename = $prefix.'/'.$file_or_dir;
	if(is_file($filename))
	{
		// 每次输出都计算一次，如果是文件夹的话，文件夹下的文件会被多次计算，浪费也就在此
		pad_output($file_or_dir, get_size($filename), $length);
	}
	else
	{
		if($handle = opendir($filename))
		{
			pad_output($file_or_dir, get_size($filename), $length, 1);
			while(($file = readdir($handle)) !== false)
			{
				if($file !== '.' && $file !== '..')
				{
					tree($filename, $file, 1 + $length);
				}
			}
		}
	}
}
```

这样，假如 a/b/c.txt 这个文件，在获取 c.txt 文件大小时会计算 c.txt 一次，获取 b 文件夹大小时还会计算一次，获取 a 文件夹时仍然会计算一次。也就是说文件的重复计算次数跟目录深度成正比。

后来又想了一个方法可以避免重复计算，且占用不多的内存，自认为效率还算高。

```php
<?php
function cacl($file, &$data, $length)
{
	global $padding;

	$f_pad = $file;
	if(($pos = strrpos($file, '/')) !== false)
	{
		$f_pad = substr($file, $pos+1);
	}
	$f_pad = str_repeat($padding, $length).$f_pad;

	if(is_file($file))
	{
		$size = filesize($file);
		$data[$f_pad] = $size;
	}
	else
	{
		$data[$f_pad] = 0;
		$size = 0;
		foreach(glob($file.'/*') as $filename)
		{
			$size += cacl($filename, $data, 1 + $length);
		}
		$data[$f_pad] = $size.'_';
	}
	return $size;
}
```

这个只用了一个函数，更短，更快。引用数组负责数据的存储，递归返回值负责文件的大小，为了减少内存的使用，在文件夹的 size 后面加了"_"来表示这是一个文件夹，输出时去掉"_"就行了。

如果你有更好的想法，欢迎交流 :)

github 地址：<a href="https://github.com/limboy/cacl_tree">https://github.com/limboy/cacl_tree</a>
