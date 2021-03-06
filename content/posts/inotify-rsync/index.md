+++
title= "inotify-rsync实时同步脚本"
date = 2010-12-13
description = ""
[taxonomies]
tags = ["programming"]
[extra]
giscus = "telescope"
+++

### 为什么要写这个脚本

rsync 是 linux 下一款非常强大的同步工具，采用差异同步的方法，只上传文件/文件夹的不同部分，同时可以对上传部分先进行压缩，所以 rsync 的传输效率是很高的。

但 rsync 也有缺点，最大的问题就是每次执行 rsync 命令都会遍历目标目录，当文件不多时，这没什么问题，一旦文件数到了一定规模，那么每次遍历都会消耗很多资源。但事实上改动的文件并不多，如果可以只 sync 改动的文件，问题就迎刃而解了。

这时就得请出本文的另一个主角：inotify。inotify 是一种文件系统的变化通知机制，如文件增加、删除等事件可以立刻让用户态得知。要使用 inotify，linux 的内核版本不能低于 2.6.13

```bash
~$ uname -a
Linux lzyy-laptop 2.6.32-26-generic #48-Ubuntu SMP Wed Nov 24 09:00:03 UTC 2010 i686 GNU/Linux
```

但 inotify 只提供了 C 语言接口，不方便调用，所以我们需要先安装<a href="https://github.com/rvoicilas/inotify-tools/wiki/">inotify-tools</a>，大多数的 linux 发行版应该都可以直接通过 apt-get 或 yum 来安装。

### 脚本说明与使用

其实<a href="http://blog.chinaunix.net/u/32831/showart_1289758.html">前人</a>已经做了类似的工作，不过有些地方尚未完善(如删除文件的同步)，于是我改进和简化了一下。

### 服务端

以下是服务端脚本，运行这段脚本后，这个机器上对应的文件夹将会同步到其他机器上

```bash
#!/bin/bash

###########################
# 在这里配置本地文件夹,目标host,目标的rsync_module。rsync_module在同步机器的/etc/rsyncd.conf文件中配置
# 逗号前后不要有空格
sync[0]='/path/to/local/dir,1.2.3.4,test' # localdir,host,rsync_module
# sync[1]='/path/to/local/dir,host,rsync_module'
###########################

for item in ${sync[@]}; do

dir=`echo $item | awk -F"," '{print $1}'`
host=`echo $item | awk -F"," '{print $2}'`
module=`echo $item | awk -F"," '{print $3}'`

inotifywait -mrq --timefmt '%d/%m/%y %H:%M' --format  '%T %w%f %e' \
 --event CLOSE_WRITE,create,move,delete  $dir | while read  date time file event
	do
		echo $event'-'$file
		case $event in
			MODIFY|CREATE|MOVE|MODIFY,ISDIR|CREATE,ISDIR|MODIFY,ISDIR)
				if [ "${file: -4}" != '4913' ]  && [ "${file: -1}" != '~' ]; then
					cmd="rsync -avz --exclude='*' --include=$file $dir $host::$module"
					# echo $cmd
					$cmd
				fi
				;;

			MOVED_FROM|MOVED_FROM,ISDIR|DELETE|DELETE,ISDIR)
				if [ "${file: -4}" != '4913' ]  && [ "${file: -1}" != '~' ]; then
					cmd="rsync -avz --delete-excluded --exclude="$file" $dir $host::$module"
					# echo $cmd
					$cmd
				fi
				;;
		esac
	done &
done
```

运行脚本

```bash
cd /path/to/inotify-rsync
chmod +x inotify-rsync.sh
./inotify-rsync
```

可以把这个脚本设置为开机启动，这样就可以自动同步了。

### 同步端

同步机器上要做两件事

**1. 设置/etc/rsyncd.conf 文件**

```bash
# vim /etc/rsyncd.conf

uid=root
gid=root
# 这个test就是上面脚本中用到的rsync_module名
# path指定同步过来的文件存放的路径
# 如果只允许部分ip的机器进行同步的话，设置allow为 192.168.1.1/100 类似的格式
[test]
path=/path/to/your/dir
allow *
{{< / highlight >}}

**2. 启动rsync daemon**

{{< highlight console >}}
rsync --daemon
```

### 其他

金山的周洋同学用 C++写了个<a href="http://hi.baidu.com/johntech/blog/item/f8bdaec8fb3c268dc81768c0.html">Sersync</a>，也是利用的 inotify+rsync 来实现实时同步，有兴趣的可以关注一下
