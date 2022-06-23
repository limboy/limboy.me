+++
title= "通过 VisiData 来方便地分析数据"
date = 2022-06-23
[taxonomies]
tags = ["util"]
[extra]
+++

在 Hacker News 上看到一篇 [通过 SQLite 来方便地操作 CSV](https://news.ycombinator.com/item?id=31824030) 的文章，利用 sqlite3 对 csv 原生支持的能力，对 csv 执行 SQL 查询，来获得自己想要的数据。试了下确实挺方便的：

{{img(path="/posts/visidata/sqlite-one-liner.jpg")}}

{% aside(level="info") %}
`tweets.csv` 是从 Twitter 导出的个人数据。可以在 Twitter 的 Settings and privacy 中找到 download an archive of your data 的选项，点击后过一段时间就能收到自己的数据了
{% end %}

保存为一个 bash function 后，就更方便了：

```bash
csv2sqlite() {
  sqlite3 :memory: -cmd '.mode csv' -cmd ".import $1.csv $1" -cmd '.mode column' $2
}

# usage
csv2sqlite tweets 'select * from tweets limit 1'
```

顺便看了下 HN 上的评论，发现有不少人提到了 [VisiData](https://www.visidata.org) 这个工具，就体验了下，确实很不错，能满足常见的数据查询工作，还不用写 SQL。下面就通过 `tweets.csv` 这个文件，结合具体的场景来看看 VisiData 的使用姿势。

{% aside(level="info") %}
VisiData 是一个表格类数据（如 json, csv）分析工具，既支持类似 Excel 的数据显示，又有终端操作的高效，能够处理百万行的数据。

[这个快捷键列表](https://jsvine.github.io/visidata-cheat-sheet/en/)很方便，基本可以覆盖常用的操作了。
{% end %}

## 每年发了多少 Tweet

VisiData 安装完后，直接 `vd tweets.csv` 就可以了，界面如下：

{{img(path="/posts/visidata/visidata-overview.jpg")}}

其中有一列为 `timestamp`，包含了 `date` 和 `time`，我们需要将 `Year` 分离出来，然后才能进行聚合操作。分离的过程也很简单，先选中 `timestamp` 这一列，输入快捷键 `:` 就会进入到正则切分模式，输入空格 ` `，就可以将 `date` 和 `time` 分开了，然后再对 `date` 列执行同样的操作，不过要用 `-` 来切分，这样就能得到 `Year` 了。

{{img(path="/posts/visidata/visidata-year.jpg")}}

{% aside(level="info") %}
列名为自动生成，这里没有调整，可以通过 `^` 快捷键重命名。
{% end %}

接下来，在 `Year` 对应的列，按一下 `F` (`shift+f`)，就能达到 `group by` 的效果，这个真的太方便了。

{{img(path="/posts/visidata/visidata-year-count.jpg")}}

{% aside(level="info") %}
VisiData 会新建一个 Table，所以不用担心会覆盖当前的表格，操作完后，输入 `q` 就能回到之前的表格。
{% end %}

可以看到我最爱唠叨的年份是 2008 和 2010 年，那时 Twitter 还能正常访问，有点什么想法就想发一下，也能在 Twitter 上找到很多有意思的人。

也可以通过这个方法看发推频率最高的是那几天：

{{img(path="/posts/visidata/visidata-tweets-per-day.jpg")}}

或者看自己 `@` 频率最高的是哪些人：（这里显示的是 user_id，可以通过 user_id 转 username 的服务来看对应的人）

{{img(path="/posts/visidata/visidata-reply.jpg")}}

## 某一天发了哪些推

找到了发推最多的日子后，接下来很自然就想看看这几天自己都发了些啥，比如我想看 `2008-01-16` 这一天的推，先选择日期列，然后输入快捷键 `|`，表示要选择符合正则表达式的行，此时 status bar 会提示输入正则，输入 `2008-01-16` 后回车，就能选中这些行了。

{% aside(level="info") %}
虽然状态栏会提示有 N 行被选中，但并没有出现在当前显示的列表中，输入快捷键 `"` 就能看到了。
{% end %}

如果 `text` 列的内容没有完全显示出来，可以选中 `text` 列，输入快捷键 `_` 就行了。

{{img(path="/posts/visidata/visidata-day-tweets.jpg")}}

## 图形化显示每个月的发推数量

VisiData 还支持散点图，我们可以通过这个功能来看每个月的发推数量，不过显示的效果不太好。

{{img(path="/posts/visidata/visidata-plot.jpg")}}

好在 VisiData 可以将当前 Table 的内容导出为 `csv`, `json` 等常用格式，我们可以将这些数据导入到其他的 plot 服务来获得更好的显示效果。

{{img(path="/posts/visidata/plot.jpg")}}

{% aside(level="info") %}
上图使用的是 [csvplot](https://www.csvplot.com) 这个在线服务。
{% end %}

## 小结

VisiData 是一个开源项目，有 5 年多的历史了，还在持续维护着，可信任程度还是比较高的。以上是我的简单探索，已经可以满足不少需求了。一开始我对 TUI (Terminal UI) 是有点抗拒的，感觉不如 GUI 美观，但结合 Terminal 的操作确实太方便了，之后如果有不太复杂的数据分析需求，应该还会选择 VisiData。
