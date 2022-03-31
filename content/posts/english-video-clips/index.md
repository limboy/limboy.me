+++
title= "通过视频片段来学习英语"
date = 2022-03-31
description = "视频能加深对单词的理解，同时单词也有助于回顾影片"
[taxonomies]
tags = ["practical", "english", "raycast", "ffmpeg"]
[extra]
+++

「背单词」是件很有挑战的事情，尤其是在出了校园之后，持续下去更是困难。那如何让这个过程多点乐趣呢？然后就想到了视频：如果把包含对应单词的影视片段裁剪出来，通过看视频的方式会不会让「背单词」不那么枯燥？一方面可以对单词的上下文可以有更多的了解，另外也正好可以回顾这些作品。

感觉可行，怎么做呢？其实也简单，从字幕文件入手，字幕包含了单词，也有 Time Offset，拿到这些信息后，找到对应的视频文件，通过 `ffmpeg` 去截取视频片段就行了。

### 第一步：下载影视剧和字幕

这一步主要是体力活，把字幕和视频文件名对应。有个小技巧：通过 `rename` 命令可以根据正则批量重命名文件（需要先通过 `brew` 安装）

```bash
# $n 可以反向引用前面括号里的内容
# -n 选项可以预览重命名后的效果（dry run）

# 「老友记.Friends.s01e07.ass」将会被重命名为「Friends.S01E07.ass」
rename 's/老友记.(Friends.)s([\d]+)e([\d]+)/$1S$2E$3/g' *
```

{% aside(level="info") %}
Mac 也内置了批量重命名文件的功能（选择多个文件 -> 右键 -> 重命名），如果不需要正则替换的话，这个也很方便
{% end %}

### 第二步：写脚本

这个脚本的目标是：

1. 找到包含该单词的视频，并解析出开始时间
2. 通过 `ffmpeg` 截取视频片段

其中 `.ass` 文件每一行的字幕格式如下：

```
Dialogue: 0,0:11:38.57,0:11:39.84,*Default,NTP,0000,0000,0000,,沃尔特  来看看\NCheck it out Walt.
```

所以只要定位到包含该单词的行，然后找到符合特征(`dd:dd:dd.dd`)的字符串即可。这里遇到一个小问题，在打开某些字幕文件时会出现乱码，通过 Hex Editor 看了下长这样：

{{ img(path="/posts/english-video-clips/utf-16.jpg") }}

BOM 头是 `0xFFFE`（小端序），同时还有用来占位的 `00`，是 `utf16le` 编码的文件。所以在判断该用哪种编码打开时要格外注意。

### 第三步：截取视频

这一部分比较简单，一行命令就妥了：

```bash
# -t 表示 duration
ffmpeg -ss 01:19:27 -i input.mp4 -t 00:00:30 -c copy output.mp4
```

最终效果大概这样：
{{ video(src="https://assets.limboy.me/file/limboy-personal/stage0-demo.mov")}}

看起来可行，但还挺不方便的，总不能每次要生成视频都要打开终端吧，要找到生成的视频并浏览也不够便捷，如果还要加上「生词本」的功能，同时查看该单词的具体解释又该怎么办呢？难道要写一个桌面端应用 🤔

我甚至想到用 [Next.js](https://nextjs.org/) 来开发一个本地 web 服务了，感觉还是太麻烦。那有没有能实现这些功能、足够好用，同时开发成本也低的解决方案呢？这时我想到了 [Raycast](https://www.raycast.com/) 这个平时一直在用的 Launcher。

浏览了下文档后，发现可以很好地满足需求。

### 第四步：接入 Raycast（生成单词视频）

简单介绍下 Raycast，它是一个 Mac 下的启动器，跟 [Alfred](https://www.alfredapp.com/) 类似，但 UI 和 UE 比 Alfred 更好，还免费，支持的 Extension 也不少。

{{ img(path="/posts/english-video-clips/raycast.jpg") }}

这里我们会用到一个脚本用来生成单词视频，一个 Extension 用来浏览单词对应的视频和解释，同时支持添加到单词本（Add to New）。

创建脚本的过程很简单，启动 Raycast 后，输入 `Create Script Command`，输入必要的信息，就会生成一个 `.sh` 结尾的文件（需要先在 Setting 的 Extension 页，`Add Script Directory`），把生成视频的脚本复制上去就行了。效果如下：

{{ video(src="https://assets.limboy.me/file/limboy-personal/raycast-cli.mov")}}

### 第五步：接入 Raycast（浏览单词）

Raycast 提供了方便的 [API](https://developers.raycast.com/)（React）来搭建界面和交互。得益于良好的设计，这些 API 使用起来非常舒服和直观。同时因为是运行在 Node 环境，所以可以访问本地文件、执行脚本等。

{% aside(level="info") %}
下次如果有涉及跟本地交互的需求，可能会优先考虑 Raycast，不合适的话再考虑本地运行 Next.js 服务。
{% end %}

最终的效果如下：

{{ video(src="https://assets.limboy.me/file/limboy-personal/raycast-english-clips.mov")}}

代码也不过百来行：

```ts
import { ActionPanel, List, Action, Icon } from '@raycast/api';
import fs from 'fs';
import { execSync } from 'child_process';
import { useState } from 'react';

const allWordsDir = '/Users/limboy/Dropbox/Videos/Snippets/';
const newWordsDir = '/Users/limboy/Dropbox/English/Snippets/Memorizing/';

const allWords = () => {
  return fs.readdirSync(allWordsDir).filter((item) => item[0] !== '.');
};

const newWords = () => {
  return fs.readdirSync(newWordsDir).filter((item) => item[0] !== '.');
};

const allSnippets = (word: string) => {
  const dir = allWordsDir + '/' + word;
  return fs.readdirSync(dir);
};

const toggleNew = (word: string, toNew: boolean) => {
  if (toNew) {
    execSync(`ln -s ${allWordsDir}${word} ${newWordsDir}`);
  } else {
    execSync(`rm ${newWordsDir}${word}`);
  }
};

export default function Command() {
  return (
    <List>
      <List.Item
        title="All Words"
        icon={Icon.Text}
        actions={
          <ActionPanel>
            <Action.Push
              title="All Words"
              target={<WordsList isAll={true} />}
            />
          </ActionPanel>
        }
      />
      <List.Item
        title="New Words"
        icon={Icon.Star}
        actions={
          <ActionPanel>
            <Action.Push
              title="All Words"
              target={<WordsList isAll={false} />}
            />
          </ActionPanel>
        }
      />
    </List>
  );
}

function WordsList({ isAll }: { isAll: boolean }) {
  const wordsFunction = isAll ? allWords : newWords;
  const [words, setWords] = useState(wordsFunction());
  return (
    <List>
      {words.map((word, i) => {
        const dictPath = 'dict://' + word;
        return (
          <List.Item
            key={i}
            icon="list-icon.png"
            title={word}
            actions={
              <ActionPanel>
                <Action.Push
                  icon={Icon.Video}
                  title="Show Video Snippets"
                  target={<Snippets word={word} />}
                />
                <Action.Open title="Show in Dict" target={dictPath} />
                <Action
                  icon={Icon.Circle}
                  title={isAll ? 'Add to New' : 'Remove from New'}
                  onAction={() => {
                    toggleNew(word, isAll);
                    setWords(wordsFunction());
                  }}
                />
              </ActionPanel>
            }
          />
        );
      })}
    </List>
  );
}

function Snippets({ word }: { word: string }) {
  return (
    <List>
      {allSnippets(word).map((snippet, i) => {
        const videoPath = allWordsDir + '/' + word + '/' + snippet;
        return (
          <List.Item
            icon={Icon.Video}
            key={i}
            title={snippet}
            actions={
              <ActionPanel>
                <Action.Open target={videoPath} title="Open Video" />
              </ActionPanel>
            }
          />
        );
      })}
    </List>
  );
}
```

通过这种方式，不仅让影视文件可以被再次唤醒，同时也有助于单词的记忆，还挺方便的。接下来就看能背多少个单词了。
