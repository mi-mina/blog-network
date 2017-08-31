(ns blog_network.scrape1
  (:require [net.cgrand.enlive-html :as html])
  (:require [clojure.data.csv :as csv])
  (:require [clojure.java.io :as io])
  (:require [clojure.data.json :as json])
  (:require [clojure.tools.namespace.repl :refer [refresh]]))

(defn read-from-csv [path]
  (with-open [reader (io/reader path)]
    (doall
      (csv/read-csv reader))))

(defn get-domain [url]
  (first (-> url
    (clojure.string/replace "http://" "")
    (clojure.string/replace "https://" "")
    (clojure.string/split #"\."))))

(defn get-domains [urls]
  (map get-domain urls))

(defn create-nodes [domains platform]
  (vec (map #(hash-map :id %, :group 1, :platform platform) domains)))

;; Obtención de datos con enlive
(defn fetch-url [url]
  (html/html-resource (java.net.URL. url)))

;; Obtiene los links en el div con clase blog-list de Blogspot
(defn get-blogspot-BlogList [url]
  (mapcat #(html/attr-values % :href) (html/select (fetch-url url) [:div.BlogList :div.blog-title :a])))

;; Obtiene los links en el div con clase link-list de Blogspot
(defn get-blogspot-LinkList [url]
  (mapcat #(html/attr-values % :href) (html/select (fetch-url url) [:div.LinkList :li :a])))

;; Obtiene los links en el ul con clase blogroll de wordpress
(defn get-wordpress-blogroll [url]
  (mapcat #(html/attr-values % :href) (html/select (fetch-url url) [:ul.blogroll :li :a])))

;; Esta función coge una lista de urls, elimina los blogs que no son de blogspot
;; o de wordpress y elimina la parte final de la url
(defn get-blogspot+wordpress-urls [urls]
  (->> urls
    (filter #(or (clojure.string/includes? % "blogspot") (clojure.string/includes? % "wordpress")))
    (map #(clojure.string/replace % "/feeds/posts/default" ""))
    (map #(clojure.string/replace % "/feed/" ""))))

;; ******************* data *******************
(def initial-blogspot-urls
  (->> (read-from-csv "data/blogs_blogspot.csv")
    (rest)
    (apply concat)
    (map #(clojure.string/replace % "/feeds/posts/default" ""))))

(def initial-wordpress-urls
  (->> (read-from-csv "data/blogs_wordpress.csv")
    (rest)
    (apply concat)
    (map #(clojure.string/replace % "/feed/" ""))))

(def initial-blogspot-domains (get-domains initial-blogspot-urls))
(def initial-wordpress-domains (get-domains initial-wordpress-urls))
(def initial-domains (concat initial-blogspot-domains initial-wordpress-domains))

;; La lista inicial de nodos es la lista de la que partimos (:group 1), ya que en principio
;; solo vamos a ver la relación entre ellos. En una segunda fase tendremos que
;; añadir a esa lista inicial los blogs que siguen cada blog de la lista inicial (:group 2)
(def initial-nodes-array-blogspot (create-nodes initial-blogspot-domains "blogspot"))
(def initial-nodes-array-wordpress (create-nodes initial-wordpress-domains "wordpress"))
(def initial-nodes-array (concat initial-nodes-array-blogspot initial-nodes-array-wordpress))

;; Crea un links-array a partir de una url de blogspot
(defn create-links-array-from-blogspot-url [url]
  (let [BlogList (get-blogspot-BlogList url)
        LinkList (get-blogspot-LinkList url)
        blogs-list (concat BlogList LinkList)
        only-bs-wp (get-blogspot+wordpress-urls blogs-list)
        blogspot-list-domains (get-domains only-bs-wp)
        blogspot-list-domains-filtered (filter (fn [s] (some #(= % s) initial-domains)) blogspot-list-domains)]
        (->> blogspot-list-domains-filtered
          ;; Con esto evito los que tienen source y target iguales
          (map #(when (not= (get-domain url) %) (hash-map :source (get-domain url) :target % :value 1)))
          (filter #(not= nil %)))))

(defn create-links-array-from-wordpress-url [url]
  (let [blogs-list (get-wordpress-blogroll url)
        only-bs-wp (get-blogspot+wordpress-urls blogs-list)
        wordpress-list-domains (get-domains only-bs-wp)
        wordpress-list-domains-filtered (filter (fn [s] (some #(= % s) initial-domains)) wordpress-list-domains)]
        (->> wordpress-list-domains-filtered
          ;; Con esto evito los que tienen source y target iguales
          (map #(when (not= (get-domain url) %) (hash-map :source (get-domain url) :target % :value 1)))
          (filter #(not= nil %)))))

(defn create-blogspot-links-array [urls]
  (reduce into [] (map create-links-array-from-blogspot-url urls)))

(defn create-wordpress-links-array [urls]
  (reduce into [] (map create-links-array-from-wordpress-url urls)))

(def links-array (concat (create-blogspot-links-array initial-blogspot-urls) (create-wordpress-links-array initial-wordpress-urls)))

(def nodes-array
  (vec (map (fn [node]
    (let [objects-with-domain-as-target (filter #(= (:target %) (:id node)) links-array)
          followers (map #(:source %) objects-with-domain-as-target)]
          (assoc node :followers followers)
          )) initial-nodes-array)))

(def universe {:nodes nodes-array :links links-array})

(with-open [writer (clojure.java.io/writer "universe.json")]
  (json/write universe writer))
