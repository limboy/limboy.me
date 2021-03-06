+++
title= "操作系统是如何管理内存的"
date = 2018-09-14
description = ""
[taxonomies]
tags = ["programming", "book"]
[extra]
giscus = "telescope"
cover = "/posts/os-memory/cover.jpg"
+++

最近在看 [Operating Systems: Three Easy Pieces](http://pages.cs.wisc.edu/~remzi/OSTEP/) 这本书，作者在这方面有 20 多年的积累，同时文风非常朴实，不会被各种术语绕晕。该书进从虚拟化、并发、持久化这三个方面来剖析操作系统，从要达到的目标到遇到的问题到解决方案到新的问题，一层层地告诉你为什么会变成现在这个样子。

今天要讲的内容主要是对该书里面关于内存管理这块的一个小结，由于看的是 0.8 版，跟最新的 1.0 版可能会有些许出入。

## 前言

每个进程创建的内存地址都是虚拟地址，操作系统使用了虚拟化技术，让进程觉得它拥有了大块可支配的内存的假象，操作系统拿到这个地址后会将它转变为真实的内存地址，从而拿到对应的信息。比如下面这段代码：

```c
#include <stdio.h>
#include <stdlib.h>
int main(int argc, char *argv[]) {
	printf("location of code : %p\n", (void *) main);
	printf("location of heap : %p\n", (void *) malloc(1));
	int x = 3;
	printf("location of stack : %p\n", (void *) &x);
	return x;
}
```

输出：

```
location of code : 0x10df2aec0
location of heap : 0x7fdeea400350
location of stack : 0x7ffee1cd560c
```

这些都是虚拟地址。对于内存的虚拟化，有三个最重要的要素：透明（就像内存只为当前的进程所用）、高效（就像直接操作物理内存那样）、保护（进程之间不能随意读写各自的内存区域），伴随着这三个要素，就开始了探索之旅。

## 远古时代

{{img(path="/posts/os-memory/1.jpg")}}

一开始，只有一个进程，一切都很美好，除了操作系统的自留地外，剩下的都给那个进程，想怎么折腾都行，只要别超出最大的容量。

但我们知道，那个时候，一台计算机是很贵的，比 iPhone XS Max 还贵，在这么昂贵的机器上同时只能运行一个程序实在浪费，于是就有了支持多进程的需求，所谓多进程，并不需要同时运行这些进程，只要它们都处于 ready 状态，操作系统快速地在它们之间切换，就能达到同时运行的假象。每个进程都需要内存，Context Switch 时，之前内存里的内容怎么办？简单粗暴的方式就是先 dump 到磁盘上，然后再从磁盘上 restore 之前 dump 的内容（如果有的话），但效果并不好，太慢了！

那怎么才能不慢呢？把进程对应的内存依旧留在物理内存中，需要的时候就切换到特定的区域。这就涉及到了内存的保护机制，毕竟进程之间可以随意读取、写入内容就乱套了，非常不安全。因此操作系统需要对物理内存做一层抽象，也就是「地址空间」(Address Space)，一个进程的地址空间包含了该进程所有相关内存，比如 code / stack / heap。一个 16 KB 的地址空间可能长这样：

{{img(path="/posts/os-memory/2.jpg")}}

当程序运行时，heap 和 stack 共用中间 free 的区域，当然这只是 OS 层面的抽象。比如下面这段代码：

```c
int x;
x = x + 3; // this is the line of code we are interested in
```

变成汇编指令后，大概是这样：

```asm
128: movl 0x0(%ebx), %eax  ;load 0+ebx into eax
132: addl $0x03, %eax ;add 3 to eax register
135: movl %eax, 0x0(%ebx) ;store eax back to mem
```

最前面的是 PC (Program Counter)，用来表示当前 code 的索引，比如 CPU 执行到 128 时，进行了 Context Switch，那么在 Switch 回来后，还可以接着从 132 开始执行（当然需要先把 PC 存起来）。之后的就是汇编代码，告诉 CPU 该如何操作。

从进程的角度看，内存可能是这样的：

{{img(path="/posts/os-memory/3.jpg")}}

真实的物理内存可能是这样的：

{{img(path="/posts/os-memory/4.jpg")}}

从 32KB 处作为开始，48KB 作为结束。那 32 / 48 可不可以动态设置呢，只要在 CPU 上整两个寄存器，base 和 bounds 就可以了，base 指明从哪里开始，bounds 指定哪里是边界。 因此真实物理地址和虚拟地址之间的关系是：

```
physical address = virtual address + base
```

有时，CPU 上用来做内存地址翻译的也会被叫做「内存管理单元 MMU」(Memory Management Unit)，随着功能越来越强大，MMU 也会变得越来越复杂。

base and bounds 这种做法最大的问题在于空间浪费，Stack 和 Heap 中间有一块 free space，即使没有用，也被占着，那如何才能解放这块区域呢，就有了下面的做法。

## 分段（Segmentation）

分段的思想很简单，之前不是一大块都是连在一起的么，现在要把你们都分开，code / stack / heap 各自成为一段，段内的空间是连续的，段与段之间不必连续，这样空间利用率上就更高了。

{{img(path="/posts/os-memory/7.jpg")}}

{{img(path="/posts/os-memory/5.jpg")}}

接下来问题就来了，一个进程会有多个段，如何知道一个内存地址对应的是哪个段呢？一个方法是用地址的前两个字节来表示：

{{img(path="/posts/os-memory/6.jpg")}}

比如 `00` 表示 code, `01` 表示 heap。获取物理地址的过程大概像这样：

```c
// 获取前两个比特
Segment = (VirtualAddress & SEG_MASK) >> SEG_SHIFT

// 获取 Offset
Offset = VirtualAddress & OFFSET_MASK

if (Offset >= Bounds[Segment])
  RaiseException(PROTECTION_FAULT)
else
  PhysAddr = Base[Segment] + Offset
```

可能有些同学已经忘了位操作，这里简单复习下，所谓掩码就是用来屏蔽指定位的一串二进制，结合 `&` 操作就可以让其他位都变为 0，需要保留的位保持原样，比如 `110110` 这串二进制，想要保留前三位，同时把后三位清零，只需要与 `111000` 执行 `&` 操作即可。如果只想要前 3 位，那么向右移 3 位，`>> 3`，因此上面那段代码 `Segment` 就变成了前两个比特。

拿到了 `Segment` 和 `Offset`，先判断下是否在安全区域内，如果超出则抛出异常，不然就去找到真实的物理地址。

每个段依旧会有 Base 和 Bounds，但注意到有些段是向上扩张，有些是向下扩张，这个信息也需要被额外记录：

{{img(path="/posts/os-memory/8.jpg")}}

除此之外，还会有其他的信息需要记录，比如是否可读写等。

那这个做法有没有问题呢，有的：

1. 当 Context Switch 时，Segment Registers 必须被存储起来方便下次使用。
2. 更大的问题是，每个进程自带了好几个段，且大小不一，容易形成碎片化(之前申请的内存被释放了)，创建新的地址空间时，就不那么方便了。

{{img(path="/posts/os-memory/9.jpg")}}

在这个例子中，当一个进程想要申请 20KB 的段时，虽然有 24KB 的剩余空间，但并不连续，因此会申请失败。一种解决方法是让内存空间变得更紧凑，比如暂停正在运行的进程，把内存拷贝到连续的地址空间，修改 Segment Register，这样就可以变成右图那样了。但是代价有点大，拷贝段会花费显著的时间。无论使用何种算法，碎片化一定会存在，只是好点的算法能降低碎片化程度。

顺便提一下 C 里面的内存申请，当 `malloc(size_t size)` 时，会返回一个指针，当 `free(void *pointer)` 时，会释放指针对应的区域，也就是说 `free` 时，不需要知道 `size`，这是因为申请内存时，有一块额外的区域用来存储这些信息，比如当用户执行 `ptr = malloc(20)` 时

{{img(path="/posts/os-memory/10.jpg")}}

除了那 20 个字节，头部还留了点空间用来放 `size` 和 `magic`

```c
typedef struct __header_t {
    int size;
    int magic;
} header_t;

void free(void *ptr) {
    header_t *hptr = (void *)ptr - sizeof(header_t);
}
```

拿到指针后，可以判断 magic number 是否相等，然后计算需要 free 的 size (header + body)，这里有一个[简易的 malloc 实现](https://www.cs.usfca.edu/~benson/cs326/pintos/pintos/src/threads/malloc.c)供参考。

既然段模式会有碎片化的问题，那如何才能避免呢？

## 分页（Paging）

Paging 的思想是把地址空间切分成固定大小的单元。比如下面一个只有 64 字节的地址空间，每个 Page 16 个字节

{{img(path="/posts/os-memory/11.jpg")}}

对应到真实的物理地址：

{{img(path="/posts/os-memory/12.jpg")}}

可以看到，虽然地址空间是连续的，但物理地址并不是。这样的好处是，不用去考虑 heap / stack 会被申请多少 size，比如要申请 64 字节地址空间，只要给 4 个 free 的 page 即可，这样 OS 管理起来也很简单，比如只要维护一份 free pages list，然后给出前 4 个。为了记录虚拟页(Virtual Page)跟物理地址之间的关系，OS 需要维护给每个进程维护一份 Page Table，它的作用就是地址翻译。比如 `movl <virtual address>, %eax`，由于进程的地址空间是 64 字节，因此需要 6 个比特来表示（2^6 = 64）

{{img(path="/posts/os-memory/13.jpg")}}

由于 Page Size 为 16 字节，因此 offset 为 4（4 个比特就能表示全一个 Page 里的任意位置），剩下的前两位作为 VPN (Virtual Page Number)

{{img(path="/posts/os-memory/14.jpg")}}

比如 `movl 21, %eax`, 21 转成 2 进制就是 `010101`

{{img(path="/posts/os-memory/15.jpg")}}

经过地址翻译后，就能找到物理内存中的地址了

{{img(path="/posts/os-memory/16.jpg")}}

那么问题又来了，Page Tables (用来将虚拟地址翻译成物理地址)存在哪里呢？在想这个问题前，先想下 Page Tables 大概有多大？

如果每个 Page Table Entry (PTE) 需要 4 个字节来保存 物理地址(PFN, Physical Frame Number)和其他的状态码，一个进程会有多少个 PTE 呢？假设地址空间为 32 位，Page Size 为 4KB，那么虚拟地址就可以被拆分成 20 bits 的 VPN 和 12 bits 的 Offset，有 2^20 个 VPN 可能需要翻译，就需要有对应数量的 PTE，因此一个进程大概需要 4MB 的内存来存储 Page Tables，想想如果有 100 个进程在运行，就需要 400MB，这个数量可不算小。

既然 Page Tables 如此之大，放 CPU 的寄存器里是不可能了，那就只能放内存了，因此在获取虚拟地址对应的物理内存地址时，需要先访问一次内存，这比直接访问 CPU 的寄存器会慢很多。

顺便来看一下 PTE 到底长啥样：

{{img(path="/posts/os-memory/17.jpg")}}

前几位都是状态位，用来表示这段内存目前的状态，比如是否有效（Valid），是否可读，是否在 Swap 等。PFN 是真正的物理内存地址。

采用分页模式后，物理地址的获取过程就变成了这样：

```
// 把 VPN 摘出来
VPN = (VirtualAddress & VPN_MASK) >> SHIFT

// 把 PTE 的地址组装好
PTEAddr = PTBR + (VPN * sizeof(PTE))

// 访问地址，拿到内容，注意，这里访问了内存，会影响速度
PTE = AccessMemory(PTEAddr)

// 检查是否有效
if (PTE.Valid == False)
  RaiseException(SEGMENTATION_FAULT)
else if (CanAccess(PTE.ProtectBits) == False)
  RaiseException(PROTECTION_FAULT)
else
  // 有效的话，再去拿真实的物理地址
  Offset = VirtualAddress & OFFSET_MASK
  PhysAddr = (PTE.PFN << PFN_SHIFT) | offset
```

那么如何对这个过程进行加速呢？

## TLB (Translation-Lookaside Buffer)

如果要加速，最容易想到的就是加缓存，TLB 就是 CPU 芯片 MMU 的一部分，首先 check TLB 中有没有该虚拟地址对应的物理地址，有的话直接返回，这样就不用再访问内存了，自然也就快了。那这个 TLB 到底长怎样呢？可以认为是很简单的 Key-Value 对，再加上额外的一些状态码 `VPN | PFN | other bits`。注意这里也会有 valid bit，只不过这里表示的是当前这个是不是一个有效的翻译，而 Page Table 里的 valid 状态码表示的是该内存是否被初始化过，如果没有被初始化，那么 valid 就为 0。

再来看看 Context Switch。每个进程的 VPN 和 PFN 的对应关系是不一样的，因此上一个进程的对应关系对于下一个进程来说，完全无用。那怎么办？最简单粗暴的方式就是进程切换时，直接清空，这样虽然不会出问题，但也降低了缓存命中率，尤其是频繁切换的话。还有一种方法是多加一个字段来表示该段翻译对应的是哪个地址空间（ASID），有点像 PID。

{{img(path="/posts/os-memory/18.jpg")}}

但 CPU 这寸土寸金的地方，不可能放很大的缓存，而且 size 越小，访问速度才会越快，当缓存满了之后怎么办？可以采用常见的策略，比如 LRU 或 Random。所以虽然内存被叫做 Random Access Memory，但也分是否命中缓存，那些命中 TLB 缓存的才是最快的。

OK，访问速度这个问题算是解决了，还有一个体积大的问题又该怎么处理呢？

## Smaller Tables

> When you have two good and seemingly opposing ideas, you should always see if you can combine them into a hybrid that manages to achieve the best of both worlds.

回顾之前，我们采用段模式时，并没有体积大的问题，因为只需要 base and bounds 就可以了，那有没有可能把段和页结合起来呢？我们来试试，如果每个 Segment 对应一个 Table，这样就只需要 3 个 Table。对于 Segment 来说，现在 Bounds 变为了判断 Page Table 的边界（比如有多少个 Pages）。假设 32 位的地址空间，4KB Pages，就会变成这样：

{{img(path="/posts/os-memory/20.jpg")}}

如果 TLB 没有命中的话，过程大概如此

```
SN = (VirtualAddress & SEG_MASK) >> SN_SHIFT
VPN = (VirtualAddress & VPN_MASK) >> VPN_SHIFT
AddressOfPTE = Base[SN] + (VPN * sizeof(PTE))
```

但这样 Segment 自带的碎片化问题依旧存在，到时 malloc 寻找可用空间时依旧会比较复杂。回过头来，我们再来看下，占用的这 4MB 空间真的是必须的么？

{{img(path="/posts/os-memory/21.jpg")}}
{{img(path="/posts/os-memory/22.jpg")}}

可以看到，中间的一大部分都是空的，但依旧会被填充（因为是采用数组的方式来访问），那有没有办法既能表达「无」的信息，又不占用空间呢？

### Multi-level Page Tables

多级分页表。比如要去宿舍找同学玩，发现宿舍大楼门关着，那么就不用再到寝室了，多级分页表的思路也类似，在最前面先做一次粗检，如果粗检都不符合就直接打回，粗检通过之后再来一次细检，这样就能把空间给省下来，具体是怎么做的呢？

把 PTE(Page Table Entry, 包含了物理地址和状态码)放进 page-sized units（比如一个 Page 里放 16 个 PTE），如果该 Page 的 PTE 都无效，那么压根就不申请内存，然后外面包一层 Page Directory 用来表示里面是否有有效的 PTE。就像文件夹一样，如果文件夹里没有文件，自然就不会占用空间。

{{img(path="/posts/os-memory/23.jpg")}}

左边是单层 Page Table 的实现，可以看到，虽然只有最下面两层是 valid 的，但中间依旧会有很多被占用的空间（就像要访问数组的第 1000 个元素，必须先要把这 1000 个元素填满）。

右边是两层 Page Table 的实现，通过 Valid 状态码就可以知道是否有必要去物理地址拿内容，如果第一层的 Valid 为 1，那么地址转换后就可以拿到第二层 PTE 的内容，如果此时 Valid 为 0，抛出 Exception，为 1，那么继续去拿真正的存放在物理内存中的内容。 因此最外层的 Valid 为 1，只是表示里面至少有一个 Valid 的 PTE。

相比之下，空间上是不是节省了不少。但也有弊端，比如需要两次内存访问才能拿到真正的虚拟地址对应的内容，所以这是一个典型的时间换空间的做法。还有一个弊端就是复杂度，无论是硬件还是操作系统，处理起来肯定比一个线性的 Page Table 查找复杂，但为了省出来的内存，这个 tradeoff 还是可以接受的。

### Demo

假设 CPU 在解析指令时，遇到了一个 14 位长的虚拟地址，现在要把它转换为真实地址，并取出其中的内容：

{{img(path="/posts/os-memory/25.jpg")}}

Page Directory Index 告诉 CPU 去第几层找 PDE(Page Directory Entry)

```
PDEAddr = PageDirBase + (PDIndex * sizeof(PDE))
```

PageDirBase 对应具体的物理地址。如果 PDE 的 valid 位为 0，则直接抛异常，不然就把 Page Table Index 拿出来，找到 PTE，看看它的 valid 状态码，如果为 0，抛异常，为 1 则去取最终的物理地址中的内容。

## 小结

如果要看更详细的，最好还是阅读原著，会有更细致的描述和一些没提到的内容，比如跟磁盘的内存交换。

了解这些底层的运行机制除了满足好奇外，还可以学到不少复杂系统的应对策略，对于其他的项目也会有所启发。比如其中提到的 Mechanism 和 Policy，前者指定大方向，后者处理实现；时间/空间上的取舍；当有两种看起来相反的思路时，如何有效地混合；复杂度和性能之间的取舍等等。这些对于设计、编写高质量的程序都大有裨益。
