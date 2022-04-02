+++
title= "SSH小技巧"
date = 2010-08-28
description = ""
[taxonomies]
tags = ["programming"]
[extra]
giscus = "telescope"
+++

参考：
<a href="http://blog.ksplice.com/2010/08/six-things-i-wish-mom-told-me-about-ssh/">Six Things I wish Mom told me(about ssh)</a>
<a href="http://troy.jdmz.net/rsync/index.html">Using Rsync and Ssh</a>

用过 linux 的，对 SSH 应该就比较熟悉了，但有些技巧可能你未必知道。

### 连接成功后运行命令

我们都知道可以通过 SSH 获取远程 shell，然后运行命令。如果只想运行单个命令的话，直接把命令附加在 SSH 命令之后即可，如

```bash
wdaher@rocksteady:~$ ssh bebop uname -a
Linux bebop 2.6.32-24-generic #39-Ubuntu SMP Wed Jul 28 05:14:15 UTC 2010 x86_64 GNU/Linux
```

这个最好结合无须输入密码的 SSH 登录。如果想获取 python 版本，直接"ssh hostname python -V"

但有些命令可能会报错，如"top"

```bash
wdaher@rocksteady:~$ ssh bebop top
TERM environment variable not set.
```

这时只需加上"-t"参数就行了。

这里我们执行 ssh 连接时并没有指定具体的主机名(ip)和用户，而只是"bebop"，这是如何做到的呢？且看下文

### 使用别名

假如在一个主机上为不同用户分别开通了不同的 ssh 账号，连接时就得这样

```bash
wdaher@rocksteady:~$ ssh -p 2222 bob.example.com
wdaher@rocksteady:~$ ssh -p 8183 waseem@alice.example.com
wdaher@rocksteady:~$ ssh -p 31337 -l waseemio wsd.example.com
```

很麻烦，而且端口或者其他参数有变动的话，不一定记得住。其实只要配置一下.ssh/config 文件就可以了。

```
Host bob
    HostName bob.example.com
    Port 2222
    User wdaher

Host alice
    HostName alice.example.com
    Port 8183
    User waseem

Host self
    HostName wsd.example.com
    Port 31337
    User waseemio
```

连接时，就变成这样了

```bash
wdaher@rocksteady:~$ ssh bob
wdaher@rocksteady:~$ ssh alice
wdaher@rocksteady:~$ ssh self
```

是不是很方便，如果 SSH 的参数改变的话，修改配置文件就行了，命令不变。

### 端口转发

假设有这么个情况：你已下班回家，这时想要查看公司内网(analytics)的某个 web 页，但只能 SSH 到自己在公司的电脑(desktop)，desktop 和 analytics 在一个局域网。

先来看一段命令

```bash
ssh desktop -L 8080:desktop:80
```

这段命令表示的是 ssh 连到 desktop 后，转发本地 8080 端口到 desktop 的 80 端口，这时，如果访问"http://localhost:8080"，就会转发到 desktop 的 80 端口。这样的话，把 desktop:80 换成 analytics:80 不就大功告成了吗

```bash
ssh desktop -L 8080:analytics:80
```

这样访问本地的 8080 端口，就会转到 analytics 的 80 端口，通过 desktop 这个跳板。

更加一劳永逸的方法是使用-D 参数，将 desktop 变成一个<a href="http://baike.baidu.com/view/490489.htm?fr=ala0_1">socks5</a>代理服务器(对这个-D 命令，大家应该都很熟悉了吧)，然后在浏览器中配置代理为"localhost:8080"

```bash
ssh desktop -D 8080 desktop
```

这样所有的浏览器访问都会通过 desktop 进行转发，也就是说直接访问 http://analytics 就可以了。(analytics 地址在 hosts 里配置，如 192.168.1.110 analytics)

### 使用"~"

"~"(不包括引号)是 ssh 保留字符，在新行输入"~"后，可以配合很多键，其中最常用的就是"~."和"~^Z"(Ctrl+Z)

"~."会终止 ssh 连接，如果中断了连接，又不想等 ssh session 过期，就可以使用这个快捷键。

"~^Z"会把当前的 ssh 连接放到后台，等完成了其他工作后，再把这个连接取出来。

```bash
wdaher@rocksteady:~$ ssh bebop
wdaher@bebop:~$ sleep 10000
wdaher@bebop:~$ ~^Z [suspend ssh]

[1]+  Stopped                 ssh bebop
wdaher@rocksteady:~$ # Do something else
wdaher@rocksteady:~$ fg # and you're back!
```

### 通过 authorized_keys 指定登录后要执行的命令

这个跟前面提到的"连接成功后运行命令"不一样，这个命令是定义在 authorized_keys 里的，ssh 连上后，只能执行该命令，并且执行完后立即退出。

先看看正常的 authorized_keys

<pre>
ssh-dss AAAAB3NzaC1kc3MAAAEBAKYJenaYvMG3nHwWxKwlWLjHb77CT2hXwmC8Ap+fG8wjlaY/9t4u
A+2qx9JNorgdrWKhHSKHokFFlWRj+qk3q+lGHS+hsXuvta44W0yD0y0sW62wrEVegz+JVmntxeYc0nDz
5tVGfZe6ydlgomzj1bhfdpYe+BAwop8L+EMqKLS4iSacNjoPlHsmqHMnbibn3tBqJEq2QJjEPaiYj1iP
5IaCuYBhuTKQGa+oyH3mXEif5CKdsIKBj46B0tCy0/GC7oWcUN92QdLrUyTeRJZsTWsxKpRbMliD2pBh
4oyX/aXEf8+HZBrO5vQjDBCfTFQA+35Xrd3eTVEjkGkncI0SAeUAAAAVAMZSASmQ9Pi38mdm6oiVXD55
Kk2rAAABAE/bA402VuCsOLg9YS0NKxugT+o4UuIjyl6b2/cMmBVWO39lWAjcsKK/zEdJbrOdt/sKsxIK
1/ZIvtl92DLlMhci5c4tBjCODey4yjLhApjWgvX9D5OPp89qhah4zu509uNX7uH58Zw/+m6ZOLHN28mV
5KLUl7FTL2KZ583KrcWkUA0Id4ptUa9CAkcqn/gWkHMptgVwaZKlqZ+QtEa0V2IwUDWS097p3SlLvozw
46+ucWxwTJttCHLzUmNN7w1cIv0w/OHh5IGh+wWjV9pbO0VT3/r2jxkzqksKOYAb5CYzSNRyEwp+NIKr
Y+aJz7myu4Unn9de4cYsuXoAB6FQ5I8AAAEBAJSmDndXJCm7G66qdu3ElsLT0Jlz/es9F27r+xrg5pZ5
GjfBCRvHNo2DF4YW9MKdUQiv+ILMY8OISduTeu32nyA7dwx7z5M8b+DtasRAa1U03EfpvRQps6ovu79m
bt1OE8LS9ql8trx8qyIpYmJxmzIdBQ+kzkY+9ZlaXsaU0Ssuda7xPrX4405CbnKcpvM6q6okMP86Ejjn
75Cfzhv65hJkCjbiF7FZxosCRIuYbhEEKu2Z9Dgh+ZbsZ+9FETZVzKBs4fySA6dIw6zmGINd+KY6umMW
yJNej2Sia70fu3XLHj2yBgN5cy8arlZ80q1Mcy763RjYGkR/FkLJ611HWIA= thisuser@thishost
</pre>

修改之后，就是这样

<pre>
from="10.1.1.1",command="/home/remoteuser/command" ssh-dss AAAA...
</pre>

其实就是在最前面加了 from 和 command，from 表明从哪个 ip 连过来的，如果是用 adsl 拨号上网，ip 会经常变动，可以把这个参数去掉。command 表明连接成功后要执行的命令，可以在 command 里限制该用户可以执行的命令(别忘了加上可执行权限)，假设限制该用户只能执行 rsync 命令:

```bash
#!/bin/sh

case "$SSH_ORIGINAL_COMMAND" in
*\&*)
echo "Rejected"
;;
*\(*)
echo "Rejected"
;;
*\{*)
echo "Rejected"
;;
*\;*)
echo "Rejected"
;;
*\<*)
echo "Rejected"
;;
*\`*)
echo "Rejected"
;;
*\|*)
echo "Rejected"
;;
rsync\ --server*)
$SSH_ORIGINAL_COMMAND
;;
*)
echo "Rejected"
;;
esac
```

$SSH_ORIGINAL_COMMAND 表示的是用户实际执行的命令

### 其他技巧

### 禁止 Root 用户登录

允许 root 用户登录太危险了(虽然很方便)，因为可以删除任何文件，可以在'/etc/ssh/sshd_config'里配置一下。

```bash
PermitRootLogin no
#或者只允许执行有限的命令
PermitRootLogin forced-commands-only
```

### 免密码登录

先用 ssh-keygen 生成一对私钥和公钥，然后把公钥添加到远程主机的 authorized_keys 里就行了

```bash
#生成私钥和公钥，默认放在~/.ssh/文件夹下，也可以自定义，提示输入passphare时，直接回车
#顺利的话就会在~/.ssh/文件夹下生成id_rsa.pub和id_rsa两个文件
ssh-keygen -t rsa

#把id_rsa.pub上传到远程主机，方法很多，ssh-copy-id只是其中一种
ssh-copy-id username@hostname
#如果id_rsa.pub在其他文件夹下
ssh-copy-id -i /path/to/id_rsa.pub username@hostname
```

这样下次就可以直接登录了
