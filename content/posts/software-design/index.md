+++
title= "软件构建设计"
date = 2010-11-20
description = ""
[taxonomies]
tags = ["programming", "book"]
[extra]
giscus = "telescope"
+++

这是《代码大全 2》的软件设计篇章，花了两天时间啃下来的，不得不感慨讲得很细致很到位。

### Key Design Concepts

Managing complexity is the most important technical topic in software development.

The goal of all software-design techniques is to break acomplicated problem into simple pieces. The more independent the subsystems are, the more you make it safe to focus on one bit of complexity at a time.

### design characteristics

- Minimal complexity
  - Avoid making "clever" designs. clever designs are usually hard to understand. Instead make "simple" and "easy-to-understand" designs.
- Ease of maintenance
- Loose coupling
- Extensibility
- Reusability
- High fan-in
  - having a high number of classes that use a given class. High fan-in implies that a system has been designed to make good use of utility classes at the lower levels in the system.
- Low-to-medium fan-outside
  - having a given class use a low-to-medium number of other classes (<7)
- Portability
- Leanness
  - designing the system so that it has no extra parts. a book is finished not when nothing more can be added but when nothing more can be taken away.
- Stratification
  - trying to keep the levels of decomposition stratified so that you can view the system at any single level and get a consistent view.
- Standard techniques

### The steps in designing with objects

- Identify the objects and their attributes (methods and data)
- Determine what can be done to each object
- Determine what each object is allowed to do to other objects
- Determine the parts of each object that will be visible to other objects-which parts will be public and which will be private.
- Define each object's public interface

### Form Consistent Abstractions

Abstraction is the ability to engage with a concept while safely ignoring some of its details - handling different details at different levels.

A good class interface is an abstraction that allows you to focus on the interface without needing to worry about the internal workings of the class.

### Design Building Blocks: Heuristics

### Encapsulate Implementation Details

Encapsulate picks up where abstraction leaves off. you aren't allowed to look at an object at any level of detail.

### Inherit - When Inheritance Simplifies the Design

Inheritance simplifies programming because you write a general routine to handle anything that depends on a door's general properties and then write specific routines to handle specific operations on specific kinds of doors.

### Hide Secrets (Information Hiding)

Information hiding is part of the foundation of both structured design and object-oriented design. In structured design, the notion of "black boxes" comes from information hiding. In object-oriented design, it gives rise to the concepts of encapsulation and modularity and it is associated with the concept of abstraction.

One key task in designing a class is deciding which features should be known outside the class and which should remain secret.

### Identify Areas Likey to Change

Accommodating changes is one of the most chanllenging aspects of good program design. The goal is to isolate unstable areas so that the effect of a change will be limited to one routine, class, or package.

areas that are likely to change:

- Business rules
- Hardware dependencies
- Input and output
- Nonstandard language features

### Keep Coupling Loose

Coupling describes how tightly a class or routing is related to other classes or routines. The goal is to create classes and routines with small, direct, visible and flexible relations to other classes and routines.

Classes and routines are first and foremost intellectual tools for reducing complexity. If they're not making your job simpler, they're not doing thier jobs.

### Look for Common Design Patterns

Popular Design Patterns

- Abstract Factory
- Adapter
- Bridge
- Composite
- Decorator
- Facade
- Factory Method
- Iterator
- Observer
- Singleton
- Strategy
- Template Method

### Design Practices

### Iterate

Design is an iterative process. You don't usually go from point A only to point B; you go from point A to point B and back to point A.

### Divide and Conquer

no one's skill is big enough to contain all the details of a complex program, and that applies just as well to design. Divide the program into different areas of concern, and then tackle each of those area individually.

### Top-Down and Bottom-Up Design Approaches

Top-down design begins at a high level of abstraction. You define base classes or other nonspecific design elements. As you develop the design, you increase the level of detail, identifying derived classes, collaborating classes, and other detailed design elements.

Bottom-up design starts with specifics and works toward genealities. It typically begins by identifying concrete objects and then generalizes aggregations of objects and base classes from those specifics.

### Experimental Prototyping

### Collaborative Design

### Capturing Your Design Work

- Insert design documentation into the code itself
- Capture design discussions and decisions on a wiki
- Write e-mail summaries
- Use a digital camera
- Save design flip charts
- Use CRC(Class, Responsibility, Collaborator) cards
- Create UML diagrams at appropriate levels of detail
