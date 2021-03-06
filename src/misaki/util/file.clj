(ns misaki.util.file
  "File control utility"
  (:use
    [clj-time.coerce :only [from-long]])
  (:require
    [clojure.java.io :as io]
    [clojure.string :as str])
  (:import [java.io File]))

; =file?
(defn file?
  "Check whether specified data is java.io.File or not."
  [x]
  (= java.io.File (class x)))

; =normalize-path
(defn normalize-path
  "Normalize file path.
  If path does not contain '/' at end of string, add '/'."
  [path]
  (if path (if (.endsWith path "/") path (str path "/"))))

; =find-files
(defn find-files
  "Find files in `dir` recursively."
  [dir]
  (file-seq (io/file dir)))

; =has-extension?
(defn has-extension?
  "Check whether file has specified extension or not."
  [ext file]
  (.endsWith (.getName file) ext))

; =extension-filter
(defn extension-filter
  "Filter file list with `has-extension?`."
  [ext file-list]
  (filter (partial has-extension? ext) file-list))

; =find-clj-files
(defn find-clj-files
  "Find *.clj files in `dir` recursively."
  [dir]
  (extension-filter ".clj" (find-files dir)))

; =remove-extension
(defn remove-extension
  "Remove file extension.

      (remove-extension \"foo.bar\")
      ;=> \"foo\"
      (remove-extension \"foo.bar.baz\")
      ;=> \"foo.bar\"
  "
  [x]
  (if (= java.io.File (class x))
    (remove-extension (.getName x))
    (str/replace-first x #"\.[^.]+$" "")))

; =get-parent-path
(defn get-parent-path
  "Get parent path name(String).
  If specified path has no parent, returns the path itself.

      (get-parent-path \"/foo/bar\")
      ;=> \"/foo\"
      (get-parent-path \"/foo/\")
      ;=> \"/foo/\"
  "
  [path]
  (if (.endsWith path "/") path
    (normalize-path (str/join "/" (drop-last (str/split path #"/"))))))

; =last-modified-date
(defn last-modified-date
  "Get last modified date from java.io.File"
  [#^File file]
  (from-long (.lastModified file)))

; =make-directories
(defn make-directories
  "Make directories which will place file."
  [filename]
  (let [paths (drop-last (str/split filename #"/"))]
    (dotimes [n (count paths)]
      (let [name (str/join "/" (take (inc n) paths))
            file (io/file name)]
        (if-not (.exists file) (.mkdir file))))))

; =write-file
(defn write-file
  "Write compiled data as specified filename.
  If filepath is not exists, this function make directories."
  [#^String filename, #^String data]
  {:pre [(string? filename) (string? data)]}
  (make-directories filename)
  (with-open [w (io/writer filename)]
    (spit w data)))

; =delete-file
(defmulti delete-file "Delete file." class)
(defmethod delete-file File
  [file]
  (when (.exists file) (.delete file)))
(defmethod delete-file String
  [filename]
  (delete-file (io/file filename)))
