(ns blog_network.scrape1
  (:require [net.cgrand.enlive-html :as html])
  (:require [clojure.data.csv :as csv])
  (:require [clojure.java.io :as io])
  (:require [clojure.data.json :as json]))

(def blogs-list-from-csv
  (with-open [reader (io/reader "data/blogs_blogspot.csv")]
    (doall
      (csv/read-csv reader))))

(def initial-blogs-list
  (->> blogs-list-from-csv
    (rest)
    (apply concat)
    (map #(clojure.string/replace % "/feeds/posts/default" ""))))

;; Todos nuestros nodos van a ser los contenidos en la lista inicial de blogs.
;; Porque lo que vamos a buscar es la relación entre ellos.

;; (def nodes-array (vec(map #({:name %, :group 1}) initial-blogs-list)))
;; (def universe {:nodes nodes-array})

#_(with-open [writer (clojure.java.io/writer "universe.json")]
  (json/write [{:nodes "bar"}] writer))

(def ^:dynamic *base-url* (nth initial-blogs-list 12))

(defn fetch-url [url]
  (html/html-resource (java.net.URL. url)))

;; Obtiene los links en el div con clase blog-list
(defn get-BlogList []
  (vec (mapcat #(html/attr-values % :href) (html/select (fetch-url *base-url*) [:div.BlogList :div.blog-title :a]))))

;; Obtiene los links en el div con clase link-list
(defn get-LinkList []
 (vec (mapcat #(html/attr-values % :href) (html/select (fetch-url *base-url*) [:div.LinkList :li :a]))))

;; filtro para quedarme solo con los que son de blogspot
(def blog-list-blogspot
  (->> (get-BlogList)
  (filter #(clojure.string/includes? % "blogspot"))
  (map #(clojure.string/replace % "/feeds/posts/default" ""))))

;; En el futuro puedo buscar también blogs en Wordpress, etc...

;; filtro para quedarme solo con los que son de blogspot
(def link-list-blogspot
  (->> (get-LinkList)
  (filter #(clojure.string/includes? % "blogspot"))
  (map #(clojure.string/replace % "/feeds/posts/default" ""))))

;; Uno los blogs de blogspot que he obtenido tanto por blog-list como por link-list
(def list-blogspot (concat blog-list-blogspot link-list-blogspot))

;; Filtro los que no están en la lista inicial.
;; Problema. Algunos acaban en blogspot.fr en vez de .com
(def list-blogspot-filtered (filter (fn [s] (some #(= % s) initial-blogs-list)) list-blogspot))
