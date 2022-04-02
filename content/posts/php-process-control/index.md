+++
title= "php 的多进程"
date = 2010-08-27
description = ""
[taxonomies]
tags = ["programming", "php"]
[extra]
giscus = "telescope"
+++

一般有两种方法，一种是使用 PHP 自带的 pcntl\_\*函数(仅限 linux)，另一种就是使用 popen/proc_open，然后在 php 内部控制进程数量。

### 使用 pcntl\_\*函数

PHP 提供了一系列的 pcntl\_\*函数，顾名思义就是 process control functions，专门用来管理进程的。最常用的就是 pcntl_fork 和 pcntl_wait。

pcntl_fork 的作用就是从当前的进程再派生出一个子进程。pcntl_wait 的作用是挂起当前进程，直到一个子进程中止。

```php
<?php
//配合pcntl_signal使用
declare(ticks=1);
//最大的子进程数量
$max = 5;
//当前的子进程数量
$child = 0;

//当子进程退出时，会触发该函数
function sig_handler($sig) {
	global $child;
	switch($sig) {
		case SIGCHLD:
			echo 'SIGCHLD received'."\n";
			$child--;
	}
}

//注册子进程退出时调用的函数
pcntl_signal(SIGCHLD, "sig_handler");

while(true) {
	$child++;
	/**
	 * 这个函数会返回两个值，一个为0，表示子进程；一个为正整数表示子进程的id
	 * 所以if和else里的两段代码都会执行
	 * if里的代码是父进程执行的
	 * else里的代码是子进程执行的
	 */
	$pid = pcntl_fork();
	if ($pid) {
		//这里是父进程执行的代码
		//如果子进程数超过了最大值，则挂起父进程
		//也就是说while语句不会继续执行
		if ($child >= $max) {
			pcntl_wait($status);
		}
	}
	else {
		//这里是子进程执行的代码
		//如果要执行其他命令的话，使用pcntl_exec
		echo "starting new child | now we have $child child process\n";
		sleep(rand(3, 5));
		exit;
	}
}
```

上面这段代码就是保证有 5 个子进程一直在干活，如果$child数量大于$max，就等子进程结束后再继续运行。子进程结束后会调用 sig_handler 函数，sig_handler 会将$child 数量减 1，那边 while 继续执行。

### 使用 popen/proc_open

popen 会创建一个管道来连接该进程，然后使用 fread/fgets/stream_get_contents 来读取该进程返回的结果。跟 exec 或 system 之类的函数不同的是，exec 会等待命令执行完成，再运行下面的代码，但 popen 不会。proc_open 又更加强大一些，支持 stdin 和 stdout，路径设置等等。

因为这些函数只负责创建，没有相应的管理方法，所以只能在 PHP 文件内部自己来实现。
demo(引用自张宴——<a href="http://blog.s135.com/post/311/">PHP 多进程并发控制的测试用例</a>)

```php
<?php
function run($input)
{
    global $p_number;
    if ($p_number <= 0)
    {
        $p_number = worker_processes($p_number);
    }
    $p_number = $p_number - 1;
    $out = popen("/bin/sh /opt/zhangyan.sh \"{$input}\" &", "r");
    pclose($out);
}

function worker_processes($p_number)
{
    $limit = 500;//允许推到后台的最大进程数
    while ($p_number <= 0)
    {
        $cmd = popen("ps -ef | grep \"/opt/zhangyan.sh\" | grep -v grep | wc -l", "r");
        $line = fread($cmd, 512);
        pclose($cmd);
        $p_number = $limit - $line;
        if ($p_number <= 0)
        {
            sleep(1);//暂停1秒钟
        }
    }
    return $p_number;
}

$input = "http://blog.s135.com"; //模拟从队列文件中读取到的数据
for ($i = 1; $i <= 1000; $i++)
{
    run($input);
    echo "Idle process number: " . $p_number . "\n";
}
?>
```

### 程序的逻辑：

1. 设置/opt/zhangyan.php 最多允许生成 500 个子进程；

2. 当/opt/zhangyan.php 读取到一条数据后，将允许生成的子进程数减 1（空闲进程数$p_number=500-1=499），然后将数据交给/opt/zhangyan.sh 去后台处理，不等待/opt/zhangyan.sh 处理结束，继续读取下一条数据；

3. 当允许生成的子进程数减至 0 时（空闲进程数$p_number=0），/opt/zhangyan.php 会等待 1 秒钟，然后检查后台还有多少个/opt /zhangyan.sh 子进程尚未处理结束；

4. 如果 1 秒钟之后/opt/zhangyan.php 发现后台的/opt /zhangyan.sh 子进程数还是 500（空闲进程数$p_number=0），会继续等待 1 秒钟，如此反复；

5. 如果/opt /zhangyan.php 发现后台尚未处理结束的/opt/zhangyan.sh 子进程数减少到 300 个了（空闲进程数$p_number=500-300=200），那么/opt/zhangyan.php 会再往后台推送 200 个/opt/zhangyan.sh 子进程；

总体来说还是使用 pcntl\_\*系函数更方便一些，逻辑也更清楚。
