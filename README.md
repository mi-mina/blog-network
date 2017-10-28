# Visualizing Antropoloops blog ecosystem

[Antropoloops](http:/antropoloops.com) would not be possible without the work of many people (vinyl collectors, music lovers...) who share old albums in their blogs. Most of the musical sources we use in our remixes come from there. In recent years we have been discovering and enjoying the richness and diversity of music through these blogs, and now we follow via RSS around 200 blogs.

We've always imagined all these blogs as a sort of distributed archive, and we wanted to know how it might look like. The graph shows the blogs we follow and the relationships between them.

# host sites used by blogs

- www.adrive.com
- www.zippyshare.com
- https://yadi.sk
- https://drive.google.com
- https://dfiles.eu/
- https://mega.nz


# Usage
```
lein deps
```
To download dependencies
```
lein  repl
```
To init the repl
```
(load "blog_network/scape1")
(in-ns 'blog_network.scape1)
```
