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
    (clojure.string/split #"\."))))

(defn get-domains [urls]
  (map get-domain urls))

(defn get-nodes [domains]
  (vec (map #(hash-map :id %, :group 1) domains)))

(defn fetch-url [url]
  (html/html-resource (java.net.URL. url)))

;; Obtiene los links en el div con clase blog-list
(defn get-BlogList [url]
  (mapcat #(html/attr-values % :href) (html/select (fetch-url url) [:div.BlogList :div.blog-title :a])))

;; Obtiene los links en el div con clase link-list
(defn get-LinkList [url]
 (mapcat #(html/attr-values % :href) (html/select (fetch-url url) [:div.LinkList :li :a])))

(defn get-blogspot-urls [urls]
 (->> urls
 (filter #(clojure.string/includes? % "blogspot"))
 (map #(clojure.string/replace % "/feeds/posts/default" ""))))

(defn get-blog-list-blogspot-domains [url]
 (->> url
   (get-BlogList)
   (get-blogspot-urls)
   (get-domains)))

(defn get-link-list-blogspot-domains [url]
 (->> url
   (get-LinkList)
   (get-blogspot-urls)
   (get-domains)))

;; ******************* data *******************
(def initial-blogspot-urls
  (->> (read-from-csv "data/blogs_blogspot2.csv")
    (rest)
    (apply concat)
    (map #(clojure.string/replace % "/feeds/posts/default" ""))))

(def initial-blogspot-domains (get-domains initial-blogspot-urls))

;; La lista inicial de nodos es la lista de la que partimos (:group 1), ya que en principio
;; solo vamos a ver la relación entre ellos. En una segunda fase tendremos que
;; añadir a esa lista inicial los blogs que siguen cada blog de la lista inicial (:group 2)
(def nodes-array (get-nodes initial-blogspot-domains))

;;(def ^:dynamic *base-url* (nth initial-blogspot-urls 12))

(defn get-links-array-from-url [url]
  (let [blog-list-blogspot-domains (get-blog-list-blogspot-domains url)
        link-list-blogspot-domains (get-link-list-blogspot-domains url)
        blogspot-domains (concat blog-list-blogspot-domains link-list-blogspot-domains)
        blogspot-domains-filtered (filter (fn [s] (some #(= % s) initial-blogspot-domains)) blogspot-domains)]
         (map
          #(hash-map :source (get-domain url) :target % :value 1)
          blogspot-domains-filtered)))

(defn get-links-array [urls]
  (reduce into [] (map get-links-array-from-url urls)))

(def links-array (get-links-array initial-blogspot-urls))

(defn calculate-target-size []
  (doseq [domain nodes-array]
    (let [objects-with-domain-as-target (filter #(= (:target %) (:id domain)) links-array)
          domain-size (count objects-with-domain-as-target)]
          (print domain)
          (assoc domain :size domain-size)
          nodes-array)))

(def nodes-array-size (calculate-target-size))



(def universe {:nodes nodes-array :links links-array})

(with-open [writer (clojure.java.io/writer "universe.json")]
  (json/write universe writer))
