+++
title= "iOS项目的目录结构和开发流程"
date = 2013-09-23
description = ""
[taxonomies]
tags = ["programming", "iOS"]
[extra]
giscus = "telescope"
+++

网上相关的资源不多，开源的且质量还不错的 iOS 项目也是少之又少，最近正好跟同事合作了一个 iOS 项目，来说说自己的一些想法。

## 目录结构

```
AppDelegate
Models
Macro
General
Helpers
Vendors
Sections
Resources
```

一个合理的目录结构首先应该是清晰的，让人一眼看上去就能大概了解目录的职责，且容易应对新的变化。

### AppDelegate

这个目录下放的是 AppDelegate.h(.m)文件，是整个应用的入口文件，所以单独拿出来。

### Models

这个目录下放一些与数据相关的 Model 文件，里面大概是这样：

```
Models
	|- BaseModel.h
	|- BaseModel.m
	|- CollectionModel.h
	|- CollectionModel.m
	...
```

### Macro

这个目录下放了整个应用会用到的宏定义，里面大概是这样：

```
Macro
	|- AppMacro.h
	|- NotificationMacro.h
	|- VendorMacro.h
	|- UtilsMacro.h
	...
```

#### AppMacro.h 里放 app 相关的宏定义，如:

```c
// 表情相关
#define EMOTION_CACHE_PATH @"cachedemotions"
#define EMOTION_RECENT_USED @"recentusedemotions"
#define EMOTION_CATEGORIES @"categoryemotions"
#define EMOTION_TOPICS @"emotiontopics"

// 收藏相关
#define COLLECT_CACHE_PATH @"collected"

// 配图相关
#define WATERFALL_ITEM_HEIGHT_MAX 300
#define WATERFALL_ITEM_WIDTH 146
```

#### NotificationMacro.h 里放的是通知相关的宏定义。

#### UtilsMacro.h 里放的是一些方便使用的宏定义，如：

```c
#define UIColorFromRGB(r,g,b) [UIColor \
colorWithRed:r/255.0 \
green:g/255.0 \
blue:b/255.0 alpha:1]

#define NSStringFromInt(intValue) [NSString stringWithFormat:@"%d",intValue]
{{< / highlight >}}

#### VendorMacro.h 里放一些第三方常量，如：

{{< highlight objc >}}
#define UMENG_KEY @"xxxxx"
#define UMENG_CHANNEL_ID @"xxx"
```

如果有新的类型的宏定义，可以再新建一个相关的 Macro.h。

### General

这个目录放会被重用的 Views/Classes 和 Categories。里面大概是这样：

```
General
	|- Views
		|- TPKScollView
		|- TPKPullToRefresh
		...
	|- Classes
		|- TPKBaseViewController
		|- TPKHorizontalView
		...
	| - Categories
		|- UIViewController+Sizzle
		|- UIImageView+Downloader
		...
```

这里的`TPK`是项目的首字母缩写。

### Helpers

这个目录放一些助手类，文件名与功能挂钩。里面大概是这样：

```
Helpers
	|- TPKShareHelper
	|- TPDBHelper
	|- TPKEmotionHelper
	...
```

助手类的主要作用是帮助 Controller 瘦身，也可以提供一定程度的复用。

### Vendors

这个目录放第三方的类库/SDK，如 UMeng、WeiboSDK、WeixinSDK 等等。

### Sections

这个目录下面的文件对应的是 app 的具体单元，如导航、瀑布流等等。里面大概是这样：

```
Sections
	|- Menu
	|- Setting
	|- Collection
	...
```

### Resources

这个目录下放的是 app 会用到的一些资源，主要是图片。

## Cocoapods

业务无关的类库可以通过 Cocoapods 来方便地管理，如`SDWebImage`, `Reachability`等等。还有一些是多个应用都会用到的基础模块，比如 HBAPI、HBSNS 、HBFoundation（HB 为公司名首字母）等等，可以建一个私有的 git repo，然后加到 podfile 中，这样如果 HBAPI 有更新，只需要`pod update`一下就行了。

顺便说一下`HBFoundation`，这个 git 仓库中可以放一些自己写的所有应用基本上都会用到的小模块。如很多 app 都会有隔一段时间跳出一个求好评的 alertView，就可以写一个`HBRating`类，这样需要使用该功能的 app 只需加上一句：`[HBRating checkIfShouldPopupWithAppID:(NSInteger)appID]`就行了。又比如 app 都有接受 push notification 的需求，可以写一个`HBAPNS`类，等等。

## 开发流程

在拿到设计图后，就可以针对设计图抽离出可复用的 Classes/Views/Helpers，考虑一下某个效果的具体实现，使用合适的设计模式来避免大量的 if/else 嵌套，等等。不要一下子就钻到 Sections 中去实现页面效果和功能，初看起来可能会快一点，但只要有点复杂度的项目，这种做法到后来只会吃尽苦头，代码会变的越来越难维护。所以前期一定要做好充足的准备工作。

经验有限，如果你有更好的想法，欢迎交流：）
