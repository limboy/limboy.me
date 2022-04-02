+++
title= "说说iOS的多线程Core Data"
date = 2013-06-16
description = ""
[taxonomies]
tags = ["programming", "iOS"]
[extra]
giscus = "telescope"
+++

Core Data 是 iOS 中很重要的一个部分，可以理解为基于 SQLite(当然也可以是其他的 Storage，如 In-memory，只是 SQLite 比较常见)的一个 ORM 实现，所以有关系数据库的特性，又不用写 SQL。顺便吐一下槽，官方说法是使用 Core Data 能减少 50%-70%的代码量，但相信用过的人应该都心里明白，Core Data 使用起来还是比较麻烦的，这也是为什么有不少的第三方类库来代替/二次包装 Core Data。

稍微复杂的应用就有可能出现同时处理多份数据的情况，这就需要用到多线程 Core Data。在 iOS 5 之前，官方推荐的是使用「Thread Confinement」，就是每个线程使用独立的 MOC(managed object context)，然后共享一个 PSC(persistent store coordinator)。同时在线程之间传递数据时，要传递 objectID，而不是 object，因为前者是线程安全的，后者不是。

如果 A 线程里，对 PSC 执行了 CUD(create, update, delete)操作，其他线程如何感知呢？这就需要通过监听事件来实现。比如在线程 A 中监听「NSManagedObjectContextDidSaveNotification」事件，如果线程 B 中执行了 CUD 操作，线程 A 就能感知到，并触发响应的 action，虽然可以通过 noti userinfo 来获取 managed objects，但因为它们是关联到另一个 MOC，所以无法直接操作它们，解决方法就是调用「mergeChangesFromContextDidSaveNotification:」方法。

用一张图来形容的话，大体就是这样：

{{img(path="/posts/ios-multi-thread-core-data/multi_thread_core_data.png")}}

```m
- (void)_setupCoreDataStack
{
     // setup managed object model
     NSURL *modelURL = [[NSBundle mainBundle] URLForResource:@"Database" withExtension:@"momd"];
     _managedObjectModel = [[NSManagedObjectModel alloc] initWithContentsOfURL:modelURL];

     // setup persistent store coordinator
     NSURL *storeURL = [NSURL fileURLWithPath:[[NSString cachesPath] stringByAppendingPathComponent:@"Database.db"]];

     NSError *error = nil;
     _persistentStoreCoordinator = [[NSPersistentStoreCoordinator alloc] initWithManagedObjectModel:_managedObjectModel];

     if (![_persistentStoreCoordinator addPersistentStoreWithType:NSSQLiteStoreType configuration:nil URL:storeURL options:nil error:&amp;error]) {
   	     // handle error
   }

     // create MOC
     _managedObjectContext = [[NSManagedObjectContext alloc] init];
     [_managedObjectContext setPersistentStoreCoordinator:_persistentStoreCoordinator];

     // subscribe to change notifications
     [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(_mocDidSaveNotification:) name:NSManagedObjectContextDidSaveNotification object:nil];
}
```

再来看看 Notification Handler，主要作用就是合并新的变化。

```m
- (void)_mocDidSaveNotification:(NSNotification *)notification
{
     NSManagedObjectContext *savedContext = [notification object];

     // ignore change notifications for the main MOC
     if (_managedObjectContext == savedContext) {
          return;
     }

     dispatch_sync(dispatch_get_main_queue(), ^{
      [_managedObjectContext mergeChangesFromContextDidSaveNotification:notification];
     });
}
```

这种方式实现起来和维护起来都有点麻烦，所以 iOS 5 中就出现了更加方便和灵活的实现，也就是「Nested MOC」。

```m
[[NSManagedObjectContext alloc] initWithConcurrencyType:NSMainQueueConcurrencyType];
```

可以看到在初始化时可以选择 ConcurrencyType，可选的有 3 个：

### NSConfinementConcurrencyType

这个是默认项，每个线程一个独立的 Context，主要是为了兼容之前的设计。

### NSPrivateQueueConcurrencyType

创建一个 private queue(使用 GCD)，这样就不会阻塞主线程。

### NSMainQueueConcurrencyType

创建一个 main queue，使用主线程，会阻塞。

还有一个重要的变化是 MOC 可以指定 parent。有了 parent 后，CUD 操作会冒泡到 parent。一个 parent 可以有多个 child。parent 还可以有 parent。

因为 UI 相关的数据必须在主线程获取，同时又要避免数据库的 I/O 操作阻塞主线程，所以就有了下面这个模型：

{{img(path="/posts/ios-multi-thread-core-data/multi_thread_core_data_nested.png")}}

我对这种实现方式的一个困惑是：child 无法得知 parent 的变化，也就是说，如果 NSFetchedResultsController 绑定了 Main MOC，当 Background Write MOC save 时，NSFetchedResultsController 为何能知晓？求指点。

这种方式比「Thread Confinement」稍微简单了点，也更明了。不过个人还是推荐使用 MagicalRecord，因为实现起来更加简单，等有空再写一篇。

写了一个使用了这个模型的 demo，配合 TableView 和 NSFetchedResultsController，有兴趣的可以看下：[https://github.com/limboy/coredata-with-tableview](https://github.com/limboy/coredata-with-tableview)

### 2013/06/17 更新

之前的困惑已消除，`NSFetchedResultsController`跟 PSC 无关，只要绑定的 MOC 有了`save`动作，`NSFetchedResultsController`就会收到通知，无论这个`save`操作有没有写入到持久层。

### 参考

- [http://www.cocoanetics.com/2012/07/multi-context-coredata/](http://www.cocoanetics.com/2012/07/multi-context-coredata/)
- [http://www.slideshare.net/Inferis/adventures-in-multithreaded-core-data](http://www.slideshare.net/Inferis/adventures-in-multithreaded-core-data)
