+++
title= "写了个基于SQLAlchemy的ORM"
date = 2012-02-10
description = ""
[taxonomies]
tags = ["programming", "python", "project"]
[extra]
giscus = "telescope"
+++

看 Rails 时，觉得 Rails 的 ORM 用起来好方便，就想找找 python 有没有类似的，没发现太尽如人意的，就按照自己的意愿，基于 SQLAlchemy Core 重新写了个，取名为 Thing，项目主页: "https://github.com/limboy/thing":https://github.com/limboy/thing

### 主要特性

# 使用方便，灵活

# 支持验证

# 支持事件触发

# 支持多数据库连接

不想把 ORM 做得太 magic，将来优化起来会不太方便，所以只是简单地封装了下，既保证了使用起来比较方便，将来涉及到分库分表或缓存时也可以从容应付。

### 安装

推荐使用 virtualenvwrapper

```py
mkvirtualenv thing
cdvirtualenv
pip install "git+git://github.com/lzyy/thing.git"
```

### 创建模型

创建一个继承 Thing 的基类，主要是设置数据库连接

```py
from sqlalchemy import create_engine
import thing

master_engine = create_engine('mysql://root:123456@localhost:3306/test')
slave_engine = create_engine('mysql://root:123456@localhost:3307/test')

class BaseThing(thing.Thing):
    def __init__(self):
        thing.Thing.__init__(self, {'master': master_engine,
                                    'slave': slave_engine})
```

h5. 注意事项：

# 所有的模型类都要继承 BaseThing

# 如果没有在子类里定义\_tablename，则默认使用小写的子类名作为表名

# 表字段会被自动获取

假设有这么个场景：一个用户有多个答案，每个答案可以被多人投票。我们可以新建 3 个 Model

```py
import thing
from sqlalchemy import create_engine
from formencode import validators
from blinker import signal

vote_before_insert = signal('vote.before_insert')

class Member(BaseThing):
    # 验证email字段
    email = validators.Email(messages = {'noAt': u'invalid email'})

    @property
    def answers(self):
        return Answer().where('member_id', '=', self.id)

class Answer(BaseThing):
    @property
    def votes(self):
        return Vote().where('answer_id', '=', self.id)

    @vote_before_insert.connect
    def _vote_before_insert(vote, data):
        if vote.answer.title == 'test':
            vote.errors = {'answer': 'signal test'}

class Vote(BaseThing):
    @property
    def member(self):
        return Member().where('id', '=', self.member_id).find()

    @property
    def answer(self):
        return Answer().where('id', '=', self.answer_id).find()
```

用户与答案是一对多的关系，这里通过@property 装饰器来实现，在 answers 方法内，可以很灵活地实现答案获取的方法。

在 Answer 模型里有一个 vote_before_insert 装饰器，在 vote 执行 insert 操作前\_vote_before_insert 方法会被触发，可以在这里做很多事，如缓存的处理，数据的验证等等。如果验证不通过，可以设置 sender 的 errors 属性，该属性一旦被设置，后续的操作将被中断，在这里 vote 就不会执行 insert 操作。

h5. 注意事项：

```
# 验证使用的是formencode，这个库支持很多的验证操作，"http://www.formencode.org/en/latest/Validator.html"
# 一共有6类事件：model.before_validation / after_validation / before_insert / after_insert / before_update / after_update
# 事件触发时第一个参数为model本身，第二个参数为数据，如果在某个事件响应函数处，设置了model.errors属性，则此次事件之后的代码都不会执行。
```

### 使用

#### 列出一个用户的 id>10 的所有回答，每次取 10 个

```py
member = Member().find(1)

for answer in member.answers.where('id', '>', 10).findall(limit=10, offset=0):
    print answer.title
```

#### 创建新用户

```py
member = Member()
member.email = 'foo@bar.com'
member.password = '123'
member.save()
print member.saved # True
print member.email # foo@bar.com
```

#### 更新用户信息

```py
member = Member().find(1)
member.email = 'foo@bar.com'
member.save()
print member.saved # True
print member.email # foo@bar.com
```

#### 验证信息

```py
member = Member()
member.password = '123'
member.email = 'foo'
member.save()
print member.errors['email'] # invalid email
```

### 多数据库连接

```py
member = Member().find(1, 'slave')
```

在执行 find / findall / save 操作时，有一个 db_section 选项，如果忽略，则默认使用初始化时传入的 engide dict 的第一项，在这里就是 master，如果想选择其他的数据库，传入该数据库对应的 key 就行，比如 slave

### 其他

```
# 查看某次插入或更新是否成功，可以检查errors属性，如果为空表示执行成功
# 如果model的key中包含主键，如id，则执行save时是一个更新操作，否则为插入
# 欢迎fork / test / feedback
```
