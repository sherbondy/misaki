(ns sherbondy.core)

(.log js/console "hi")

(set! (.-onload js/window)
  (fn []
    (.prettyPrint js/window)))