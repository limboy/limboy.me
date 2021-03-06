+++
title= "看了Solar框架的几点感触"
date = 2010-12-09
description = ""
[taxonomies]
tags = ["programming", "essay"]
[extra]
giscus = "telescope"
+++

<a href="http://solarphp.com/">Solar 框架</a>，大家可能不是很熟悉，我也是看了这篇文章:<a href="http://paul-m-jones.com/archives/1113">The Future of Zend Framework is Solar</a>后，眼前一亮，就花了点时间了解了一下。标题很吸引眼球，不过确实也把 Solar 的一些特性通过对比的方式很好地展现出来了，下面是我总结的几点。

### 全局构建方法

很多框架都没有做到这点，或者说没有意识到这点，要实例化一个类时，可以 new，可以 getInstance()，可以 factory，参数的传递也没有统一的规范。Solar 这点做得很好

```php
<?php
class Solar_Example extends Solar_Base {
    // note that the config property is named for the class
    // with an underscore prefix.  this lets us collect the
    // parent config defaults as well.
    protected $_Solar_Example = array(
        'a' => null,
        'b' => null,
        'c' => null,
    );
}

$config = array(
    'a' => 'one',
    'b' => 'two',
    'c' => 'three'
);

$example = Solar::factory('Solar_Example', $config);
```

可以看到 Solar 在实例化一个类时是通过一个全局的 factory 方法来实现的，同时参数的传递也很讲究，只能传递一个 config 数组，当然这个 config 可以从配置中读取。

### 统一的 config 调用

Solar 在运行时只调用一个 config 文件，这个跟 yii 有点类似，Kohana 则是把配置文件打得很散。这样做的好处是可以避免在运行时多次读取配置文件，影响效率，而且配置文件一多的话也容易乱。

Solar 的 config 配置里有几项是特殊项，如 ini_set,registry_set。还有一个很重要的特性是将类名作为 key，然后将该类的属性作为值，运行时这些值将自动覆盖类的默认值。

```php
<?php
/**
 * ini_set values
 */
$config['Solar']['ini_set'] = array(
    'error_reporting'   => (E_ALL | E_STRICT),
    'display_errors'    => true,
    'html_errors'       => true,
    'session.save_path' => "$system/tmp/session/",
    'date.timezone'     => 'UTC',
);

/**
 * auto-register some default objects for common use. note that these are
 * lazy-loaded and only get created when called for the first time.
 */
$config['Solar']['registry_set'] = array(
    'sql'              => 'Solar_Sql',
    'user'             => 'Solar_User',
    'model_catalog'    => 'Solar_Sql_Model_Catalog',
    'mail_transport'   => 'Solar_Mail_Transport',
    'controller_front' => 'Solar_Controller_Front',
);

/**
 * sql adapter to use
 */
$config['Solar_Sql'] = array(
    'adapter' => 'Solar_Sql_Adapter_Sqlite',
);

/**
 * front controller
 */
$config['Solar_Controller_Front'] = array(
    'classes' => array('Solar_App'),
    'disable'  => array('base'),
    'default' => 'hello',
    'routing' => array(),
);
```

有一点我觉得 Solar 做得不太好，就是把类的属性的默认值放在了类里，而不是配置文件里。将来如果因为某个属性导致系统出问题，调试起来将会很困难。

### 全局注册器(消灭单例)

通过全局注册器就可以在整个应用程序中共享内容，这个内容可以是字符串/数组/对象等等。

```php
<?php
// script 1
$obj = Solar::factory('Solar_Example');
Solar_Registry::set('example', $obj);

// script 2
$obj = Solar_Registry::get('example');
?>
```

这个就是最简单的存取，也可以设置为 lazy-loading，就是不直接存对象，而是类名和 config，这样只有到真正需要时才实例化。

```php
<?php
$config = array(...);
Solar_Registry::set('example', 'Solar_Example', $config);
```

通过这种方法，其实就实现了单例。现在很多框架都在大力打压单例，Zend Framework 更是在 2.0 的 roadmap 里提出要尽可能地消灭单例，不在类的内部实现单例方法，因为这样的话子类就很难扩展，尤其是在单例里又加入了一些特有的逻辑。

### 异常机制

Solar 的异常机制也有自己的特点，做得很细致。自带了 16 个常用异常，如 DirNotFound/FileNotReadable 等等，不过感觉这块有点过设计了。

```php
<?php
$class = 'My_Example_Class'; //出错的类名
$code = 'ERR_SOMETHING_WRONG'; //Exception类
$text = 'Something is wrong.'; //出错信息
$info = array('foo' => 'bar'); //附加信息
$exception = Solar::exception($class, $code, $text, $info);
throw $exception;
```

### 依赖注入

所谓依赖注入(dependency injection)，就是某客户类只依赖于服务类的一个接口，而不依赖于具体服务类，所以客户类只定义一个注入点。在程序运行过程中，客户类不直接实例化具体服务类实例，而是客户类的运行上下文环境或专门组件负责实例化服务类，然后将其注入到客户类中，保证客户类的正常运行。

Solar 一般是把要注入的类定义在 config 里，比如 Auth 类要用到 Cache，但不确定具体使用时会用到哪个 Cache，此时可以通过配置 config 文件来实现

```php
<?php
$config['Solar_Auth_Adapter'] = array(
	'cache' => array(
		'adapter' => 'Solar_Cache_Adapter_Memcache',
	),
);

$config['Solar_Cache_Adapter_Memcache'] = array(
        'host' => 'localhost',
        'port' => 11211,
        'timeout' => 1,
);
```

这样 Auth 类就会使用 Memcache 作为缓存引擎。可以在类内部定义多个注入点，这样就可以使用不同的类来完成同样的目的，只要该类有特定的方法。Zend Framework 在 2.0 的 roadmap 中也提到"All components **MUST** allow for dependency injection"。

依赖注入可以让模块之间更加松耦合，比如之前用的是 XCache 缓存殷勤，后来由于业务变动要使用 Memcache 引擎，这时只需在配置文件里修改一下缓存类型就行了，多省事啊。

我们学习各种设计模式，最终都是为了一个目的：应对变化。而依赖注入可以让我们更加从容地应对变化。

### 适配器

使用适配器是依赖注入的基础，适配器其实就是一个抽象基类，所有的子类都必须继承该抽象基类。这样才能保证在使用依赖注入时，一定存在某个特定方法。比如上面说到的 Auth 引用缓存问题，因为所有的缓存都是继承 Solar_Cache_Adapter 而来，所以一定会有 save 方法，Auth 在调用缓存时就可以放心地 save 了。

Solar 内部使用了大量的 Adapter，目的就是为了方便依赖注入。可能系统提供的几个类都不适合具体应用，这时只要继承 Adapter，自己写一个类，然后加到配置文件里就行了。

### 总结

Solar 框架还是值得看一看的，即使不打算拿他来做应用。也可以关注一下 Zend Framework 2.0，如果真的实现了<a href="http://framework.zend.com/wiki/display/ZFDEV2/Zend+Framework+2.0+Requirements">roadmap</a>里所说的种种，相信一定会给其他的 php 框架带来巨大的冲击。
