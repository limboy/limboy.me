+++
title= "嵌套评论的一个数据库设计技巧"
date = 2010-08-27
description = ""
[taxonomies]
tags = ["programming"]
[extra]
giscus = "telescope"
+++

前些日子看 drupal 源码时学到的。要实现嵌套评论，只要在表里加一个 parent_id 字段即可，添加评论的时候很方便，不过显示起来就会慢/麻烦一点。其实只要在表里再添加一个字段，就可以高效/快速的显示评论了，这个字段就是 thread。看一下 SQL 构造语句

```sql
CREATE TABLE IF NOT EXISTS `comments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `parent_id` int(11) NOT NULL,
  `topic_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `username` varchar(64) NOT NULL,
  `created` int(11) NOT NULL,
  `changed` int(11) NOT NULL,
  `status` int(11) NOT NULL,
  `content` text NOT NULL,
  `thread` varchar(30) NOT NULL,
  PRIMARY KEY (`id`),
) ENGINE=MyISAM  DEFAULT CHARSET=utf8;
```

thread 类似这样

```
//存储在thread字段中的数据类似下面
1/
1.1/
1.2/
1.a/
2/
```

加上"/"是因为"/"的 ascii 值小于任何数字，但大于"."，这样如果把主回复按时间倒序排序的话，直接

```sql
SELECT * FROM `comments` WHERE topic_id = 1 ORDER BY thread DESC
```

如果把主回复按时间正序排序(从小到大)的话，就有问题了，因为"1/" > "1.1/"，结果就是"1.1/"在"1/"前面，这当然是不合理的，只要把最后的"/"去掉就行了，这样"1"就小于"1.1"

```sql
SELECT * FROM `comments` as c WHERE topic_id = 1 ORDER BY SUBSTRING(c.thread, 1, (LENGTH(c.thread) - 1)) ASC
```

显示时，可以根据 thread 里"."的数量处理缩进(回复的回复)

如果你还有更好的方法，欢迎交流
