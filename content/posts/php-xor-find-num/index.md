+++
title= "一道面试题的思考"
date = 2011-06-03
description = ""
[taxonomies]
tags = ["programming"]
[extra]
giscus = "telescope"
+++

前几天下班途中跟同事聊到了一道面试题，大意是，给你 1-1000 个连续自然数，然后从中随机去掉两个，再打乱顺序，要求只遍历一次，求出被去掉的两个数。

这题其实挺为面试者的，因为要求 1 分钟内说出解法，且不能使用计算机、纸和笔。如果之前没有遇到过类似的题目，加上面试时的紧张心情，很难能在那么短的时间里想到解决方案，至少我做不到。

好在我有时间，上网看了一下，比较常见的有两种方法

### 求方程组的解

遍历被打乱的数组时，计算 value 的累加值和 value 平方的累加值。结合未打乱之前的数组，这样就能得出 x+y = m 与 x*x+y*y = n 两个方程，解这组方程即可算出被去掉的两个数。这种方法比较容易理解，实现起来也比较简单

### 使用异或

这个就麻烦点了。先来说说异或的定义：两个二进制位不同的取 1。再来说说异或的两个特性：顺序无关 / 对一个数异或两次等于没有异或。顺序无关就是说异或的元素可以随意交换顺序，而不会影响结果。异或两次可以理解为+x 和-x。

#### 计算出 x^y 的值

首先，这两个数组(打乱前和打乱后)各自异或，也就是 1^2^...^1000，得到两个异或值。再对这两个异或值进行一次异或，这样就得到了 x^y 的指(重复部分互相抵消了)。

```php
// 其实就是把数组的所有元素进行异或，重复部分互相抵消
result = 1^2^...^1000^1^2...^1000;
result = 1^1^2^2...^x...^y...^1000^1000;
result = x^y;
```

#### 获取计算出的异或值的 1 所在的位置，并继续异或

因为 x 和 y 是两个不同的整数，所以这两个数的异或结果，转化为二进制的话，一定在某位是 1，假设在第 3 位。也就是说如果把原始数组按第 3 位是否为 0 进行划分，就可以分成两个数组，每个数组各包含一个被抽取的数。如果打乱后的数组也按这个规则划分为两个数组，这样就得到了 4 个数组，其中两组是第 3 位为 0，另外两组是第 3 位为 1。把第 3 位为 0 的两个数组所有元素进行异或就能得到被抽取的一个数，同理也就能获得另外一个被抽取的数，于是问题解决。

### PHP 的实现

```php
<?php
// 起始长度
$length = 10;

$arr = $arr_copy = range(1, $length);
// 将要被移除的两个数
$num1 = $num2 = 0;
// 两个数组异或再互相异或的结果
$num1_num2_xor = 0;
// 存放被pos分割的数字
$arr_0 = $arr_1 = $arr_copy_0 = $arr_copy_1 = array();

// 获取一个数字转化为二进制后1所在的位置
function get_pos($num)
{
	for($i=0 ;$i<10; $i++)
	{
		$b = pow(2, $i);
		$rs = $num&$b;
		if($rs % 2 == 0 && $rs != 0)
		{
			return $i;
		}
	}
	return 0;
}

// 进行异或计算
function do_xor($x, $y)
{
	return $x^$y;
}

function init()
{
	global $arr, $arr_copy, $num1, $num2, $num1_num2_xor, $length;

	$rand_index_1 = mt_rand(1, $length/2);
	$rand_index_2 = mt_rand($length/2+1, $length-1);

	// 获取两个随机数，然后去掉从数组中去掉它们
	$num1 = $arr[$rand_index_1];
	$num2 = $arr[$rand_index_2];

	unset($arr[$rand_index_1]);
	unset($arr[$rand_index_2]);

	cacl_num1_num2_xor();
	divide_by_pos(get_pos($num1_num2_xor));
	get_num();

}

// 获取两个数组各自异或再互相异或的结果
function cacl_num1_num2_xor()
{
	global $arr, $arr_copy, $num1_num2_xor;
	$arr_xor = array_reduce($arr, 'do_xor');
	$arr_copy_xor = array_reduce($arr_copy, 'do_xor');

	$num1_num2_xor = $arr_xor ^ $arr_copy_xor;
}

// 根据pos将两个数组再各自细分成两个数组
// 其中$arr_copy_0和$arr_copy_1各自包含了一个被抽取的数
function divide_by_pos($pos)
{
	global $arr, $arr_copy, $arr_0, $arr_1, $arr_copy_0, $arr_copy_1;
	$b = pow(2, $pos);

	foreach($arr as $val)
	{
		$rs = $val&$b;
		if($rs == 0)
		{
			$arr_0[] = $val;
		}
		else
		{
			$arr_1[] = $val;
		}
	}

	foreach($arr_copy as $val)
	{
		$rs = $val&$b;
		if($rs == 0)
		{
			$arr_copy_0[] = $val;
		}
		else
		{
			$arr_copy_1[] = $val;
		}
	}
}

// 对这4个数组进行对应的异或操作，就出结果了
function get_num()
{
	global $arr_0, $arr_1, $arr_copy_0, $arr_copy_1, $num1, $num2;
	$arr_0_xor = array_reduce($arr_0, 'do_xor');
	$arr_copy_0_xor = array_reduce($arr_copy_0, 'do_xor');
	$cacl_num1 = $arr_0_xor^$arr_copy_0_xor;

	$arr_1_xor = array_reduce($arr_1, 'do_xor');
	$arr_copy_1_xor = array_reduce($arr_copy_1, 'do_xor');
	$cacl_num2 = $arr_1_xor^$arr_copy_1_xor;

	echo $cacl_num1.' / '.$cacl_num2. PHP_EOL;
	echo $num1.' / '.$num2;
}

init();
```
