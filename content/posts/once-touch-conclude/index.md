+++
title= "开发Once Touch的一些感想和经验小结"
date = 2012-11-24
description = ""
[taxonomies]
tags = ["project", "review"]
[extra]
giscus = "telescope"
+++

Once Touch 是我开发的第一款 iOS 应用，这也延续了我每换一家公司就换一门语言的「优良」传统：ActionScript(时光网)->PHP(凤凰网)->Python(知乎)->Objective-C(Legend33)。希望这次是最后的转型。

简单说说为什么选择 iOS 平台。主要有以下几个原因：

### 用户基数

iPhone 和 iPad 的总销量都是上亿的规模，所以不用担心会是个小众平台，但你会说 Android 的占有量比 iOS 要高得多，这就引出下一个原因：消费体验和消费习惯

### 消费体验

关联信用卡，点击两下按钮，输入密码就能完成了一次购买，简单几步，钱就流到了你的卡里，只要你的 app 足够优秀，足够吸引人。当然了，还要交给老大 30%的地摊费。

### 消费习惯

虽然在国内越狱的 iPhone 还是呈现一统江湖状，但还是有那么一部分人愿意为优秀的 app 买单，而且随着支持国内的银行卡、系统升级、Gift Card 等原因，会有越来越多的人加入支付队伍。如果把眼光放在全球，就更不用纠结国内的悲惨现状。

### 产品品质

尽管随着乔老爷的离去，苹果的产品开始被更多的人所诟病（当然我也在其中），但不可否认，它依旧是最好的产品，至少在我看来如此。给她一点时间去适应，去试错、去磨合，去找到自己的节奏，相信在 Android 的鞭策下，她还会带给我们更多的惊喜。

### 开发体验

第一次打开 Xcode 时，就喜欢上了这个界面，心想，以后如果能用它开发 app 会是件多么愉快的事情啊。Objective-C 虽然需要花点时间去适应它那有点别扭的语法，但过了适应期后，这种障碍就不存在了。Xcode 虽然偶尔会崩溃、出现莫名的错误、查文档很慢，基本上还是很称职的，在 2010 Air 上能有这样的表现我已经很满足了。

### 进入门槛

相比 web 开发，iOS 的进入门槛明显要高不少：中文资料偏少、需要一套苹果的开发设备、有一定的编程经验。所以搞 iOS 开发的不少都是从其他语言转过来的。如果一项技能不好学，但学会了又很有用，你愿不愿意花时间去攻克它？

---

我的 iOS 学习之路，主要是这几个工具：[Programming in Objective-C](http://www.amazon.com/Programming-Objective-C-Edition-Developers-Library/dp/0321811909)、[Stanford iPad and iPhone Application Development](https://itunes.apple.com/itunes-u/ipad-iphone-application-development/id473757255?mt=10)、[StackOverflow](http://www.stackoverflow.com)。接下来就是不断地练习了。Once Touch 的开发用到了 Cocos2d 框架，所以还看了[learn cocos2d game development with ios 5](http://www.amazon.com/Learn-cocos2d-Game-Development-Apress/dp/1430238135/)这本书，了解基本的概念和使用。

开发 Once Touch 第一版的时候，架构想得不多，主要是以实现为主。但是跟所有项目一样，唯一不变的就是变化。在那个体系下要增加点变化会比较麻烦，常常是牵一发而动全身。即使这样，只要时间足够，这些变化还是可以被搞定的，所以国内的互联网公司常常需要很多人，因为低质量的代码需要更多的人去维护，而且周期也会变长，自然也就不敏捷了。

后来要开发 universal 版了，iPad、iPhone5 自然也都要支持，如果再在现有的代码上进行调整，我觉得对自己太残忍，以后也不好意思开源，索性就重新再写一遍吧。

这次重写的指导方针就是模块化编程，也就是多用组合，少用继承。比如 Once Touch 里的小球，可以移动、缩放，就可以把移动和缩放单独提出来作为两个模块，小球再通过 addChild 的方式把这两个模块添加进来，这样小球就可以移动和缩放了。

### 为什么要多用组合，少用继承

先来看两张图片，第一张是国际空间站

{{img(path="/posts/once-touch-conclude/space-station.jpg")}}

再来看看拆解图

{{img(path="/posts/once-touch-conclude/space-station-parts.jpg")}}

看出模块的好处了吧，只要接口是对的，且功能也正常，这个模块是非洲产的，还是美国造的，都不 care。也就是说空间站完全不关心每个模块的内部实现。每个模块只要完成自己的功能就行了，出了问题，也只需要调整某一个模块，而不用担心会引发其他模块功能的异常。这其实就是 OO 设计里的 SOLID 原则。

### Xcode 的文件管理

之前的习惯是把文件都交给 Xcode 来管理，在 Xcode 里新建 Group，因为 Xcode 并不会在新建 Group 时在文件系统也新建文件夹，所以在 Project 在 Xcode 看起来挺整洁，到了文件系统就又是另一回事了。那能不能两全其美呢，当然是可以的，稍微改变下流程就行。不要在 Xcode 里新建 Group，先在文件系统中建立好文件夹，然后把文件夹拖到 Xcode 的目录中就可以了，以后在该 Group 下新建的文件都会出现在文件系统中对应的文件夹内。

{{img(path="/posts/once-touch-conclude/xcode-finder.png")}}

### 目录结构

从上面的图中可以看到我的目录结果，简单说明一下：

#### Utils

这里放一些与应用无关的帮助类文件，如 Global.h / Helper.h / Macro.h 等等。

#### Components

这是重头戏，所有的模块都会被放到这里。

#### Vendors

这里放一些第三方的类库，如 MagicalRecord / CCUIViewWrapper 等等。

#### Models

与数据打交道的 Model 都会放到这里

#### Config

应用的默认设置，主要是一个 plist 文件

#### Textures

这是一个比较特殊的文件夹，不是 Group，而是 Folder，也就是走的文件系统。这么做的原因是，把 iPad 和 iPhone 需要用到的资源分开存储（分别放到 iPad 和 iPhone 文件夹里），按需载入。

### 模块的粒度

以这个画面为例

{{img(path="/posts/once-touch-conclude/once-touch-popup.jpg")}}

应该把星星作为一个模块，还是把 3 个星星作为一个模块？分数有没有必要作为一个模块？左边黄色的那个圈呢？

如果模块的粒度划分过细，那么组装的过程就会很痛苦。想像一下某个 MM 拎着一堆电脑零件来找你组装台电脑，你信心满满地告诉她：几分钟搞定。等你打开箱子后发现，风扇、硬盘神马的都是以最小单位存在，还得先把这些附件先组装起来，看你崩不崩溃。

如果粒度划分过粗，就失去了模块的意义，基本上也无法复用了。一辆雪佛莱，如果说还能作为某个更大实体的零部件的话，估计也就只有擎天柱了。

所以恰当的粒度划分才会带来生产力的提升。还是以上面这张图为例，星星、钻石、分数和左边的圆，如果其他地方很少会单独使用到这些实体，就可以整体作为一个模块。当然如果将来其他模块会用到其中的某一部分，就需要重新拆分了。

### 模块与母体之间的通信

首先，模块之间是互盲的，A 模块不需要知道 B 模块的存在，更不能依赖 B 模块，这样才能解耦(话虽如此，实际上经常会自然不自然地与某个模块发生耦合)。模块只需要提供接口供母体使用就行了。当然在特定事件发生时，还需要通知母体，这就需要用到 delegate。有 delegate，自然也少不了 protocol。以小球为例，小球本身是一个模块，该模块又有移动和缩放两个子模块。

#### MovementComponent

```m
@interface MovementComponent : BaseComponent {
	float _radian; // 小球的半径
	float _delay; // 小球是否需要延迟运动
	BOOL _isOutSide; // 小球是否在外面，Challenge/Endless模式会用到
}

@property (nonatomic) float speed; // 小球的移动速度
@property float delay; // 延迟时间
@property (nonatomic) BOOL isOutSide; // 是否在外面

- (void)move; // 开始运动
- (void)stopMove; // 停止运动
```

#### ZoomComponent

```m
@class ZoomComponent;

@protocol ZoomComponentProtocol <NSObject>

// 当小球是最后一个球时，也就是得到perfect后，会有一个覆盖全屏的缩放
// 等到缩放完成后需要通知delegate
- (void)zoomComponentDidGiantZoomOut:(ZoomComponent *)zoomComponent;

@optional
// 小球从最大缩放到最小后，需要通知delegate
- (void)zoomComponentDidZoomOut:(ZoomComponent *)zoomComponent;

@end

@interface ZoomComponent : BaseComponent {
	BOOL _pauseZoomOut; // 在Endless模式，最后一个球是不消失的，所以需要停止缩小
}

- (void)reInit; // 重新初始化，对已有小球的重复利用，用于Challenge/Endless模式
- (void)zoomIn; // 放大
- (void)pauseZoomOut; // 停止缩小
- (void)resumeZoomOut; // 可以缩小
- (void)giantZoomIn; // 全屏放大

@property (nonatomic) BOOL isSmall; // 当前是否为小球状态
@property (nonatomic) BOOL isBig; // 当前是否为大球状态
@property (nonatomic) BOOL isZoomIn; // 是否开始放大
@property (nonatomic) BOOL isZoomOut; // 是否开始缩小
@property (nonatomic) BOOL finishedZoom; // 是否已经完成了缩放整个流程
@property (nonatomic) float zoomDuration; // 放大的时间
@property (nonatomic) float bigDuration; // 大球状态停留的时间
@property (nonatomic) float bigScale; // 放大到多少倍
@property (nonatomic, weak) id<ZoomComponentProtocol> delegate; // 母体
@end
```

ZoomComponent 里有一个 protocol 和一个 delegate，如果某个 object 想要添加 ZoomComponent，则必须实现 ZoomComponentProtocol 协议，并且把自己设置为 ZoomComponent 的 delegate，这样在相应的事件发生时，会自动触发协议里的几个方法。因为是小球添加了 MovementComponent 和 ZoomComponent，所以 BallComponent 需要实现 ZoomComponentProtocol

#### BallComponent

```m
#import "ZoomComponent.h"

@interface BallComponent : BaseComponent<ZoomComponentProtocal>{
	int _index;
	BOOL _isMasterBall;
	ZoomComponent *_zoomComponent;
	MovementComponent *_movementComponent;
	CCSprite *_ballSprite;
}
```

这里又有问题了，Layer 添加了 BallComponent 后，需要调用 Ball 的一些方法和属性，如 isBig / move 等等，对于 Ball 来说，其实就是调用 Zoom 和 Movement 对应的方法，如 ballComponent.isBig 其实就是 zoomComponent.isBig。那能不能对外暴露 zoomComponent 和 movementComponent 呢，如 ball.zoomComponent.isBig 或 [ball.movementComponent move]。这样不好，前面说过了，调用方不应该知道模块的内部实现，因为模块的内部是有可能变动的。所以，就只能进行二次封装，类似下面：

```m
- (void)setBigDuration:(float)bigDuration
{
	_zoomComponent.bigDuration = bigDuration;
}

- (void)setBigScale:(float)bigScale
{
	_zoomComponent.bigScale = bigScale;
}

- (void)setSpeed:(float)speed
{
	_movementComponent.speed = speed;
}

- (void)setDelay:(float)delay
{
	_movementComponent.delay = delay;
}
```

初看起来会觉得挺累赘，但是从长远考虑这么做是值得的。显性好于隐性，这样能一下知道 ball 模块对外暴露了哪些方法。

添加模块和设置 delegate 的过程大体如下：

```m
_zoomComponent = [ZoomComponent node];
_zoomComponent.bigDuration = bigDuration;
_zoomComponent.bigScale = bigScale;
_zoomComponent.delegate = self;
[self addChild:_zoomComponent];
```

### 小结

使用继承会使架构变得复杂，为了保证每个类都只有自己需要的方法，需要很小心地定义 public / protected / private 方法，尤其是对父类地改动更需小心，这种架构很难应对多变的环境。

使用组合可以让每一个模块专注于自己地功能，按需使用，模块的调整只要不影响接口，爱怎么折腾就怎么折腾，提升了自由度。

不过组合也是有副作用的，尤其是涉及到子模块，比如上面的 BallComponent，需要重新定义一遍接口，而继承的话就没有这个问题。有一些公共的属性和方法也可以通过继承来实现，比如所有的 Component 都继承自 BaseComponent。

所以尽量多用组合，少用继承。

一些我觉得还不错的资源：

- [Scalable JavaScript Application Architecture](http://www.slideshare.net/nzakas/scalable-javascript-application-architecture)
- [Prefer composition over inheritance?](http://stackoverflow.com/questions/49002/prefer-composition-over-inheritance)
- [Where does this concept of “favor composition over inheritance” come from?](http://programmers.stackexchange.com/q/65179)
