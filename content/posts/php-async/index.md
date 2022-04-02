+++
title= "说说php的异步请求"
date = 2010-12-05
description = ""
[taxonomies]
tags = ["programming", "php"]
[extra]
giscus = "telescope"
+++

很多情况下我们需要让 php 在后台执行某个程序，同时又不影响页面的输出，以下是我总结的几种实现方式

### exec

这是最简单的方式

```php
<?php
exec(sprintf("%s > %s 2>&1 & echo $! > %s", $cmd, $outputfile, $pidfile));
```

调用$cmd命令，将输出重定向到$outputfile，不显示错误信息，同时将进程 id 输出到$pidfile。

这样也方便监控，比如判断该进程是否还在运行

```php
<?php
function isRunning($pid){
    try{
        $result = shell_exec(sprintf("ps %d", $pid));
        if( count(preg_split("/\n/", $result)) > 2){
            return true;
        }
    }catch(Exception $e){}

    return false;
}
```

注意：如果直接调用 exec 来运行某个命令，或者在该命令后面加个"&"，php 还是会等待该命令运行完成再执行下面的操作。

### proc_open/proc_close

这个方法很有意思，先用 proc_open 运行一段后台程序，然后用 proc_close 来关闭 proc_open，结果程序就在后台运行了，同时 php 也会继续执行下去

```php
<?php
proc_close(proc_open ("ping www.baidu.com -c 10 > /path/to/output &", array(), $foo));
```

### pcntl_fork

使用 php 的多线程来达到目的，原理就是复制一个子线程，同时杀死父线程(不支持 windows)。

```php
<?php
if ($pid = pcntl_fork())
    die();     // Parent

function shutdown() {
    posix_kill(posix_getpid(), SIGHUP);
}

if(ob_get_level()) ob_end_clean(); // Discard the output buffer and close

fclose(STDIN);  // Close all of the standard
fclose(STDOUT); // file descriptors as we
fclose(STDERR); // are running as a daemon.

register_shutdown_function('shutdown');

if (posix_setsid() < 0)
    die();      // <- This is an error

// Do your stuff here
exec('/bash/command > /path/to/output');
```

### header

使用这个方法的前提是使用 http 协议，同时目标文件可控，最好在一个域下。因为必须要建立 http 连接才行，所以稍微有点费时。原理是通过 header 输出'Connection:close'头，中断 http 连接，同时后面的代码继续执行。

```php
<?php
while(ob_get_level()) ob_end_clean();
header('Connection: close');
ignore_user_abort();
ob_start();
echo('Connection Closed');
$size = ob_get_length();
header("Content-Length: $size");
ob_end_flush();
flush();
```

### 使用数据库作中转

把要执行的命令和参数先存到缓存或数据库，接下来的事就不用 php 操心了。

如果还有其他的方法，欢迎交流 :)
