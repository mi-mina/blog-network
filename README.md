Visualizing Antropoloops blog ecosystem

# To pull a commit

```
git fetch
git pull origin master
```
# To push a commit

```
git add .
git commit -m "write your message"
git push origin master
```

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
