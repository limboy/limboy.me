+++
title= "高性能MySQL小结"
date = 2011-01-05
description = ""
[taxonomies]
tags = ["programming", "mysql", "book"]
[extra]
giscus = "telescope"
+++

其实只看到了 1/3，先记录一下，等以后有空了再补上。

### 将查询结果导出到文件

```bash
mysql > SQL QUERY INTO OUTFILE '/path/to/sql/file'
```

### 将每次操作都导出到文件

```bash
mysql > \T /path/to/file
mysql > ... //这些操作，及操作的结果都会输出到对应的文件
mysql > \t
```

文件内容大概会是这样

```bash
(root@localhost) [(none)]> use noah;
Reading table information for completion of table and column names
You can turn off this feature to get a quicker startup with -A

Database changed
(root@localhost) [noah]> show tables;
+----------------+
| Tables_in_noah |
+----------------+
| blog_category  |
| blog_comment   |
| blog_post      |
| blog_res       |
| blog_role      |
| blog_role_res  |
| blog_role_user |
| blog_tag       |
| blog_user      |
| test           |
+----------------+
10 rows in set (0.00 sec)

(root@localhost) [noah]> select * from test;
+----+------+
| id | name |
+----+------+
|  1 | foo  |
|  2 | bar  |
+----+------+
2 rows in set (0.02 sec)
```

### 显示 MySQL 当前状态及其他信息

```bash
SHOW STATUS; //显示MySQL当前状态
SHOW VARIABLES; //显示MySQL的变量信息，如version/data_dir等等
SHOW VARIABLES LIKE '%home%'; //获取包含home的变量
SHOW TABLE STATUS\G //显示当前表的状态，注意后面的\G，垂直显示结果
DESCRIBE tbl; //获取表结构
SHOW FULL COLUMNS FROM tbl; //类似上面
```

### 显示 MySQL 当前的连接状况

```bash
# 使用mysqladmin
mysqladmin processlist
# 或进入到mysql cli后执行
mysql > show processlist;

# 结果大概是这样
+-----+------+-----------+------+---------+------+-------+------------------+
| Id  | User | Host      | db   | Command | Time | State | Info             |
+-----+------+-----------+------+---------+------+-------+------------------+
| 409 | root | localhost | noah | Query   |    0 | NULL  | show processlist |
+-----+------+-----------+------+---------+------+-------+------------------+
```

### 关于 TIMESTAMP

- 第一个 TIMESTAMP 字段会随着表其他字段的更新而自动更新，之后的 TIMESTAMP 字段则不会。
- TIMESTAMP 的范围是：1970-2037；而 DATETIME 的范围是：1000-9999

### 移除重复的行

```bash
# 注意这个IGNORE参数，如果没加的话会报错，且执行失败
# 假设要去除a,b项重复的行
ALTER IGNORE TABLE tbl ADD UNIQUE INDEX(a,b);
```

### 查看当前在操作的数据库

```bash
SELECT DATABASE();
```

也可以在 mysql 的提示符上动点手脚

```bash
# edit /etc/mysql/my.cnf
[mysql]
#no-auto-rehash	# faster start of mysql but no tab completition
prompt=(\\u@\\h) [\\d]> \\
```

### 复制一个表

```bash
CREATE TABLE tbl1 LIKE tbl;
INSERT INTO tbl1 SELECT * FROM tbl;
# 也可以先用mysqladmin导出数据，再导入
```

### 定长表与变长表

包含任何 varchar、text 等变长字段的数据表，即为变长表，反之则为定长表。所以 CHAR 和 VARCHAR 不共存

CHAR(30)，最多可以容纳 30 个字符，但如果字符数不到 30 个的话，也会占用这些空间，只不过会在后面补上空格，但我们查询时又会发现尾部没有空格，这是因为空格已经被 CHAR 处理掉了。

VARCHAR(30)，也是最多可以容纳 30 个字符，但如果不足 30 个的话，有多少字符占多少空间，不会浪费。

变长表的优势在于有效利用空间，但由于记录大小不同，在其上进行许多删除或更新操作会使表中的碎片增多，需要定期 OPTIMIZE TABLE 以保持性能。

定长表的查询，检索和更新速度都比变长表快，但占用的空间也大。

PS:MySQL 5.0.3 之后 VARCHAR 的最大字符数为 65535

### 转换编码

```bash
SET NAMES utf8
# CHARSET utf8
```

### 聚合函数

```bash
COUNT [GROUP BY]
COUNT + HAVING + GROUP BY (HAVING可以看作后置WHERE语句)
MIN/MAX [GROUP BY]
SUM/AVG [GROUP BY]
DISTINCT [GROUP BY]
所有的这些聚合函数加上GROUP BY之后，都只对GROUP BY部分有效。(不好理解，忽略)
```

### 并发控制

#### 读锁(共享锁)/写锁(排他锁)

当某一用户修改一部分数据时，MySQL 会禁止其他用户读取同一数据。大多数时，MySQL 都是以透明的方式实现锁的内部管理

#### 锁粒度

只锁定部分修改的数据，而不是所有的资源，或者只对要修改的数据片精确加锁。任何时间，在给定的资源上，被加锁的数据量越小，就可以允许更多的并发修改，只要相互之间互不冲突即可

这么做的问题是加锁也会消耗系统资源。如获得锁，检查锁是否已解除，以及释放锁等，都会增加系统开销。如果系统花费大量时间来管理锁，而不是读/写数据，那么系统整体性能都可能会受到影响

所谓的锁策略，就是在锁开销和数据安全之间寻求一种平衡。

#### 表锁(MyISAM)

开销最小，但不适合频繁写操作

#### 行锁(InnoDb)

可以支持最大的并发处理，但同时也会增加开销（InnoDb），由存储引擎实现，而不是 MySQL 服务器

#### 事务

一组原子性的 SQL 语句。要么全部执行(commit)，要么全部不执行(rollback)

正像锁粒度的增加会导致锁开销的增加一样，这种事务处理中的额外安全措施，也会导致数据库服务器要完成更多的额外工作

MySQL 默认操作是 AutoCommit，这意味着除非显示地开始一个事务，否则将把每个 SQL 操作视为一个单独事务自动执行

#### 死锁

两个或多个事务在同一资源上相互占用，并请求加锁时，导致的恶性循环现象

解决办法：死锁检测/死锁超时机制。InnoDb 处理死锁的方法是，回滚拥有最少排他行级锁的事务。

#### 隐式和显式锁定

InnoDb: 一个事务在执行过程中的任何时候，都可以获得锁，但只有在执行 COMMIT 或 ROLLBACK 语句后，才可以释放这些锁。

InnoDb 也支持显式锁定，如：

```bash
SELECT ... LOCK IN SHARE MODE
SELECT ... FOR UPDATE
```

#### 多版本并发控制

MySQL 事务性存储引擎，如 InnoDb，不是简单使用行加锁机制，而是 MVCC 和行加锁机制关联使用。

MVCC 不是 MySQL 独有的技术，其他如 Oracle, Postgresql 等都在使用

可以将 MVCC 设想成一种行级加锁的变形，它避免了很多情况下的锁操作，大大降低了系统的开销

MVCC 是通过及时保存在某些时刻的数据快照，而得以实现的。

所谓"版本号"，其实是 InnoDb 维护的一个计数器，每启动一个事务，计数器随着递增，并将该号作为事务的版本号

**[INSERT]**
InnoDb 将系统当前的版本号设为新增行的版本号

**[DELETE]**
InnoDb 将系统当前的版本号设为被删除行的删除号，该行并未立即被物理删除

**[UPDATE]**
INSERT+DELETE

**[SELECT]**

1. 行版本号不大于事务版本号。这确保了该行在事务开始时已存在，或者由当前事务创建、更新
2. 行删除号不存在，或者删除号大于事务版本号。这确保事务开始前行未被删除

对于被标记为删除的行，InnoDb 有专门的线程负责物理删除，当行满足如下条件时认为可以将其物理删除：当前不存在版本号小于该行删除号的事务，这样可以确保不会有事务再引用到该行

保存这些额外记录的好处，是使大多数读操作都不必申请加锁

### 关于 MyISAM

- 表加锁。并发低/开销少
- 将每个表存储成两个文件：数据文件(.MYD)和索引文件(.MYI)
- 使用 CHECK TABLE mytable 和 REPAIR TABLE mytable 来修复表，也可以使用 myisamchk 命令
- 索引长度不能超过 1000(注意，如果是 utf8 的话，长度 x3)，InnoDb 没有此限制
- 可以延迟索引。使用表创建选项 DELAY_KEY_WRITE 创建的 MyISAM 表，在 SQL 结束之后，不会将索引的改变数据写入磁盘，而是在内存的键缓冲区中缓存索引改变数据，只有在清理缓冲区或关闭表时才将索引块转到磁盘。对于数据经常改变，并且频繁使用的表，这种模式大大提高了表的处理性能。不过，如果服务器或系统崩溃，索引将肯定损坏，并需要修复

### 关于 InnoDb

- 行级锁。并发高/开销相对高
- 高性能
- 崩溃后自动恢复
- 主键聚簇索引，辅助索引非聚簇索引(单独索引树)，辅助索引也会包含主键列，所以如果主键列较大，则它的辅助索引也会较大
- 任何改变 InnoDb 表结构的操作会导致整个表的重建，包括重建所有索引
- 外键约束
- 自动提交性能差？
- 可以显示锁定
- 不要对 InnoDb 使用不带 WHERE 语句的 count(\*)，这会导致 InnoDb 执行全表扫描或索引扫描，而 MyISAM 只需要从相关记录中读取该值即可。

### 性能检测

```bash
mysql > SET PROFILING = 1;
mysql > ...
mysql > SHOW PROFILES;

```

会把执行的语句和执行时间都打印出来，如下

```bash
+----------+------------+-----------------------------------+
| Query_ID | Duration   | Query                             |
+----------+------------+-----------------------------------+
|        1 | 0.00011700 | select count(*) from user         |
|        2 | 0.00033500 | select count(*) from user_copy    |
|        3 | 0.59868300 | select count(created) from user   |
|        4 | 0.51746400 | select count(name) from user_copy |
|        5 | 0.00846700 | show table status like 'user'     |
+----------+------------+-----------------------------------+
```

还可以针对某个 query 进行更细致的分析

也可以使用 FLUSH STATUS + SHOW SESSION STATUS

```bash
mysql > SHOW PROFILE FOR QUERY 1;

```

### 查询缓存

MySQL 在第二次执行相同的 SQL 查询语句时，默认会使用查询缓存。加上"SQL_NO_CACHE"不使用查询缓存

```bash
SELECT SQL_NO_CACHE username, ...
```

### 关于 NULL

- 尽量避免 NULL
- MySQL 难以优化引用了可空列的查询，它会使索引，索引统计和值更加复杂
- 即使要在表中存储"没有值"的字段，还是有可能不使用 NULL 的，考虑使用 0 或空字符来代替它。

### 索引

索引是性能问题的首要原因，先搞定索引，再去搞查询优化

#### B-Tree 索引

- 根节点保存了指向子节点的指针，存储引擎根据指针寻找数据
- 当一个数据块不能放下所有索引字段数据时，就会形成树形的根节点或分支节点，所以树的深度和广度是由数据量决定的
- 每个节点包含了下层节点的链接，(没有相邻节点链接，上层链接可有可没有)

假设建立了一个(last_name, first_name, birth)的索引，此索引对于以下类型可用

    匹配全名 (例如可以找到一个叫Cuba Allen，并且出生于1960-01-01的人)
    匹配最左前缀 (例如可以找到姓为Allen的人，仅适用于索引中的第一列)

由于树的节点是排好序的，它们可以用于查找和 ORDER BY 查询

B-Tree 的局限在于如果查询不是从索引列的最左边开始，就无法使用索引。所以索引列的顺序至关重要。

### 高性能索引策略

#### 隔离列

如果在查询中没有隔离索引的列，MySQL 通常不会是使用索引。"隔离"列意味着它不是表达式的一部分，也没有位于函数中。

#### 前缀索引

找到合适的前缀长度(计算全列的选择性，并使前缀的选择性接近于它)

```bash
SELECT COUNT(DISTINCT city)/COUNT(*) FROM city_demo
SELECT COUNT(DISTINCE LEFT(city, 4))/COUNT(*) FROM city_demo
```

也要注意如果数据分布非常不均匀，可能就会有问题

前缀索引能很好的减少索引的大小及提高速度，但 MySQL 不能在 ORDER BY 和 GROUP BY 中使用索引

#### 聚集索引 (InnoDb)

当表有聚集索引时，它的数据行实际保存在索引的叶子页(而不是指针)，所谓"聚集"就是指实际的数据行和相关的键值都保存在一起，每个表只能由一个聚集索引(主索引)，因为不能以此把行保存在两个地方

**优点：**

- 可以把相关数据保存在一起。如果没有使用聚集，读取每个邮件都会访问磁盘
- 数据访问快。聚集索引把索引和数据都保存到了同一棵 B-Tree 中，因此从聚集索引中取得的数据通常比在非聚集索引进行查找要快
- 聚集索引能最大限度地提升 I/O 密集负载的性能。

**缺点：**

- 更新索引列代价是庞大的，因为它强制 InnoDb 把每个更新的行移到新位置
- 辅助索引会比较大，因为它们的叶子包含了被引用行的主键列
- 辅助索引访问需要两次索引查找

#### 覆盖索引

所有满足查询需要的数据的索引(只需要读取索引，不需要再读取行数据)，比如这条 SQL 语句

```bash
SELECT state_id, city, address FROM userinfo WHERE state_id = 5
```

如果只在 state_id 上建索引，则 city,address 都要从表里读取行数据

如果建立 index (state_id, city, address)，既能使用 state_id 索引，同时又可以使用覆盖索引，速度就快多了

#### 多余和重复索引

- MySQL 允许你在统一列上创建多个索引，所以 MySQL 不得不单独维护每一个索引
- 如果列(A,B)上有索引，那么另外一个列(A)上的索引就是多余的(B-Tree)
- 大多数情况下，多余索引都是不好的，为了避免它，应该扩展已有索引，而不是添加新索引
- 索引越多，更新索引的开销越大，尤其是在数据很多的情况下
