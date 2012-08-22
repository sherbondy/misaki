var COMPILED = false;
var goog = goog || {};
goog.global = this;
goog.DEBUG = true;
goog.LOCALE = "en";
goog.provide = function(name) {
  if(!COMPILED) {
    if(goog.isProvided_(name)) {
      throw Error('Namespace "' + name + '" already declared.');
    }
    delete goog.implicitNamespaces_[name];
    var namespace = name;
    while(namespace = namespace.substring(0, namespace.lastIndexOf("."))) {
      if(goog.getObjectByName(namespace)) {
        break
      }
      goog.implicitNamespaces_[namespace] = true
    }
  }
  goog.exportPath_(name)
};
goog.setTestOnly = function(opt_message) {
  if(COMPILED && !goog.DEBUG) {
    opt_message = opt_message || "";
    throw Error("Importing test-only code into non-debug environment" + opt_message ? ": " + opt_message : ".");
  }
};
if(!COMPILED) {
  goog.isProvided_ = function(name) {
    return!goog.implicitNamespaces_[name] && !!goog.getObjectByName(name)
  };
  goog.implicitNamespaces_ = {}
}
goog.exportPath_ = function(name, opt_object, opt_objectToExportTo) {
  var parts = name.split(".");
  var cur = opt_objectToExportTo || goog.global;
  if(!(parts[0] in cur) && cur.execScript) {
    cur.execScript("var " + parts[0])
  }
  for(var part;parts.length && (part = parts.shift());) {
    if(!parts.length && goog.isDef(opt_object)) {
      cur[part] = opt_object
    }else {
      if(cur[part]) {
        cur = cur[part]
      }else {
        cur = cur[part] = {}
      }
    }
  }
};
goog.getObjectByName = function(name, opt_obj) {
  var parts = name.split(".");
  var cur = opt_obj || goog.global;
  for(var part;part = parts.shift();) {
    if(goog.isDefAndNotNull(cur[part])) {
      cur = cur[part]
    }else {
      return null
    }
  }
  return cur
};
goog.globalize = function(obj, opt_global) {
  var global = opt_global || goog.global;
  for(var x in obj) {
    global[x] = obj[x]
  }
};
goog.addDependency = function(relPath, provides, requires) {
  if(!COMPILED) {
    var provide, require;
    var path = relPath.replace(/\\/g, "/");
    var deps = goog.dependencies_;
    for(var i = 0;provide = provides[i];i++) {
      deps.nameToPath[provide] = path;
      if(!(path in deps.pathToNames)) {
        deps.pathToNames[path] = {}
      }
      deps.pathToNames[path][provide] = true
    }
    for(var j = 0;require = requires[j];j++) {
      if(!(path in deps.requires)) {
        deps.requires[path] = {}
      }
      deps.requires[path][require] = true
    }
  }
};
goog.ENABLE_DEBUG_LOADER = true;
goog.require = function(name) {
  if(!COMPILED) {
    if(goog.isProvided_(name)) {
      return
    }
    if(goog.ENABLE_DEBUG_LOADER) {
      var path = goog.getPathFromDeps_(name);
      if(path) {
        goog.included_[path] = true;
        goog.writeScripts_();
        return
      }
    }
    var errorMessage = "goog.require could not find: " + name;
    if(goog.global.console) {
      goog.global.console["error"](errorMessage)
    }
    throw Error(errorMessage);
  }
};
goog.basePath = "";
goog.global.CLOSURE_BASE_PATH;
goog.global.CLOSURE_NO_DEPS;
goog.global.CLOSURE_IMPORT_SCRIPT;
goog.nullFunction = function() {
};
goog.identityFunction = function(var_args) {
  return arguments[0]
};
goog.abstractMethod = function() {
  throw Error("unimplemented abstract method");
};
goog.addSingletonGetter = function(ctor) {
  ctor.getInstance = function() {
    return ctor.instance_ || (ctor.instance_ = new ctor)
  }
};
if(!COMPILED && goog.ENABLE_DEBUG_LOADER) {
  goog.included_ = {};
  goog.dependencies_ = {pathToNames:{}, nameToPath:{}, requires:{}, visited:{}, written:{}};
  goog.inHtmlDocument_ = function() {
    var doc = goog.global.document;
    return typeof doc != "undefined" && "write" in doc
  };
  goog.findBasePath_ = function() {
    if(goog.global.CLOSURE_BASE_PATH) {
      goog.basePath = goog.global.CLOSURE_BASE_PATH;
      return
    }else {
      if(!goog.inHtmlDocument_()) {
        return
      }
    }
    var doc = goog.global.document;
    var scripts = doc.getElementsByTagName("script");
    for(var i = scripts.length - 1;i >= 0;--i) {
      var src = scripts[i].src;
      var qmark = src.lastIndexOf("?");
      var l = qmark == -1 ? src.length : qmark;
      if(src.substr(l - 7, 7) == "base.js") {
        goog.basePath = src.substr(0, l - 7);
        return
      }
    }
  };
  goog.importScript_ = function(src) {
    var importScript = goog.global.CLOSURE_IMPORT_SCRIPT || goog.writeScriptTag_;
    if(!goog.dependencies_.written[src] && importScript(src)) {
      goog.dependencies_.written[src] = true
    }
  };
  goog.writeScriptTag_ = function(src) {
    if(goog.inHtmlDocument_()) {
      var doc = goog.global.document;
      doc.write('<script type="text/javascript" src="' + src + '"></' + "script>");
      return true
    }else {
      return false
    }
  };
  goog.writeScripts_ = function() {
    var scripts = [];
    var seenScript = {};
    var deps = goog.dependencies_;
    function visitNode(path) {
      if(path in deps.written) {
        return
      }
      if(path in deps.visited) {
        if(!(path in seenScript)) {
          seenScript[path] = true;
          scripts.push(path)
        }
        return
      }
      deps.visited[path] = true;
      if(path in deps.requires) {
        for(var requireName in deps.requires[path]) {
          if(!goog.isProvided_(requireName)) {
            if(requireName in deps.nameToPath) {
              visitNode(deps.nameToPath[requireName])
            }else {
              throw Error("Undefined nameToPath for " + requireName);
            }
          }
        }
      }
      if(!(path in seenScript)) {
        seenScript[path] = true;
        scripts.push(path)
      }
    }
    for(var path in goog.included_) {
      if(!deps.written[path]) {
        visitNode(path)
      }
    }
    for(var i = 0;i < scripts.length;i++) {
      if(scripts[i]) {
        goog.importScript_(goog.basePath + scripts[i])
      }else {
        throw Error("Undefined script input");
      }
    }
  };
  goog.getPathFromDeps_ = function(rule) {
    if(rule in goog.dependencies_.nameToPath) {
      return goog.dependencies_.nameToPath[rule]
    }else {
      return null
    }
  };
  goog.findBasePath_();
  if(!goog.global.CLOSURE_NO_DEPS) {
    goog.importScript_(goog.basePath + "deps.js")
  }
}
goog.typeOf = function(value) {
  var s = typeof value;
  if(s == "object") {
    if(value) {
      if(value instanceof Array) {
        return"array"
      }else {
        if(value instanceof Object) {
          return s
        }
      }
      var className = Object.prototype.toString.call(value);
      if(className == "[object Window]") {
        return"object"
      }
      if(className == "[object Array]" || typeof value.length == "number" && typeof value.splice != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("splice")) {
        return"array"
      }
      if(className == "[object Function]" || typeof value.call != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("call")) {
        return"function"
      }
    }else {
      return"null"
    }
  }else {
    if(s == "function" && typeof value.call == "undefined") {
      return"object"
    }
  }
  return s
};
goog.propertyIsEnumerableCustom_ = function(object, propName) {
  if(propName in object) {
    for(var key in object) {
      if(key == propName && Object.prototype.hasOwnProperty.call(object, propName)) {
        return true
      }
    }
  }
  return false
};
goog.propertyIsEnumerable_ = function(object, propName) {
  if(object instanceof Object) {
    return Object.prototype.propertyIsEnumerable.call(object, propName)
  }else {
    return goog.propertyIsEnumerableCustom_(object, propName)
  }
};
goog.isDef = function(val) {
  return val !== undefined
};
goog.isNull = function(val) {
  return val === null
};
goog.isDefAndNotNull = function(val) {
  return val != null
};
goog.isArray = function(val) {
  return goog.typeOf(val) == "array"
};
goog.isArrayLike = function(val) {
  var type = goog.typeOf(val);
  return type == "array" || type == "object" && typeof val.length == "number"
};
goog.isDateLike = function(val) {
  return goog.isObject(val) && typeof val.getFullYear == "function"
};
goog.isString = function(val) {
  return typeof val == "string"
};
goog.isBoolean = function(val) {
  return typeof val == "boolean"
};
goog.isNumber = function(val) {
  return typeof val == "number"
};
goog.isFunction = function(val) {
  return goog.typeOf(val) == "function"
};
goog.isObject = function(val) {
  var type = goog.typeOf(val);
  return type == "object" || type == "array" || type == "function"
};
goog.getUid = function(obj) {
  return obj[goog.UID_PROPERTY_] || (obj[goog.UID_PROPERTY_] = ++goog.uidCounter_)
};
goog.removeUid = function(obj) {
  if("removeAttribute" in obj) {
    obj.removeAttribute(goog.UID_PROPERTY_)
  }
  try {
    delete obj[goog.UID_PROPERTY_]
  }catch(ex) {
  }
};
goog.UID_PROPERTY_ = "closure_uid_" + Math.floor(Math.random() * 2147483648).toString(36);
goog.uidCounter_ = 0;
goog.getHashCode = goog.getUid;
goog.removeHashCode = goog.removeUid;
goog.cloneObject = function(obj) {
  var type = goog.typeOf(obj);
  if(type == "object" || type == "array") {
    if(obj.clone) {
      return obj.clone()
    }
    var clone = type == "array" ? [] : {};
    for(var key in obj) {
      clone[key] = goog.cloneObject(obj[key])
    }
    return clone
  }
  return obj
};
Object.prototype.clone;
goog.bindNative_ = function(fn, selfObj, var_args) {
  return fn.call.apply(fn.bind, arguments)
};
goog.bindJs_ = function(fn, selfObj, var_args) {
  if(!fn) {
    throw new Error;
  }
  if(arguments.length > 2) {
    var boundArgs = Array.prototype.slice.call(arguments, 2);
    return function() {
      var newArgs = Array.prototype.slice.call(arguments);
      Array.prototype.unshift.apply(newArgs, boundArgs);
      return fn.apply(selfObj, newArgs)
    }
  }else {
    return function() {
      return fn.apply(selfObj, arguments)
    }
  }
};
goog.bind = function(fn, selfObj, var_args) {
  if(Function.prototype.bind && Function.prototype.bind.toString().indexOf("native code") != -1) {
    goog.bind = goog.bindNative_
  }else {
    goog.bind = goog.bindJs_
  }
  return goog.bind.apply(null, arguments)
};
goog.partial = function(fn, var_args) {
  var args = Array.prototype.slice.call(arguments, 1);
  return function() {
    var newArgs = Array.prototype.slice.call(arguments);
    newArgs.unshift.apply(newArgs, args);
    return fn.apply(this, newArgs)
  }
};
goog.mixin = function(target, source) {
  for(var x in source) {
    target[x] = source[x]
  }
};
goog.now = Date.now || function() {
  return+new Date
};
goog.globalEval = function(script) {
  if(goog.global.execScript) {
    goog.global.execScript(script, "JavaScript")
  }else {
    if(goog.global.eval) {
      if(goog.evalWorksForGlobals_ == null) {
        goog.global.eval("var _et_ = 1;");
        if(typeof goog.global["_et_"] != "undefined") {
          delete goog.global["_et_"];
          goog.evalWorksForGlobals_ = true
        }else {
          goog.evalWorksForGlobals_ = false
        }
      }
      if(goog.evalWorksForGlobals_) {
        goog.global.eval(script)
      }else {
        var doc = goog.global.document;
        var scriptElt = doc.createElement("script");
        scriptElt.type = "text/javascript";
        scriptElt.defer = false;
        scriptElt.appendChild(doc.createTextNode(script));
        doc.body.appendChild(scriptElt);
        doc.body.removeChild(scriptElt)
      }
    }else {
      throw Error("goog.globalEval not available");
    }
  }
};
goog.evalWorksForGlobals_ = null;
goog.cssNameMapping_;
goog.cssNameMappingStyle_;
goog.getCssName = function(className, opt_modifier) {
  var getMapping = function(cssName) {
    return goog.cssNameMapping_[cssName] || cssName
  };
  var renameByParts = function(cssName) {
    var parts = cssName.split("-");
    var mapped = [];
    for(var i = 0;i < parts.length;i++) {
      mapped.push(getMapping(parts[i]))
    }
    return mapped.join("-")
  };
  var rename;
  if(goog.cssNameMapping_) {
    rename = goog.cssNameMappingStyle_ == "BY_WHOLE" ? getMapping : renameByParts
  }else {
    rename = function(a) {
      return a
    }
  }
  if(opt_modifier) {
    return className + "-" + rename(opt_modifier)
  }else {
    return rename(className)
  }
};
goog.setCssNameMapping = function(mapping, opt_style) {
  goog.cssNameMapping_ = mapping;
  goog.cssNameMappingStyle_ = opt_style
};
goog.global.CLOSURE_CSS_NAME_MAPPING;
if(!COMPILED && goog.global.CLOSURE_CSS_NAME_MAPPING) {
  goog.cssNameMapping_ = goog.global.CLOSURE_CSS_NAME_MAPPING
}
goog.getMsg = function(str, opt_values) {
  var values = opt_values || {};
  for(var key in values) {
    var value = ("" + values[key]).replace(/\$/g, "$$$$");
    str = str.replace(new RegExp("\\{\\$" + key + "\\}", "gi"), value)
  }
  return str
};
goog.exportSymbol = function(publicPath, object, opt_objectToExportTo) {
  goog.exportPath_(publicPath, object, opt_objectToExportTo)
};
goog.exportProperty = function(object, publicName, symbol) {
  object[publicName] = symbol
};
goog.inherits = function(childCtor, parentCtor) {
  function tempCtor() {
  }
  tempCtor.prototype = parentCtor.prototype;
  childCtor.superClass_ = parentCtor.prototype;
  childCtor.prototype = new tempCtor;
  childCtor.prototype.constructor = childCtor
};
goog.base = function(me, opt_methodName, var_args) {
  var caller = arguments.callee.caller;
  if(caller.superClass_) {
    return caller.superClass_.constructor.apply(me, Array.prototype.slice.call(arguments, 1))
  }
  var args = Array.prototype.slice.call(arguments, 2);
  var foundCaller = false;
  for(var ctor = me.constructor;ctor;ctor = ctor.superClass_ && ctor.superClass_.constructor) {
    if(ctor.prototype[opt_methodName] === caller) {
      foundCaller = true
    }else {
      if(foundCaller) {
        return ctor.prototype[opt_methodName].apply(me, args)
      }
    }
  }
  if(me[opt_methodName] === caller) {
    return me.constructor.prototype[opt_methodName].apply(me, args)
  }else {
    throw Error("goog.base called from a method of one name " + "to a method of a different name");
  }
};
goog.scope = function(fn) {
  fn.call(goog.global)
};
goog.provide("goog.debug.Error");
goog.debug.Error = function(opt_msg) {
  this.stack = (new Error).stack || "";
  if(opt_msg) {
    this.message = String(opt_msg)
  }
};
goog.inherits(goog.debug.Error, Error);
goog.debug.Error.prototype.name = "CustomError";
goog.provide("goog.string");
goog.provide("goog.string.Unicode");
goog.string.Unicode = {NBSP:"\u00a0"};
goog.string.startsWith = function(str, prefix) {
  return str.lastIndexOf(prefix, 0) == 0
};
goog.string.endsWith = function(str, suffix) {
  var l = str.length - suffix.length;
  return l >= 0 && str.indexOf(suffix, l) == l
};
goog.string.caseInsensitiveStartsWith = function(str, prefix) {
  return goog.string.caseInsensitiveCompare(prefix, str.substr(0, prefix.length)) == 0
};
goog.string.caseInsensitiveEndsWith = function(str, suffix) {
  return goog.string.caseInsensitiveCompare(suffix, str.substr(str.length - suffix.length, suffix.length)) == 0
};
goog.string.subs = function(str, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var replacement = String(arguments[i]).replace(/\$/g, "$$$$");
    str = str.replace(/\%s/, replacement)
  }
  return str
};
goog.string.collapseWhitespace = function(str) {
  return str.replace(/[\s\xa0]+/g, " ").replace(/^\s+|\s+$/g, "")
};
goog.string.isEmpty = function(str) {
  return/^[\s\xa0]*$/.test(str)
};
goog.string.isEmptySafe = function(str) {
  return goog.string.isEmpty(goog.string.makeSafe(str))
};
goog.string.isBreakingWhitespace = function(str) {
  return!/[^\t\n\r ]/.test(str)
};
goog.string.isAlpha = function(str) {
  return!/[^a-zA-Z]/.test(str)
};
goog.string.isNumeric = function(str) {
  return!/[^0-9]/.test(str)
};
goog.string.isAlphaNumeric = function(str) {
  return!/[^a-zA-Z0-9]/.test(str)
};
goog.string.isSpace = function(ch) {
  return ch == " "
};
goog.string.isUnicodeChar = function(ch) {
  return ch.length == 1 && ch >= " " && ch <= "~" || ch >= "\u0080" && ch <= "\ufffd"
};
goog.string.stripNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)+/g, " ")
};
goog.string.canonicalizeNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)/g, "\n")
};
goog.string.normalizeWhitespace = function(str) {
  return str.replace(/\xa0|\s/g, " ")
};
goog.string.normalizeSpaces = function(str) {
  return str.replace(/\xa0|[ \t]+/g, " ")
};
goog.string.collapseBreakingSpaces = function(str) {
  return str.replace(/[\t\r\n ]+/g, " ").replace(/^[\t\r\n ]+|[\t\r\n ]+$/g, "")
};
goog.string.trim = function(str) {
  return str.replace(/^[\s\xa0]+|[\s\xa0]+$/g, "")
};
goog.string.trimLeft = function(str) {
  return str.replace(/^[\s\xa0]+/, "")
};
goog.string.trimRight = function(str) {
  return str.replace(/[\s\xa0]+$/, "")
};
goog.string.caseInsensitiveCompare = function(str1, str2) {
  var test1 = String(str1).toLowerCase();
  var test2 = String(str2).toLowerCase();
  if(test1 < test2) {
    return-1
  }else {
    if(test1 == test2) {
      return 0
    }else {
      return 1
    }
  }
};
goog.string.numerateCompareRegExp_ = /(\.\d+)|(\d+)|(\D+)/g;
goog.string.numerateCompare = function(str1, str2) {
  if(str1 == str2) {
    return 0
  }
  if(!str1) {
    return-1
  }
  if(!str2) {
    return 1
  }
  var tokens1 = str1.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var tokens2 = str2.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var count = Math.min(tokens1.length, tokens2.length);
  for(var i = 0;i < count;i++) {
    var a = tokens1[i];
    var b = tokens2[i];
    if(a != b) {
      var num1 = parseInt(a, 10);
      if(!isNaN(num1)) {
        var num2 = parseInt(b, 10);
        if(!isNaN(num2) && num1 - num2) {
          return num1 - num2
        }
      }
      return a < b ? -1 : 1
    }
  }
  if(tokens1.length != tokens2.length) {
    return tokens1.length - tokens2.length
  }
  return str1 < str2 ? -1 : 1
};
goog.string.encodeUriRegExp_ = /^[a-zA-Z0-9\-_.!~*'()]*$/;
goog.string.urlEncode = function(str) {
  str = String(str);
  if(!goog.string.encodeUriRegExp_.test(str)) {
    return encodeURIComponent(str)
  }
  return str
};
goog.string.urlDecode = function(str) {
  return decodeURIComponent(str.replace(/\+/g, " "))
};
goog.string.newLineToBr = function(str, opt_xml) {
  return str.replace(/(\r\n|\r|\n)/g, opt_xml ? "<br />" : "<br>")
};
goog.string.htmlEscape = function(str, opt_isLikelyToContainHtmlChars) {
  if(opt_isLikelyToContainHtmlChars) {
    return str.replace(goog.string.amperRe_, "&amp;").replace(goog.string.ltRe_, "&lt;").replace(goog.string.gtRe_, "&gt;").replace(goog.string.quotRe_, "&quot;")
  }else {
    if(!goog.string.allRe_.test(str)) {
      return str
    }
    if(str.indexOf("&") != -1) {
      str = str.replace(goog.string.amperRe_, "&amp;")
    }
    if(str.indexOf("<") != -1) {
      str = str.replace(goog.string.ltRe_, "&lt;")
    }
    if(str.indexOf(">") != -1) {
      str = str.replace(goog.string.gtRe_, "&gt;")
    }
    if(str.indexOf('"') != -1) {
      str = str.replace(goog.string.quotRe_, "&quot;")
    }
    return str
  }
};
goog.string.amperRe_ = /&/g;
goog.string.ltRe_ = /</g;
goog.string.gtRe_ = />/g;
goog.string.quotRe_ = /\"/g;
goog.string.allRe_ = /[&<>\"]/;
goog.string.unescapeEntities = function(str) {
  if(goog.string.contains(str, "&")) {
    if("document" in goog.global) {
      return goog.string.unescapeEntitiesUsingDom_(str)
    }else {
      return goog.string.unescapePureXmlEntities_(str)
    }
  }
  return str
};
goog.string.unescapeEntitiesUsingDom_ = function(str) {
  var seen = {"&amp;":"&", "&lt;":"<", "&gt;":">", "&quot;":'"'};
  var div = document.createElement("div");
  return str.replace(goog.string.HTML_ENTITY_PATTERN_, function(s, entity) {
    var value = seen[s];
    if(value) {
      return value
    }
    if(entity.charAt(0) == "#") {
      var n = Number("0" + entity.substr(1));
      if(!isNaN(n)) {
        value = String.fromCharCode(n)
      }
    }
    if(!value) {
      div.innerHTML = s + " ";
      value = div.firstChild.nodeValue.slice(0, -1)
    }
    return seen[s] = value
  })
};
goog.string.unescapePureXmlEntities_ = function(str) {
  return str.replace(/&([^;]+);/g, function(s, entity) {
    switch(entity) {
      case "amp":
        return"&";
      case "lt":
        return"<";
      case "gt":
        return">";
      case "quot":
        return'"';
      default:
        if(entity.charAt(0) == "#") {
          var n = Number("0" + entity.substr(1));
          if(!isNaN(n)) {
            return String.fromCharCode(n)
          }
        }
        return s
    }
  })
};
goog.string.HTML_ENTITY_PATTERN_ = /&([^;\s<&]+);?/g;
goog.string.whitespaceEscape = function(str, opt_xml) {
  return goog.string.newLineToBr(str.replace(/  /g, " &#160;"), opt_xml)
};
goog.string.stripQuotes = function(str, quoteChars) {
  var length = quoteChars.length;
  for(var i = 0;i < length;i++) {
    var quoteChar = length == 1 ? quoteChars : quoteChars.charAt(i);
    if(str.charAt(0) == quoteChar && str.charAt(str.length - 1) == quoteChar) {
      return str.substring(1, str.length - 1)
    }
  }
  return str
};
goog.string.truncate = function(str, chars, opt_protectEscapedCharacters) {
  if(opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str)
  }
  if(str.length > chars) {
    str = str.substring(0, chars - 3) + "..."
  }
  if(opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str)
  }
  return str
};
goog.string.truncateMiddle = function(str, chars, opt_protectEscapedCharacters, opt_trailingChars) {
  if(opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str)
  }
  if(opt_trailingChars && str.length > chars) {
    if(opt_trailingChars > chars) {
      opt_trailingChars = chars
    }
    var endPoint = str.length - opt_trailingChars;
    var startPoint = chars - opt_trailingChars;
    str = str.substring(0, startPoint) + "..." + str.substring(endPoint)
  }else {
    if(str.length > chars) {
      var half = Math.floor(chars / 2);
      var endPos = str.length - half;
      half += chars % 2;
      str = str.substring(0, half) + "..." + str.substring(endPos)
    }
  }
  if(opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str)
  }
  return str
};
goog.string.specialEscapeChars_ = {"\x00":"\\0", "\u0008":"\\b", "\u000c":"\\f", "\n":"\\n", "\r":"\\r", "\t":"\\t", "\x0B":"\\x0B", '"':'\\"', "\\":"\\\\"};
goog.string.jsEscapeCache_ = {"'":"\\'"};
goog.string.quote = function(s) {
  s = String(s);
  if(s.quote) {
    return s.quote()
  }else {
    var sb = ['"'];
    for(var i = 0;i < s.length;i++) {
      var ch = s.charAt(i);
      var cc = ch.charCodeAt(0);
      sb[i + 1] = goog.string.specialEscapeChars_[ch] || (cc > 31 && cc < 127 ? ch : goog.string.escapeChar(ch))
    }
    sb.push('"');
    return sb.join("")
  }
};
goog.string.escapeString = function(str) {
  var sb = [];
  for(var i = 0;i < str.length;i++) {
    sb[i] = goog.string.escapeChar(str.charAt(i))
  }
  return sb.join("")
};
goog.string.escapeChar = function(c) {
  if(c in goog.string.jsEscapeCache_) {
    return goog.string.jsEscapeCache_[c]
  }
  if(c in goog.string.specialEscapeChars_) {
    return goog.string.jsEscapeCache_[c] = goog.string.specialEscapeChars_[c]
  }
  var rv = c;
  var cc = c.charCodeAt(0);
  if(cc > 31 && cc < 127) {
    rv = c
  }else {
    if(cc < 256) {
      rv = "\\x";
      if(cc < 16 || cc > 256) {
        rv += "0"
      }
    }else {
      rv = "\\u";
      if(cc < 4096) {
        rv += "0"
      }
    }
    rv += cc.toString(16).toUpperCase()
  }
  return goog.string.jsEscapeCache_[c] = rv
};
goog.string.toMap = function(s) {
  var rv = {};
  for(var i = 0;i < s.length;i++) {
    rv[s.charAt(i)] = true
  }
  return rv
};
goog.string.contains = function(s, ss) {
  return s.indexOf(ss) != -1
};
goog.string.removeAt = function(s, index, stringLength) {
  var resultStr = s;
  if(index >= 0 && index < s.length && stringLength > 0) {
    resultStr = s.substr(0, index) + s.substr(index + stringLength, s.length - index - stringLength)
  }
  return resultStr
};
goog.string.remove = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "");
  return s.replace(re, "")
};
goog.string.removeAll = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "g");
  return s.replace(re, "")
};
goog.string.regExpEscape = function(s) {
  return String(s).replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g, "\\$1").replace(/\x08/g, "\\x08")
};
goog.string.repeat = function(string, length) {
  return(new Array(length + 1)).join(string)
};
goog.string.padNumber = function(num, length, opt_precision) {
  var s = goog.isDef(opt_precision) ? num.toFixed(opt_precision) : String(num);
  var index = s.indexOf(".");
  if(index == -1) {
    index = s.length
  }
  return goog.string.repeat("0", Math.max(0, length - index)) + s
};
goog.string.makeSafe = function(obj) {
  return obj == null ? "" : String(obj)
};
goog.string.buildString = function(var_args) {
  return Array.prototype.join.call(arguments, "")
};
goog.string.getRandomString = function() {
  var x = 2147483648;
  return Math.floor(Math.random() * x).toString(36) + Math.abs(Math.floor(Math.random() * x) ^ goog.now()).toString(36)
};
goog.string.compareVersions = function(version1, version2) {
  var order = 0;
  var v1Subs = goog.string.trim(String(version1)).split(".");
  var v2Subs = goog.string.trim(String(version2)).split(".");
  var subCount = Math.max(v1Subs.length, v2Subs.length);
  for(var subIdx = 0;order == 0 && subIdx < subCount;subIdx++) {
    var v1Sub = v1Subs[subIdx] || "";
    var v2Sub = v2Subs[subIdx] || "";
    var v1CompParser = new RegExp("(\\d*)(\\D*)", "g");
    var v2CompParser = new RegExp("(\\d*)(\\D*)", "g");
    do {
      var v1Comp = v1CompParser.exec(v1Sub) || ["", "", ""];
      var v2Comp = v2CompParser.exec(v2Sub) || ["", "", ""];
      if(v1Comp[0].length == 0 && v2Comp[0].length == 0) {
        break
      }
      var v1CompNum = v1Comp[1].length == 0 ? 0 : parseInt(v1Comp[1], 10);
      var v2CompNum = v2Comp[1].length == 0 ? 0 : parseInt(v2Comp[1], 10);
      order = goog.string.compareElements_(v1CompNum, v2CompNum) || goog.string.compareElements_(v1Comp[2].length == 0, v2Comp[2].length == 0) || goog.string.compareElements_(v1Comp[2], v2Comp[2])
    }while(order == 0)
  }
  return order
};
goog.string.compareElements_ = function(left, right) {
  if(left < right) {
    return-1
  }else {
    if(left > right) {
      return 1
    }
  }
  return 0
};
goog.string.HASHCODE_MAX_ = 4294967296;
goog.string.hashCode = function(str) {
  var result = 0;
  for(var i = 0;i < str.length;++i) {
    result = 31 * result + str.charCodeAt(i);
    result %= goog.string.HASHCODE_MAX_
  }
  return result
};
goog.string.uniqueStringCounter_ = Math.random() * 2147483648 | 0;
goog.string.createUniqueString = function() {
  return"goog_" + goog.string.uniqueStringCounter_++
};
goog.string.toNumber = function(str) {
  var num = Number(str);
  if(num == 0 && goog.string.isEmpty(str)) {
    return NaN
  }
  return num
};
goog.string.toCamelCaseCache_ = {};
goog.string.toCamelCase = function(str) {
  return goog.string.toCamelCaseCache_[str] || (goog.string.toCamelCaseCache_[str] = String(str).replace(/\-([a-z])/g, function(all, match) {
    return match.toUpperCase()
  }))
};
goog.string.toSelectorCaseCache_ = {};
goog.string.toSelectorCase = function(str) {
  return goog.string.toSelectorCaseCache_[str] || (goog.string.toSelectorCaseCache_[str] = String(str).replace(/([A-Z])/g, "-$1").toLowerCase())
};
goog.provide("goog.asserts");
goog.provide("goog.asserts.AssertionError");
goog.require("goog.debug.Error");
goog.require("goog.string");
goog.asserts.ENABLE_ASSERTS = goog.DEBUG;
goog.asserts.AssertionError = function(messagePattern, messageArgs) {
  messageArgs.unshift(messagePattern);
  goog.debug.Error.call(this, goog.string.subs.apply(null, messageArgs));
  messageArgs.shift();
  this.messagePattern = messagePattern
};
goog.inherits(goog.asserts.AssertionError, goog.debug.Error);
goog.asserts.AssertionError.prototype.name = "AssertionError";
goog.asserts.doAssertFailure_ = function(defaultMessage, defaultArgs, givenMessage, givenArgs) {
  var message = "Assertion failed";
  if(givenMessage) {
    message += ": " + givenMessage;
    var args = givenArgs
  }else {
    if(defaultMessage) {
      message += ": " + defaultMessage;
      args = defaultArgs
    }
  }
  throw new goog.asserts.AssertionError("" + message, args || []);
};
goog.asserts.assert = function(condition, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !condition) {
    goog.asserts.doAssertFailure_("", null, opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return condition
};
goog.asserts.fail = function(opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS) {
    throw new goog.asserts.AssertionError("Failure" + (opt_message ? ": " + opt_message : ""), Array.prototype.slice.call(arguments, 1));
  }
};
goog.asserts.assertNumber = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isNumber(value)) {
    goog.asserts.doAssertFailure_("Expected number but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertString = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isString(value)) {
    goog.asserts.doAssertFailure_("Expected string but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertFunction = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isFunction(value)) {
    goog.asserts.doAssertFailure_("Expected function but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertObject = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isObject(value)) {
    goog.asserts.doAssertFailure_("Expected object but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertArray = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isArray(value)) {
    goog.asserts.doAssertFailure_("Expected array but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertBoolean = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isBoolean(value)) {
    goog.asserts.doAssertFailure_("Expected boolean but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertInstanceof = function(value, type, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !(value instanceof type)) {
    goog.asserts.doAssertFailure_("instanceof check failed.", null, opt_message, Array.prototype.slice.call(arguments, 3))
  }
};
goog.provide("goog.array");
goog.provide("goog.array.ArrayLike");
goog.require("goog.asserts");
goog.NATIVE_ARRAY_PROTOTYPES = true;
goog.array.ArrayLike;
goog.array.peek = function(array) {
  return array[array.length - 1]
};
goog.array.ARRAY_PROTOTYPE_ = Array.prototype;
goog.array.indexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.indexOf ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.indexOf.call(arr, obj, opt_fromIndex)
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? 0 : opt_fromIndex < 0 ? Math.max(0, arr.length + opt_fromIndex) : opt_fromIndex;
  if(goog.isString(arr)) {
    if(!goog.isString(obj) || obj.length != 1) {
      return-1
    }
    return arr.indexOf(obj, fromIndex)
  }
  for(var i = fromIndex;i < arr.length;i++) {
    if(i in arr && arr[i] === obj) {
      return i
    }
  }
  return-1
};
goog.array.lastIndexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.lastIndexOf ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  return goog.array.ARRAY_PROTOTYPE_.lastIndexOf.call(arr, obj, fromIndex)
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  if(fromIndex < 0) {
    fromIndex = Math.max(0, arr.length + fromIndex)
  }
  if(goog.isString(arr)) {
    if(!goog.isString(obj) || obj.length != 1) {
      return-1
    }
    return arr.lastIndexOf(obj, fromIndex)
  }
  for(var i = fromIndex;i >= 0;i--) {
    if(i in arr && arr[i] === obj) {
      return i
    }
  }
  return-1
};
goog.array.forEach = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.forEach ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  goog.array.ARRAY_PROTOTYPE_.forEach.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      f.call(opt_obj, arr2[i], i, arr)
    }
  }
};
goog.array.forEachRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = l - 1;i >= 0;--i) {
    if(i in arr2) {
      f.call(opt_obj, arr2[i], i, arr)
    }
  }
};
goog.array.filter = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.filter ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.filter.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = [];
  var resLength = 0;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      var val = arr2[i];
      if(f.call(opt_obj, val, i, arr)) {
        res[resLength++] = val
      }
    }
  }
  return res
};
goog.array.map = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.map ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.map.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = new Array(l);
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      res[i] = f.call(opt_obj, arr2[i], i, arr)
    }
  }
  return res
};
goog.array.reduce = function(arr, f, val, opt_obj) {
  if(arr.reduce) {
    if(opt_obj) {
      return arr.reduce(goog.bind(f, opt_obj), val)
    }else {
      return arr.reduce(f, val)
    }
  }
  var rval = val;
  goog.array.forEach(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.reduceRight = function(arr, f, val, opt_obj) {
  if(arr.reduceRight) {
    if(opt_obj) {
      return arr.reduceRight(goog.bind(f, opt_obj), val)
    }else {
      return arr.reduceRight(f, val)
    }
  }
  var rval = val;
  goog.array.forEachRight(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.some = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.some ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.some.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return true
    }
  }
  return false
};
goog.array.every = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.every ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.every.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && !f.call(opt_obj, arr2[i], i, arr)) {
      return false
    }
  }
  return true
};
goog.array.find = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
};
goog.array.findIndex = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i
    }
  }
  return-1
};
goog.array.findRight = function(arr, f, opt_obj) {
  var i = goog.array.findIndexRight(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
};
goog.array.findIndexRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = l - 1;i >= 0;i--) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i
    }
  }
  return-1
};
goog.array.contains = function(arr, obj) {
  return goog.array.indexOf(arr, obj) >= 0
};
goog.array.isEmpty = function(arr) {
  return arr.length == 0
};
goog.array.clear = function(arr) {
  if(!goog.isArray(arr)) {
    for(var i = arr.length - 1;i >= 0;i--) {
      delete arr[i]
    }
  }
  arr.length = 0
};
goog.array.insert = function(arr, obj) {
  if(!goog.array.contains(arr, obj)) {
    arr.push(obj)
  }
};
goog.array.insertAt = function(arr, obj, opt_i) {
  goog.array.splice(arr, opt_i, 0, obj)
};
goog.array.insertArrayAt = function(arr, elementsToAdd, opt_i) {
  goog.partial(goog.array.splice, arr, opt_i, 0).apply(null, elementsToAdd)
};
goog.array.insertBefore = function(arr, obj, opt_obj2) {
  var i;
  if(arguments.length == 2 || (i = goog.array.indexOf(arr, opt_obj2)) < 0) {
    arr.push(obj)
  }else {
    goog.array.insertAt(arr, obj, i)
  }
};
goog.array.remove = function(arr, obj) {
  var i = goog.array.indexOf(arr, obj);
  var rv;
  if(rv = i >= 0) {
    goog.array.removeAt(arr, i)
  }
  return rv
};
goog.array.removeAt = function(arr, i) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.splice.call(arr, i, 1).length == 1
};
goog.array.removeIf = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  if(i >= 0) {
    goog.array.removeAt(arr, i);
    return true
  }
  return false
};
goog.array.concat = function(var_args) {
  return goog.array.ARRAY_PROTOTYPE_.concat.apply(goog.array.ARRAY_PROTOTYPE_, arguments)
};
goog.array.clone = function(arr) {
  if(goog.isArray(arr)) {
    return goog.array.concat(arr)
  }else {
    var rv = [];
    for(var i = 0, len = arr.length;i < len;i++) {
      rv[i] = arr[i]
    }
    return rv
  }
};
goog.array.toArray = function(object) {
  if(goog.isArray(object)) {
    return goog.array.concat(object)
  }
  return goog.array.clone(object)
};
goog.array.extend = function(arr1, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var arr2 = arguments[i];
    var isArrayLike;
    if(goog.isArray(arr2) || (isArrayLike = goog.isArrayLike(arr2)) && arr2.hasOwnProperty("callee")) {
      arr1.push.apply(arr1, arr2)
    }else {
      if(isArrayLike) {
        var len1 = arr1.length;
        var len2 = arr2.length;
        for(var j = 0;j < len2;j++) {
          arr1[len1 + j] = arr2[j]
        }
      }else {
        arr1.push(arr2)
      }
    }
  }
};
goog.array.splice = function(arr, index, howMany, var_args) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.splice.apply(arr, goog.array.slice(arguments, 1))
};
goog.array.slice = function(arr, start, opt_end) {
  goog.asserts.assert(arr.length != null);
  if(arguments.length <= 2) {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start)
  }else {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start, opt_end)
  }
};
goog.array.removeDuplicates = function(arr, opt_rv) {
  var returnArray = opt_rv || arr;
  var seen = {}, cursorInsert = 0, cursorRead = 0;
  while(cursorRead < arr.length) {
    var current = arr[cursorRead++];
    var key = goog.isObject(current) ? "o" + goog.getUid(current) : (typeof current).charAt(0) + current;
    if(!Object.prototype.hasOwnProperty.call(seen, key)) {
      seen[key] = true;
      returnArray[cursorInsert++] = current
    }
  }
  returnArray.length = cursorInsert
};
goog.array.binarySearch = function(arr, target, opt_compareFn) {
  return goog.array.binarySearch_(arr, opt_compareFn || goog.array.defaultCompare, false, target)
};
goog.array.binarySelect = function(arr, evaluator, opt_obj) {
  return goog.array.binarySearch_(arr, evaluator, true, undefined, opt_obj)
};
goog.array.binarySearch_ = function(arr, compareFn, isEvaluator, opt_target, opt_selfObj) {
  var left = 0;
  var right = arr.length;
  var found;
  while(left < right) {
    var middle = left + right >> 1;
    var compareResult;
    if(isEvaluator) {
      compareResult = compareFn.call(opt_selfObj, arr[middle], middle, arr)
    }else {
      compareResult = compareFn(opt_target, arr[middle])
    }
    if(compareResult > 0) {
      left = middle + 1
    }else {
      right = middle;
      found = !compareResult
    }
  }
  return found ? left : ~left
};
goog.array.sort = function(arr, opt_compareFn) {
  goog.asserts.assert(arr.length != null);
  goog.array.ARRAY_PROTOTYPE_.sort.call(arr, opt_compareFn || goog.array.defaultCompare)
};
goog.array.stableSort = function(arr, opt_compareFn) {
  for(var i = 0;i < arr.length;i++) {
    arr[i] = {index:i, value:arr[i]}
  }
  var valueCompareFn = opt_compareFn || goog.array.defaultCompare;
  function stableCompareFn(obj1, obj2) {
    return valueCompareFn(obj1.value, obj2.value) || obj1.index - obj2.index
  }
  goog.array.sort(arr, stableCompareFn);
  for(var i = 0;i < arr.length;i++) {
    arr[i] = arr[i].value
  }
};
goog.array.sortObjectsByKey = function(arr, key, opt_compareFn) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  goog.array.sort(arr, function(a, b) {
    return compare(a[key], b[key])
  })
};
goog.array.isSorted = function(arr, opt_compareFn, opt_strict) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  for(var i = 1;i < arr.length;i++) {
    var compareResult = compare(arr[i - 1], arr[i]);
    if(compareResult > 0 || compareResult == 0 && opt_strict) {
      return false
    }
  }
  return true
};
goog.array.equals = function(arr1, arr2, opt_equalsFn) {
  if(!goog.isArrayLike(arr1) || !goog.isArrayLike(arr2) || arr1.length != arr2.length) {
    return false
  }
  var l = arr1.length;
  var equalsFn = opt_equalsFn || goog.array.defaultCompareEquality;
  for(var i = 0;i < l;i++) {
    if(!equalsFn(arr1[i], arr2[i])) {
      return false
    }
  }
  return true
};
goog.array.compare = function(arr1, arr2, opt_equalsFn) {
  return goog.array.equals(arr1, arr2, opt_equalsFn)
};
goog.array.compare3 = function(arr1, arr2, opt_compareFn) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  var l = Math.min(arr1.length, arr2.length);
  for(var i = 0;i < l;i++) {
    var result = compare(arr1[i], arr2[i]);
    if(result != 0) {
      return result
    }
  }
  return goog.array.defaultCompare(arr1.length, arr2.length)
};
goog.array.defaultCompare = function(a, b) {
  return a > b ? 1 : a < b ? -1 : 0
};
goog.array.defaultCompareEquality = function(a, b) {
  return a === b
};
goog.array.binaryInsert = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  if(index < 0) {
    goog.array.insertAt(array, value, -(index + 1));
    return true
  }
  return false
};
goog.array.binaryRemove = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  return index >= 0 ? goog.array.removeAt(array, index) : false
};
goog.array.bucket = function(array, sorter) {
  var buckets = {};
  for(var i = 0;i < array.length;i++) {
    var value = array[i];
    var key = sorter(value, i, array);
    if(goog.isDef(key)) {
      var bucket = buckets[key] || (buckets[key] = []);
      bucket.push(value)
    }
  }
  return buckets
};
goog.array.repeat = function(value, n) {
  var array = [];
  for(var i = 0;i < n;i++) {
    array[i] = value
  }
  return array
};
goog.array.flatten = function(var_args) {
  var result = [];
  for(var i = 0;i < arguments.length;i++) {
    var element = arguments[i];
    if(goog.isArray(element)) {
      result.push.apply(result, goog.array.flatten.apply(null, element))
    }else {
      result.push(element)
    }
  }
  return result
};
goog.array.rotate = function(array, n) {
  goog.asserts.assert(array.length != null);
  if(array.length) {
    n %= array.length;
    if(n > 0) {
      goog.array.ARRAY_PROTOTYPE_.unshift.apply(array, array.splice(-n, n))
    }else {
      if(n < 0) {
        goog.array.ARRAY_PROTOTYPE_.push.apply(array, array.splice(0, -n))
      }
    }
  }
  return array
};
goog.array.zip = function(var_args) {
  if(!arguments.length) {
    return[]
  }
  var result = [];
  for(var i = 0;true;i++) {
    var value = [];
    for(var j = 0;j < arguments.length;j++) {
      var arr = arguments[j];
      if(i >= arr.length) {
        return result
      }
      value.push(arr[i])
    }
    result.push(value)
  }
};
goog.array.shuffle = function(arr, opt_randFn) {
  var randFn = opt_randFn || Math.random;
  for(var i = arr.length - 1;i > 0;i--) {
    var j = Math.floor(randFn() * (i + 1));
    var tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp
  }
};
goog.provide("goog.object");
goog.object.forEach = function(obj, f, opt_obj) {
  for(var key in obj) {
    f.call(opt_obj, obj[key], key, obj)
  }
};
goog.object.filter = function(obj, f, opt_obj) {
  var res = {};
  for(var key in obj) {
    if(f.call(opt_obj, obj[key], key, obj)) {
      res[key] = obj[key]
    }
  }
  return res
};
goog.object.map = function(obj, f, opt_obj) {
  var res = {};
  for(var key in obj) {
    res[key] = f.call(opt_obj, obj[key], key, obj)
  }
  return res
};
goog.object.some = function(obj, f, opt_obj) {
  for(var key in obj) {
    if(f.call(opt_obj, obj[key], key, obj)) {
      return true
    }
  }
  return false
};
goog.object.every = function(obj, f, opt_obj) {
  for(var key in obj) {
    if(!f.call(opt_obj, obj[key], key, obj)) {
      return false
    }
  }
  return true
};
goog.object.getCount = function(obj) {
  var rv = 0;
  for(var key in obj) {
    rv++
  }
  return rv
};
goog.object.getAnyKey = function(obj) {
  for(var key in obj) {
    return key
  }
};
goog.object.getAnyValue = function(obj) {
  for(var key in obj) {
    return obj[key]
  }
};
goog.object.contains = function(obj, val) {
  return goog.object.containsValue(obj, val)
};
goog.object.getValues = function(obj) {
  var res = [];
  var i = 0;
  for(var key in obj) {
    res[i++] = obj[key]
  }
  return res
};
goog.object.getKeys = function(obj) {
  var res = [];
  var i = 0;
  for(var key in obj) {
    res[i++] = key
  }
  return res
};
goog.object.getValueByKeys = function(obj, var_args) {
  var isArrayLike = goog.isArrayLike(var_args);
  var keys = isArrayLike ? var_args : arguments;
  for(var i = isArrayLike ? 0 : 1;i < keys.length;i++) {
    obj = obj[keys[i]];
    if(!goog.isDef(obj)) {
      break
    }
  }
  return obj
};
goog.object.containsKey = function(obj, key) {
  return key in obj
};
goog.object.containsValue = function(obj, val) {
  for(var key in obj) {
    if(obj[key] == val) {
      return true
    }
  }
  return false
};
goog.object.findKey = function(obj, f, opt_this) {
  for(var key in obj) {
    if(f.call(opt_this, obj[key], key, obj)) {
      return key
    }
  }
  return undefined
};
goog.object.findValue = function(obj, f, opt_this) {
  var key = goog.object.findKey(obj, f, opt_this);
  return key && obj[key]
};
goog.object.isEmpty = function(obj) {
  for(var key in obj) {
    return false
  }
  return true
};
goog.object.clear = function(obj) {
  for(var i in obj) {
    delete obj[i]
  }
};
goog.object.remove = function(obj, key) {
  var rv;
  if(rv = key in obj) {
    delete obj[key]
  }
  return rv
};
goog.object.add = function(obj, key, val) {
  if(key in obj) {
    throw Error('The object already contains the key "' + key + '"');
  }
  goog.object.set(obj, key, val)
};
goog.object.get = function(obj, key, opt_val) {
  if(key in obj) {
    return obj[key]
  }
  return opt_val
};
goog.object.set = function(obj, key, value) {
  obj[key] = value
};
goog.object.setIfUndefined = function(obj, key, value) {
  return key in obj ? obj[key] : obj[key] = value
};
goog.object.clone = function(obj) {
  var res = {};
  for(var key in obj) {
    res[key] = obj[key]
  }
  return res
};
goog.object.unsafeClone = function(obj) {
  var type = goog.typeOf(obj);
  if(type == "object" || type == "array") {
    if(obj.clone) {
      return obj.clone()
    }
    var clone = type == "array" ? [] : {};
    for(var key in obj) {
      clone[key] = goog.object.unsafeClone(obj[key])
    }
    return clone
  }
  return obj
};
goog.object.transpose = function(obj) {
  var transposed = {};
  for(var key in obj) {
    transposed[obj[key]] = key
  }
  return transposed
};
goog.object.PROTOTYPE_FIELDS_ = ["constructor", "hasOwnProperty", "isPrototypeOf", "propertyIsEnumerable", "toLocaleString", "toString", "valueOf"];
goog.object.extend = function(target, var_args) {
  var key, source;
  for(var i = 1;i < arguments.length;i++) {
    source = arguments[i];
    for(key in source) {
      target[key] = source[key]
    }
    for(var j = 0;j < goog.object.PROTOTYPE_FIELDS_.length;j++) {
      key = goog.object.PROTOTYPE_FIELDS_[j];
      if(Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key]
      }
    }
  }
};
goog.object.create = function(var_args) {
  var argLength = arguments.length;
  if(argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.create.apply(null, arguments[0])
  }
  if(argLength % 2) {
    throw Error("Uneven number of arguments");
  }
  var rv = {};
  for(var i = 0;i < argLength;i += 2) {
    rv[arguments[i]] = arguments[i + 1]
  }
  return rv
};
goog.object.createSet = function(var_args) {
  var argLength = arguments.length;
  if(argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.createSet.apply(null, arguments[0])
  }
  var rv = {};
  for(var i = 0;i < argLength;i++) {
    rv[arguments[i]] = true
  }
  return rv
};
goog.provide("goog.string.format");
goog.require("goog.string");
goog.string.format = function(formatString, var_args) {
  var args = Array.prototype.slice.call(arguments);
  var template = args.shift();
  if(typeof template == "undefined") {
    throw Error("[goog.string.format] Template required");
  }
  var formatRe = /%([0\-\ \+]*)(\d+)?(\.(\d+))?([%sfdiu])/g;
  function replacerDemuxer(match, flags, width, dotp, precision, type, offset, wholeString) {
    if(type == "%") {
      return"%"
    }
    var value = args.shift();
    if(typeof value == "undefined") {
      throw Error("[goog.string.format] Not enough arguments");
    }
    arguments[0] = value;
    return goog.string.format.demuxes_[type].apply(null, arguments)
  }
  return template.replace(formatRe, replacerDemuxer)
};
goog.string.format.demuxes_ = {};
goog.string.format.demuxes_["s"] = function(value, flags, width, dotp, precision, type, offset, wholeString) {
  var replacement = value;
  if(isNaN(width) || width == "" || replacement.length >= width) {
    return replacement
  }
  if(flags.indexOf("-", 0) > -1) {
    replacement = replacement + goog.string.repeat(" ", width - replacement.length)
  }else {
    replacement = goog.string.repeat(" ", width - replacement.length) + replacement
  }
  return replacement
};
goog.string.format.demuxes_["f"] = function(value, flags, width, dotp, precision, type, offset, wholeString) {
  var replacement = value.toString();
  if(!(isNaN(precision) || precision == "")) {
    replacement = value.toFixed(precision)
  }
  var sign;
  if(value < 0) {
    sign = "-"
  }else {
    if(flags.indexOf("+") >= 0) {
      sign = "+"
    }else {
      if(flags.indexOf(" ") >= 0) {
        sign = " "
      }else {
        sign = ""
      }
    }
  }
  if(value >= 0) {
    replacement = sign + replacement
  }
  if(isNaN(width) || replacement.length >= width) {
    return replacement
  }
  replacement = isNaN(precision) ? Math.abs(value).toString() : Math.abs(value).toFixed(precision);
  var padCount = width - replacement.length - sign.length;
  if(flags.indexOf("-", 0) >= 0) {
    replacement = sign + replacement + goog.string.repeat(" ", padCount)
  }else {
    var paddingChar = flags.indexOf("0", 0) >= 0 ? "0" : " ";
    replacement = sign + goog.string.repeat(paddingChar, padCount) + replacement
  }
  return replacement
};
goog.string.format.demuxes_["d"] = function(value, flags, width, dotp, precision, type, offset, wholeString) {
  return goog.string.format.demuxes_["f"](parseInt(value, 10), flags, width, dotp, 0, type, offset, wholeString)
};
goog.string.format.demuxes_["i"] = goog.string.format.demuxes_["d"];
goog.string.format.demuxes_["u"] = goog.string.format.demuxes_["d"];
goog.provide("goog.userAgent.jscript");
goog.require("goog.string");
goog.userAgent.jscript.ASSUME_NO_JSCRIPT = false;
goog.userAgent.jscript.init_ = function() {
  var hasScriptEngine = "ScriptEngine" in goog.global;
  goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_ = hasScriptEngine && goog.global["ScriptEngine"]() == "JScript";
  goog.userAgent.jscript.DETECTED_VERSION_ = goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_ ? goog.global["ScriptEngineMajorVersion"]() + "." + goog.global["ScriptEngineMinorVersion"]() + "." + goog.global["ScriptEngineBuildVersion"]() : "0"
};
if(!goog.userAgent.jscript.ASSUME_NO_JSCRIPT) {
  goog.userAgent.jscript.init_()
}
goog.userAgent.jscript.HAS_JSCRIPT = goog.userAgent.jscript.ASSUME_NO_JSCRIPT ? false : goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_;
goog.userAgent.jscript.VERSION = goog.userAgent.jscript.ASSUME_NO_JSCRIPT ? "0" : goog.userAgent.jscript.DETECTED_VERSION_;
goog.userAgent.jscript.isVersion = function(version) {
  return goog.string.compareVersions(goog.userAgent.jscript.VERSION, version) >= 0
};
goog.provide("goog.string.StringBuffer");
goog.require("goog.userAgent.jscript");
goog.string.StringBuffer = function(opt_a1, var_args) {
  this.buffer_ = goog.userAgent.jscript.HAS_JSCRIPT ? [] : "";
  if(opt_a1 != null) {
    this.append.apply(this, arguments)
  }
};
goog.string.StringBuffer.prototype.set = function(s) {
  this.clear();
  this.append(s)
};
if(goog.userAgent.jscript.HAS_JSCRIPT) {
  goog.string.StringBuffer.prototype.bufferLength_ = 0;
  goog.string.StringBuffer.prototype.append = function(a1, opt_a2, var_args) {
    if(opt_a2 == null) {
      this.buffer_[this.bufferLength_++] = a1
    }else {
      this.buffer_.push.apply(this.buffer_, arguments);
      this.bufferLength_ = this.buffer_.length
    }
    return this
  }
}else {
  goog.string.StringBuffer.prototype.append = function(a1, opt_a2, var_args) {
    this.buffer_ += a1;
    if(opt_a2 != null) {
      for(var i = 1;i < arguments.length;i++) {
        this.buffer_ += arguments[i]
      }
    }
    return this
  }
}
goog.string.StringBuffer.prototype.clear = function() {
  if(goog.userAgent.jscript.HAS_JSCRIPT) {
    this.buffer_.length = 0;
    this.bufferLength_ = 0
  }else {
    this.buffer_ = ""
  }
};
goog.string.StringBuffer.prototype.getLength = function() {
  return this.toString().length
};
goog.string.StringBuffer.prototype.toString = function() {
  if(goog.userAgent.jscript.HAS_JSCRIPT) {
    var str = this.buffer_.join("");
    this.clear();
    if(str) {
      this.append(str)
    }
    return str
  }else {
    return this.buffer_
  }
};
goog.provide("cljs.core");
goog.require("goog.array");
goog.require("goog.object");
goog.require("goog.string.format");
goog.require("goog.string.StringBuffer");
goog.require("goog.string");
cljs.core._STAR_unchecked_if_STAR_ = false;
cljs.core._STAR_print_fn_STAR_ = function _STAR_print_fn_STAR_(_) {
  throw new Error("No *print-fn* fn set for evaluation environment");
};
cljs.core.truth_ = function truth_(x) {
  return x != null && x !== false
};
cljs.core.type_satisfies_ = function type_satisfies_(p, x) {
  var x__4753 = x == null ? null : x;
  if(p[goog.typeOf(x__4753)]) {
    return true
  }else {
    if(p["_"]) {
      return true
    }else {
      if("\ufdd0'else") {
        return false
      }else {
        return null
      }
    }
  }
};
cljs.core.is_proto_ = function is_proto_(x) {
  return x.constructor.prototype === x
};
cljs.core._STAR_main_cli_fn_STAR_ = null;
cljs.core.missing_protocol = function missing_protocol(proto, obj) {
  return Error(["No protocol method ", proto, " defined for type ", goog.typeOf(obj), ": ", obj].join(""))
};
cljs.core.aclone = function aclone(array_like) {
  return array_like.slice()
};
cljs.core.array = function array(var_args) {
  return Array.prototype.slice.call(arguments)
};
cljs.core.make_array = function() {
  var make_array = null;
  var make_array__1 = function(size) {
    return new Array(size)
  };
  var make_array__2 = function(type, size) {
    return make_array.call(null, size)
  };
  make_array = function(type, size) {
    switch(arguments.length) {
      case 1:
        return make_array__1.call(this, type);
      case 2:
        return make_array__2.call(this, type, size)
    }
    throw"Invalid arity: " + arguments.length;
  };
  make_array.cljs$lang$arity$1 = make_array__1;
  make_array.cljs$lang$arity$2 = make_array__2;
  return make_array
}();
cljs.core.aget = function() {
  var aget = null;
  var aget__2 = function(array, i) {
    return array[i]
  };
  var aget__3 = function() {
    var G__4754__delegate = function(array, i, idxs) {
      return cljs.core.apply.call(null, aget, aget.call(null, array, i), idxs)
    };
    var G__4754 = function(array, i, var_args) {
      var idxs = null;
      if(goog.isDef(var_args)) {
        idxs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4754__delegate.call(this, array, i, idxs)
    };
    G__4754.cljs$lang$maxFixedArity = 2;
    G__4754.cljs$lang$applyTo = function(arglist__4755) {
      var array = cljs.core.first(arglist__4755);
      var i = cljs.core.first(cljs.core.next(arglist__4755));
      var idxs = cljs.core.rest(cljs.core.next(arglist__4755));
      return G__4754__delegate(array, i, idxs)
    };
    G__4754.cljs$lang$arity$variadic = G__4754__delegate;
    return G__4754
  }();
  aget = function(array, i, var_args) {
    var idxs = var_args;
    switch(arguments.length) {
      case 2:
        return aget__2.call(this, array, i);
      default:
        return aget__3.cljs$lang$arity$variadic(array, i, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  aget.cljs$lang$maxFixedArity = 2;
  aget.cljs$lang$applyTo = aget__3.cljs$lang$applyTo;
  aget.cljs$lang$arity$2 = aget__2;
  aget.cljs$lang$arity$variadic = aget__3.cljs$lang$arity$variadic;
  return aget
}();
cljs.core.aset = function aset(array, i, val) {
  return array[i] = val
};
cljs.core.alength = function alength(array) {
  return array.length
};
cljs.core.into_array = function() {
  var into_array = null;
  var into_array__1 = function(aseq) {
    return into_array.call(null, null, aseq)
  };
  var into_array__2 = function(type, aseq) {
    return cljs.core.reduce.call(null, function(a, x) {
      a.push(x);
      return a
    }, [], aseq)
  };
  into_array = function(type, aseq) {
    switch(arguments.length) {
      case 1:
        return into_array__1.call(this, type);
      case 2:
        return into_array__2.call(this, type, aseq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  into_array.cljs$lang$arity$1 = into_array__1;
  into_array.cljs$lang$arity$2 = into_array__2;
  return into_array
}();
cljs.core.IFn = {};
cljs.core._invoke = function() {
  var _invoke = null;
  var _invoke__1 = function(this$) {
    if(function() {
      var and__3822__auto____4840 = this$;
      if(and__3822__auto____4840) {
        return this$.cljs$core$IFn$_invoke$arity$1
      }else {
        return and__3822__auto____4840
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$1(this$)
    }else {
      var x__1014__auto____4841 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____4842 = cljs.core._invoke[goog.typeOf(x__1014__auto____4841)];
        if(or__3824__auto____4842) {
          return or__3824__auto____4842
        }else {
          var or__3824__auto____4843 = cljs.core._invoke["_"];
          if(or__3824__auto____4843) {
            return or__3824__auto____4843
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$)
    }
  };
  var _invoke__2 = function(this$, a) {
    if(function() {
      var and__3822__auto____4844 = this$;
      if(and__3822__auto____4844) {
        return this$.cljs$core$IFn$_invoke$arity$2
      }else {
        return and__3822__auto____4844
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$2(this$, a)
    }else {
      var x__1014__auto____4845 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____4846 = cljs.core._invoke[goog.typeOf(x__1014__auto____4845)];
        if(or__3824__auto____4846) {
          return or__3824__auto____4846
        }else {
          var or__3824__auto____4847 = cljs.core._invoke["_"];
          if(or__3824__auto____4847) {
            return or__3824__auto____4847
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a)
    }
  };
  var _invoke__3 = function(this$, a, b) {
    if(function() {
      var and__3822__auto____4848 = this$;
      if(and__3822__auto____4848) {
        return this$.cljs$core$IFn$_invoke$arity$3
      }else {
        return and__3822__auto____4848
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$3(this$, a, b)
    }else {
      var x__1014__auto____4849 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____4850 = cljs.core._invoke[goog.typeOf(x__1014__auto____4849)];
        if(or__3824__auto____4850) {
          return or__3824__auto____4850
        }else {
          var or__3824__auto____4851 = cljs.core._invoke["_"];
          if(or__3824__auto____4851) {
            return or__3824__auto____4851
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b)
    }
  };
  var _invoke__4 = function(this$, a, b, c) {
    if(function() {
      var and__3822__auto____4852 = this$;
      if(and__3822__auto____4852) {
        return this$.cljs$core$IFn$_invoke$arity$4
      }else {
        return and__3822__auto____4852
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$4(this$, a, b, c)
    }else {
      var x__1014__auto____4853 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____4854 = cljs.core._invoke[goog.typeOf(x__1014__auto____4853)];
        if(or__3824__auto____4854) {
          return or__3824__auto____4854
        }else {
          var or__3824__auto____4855 = cljs.core._invoke["_"];
          if(or__3824__auto____4855) {
            return or__3824__auto____4855
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c)
    }
  };
  var _invoke__5 = function(this$, a, b, c, d) {
    if(function() {
      var and__3822__auto____4856 = this$;
      if(and__3822__auto____4856) {
        return this$.cljs$core$IFn$_invoke$arity$5
      }else {
        return and__3822__auto____4856
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$5(this$, a, b, c, d)
    }else {
      var x__1014__auto____4857 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____4858 = cljs.core._invoke[goog.typeOf(x__1014__auto____4857)];
        if(or__3824__auto____4858) {
          return or__3824__auto____4858
        }else {
          var or__3824__auto____4859 = cljs.core._invoke["_"];
          if(or__3824__auto____4859) {
            return or__3824__auto____4859
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d)
    }
  };
  var _invoke__6 = function(this$, a, b, c, d, e) {
    if(function() {
      var and__3822__auto____4860 = this$;
      if(and__3822__auto____4860) {
        return this$.cljs$core$IFn$_invoke$arity$6
      }else {
        return and__3822__auto____4860
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$6(this$, a, b, c, d, e)
    }else {
      var x__1014__auto____4861 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____4862 = cljs.core._invoke[goog.typeOf(x__1014__auto____4861)];
        if(or__3824__auto____4862) {
          return or__3824__auto____4862
        }else {
          var or__3824__auto____4863 = cljs.core._invoke["_"];
          if(or__3824__auto____4863) {
            return or__3824__auto____4863
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e)
    }
  };
  var _invoke__7 = function(this$, a, b, c, d, e, f) {
    if(function() {
      var and__3822__auto____4864 = this$;
      if(and__3822__auto____4864) {
        return this$.cljs$core$IFn$_invoke$arity$7
      }else {
        return and__3822__auto____4864
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$7(this$, a, b, c, d, e, f)
    }else {
      var x__1014__auto____4865 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____4866 = cljs.core._invoke[goog.typeOf(x__1014__auto____4865)];
        if(or__3824__auto____4866) {
          return or__3824__auto____4866
        }else {
          var or__3824__auto____4867 = cljs.core._invoke["_"];
          if(or__3824__auto____4867) {
            return or__3824__auto____4867
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f)
    }
  };
  var _invoke__8 = function(this$, a, b, c, d, e, f, g) {
    if(function() {
      var and__3822__auto____4868 = this$;
      if(and__3822__auto____4868) {
        return this$.cljs$core$IFn$_invoke$arity$8
      }else {
        return and__3822__auto____4868
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$8(this$, a, b, c, d, e, f, g)
    }else {
      var x__1014__auto____4869 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____4870 = cljs.core._invoke[goog.typeOf(x__1014__auto____4869)];
        if(or__3824__auto____4870) {
          return or__3824__auto____4870
        }else {
          var or__3824__auto____4871 = cljs.core._invoke["_"];
          if(or__3824__auto____4871) {
            return or__3824__auto____4871
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g)
    }
  };
  var _invoke__9 = function(this$, a, b, c, d, e, f, g, h) {
    if(function() {
      var and__3822__auto____4872 = this$;
      if(and__3822__auto____4872) {
        return this$.cljs$core$IFn$_invoke$arity$9
      }else {
        return and__3822__auto____4872
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$9(this$, a, b, c, d, e, f, g, h)
    }else {
      var x__1014__auto____4873 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____4874 = cljs.core._invoke[goog.typeOf(x__1014__auto____4873)];
        if(or__3824__auto____4874) {
          return or__3824__auto____4874
        }else {
          var or__3824__auto____4875 = cljs.core._invoke["_"];
          if(or__3824__auto____4875) {
            return or__3824__auto____4875
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h)
    }
  };
  var _invoke__10 = function(this$, a, b, c, d, e, f, g, h, i) {
    if(function() {
      var and__3822__auto____4876 = this$;
      if(and__3822__auto____4876) {
        return this$.cljs$core$IFn$_invoke$arity$10
      }else {
        return and__3822__auto____4876
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$10(this$, a, b, c, d, e, f, g, h, i)
    }else {
      var x__1014__auto____4877 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____4878 = cljs.core._invoke[goog.typeOf(x__1014__auto____4877)];
        if(or__3824__auto____4878) {
          return or__3824__auto____4878
        }else {
          var or__3824__auto____4879 = cljs.core._invoke["_"];
          if(or__3824__auto____4879) {
            return or__3824__auto____4879
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i)
    }
  };
  var _invoke__11 = function(this$, a, b, c, d, e, f, g, h, i, j) {
    if(function() {
      var and__3822__auto____4880 = this$;
      if(and__3822__auto____4880) {
        return this$.cljs$core$IFn$_invoke$arity$11
      }else {
        return and__3822__auto____4880
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$11(this$, a, b, c, d, e, f, g, h, i, j)
    }else {
      var x__1014__auto____4881 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____4882 = cljs.core._invoke[goog.typeOf(x__1014__auto____4881)];
        if(or__3824__auto____4882) {
          return or__3824__auto____4882
        }else {
          var or__3824__auto____4883 = cljs.core._invoke["_"];
          if(or__3824__auto____4883) {
            return or__3824__auto____4883
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j)
    }
  };
  var _invoke__12 = function(this$, a, b, c, d, e, f, g, h, i, j, k) {
    if(function() {
      var and__3822__auto____4884 = this$;
      if(and__3822__auto____4884) {
        return this$.cljs$core$IFn$_invoke$arity$12
      }else {
        return and__3822__auto____4884
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$12(this$, a, b, c, d, e, f, g, h, i, j, k)
    }else {
      var x__1014__auto____4885 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____4886 = cljs.core._invoke[goog.typeOf(x__1014__auto____4885)];
        if(or__3824__auto____4886) {
          return or__3824__auto____4886
        }else {
          var or__3824__auto____4887 = cljs.core._invoke["_"];
          if(or__3824__auto____4887) {
            return or__3824__auto____4887
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k)
    }
  };
  var _invoke__13 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l) {
    if(function() {
      var and__3822__auto____4888 = this$;
      if(and__3822__auto____4888) {
        return this$.cljs$core$IFn$_invoke$arity$13
      }else {
        return and__3822__auto____4888
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$13(this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }else {
      var x__1014__auto____4889 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____4890 = cljs.core._invoke[goog.typeOf(x__1014__auto____4889)];
        if(or__3824__auto____4890) {
          return or__3824__auto____4890
        }else {
          var or__3824__auto____4891 = cljs.core._invoke["_"];
          if(or__3824__auto____4891) {
            return or__3824__auto____4891
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }
  };
  var _invoke__14 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m) {
    if(function() {
      var and__3822__auto____4892 = this$;
      if(and__3822__auto____4892) {
        return this$.cljs$core$IFn$_invoke$arity$14
      }else {
        return and__3822__auto____4892
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$14(this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }else {
      var x__1014__auto____4893 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____4894 = cljs.core._invoke[goog.typeOf(x__1014__auto____4893)];
        if(or__3824__auto____4894) {
          return or__3824__auto____4894
        }else {
          var or__3824__auto____4895 = cljs.core._invoke["_"];
          if(or__3824__auto____4895) {
            return or__3824__auto____4895
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }
  };
  var _invoke__15 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n) {
    if(function() {
      var and__3822__auto____4896 = this$;
      if(and__3822__auto____4896) {
        return this$.cljs$core$IFn$_invoke$arity$15
      }else {
        return and__3822__auto____4896
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$15(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }else {
      var x__1014__auto____4897 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____4898 = cljs.core._invoke[goog.typeOf(x__1014__auto____4897)];
        if(or__3824__auto____4898) {
          return or__3824__auto____4898
        }else {
          var or__3824__auto____4899 = cljs.core._invoke["_"];
          if(or__3824__auto____4899) {
            return or__3824__auto____4899
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }
  };
  var _invoke__16 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o) {
    if(function() {
      var and__3822__auto____4900 = this$;
      if(and__3822__auto____4900) {
        return this$.cljs$core$IFn$_invoke$arity$16
      }else {
        return and__3822__auto____4900
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$16(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }else {
      var x__1014__auto____4901 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____4902 = cljs.core._invoke[goog.typeOf(x__1014__auto____4901)];
        if(or__3824__auto____4902) {
          return or__3824__auto____4902
        }else {
          var or__3824__auto____4903 = cljs.core._invoke["_"];
          if(or__3824__auto____4903) {
            return or__3824__auto____4903
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }
  };
  var _invoke__17 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) {
    if(function() {
      var and__3822__auto____4904 = this$;
      if(and__3822__auto____4904) {
        return this$.cljs$core$IFn$_invoke$arity$17
      }else {
        return and__3822__auto____4904
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$17(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }else {
      var x__1014__auto____4905 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____4906 = cljs.core._invoke[goog.typeOf(x__1014__auto____4905)];
        if(or__3824__auto____4906) {
          return or__3824__auto____4906
        }else {
          var or__3824__auto____4907 = cljs.core._invoke["_"];
          if(or__3824__auto____4907) {
            return or__3824__auto____4907
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }
  };
  var _invoke__18 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q) {
    if(function() {
      var and__3822__auto____4908 = this$;
      if(and__3822__auto____4908) {
        return this$.cljs$core$IFn$_invoke$arity$18
      }else {
        return and__3822__auto____4908
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$18(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }else {
      var x__1014__auto____4909 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____4910 = cljs.core._invoke[goog.typeOf(x__1014__auto____4909)];
        if(or__3824__auto____4910) {
          return or__3824__auto____4910
        }else {
          var or__3824__auto____4911 = cljs.core._invoke["_"];
          if(or__3824__auto____4911) {
            return or__3824__auto____4911
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }
  };
  var _invoke__19 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s) {
    if(function() {
      var and__3822__auto____4912 = this$;
      if(and__3822__auto____4912) {
        return this$.cljs$core$IFn$_invoke$arity$19
      }else {
        return and__3822__auto____4912
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$19(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }else {
      var x__1014__auto____4913 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____4914 = cljs.core._invoke[goog.typeOf(x__1014__auto____4913)];
        if(or__3824__auto____4914) {
          return or__3824__auto____4914
        }else {
          var or__3824__auto____4915 = cljs.core._invoke["_"];
          if(or__3824__auto____4915) {
            return or__3824__auto____4915
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }
  };
  var _invoke__20 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t) {
    if(function() {
      var and__3822__auto____4916 = this$;
      if(and__3822__auto____4916) {
        return this$.cljs$core$IFn$_invoke$arity$20
      }else {
        return and__3822__auto____4916
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$20(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }else {
      var x__1014__auto____4917 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____4918 = cljs.core._invoke[goog.typeOf(x__1014__auto____4917)];
        if(or__3824__auto____4918) {
          return or__3824__auto____4918
        }else {
          var or__3824__auto____4919 = cljs.core._invoke["_"];
          if(or__3824__auto____4919) {
            return or__3824__auto____4919
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }
  };
  var _invoke__21 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    if(function() {
      var and__3822__auto____4920 = this$;
      if(and__3822__auto____4920) {
        return this$.cljs$core$IFn$_invoke$arity$21
      }else {
        return and__3822__auto____4920
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$21(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }else {
      var x__1014__auto____4921 = this$ == null ? null : this$;
      return function() {
        var or__3824__auto____4922 = cljs.core._invoke[goog.typeOf(x__1014__auto____4921)];
        if(or__3824__auto____4922) {
          return or__3824__auto____4922
        }else {
          var or__3824__auto____4923 = cljs.core._invoke["_"];
          if(or__3824__auto____4923) {
            return or__3824__auto____4923
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }
  };
  _invoke = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    switch(arguments.length) {
      case 1:
        return _invoke__1.call(this, this$);
      case 2:
        return _invoke__2.call(this, this$, a);
      case 3:
        return _invoke__3.call(this, this$, a, b);
      case 4:
        return _invoke__4.call(this, this$, a, b, c);
      case 5:
        return _invoke__5.call(this, this$, a, b, c, d);
      case 6:
        return _invoke__6.call(this, this$, a, b, c, d, e);
      case 7:
        return _invoke__7.call(this, this$, a, b, c, d, e, f);
      case 8:
        return _invoke__8.call(this, this$, a, b, c, d, e, f, g);
      case 9:
        return _invoke__9.call(this, this$, a, b, c, d, e, f, g, h);
      case 10:
        return _invoke__10.call(this, this$, a, b, c, d, e, f, g, h, i);
      case 11:
        return _invoke__11.call(this, this$, a, b, c, d, e, f, g, h, i, j);
      case 12:
        return _invoke__12.call(this, this$, a, b, c, d, e, f, g, h, i, j, k);
      case 13:
        return _invoke__13.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l);
      case 14:
        return _invoke__14.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m);
      case 15:
        return _invoke__15.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n);
      case 16:
        return _invoke__16.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o);
      case 17:
        return _invoke__17.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p);
      case 18:
        return _invoke__18.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q);
      case 19:
        return _invoke__19.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s);
      case 20:
        return _invoke__20.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t);
      case 21:
        return _invoke__21.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _invoke.cljs$lang$arity$1 = _invoke__1;
  _invoke.cljs$lang$arity$2 = _invoke__2;
  _invoke.cljs$lang$arity$3 = _invoke__3;
  _invoke.cljs$lang$arity$4 = _invoke__4;
  _invoke.cljs$lang$arity$5 = _invoke__5;
  _invoke.cljs$lang$arity$6 = _invoke__6;
  _invoke.cljs$lang$arity$7 = _invoke__7;
  _invoke.cljs$lang$arity$8 = _invoke__8;
  _invoke.cljs$lang$arity$9 = _invoke__9;
  _invoke.cljs$lang$arity$10 = _invoke__10;
  _invoke.cljs$lang$arity$11 = _invoke__11;
  _invoke.cljs$lang$arity$12 = _invoke__12;
  _invoke.cljs$lang$arity$13 = _invoke__13;
  _invoke.cljs$lang$arity$14 = _invoke__14;
  _invoke.cljs$lang$arity$15 = _invoke__15;
  _invoke.cljs$lang$arity$16 = _invoke__16;
  _invoke.cljs$lang$arity$17 = _invoke__17;
  _invoke.cljs$lang$arity$18 = _invoke__18;
  _invoke.cljs$lang$arity$19 = _invoke__19;
  _invoke.cljs$lang$arity$20 = _invoke__20;
  _invoke.cljs$lang$arity$21 = _invoke__21;
  return _invoke
}();
cljs.core.ICounted = {};
cljs.core._count = function _count(coll) {
  if(function() {
    var and__3822__auto____4928 = coll;
    if(and__3822__auto____4928) {
      return coll.cljs$core$ICounted$_count$arity$1
    }else {
      return and__3822__auto____4928
    }
  }()) {
    return coll.cljs$core$ICounted$_count$arity$1(coll)
  }else {
    var x__1014__auto____4929 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____4930 = cljs.core._count[goog.typeOf(x__1014__auto____4929)];
      if(or__3824__auto____4930) {
        return or__3824__auto____4930
      }else {
        var or__3824__auto____4931 = cljs.core._count["_"];
        if(or__3824__auto____4931) {
          return or__3824__auto____4931
        }else {
          throw cljs.core.missing_protocol.call(null, "ICounted.-count", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IEmptyableCollection = {};
cljs.core._empty = function _empty(coll) {
  if(function() {
    var and__3822__auto____4936 = coll;
    if(and__3822__auto____4936) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1
    }else {
      return and__3822__auto____4936
    }
  }()) {
    return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
  }else {
    var x__1014__auto____4937 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____4938 = cljs.core._empty[goog.typeOf(x__1014__auto____4937)];
      if(or__3824__auto____4938) {
        return or__3824__auto____4938
      }else {
        var or__3824__auto____4939 = cljs.core._empty["_"];
        if(or__3824__auto____4939) {
          return or__3824__auto____4939
        }else {
          throw cljs.core.missing_protocol.call(null, "IEmptyableCollection.-empty", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ICollection = {};
cljs.core._conj = function _conj(coll, o) {
  if(function() {
    var and__3822__auto____4944 = coll;
    if(and__3822__auto____4944) {
      return coll.cljs$core$ICollection$_conj$arity$2
    }else {
      return and__3822__auto____4944
    }
  }()) {
    return coll.cljs$core$ICollection$_conj$arity$2(coll, o)
  }else {
    var x__1014__auto____4945 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____4946 = cljs.core._conj[goog.typeOf(x__1014__auto____4945)];
      if(or__3824__auto____4946) {
        return or__3824__auto____4946
      }else {
        var or__3824__auto____4947 = cljs.core._conj["_"];
        if(or__3824__auto____4947) {
          return or__3824__auto____4947
        }else {
          throw cljs.core.missing_protocol.call(null, "ICollection.-conj", coll);
        }
      }
    }().call(null, coll, o)
  }
};
cljs.core.IIndexed = {};
cljs.core._nth = function() {
  var _nth = null;
  var _nth__2 = function(coll, n) {
    if(function() {
      var and__3822__auto____4956 = coll;
      if(and__3822__auto____4956) {
        return coll.cljs$core$IIndexed$_nth$arity$2
      }else {
        return and__3822__auto____4956
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
    }else {
      var x__1014__auto____4957 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____4958 = cljs.core._nth[goog.typeOf(x__1014__auto____4957)];
        if(or__3824__auto____4958) {
          return or__3824__auto____4958
        }else {
          var or__3824__auto____4959 = cljs.core._nth["_"];
          if(or__3824__auto____4959) {
            return or__3824__auto____4959
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n)
    }
  };
  var _nth__3 = function(coll, n, not_found) {
    if(function() {
      var and__3822__auto____4960 = coll;
      if(and__3822__auto____4960) {
        return coll.cljs$core$IIndexed$_nth$arity$3
      }else {
        return and__3822__auto____4960
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$3(coll, n, not_found)
    }else {
      var x__1014__auto____4961 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____4962 = cljs.core._nth[goog.typeOf(x__1014__auto____4961)];
        if(or__3824__auto____4962) {
          return or__3824__auto____4962
        }else {
          var or__3824__auto____4963 = cljs.core._nth["_"];
          if(or__3824__auto____4963) {
            return or__3824__auto____4963
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n, not_found)
    }
  };
  _nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return _nth__2.call(this, coll, n);
      case 3:
        return _nth__3.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _nth.cljs$lang$arity$2 = _nth__2;
  _nth.cljs$lang$arity$3 = _nth__3;
  return _nth
}();
cljs.core.ASeq = {};
cljs.core.ISeq = {};
cljs.core._first = function _first(coll) {
  if(function() {
    var and__3822__auto____4968 = coll;
    if(and__3822__auto____4968) {
      return coll.cljs$core$ISeq$_first$arity$1
    }else {
      return and__3822__auto____4968
    }
  }()) {
    return coll.cljs$core$ISeq$_first$arity$1(coll)
  }else {
    var x__1014__auto____4969 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____4970 = cljs.core._first[goog.typeOf(x__1014__auto____4969)];
      if(or__3824__auto____4970) {
        return or__3824__auto____4970
      }else {
        var or__3824__auto____4971 = cljs.core._first["_"];
        if(or__3824__auto____4971) {
          return or__3824__auto____4971
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._rest = function _rest(coll) {
  if(function() {
    var and__3822__auto____4976 = coll;
    if(and__3822__auto____4976) {
      return coll.cljs$core$ISeq$_rest$arity$1
    }else {
      return and__3822__auto____4976
    }
  }()) {
    return coll.cljs$core$ISeq$_rest$arity$1(coll)
  }else {
    var x__1014__auto____4977 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____4978 = cljs.core._rest[goog.typeOf(x__1014__auto____4977)];
      if(or__3824__auto____4978) {
        return or__3824__auto____4978
      }else {
        var or__3824__auto____4979 = cljs.core._rest["_"];
        if(or__3824__auto____4979) {
          return or__3824__auto____4979
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-rest", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.INext = {};
cljs.core._next = function _next(coll) {
  if(function() {
    var and__3822__auto____4984 = coll;
    if(and__3822__auto____4984) {
      return coll.cljs$core$INext$_next$arity$1
    }else {
      return and__3822__auto____4984
    }
  }()) {
    return coll.cljs$core$INext$_next$arity$1(coll)
  }else {
    var x__1014__auto____4985 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____4986 = cljs.core._next[goog.typeOf(x__1014__auto____4985)];
      if(or__3824__auto____4986) {
        return or__3824__auto____4986
      }else {
        var or__3824__auto____4987 = cljs.core._next["_"];
        if(or__3824__auto____4987) {
          return or__3824__auto____4987
        }else {
          throw cljs.core.missing_protocol.call(null, "INext.-next", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ILookup = {};
cljs.core._lookup = function() {
  var _lookup = null;
  var _lookup__2 = function(o, k) {
    if(function() {
      var and__3822__auto____4996 = o;
      if(and__3822__auto____4996) {
        return o.cljs$core$ILookup$_lookup$arity$2
      }else {
        return and__3822__auto____4996
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$2(o, k)
    }else {
      var x__1014__auto____4997 = o == null ? null : o;
      return function() {
        var or__3824__auto____4998 = cljs.core._lookup[goog.typeOf(x__1014__auto____4997)];
        if(or__3824__auto____4998) {
          return or__3824__auto____4998
        }else {
          var or__3824__auto____4999 = cljs.core._lookup["_"];
          if(or__3824__auto____4999) {
            return or__3824__auto____4999
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k)
    }
  };
  var _lookup__3 = function(o, k, not_found) {
    if(function() {
      var and__3822__auto____5000 = o;
      if(and__3822__auto____5000) {
        return o.cljs$core$ILookup$_lookup$arity$3
      }else {
        return and__3822__auto____5000
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$3(o, k, not_found)
    }else {
      var x__1014__auto____5001 = o == null ? null : o;
      return function() {
        var or__3824__auto____5002 = cljs.core._lookup[goog.typeOf(x__1014__auto____5001)];
        if(or__3824__auto____5002) {
          return or__3824__auto____5002
        }else {
          var or__3824__auto____5003 = cljs.core._lookup["_"];
          if(or__3824__auto____5003) {
            return or__3824__auto____5003
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k, not_found)
    }
  };
  _lookup = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return _lookup__2.call(this, o, k);
      case 3:
        return _lookup__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _lookup.cljs$lang$arity$2 = _lookup__2;
  _lookup.cljs$lang$arity$3 = _lookup__3;
  return _lookup
}();
cljs.core.IAssociative = {};
cljs.core._contains_key_QMARK_ = function _contains_key_QMARK_(coll, k) {
  if(function() {
    var and__3822__auto____5008 = coll;
    if(and__3822__auto____5008) {
      return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2
    }else {
      return and__3822__auto____5008
    }
  }()) {
    return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2(coll, k)
  }else {
    var x__1014__auto____5009 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____5010 = cljs.core._contains_key_QMARK_[goog.typeOf(x__1014__auto____5009)];
      if(or__3824__auto____5010) {
        return or__3824__auto____5010
      }else {
        var or__3824__auto____5011 = cljs.core._contains_key_QMARK_["_"];
        if(or__3824__auto____5011) {
          return or__3824__auto____5011
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-contains-key?", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core._assoc = function _assoc(coll, k, v) {
  if(function() {
    var and__3822__auto____5016 = coll;
    if(and__3822__auto____5016) {
      return coll.cljs$core$IAssociative$_assoc$arity$3
    }else {
      return and__3822__auto____5016
    }
  }()) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, k, v)
  }else {
    var x__1014__auto____5017 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____5018 = cljs.core._assoc[goog.typeOf(x__1014__auto____5017)];
      if(or__3824__auto____5018) {
        return or__3824__auto____5018
      }else {
        var or__3824__auto____5019 = cljs.core._assoc["_"];
        if(or__3824__auto____5019) {
          return or__3824__auto____5019
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-assoc", coll);
        }
      }
    }().call(null, coll, k, v)
  }
};
cljs.core.IMap = {};
cljs.core._dissoc = function _dissoc(coll, k) {
  if(function() {
    var and__3822__auto____5024 = coll;
    if(and__3822__auto____5024) {
      return coll.cljs$core$IMap$_dissoc$arity$2
    }else {
      return and__3822__auto____5024
    }
  }()) {
    return coll.cljs$core$IMap$_dissoc$arity$2(coll, k)
  }else {
    var x__1014__auto____5025 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____5026 = cljs.core._dissoc[goog.typeOf(x__1014__auto____5025)];
      if(or__3824__auto____5026) {
        return or__3824__auto____5026
      }else {
        var or__3824__auto____5027 = cljs.core._dissoc["_"];
        if(or__3824__auto____5027) {
          return or__3824__auto____5027
        }else {
          throw cljs.core.missing_protocol.call(null, "IMap.-dissoc", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core.IMapEntry = {};
cljs.core._key = function _key(coll) {
  if(function() {
    var and__3822__auto____5032 = coll;
    if(and__3822__auto____5032) {
      return coll.cljs$core$IMapEntry$_key$arity$1
    }else {
      return and__3822__auto____5032
    }
  }()) {
    return coll.cljs$core$IMapEntry$_key$arity$1(coll)
  }else {
    var x__1014__auto____5033 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____5034 = cljs.core._key[goog.typeOf(x__1014__auto____5033)];
      if(or__3824__auto____5034) {
        return or__3824__auto____5034
      }else {
        var or__3824__auto____5035 = cljs.core._key["_"];
        if(or__3824__auto____5035) {
          return or__3824__auto____5035
        }else {
          throw cljs.core.missing_protocol.call(null, "IMapEntry.-key", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._val = function _val(coll) {
  if(function() {
    var and__3822__auto____5040 = coll;
    if(and__3822__auto____5040) {
      return coll.cljs$core$IMapEntry$_val$arity$1
    }else {
      return and__3822__auto____5040
    }
  }()) {
    return coll.cljs$core$IMapEntry$_val$arity$1(coll)
  }else {
    var x__1014__auto____5041 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____5042 = cljs.core._val[goog.typeOf(x__1014__auto____5041)];
      if(or__3824__auto____5042) {
        return or__3824__auto____5042
      }else {
        var or__3824__auto____5043 = cljs.core._val["_"];
        if(or__3824__auto____5043) {
          return or__3824__auto____5043
        }else {
          throw cljs.core.missing_protocol.call(null, "IMapEntry.-val", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ISet = {};
cljs.core._disjoin = function _disjoin(coll, v) {
  if(function() {
    var and__3822__auto____5048 = coll;
    if(and__3822__auto____5048) {
      return coll.cljs$core$ISet$_disjoin$arity$2
    }else {
      return and__3822__auto____5048
    }
  }()) {
    return coll.cljs$core$ISet$_disjoin$arity$2(coll, v)
  }else {
    var x__1014__auto____5049 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____5050 = cljs.core._disjoin[goog.typeOf(x__1014__auto____5049)];
      if(or__3824__auto____5050) {
        return or__3824__auto____5050
      }else {
        var or__3824__auto____5051 = cljs.core._disjoin["_"];
        if(or__3824__auto____5051) {
          return or__3824__auto____5051
        }else {
          throw cljs.core.missing_protocol.call(null, "ISet.-disjoin", coll);
        }
      }
    }().call(null, coll, v)
  }
};
cljs.core.IStack = {};
cljs.core._peek = function _peek(coll) {
  if(function() {
    var and__3822__auto____5056 = coll;
    if(and__3822__auto____5056) {
      return coll.cljs$core$IStack$_peek$arity$1
    }else {
      return and__3822__auto____5056
    }
  }()) {
    return coll.cljs$core$IStack$_peek$arity$1(coll)
  }else {
    var x__1014__auto____5057 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____5058 = cljs.core._peek[goog.typeOf(x__1014__auto____5057)];
      if(or__3824__auto____5058) {
        return or__3824__auto____5058
      }else {
        var or__3824__auto____5059 = cljs.core._peek["_"];
        if(or__3824__auto____5059) {
          return or__3824__auto____5059
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-peek", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._pop = function _pop(coll) {
  if(function() {
    var and__3822__auto____5064 = coll;
    if(and__3822__auto____5064) {
      return coll.cljs$core$IStack$_pop$arity$1
    }else {
      return and__3822__auto____5064
    }
  }()) {
    return coll.cljs$core$IStack$_pop$arity$1(coll)
  }else {
    var x__1014__auto____5065 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____5066 = cljs.core._pop[goog.typeOf(x__1014__auto____5065)];
      if(or__3824__auto____5066) {
        return or__3824__auto____5066
      }else {
        var or__3824__auto____5067 = cljs.core._pop["_"];
        if(or__3824__auto____5067) {
          return or__3824__auto____5067
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-pop", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IVector = {};
cljs.core._assoc_n = function _assoc_n(coll, n, val) {
  if(function() {
    var and__3822__auto____5072 = coll;
    if(and__3822__auto____5072) {
      return coll.cljs$core$IVector$_assoc_n$arity$3
    }else {
      return and__3822__auto____5072
    }
  }()) {
    return coll.cljs$core$IVector$_assoc_n$arity$3(coll, n, val)
  }else {
    var x__1014__auto____5073 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____5074 = cljs.core._assoc_n[goog.typeOf(x__1014__auto____5073)];
      if(or__3824__auto____5074) {
        return or__3824__auto____5074
      }else {
        var or__3824__auto____5075 = cljs.core._assoc_n["_"];
        if(or__3824__auto____5075) {
          return or__3824__auto____5075
        }else {
          throw cljs.core.missing_protocol.call(null, "IVector.-assoc-n", coll);
        }
      }
    }().call(null, coll, n, val)
  }
};
cljs.core.IDeref = {};
cljs.core._deref = function _deref(o) {
  if(function() {
    var and__3822__auto____5080 = o;
    if(and__3822__auto____5080) {
      return o.cljs$core$IDeref$_deref$arity$1
    }else {
      return and__3822__auto____5080
    }
  }()) {
    return o.cljs$core$IDeref$_deref$arity$1(o)
  }else {
    var x__1014__auto____5081 = o == null ? null : o;
    return function() {
      var or__3824__auto____5082 = cljs.core._deref[goog.typeOf(x__1014__auto____5081)];
      if(or__3824__auto____5082) {
        return or__3824__auto____5082
      }else {
        var or__3824__auto____5083 = cljs.core._deref["_"];
        if(or__3824__auto____5083) {
          return or__3824__auto____5083
        }else {
          throw cljs.core.missing_protocol.call(null, "IDeref.-deref", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.IDerefWithTimeout = {};
cljs.core._deref_with_timeout = function _deref_with_timeout(o, msec, timeout_val) {
  if(function() {
    var and__3822__auto____5088 = o;
    if(and__3822__auto____5088) {
      return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3
    }else {
      return and__3822__auto____5088
    }
  }()) {
    return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3(o, msec, timeout_val)
  }else {
    var x__1014__auto____5089 = o == null ? null : o;
    return function() {
      var or__3824__auto____5090 = cljs.core._deref_with_timeout[goog.typeOf(x__1014__auto____5089)];
      if(or__3824__auto____5090) {
        return or__3824__auto____5090
      }else {
        var or__3824__auto____5091 = cljs.core._deref_with_timeout["_"];
        if(or__3824__auto____5091) {
          return or__3824__auto____5091
        }else {
          throw cljs.core.missing_protocol.call(null, "IDerefWithTimeout.-deref-with-timeout", o);
        }
      }
    }().call(null, o, msec, timeout_val)
  }
};
cljs.core.IMeta = {};
cljs.core._meta = function _meta(o) {
  if(function() {
    var and__3822__auto____5096 = o;
    if(and__3822__auto____5096) {
      return o.cljs$core$IMeta$_meta$arity$1
    }else {
      return and__3822__auto____5096
    }
  }()) {
    return o.cljs$core$IMeta$_meta$arity$1(o)
  }else {
    var x__1014__auto____5097 = o == null ? null : o;
    return function() {
      var or__3824__auto____5098 = cljs.core._meta[goog.typeOf(x__1014__auto____5097)];
      if(or__3824__auto____5098) {
        return or__3824__auto____5098
      }else {
        var or__3824__auto____5099 = cljs.core._meta["_"];
        if(or__3824__auto____5099) {
          return or__3824__auto____5099
        }else {
          throw cljs.core.missing_protocol.call(null, "IMeta.-meta", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.IWithMeta = {};
cljs.core._with_meta = function _with_meta(o, meta) {
  if(function() {
    var and__3822__auto____5104 = o;
    if(and__3822__auto____5104) {
      return o.cljs$core$IWithMeta$_with_meta$arity$2
    }else {
      return and__3822__auto____5104
    }
  }()) {
    return o.cljs$core$IWithMeta$_with_meta$arity$2(o, meta)
  }else {
    var x__1014__auto____5105 = o == null ? null : o;
    return function() {
      var or__3824__auto____5106 = cljs.core._with_meta[goog.typeOf(x__1014__auto____5105)];
      if(or__3824__auto____5106) {
        return or__3824__auto____5106
      }else {
        var or__3824__auto____5107 = cljs.core._with_meta["_"];
        if(or__3824__auto____5107) {
          return or__3824__auto____5107
        }else {
          throw cljs.core.missing_protocol.call(null, "IWithMeta.-with-meta", o);
        }
      }
    }().call(null, o, meta)
  }
};
cljs.core.IReduce = {};
cljs.core._reduce = function() {
  var _reduce = null;
  var _reduce__2 = function(coll, f) {
    if(function() {
      var and__3822__auto____5116 = coll;
      if(and__3822__auto____5116) {
        return coll.cljs$core$IReduce$_reduce$arity$2
      }else {
        return and__3822__auto____5116
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$2(coll, f)
    }else {
      var x__1014__auto____5117 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____5118 = cljs.core._reduce[goog.typeOf(x__1014__auto____5117)];
        if(or__3824__auto____5118) {
          return or__3824__auto____5118
        }else {
          var or__3824__auto____5119 = cljs.core._reduce["_"];
          if(or__3824__auto____5119) {
            return or__3824__auto____5119
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f)
    }
  };
  var _reduce__3 = function(coll, f, start) {
    if(function() {
      var and__3822__auto____5120 = coll;
      if(and__3822__auto____5120) {
        return coll.cljs$core$IReduce$_reduce$arity$3
      }else {
        return and__3822__auto____5120
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$3(coll, f, start)
    }else {
      var x__1014__auto____5121 = coll == null ? null : coll;
      return function() {
        var or__3824__auto____5122 = cljs.core._reduce[goog.typeOf(x__1014__auto____5121)];
        if(or__3824__auto____5122) {
          return or__3824__auto____5122
        }else {
          var or__3824__auto____5123 = cljs.core._reduce["_"];
          if(or__3824__auto____5123) {
            return or__3824__auto____5123
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f, start)
    }
  };
  _reduce = function(coll, f, start) {
    switch(arguments.length) {
      case 2:
        return _reduce__2.call(this, coll, f);
      case 3:
        return _reduce__3.call(this, coll, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _reduce.cljs$lang$arity$2 = _reduce__2;
  _reduce.cljs$lang$arity$3 = _reduce__3;
  return _reduce
}();
cljs.core.IKVReduce = {};
cljs.core._kv_reduce = function _kv_reduce(coll, f, init) {
  if(function() {
    var and__3822__auto____5128 = coll;
    if(and__3822__auto____5128) {
      return coll.cljs$core$IKVReduce$_kv_reduce$arity$3
    }else {
      return and__3822__auto____5128
    }
  }()) {
    return coll.cljs$core$IKVReduce$_kv_reduce$arity$3(coll, f, init)
  }else {
    var x__1014__auto____5129 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____5130 = cljs.core._kv_reduce[goog.typeOf(x__1014__auto____5129)];
      if(or__3824__auto____5130) {
        return or__3824__auto____5130
      }else {
        var or__3824__auto____5131 = cljs.core._kv_reduce["_"];
        if(or__3824__auto____5131) {
          return or__3824__auto____5131
        }else {
          throw cljs.core.missing_protocol.call(null, "IKVReduce.-kv-reduce", coll);
        }
      }
    }().call(null, coll, f, init)
  }
};
cljs.core.IEquiv = {};
cljs.core._equiv = function _equiv(o, other) {
  if(function() {
    var and__3822__auto____5136 = o;
    if(and__3822__auto____5136) {
      return o.cljs$core$IEquiv$_equiv$arity$2
    }else {
      return and__3822__auto____5136
    }
  }()) {
    return o.cljs$core$IEquiv$_equiv$arity$2(o, other)
  }else {
    var x__1014__auto____5137 = o == null ? null : o;
    return function() {
      var or__3824__auto____5138 = cljs.core._equiv[goog.typeOf(x__1014__auto____5137)];
      if(or__3824__auto____5138) {
        return or__3824__auto____5138
      }else {
        var or__3824__auto____5139 = cljs.core._equiv["_"];
        if(or__3824__auto____5139) {
          return or__3824__auto____5139
        }else {
          throw cljs.core.missing_protocol.call(null, "IEquiv.-equiv", o);
        }
      }
    }().call(null, o, other)
  }
};
cljs.core.IHash = {};
cljs.core._hash = function _hash(o) {
  if(function() {
    var and__3822__auto____5144 = o;
    if(and__3822__auto____5144) {
      return o.cljs$core$IHash$_hash$arity$1
    }else {
      return and__3822__auto____5144
    }
  }()) {
    return o.cljs$core$IHash$_hash$arity$1(o)
  }else {
    var x__1014__auto____5145 = o == null ? null : o;
    return function() {
      var or__3824__auto____5146 = cljs.core._hash[goog.typeOf(x__1014__auto____5145)];
      if(or__3824__auto____5146) {
        return or__3824__auto____5146
      }else {
        var or__3824__auto____5147 = cljs.core._hash["_"];
        if(or__3824__auto____5147) {
          return or__3824__auto____5147
        }else {
          throw cljs.core.missing_protocol.call(null, "IHash.-hash", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.ISeqable = {};
cljs.core._seq = function _seq(o) {
  if(function() {
    var and__3822__auto____5152 = o;
    if(and__3822__auto____5152) {
      return o.cljs$core$ISeqable$_seq$arity$1
    }else {
      return and__3822__auto____5152
    }
  }()) {
    return o.cljs$core$ISeqable$_seq$arity$1(o)
  }else {
    var x__1014__auto____5153 = o == null ? null : o;
    return function() {
      var or__3824__auto____5154 = cljs.core._seq[goog.typeOf(x__1014__auto____5153)];
      if(or__3824__auto____5154) {
        return or__3824__auto____5154
      }else {
        var or__3824__auto____5155 = cljs.core._seq["_"];
        if(or__3824__auto____5155) {
          return or__3824__auto____5155
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeqable.-seq", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.ISequential = {};
cljs.core.IList = {};
cljs.core.IRecord = {};
cljs.core.IReversible = {};
cljs.core._rseq = function _rseq(coll) {
  if(function() {
    var and__3822__auto____5160 = coll;
    if(and__3822__auto____5160) {
      return coll.cljs$core$IReversible$_rseq$arity$1
    }else {
      return and__3822__auto____5160
    }
  }()) {
    return coll.cljs$core$IReversible$_rseq$arity$1(coll)
  }else {
    var x__1014__auto____5161 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____5162 = cljs.core._rseq[goog.typeOf(x__1014__auto____5161)];
      if(or__3824__auto____5162) {
        return or__3824__auto____5162
      }else {
        var or__3824__auto____5163 = cljs.core._rseq["_"];
        if(or__3824__auto____5163) {
          return or__3824__auto____5163
        }else {
          throw cljs.core.missing_protocol.call(null, "IReversible.-rseq", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ISorted = {};
cljs.core._sorted_seq = function _sorted_seq(coll, ascending_QMARK_) {
  if(function() {
    var and__3822__auto____5168 = coll;
    if(and__3822__auto____5168) {
      return coll.cljs$core$ISorted$_sorted_seq$arity$2
    }else {
      return and__3822__auto____5168
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq$arity$2(coll, ascending_QMARK_)
  }else {
    var x__1014__auto____5169 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____5170 = cljs.core._sorted_seq[goog.typeOf(x__1014__auto____5169)];
      if(or__3824__auto____5170) {
        return or__3824__auto____5170
      }else {
        var or__3824__auto____5171 = cljs.core._sorted_seq["_"];
        if(or__3824__auto____5171) {
          return or__3824__auto____5171
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq", coll);
        }
      }
    }().call(null, coll, ascending_QMARK_)
  }
};
cljs.core._sorted_seq_from = function _sorted_seq_from(coll, k, ascending_QMARK_) {
  if(function() {
    var and__3822__auto____5176 = coll;
    if(and__3822__auto____5176) {
      return coll.cljs$core$ISorted$_sorted_seq_from$arity$3
    }else {
      return and__3822__auto____5176
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq_from$arity$3(coll, k, ascending_QMARK_)
  }else {
    var x__1014__auto____5177 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____5178 = cljs.core._sorted_seq_from[goog.typeOf(x__1014__auto____5177)];
      if(or__3824__auto____5178) {
        return or__3824__auto____5178
      }else {
        var or__3824__auto____5179 = cljs.core._sorted_seq_from["_"];
        if(or__3824__auto____5179) {
          return or__3824__auto____5179
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq-from", coll);
        }
      }
    }().call(null, coll, k, ascending_QMARK_)
  }
};
cljs.core._entry_key = function _entry_key(coll, entry) {
  if(function() {
    var and__3822__auto____5184 = coll;
    if(and__3822__auto____5184) {
      return coll.cljs$core$ISorted$_entry_key$arity$2
    }else {
      return and__3822__auto____5184
    }
  }()) {
    return coll.cljs$core$ISorted$_entry_key$arity$2(coll, entry)
  }else {
    var x__1014__auto____5185 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____5186 = cljs.core._entry_key[goog.typeOf(x__1014__auto____5185)];
      if(or__3824__auto____5186) {
        return or__3824__auto____5186
      }else {
        var or__3824__auto____5187 = cljs.core._entry_key["_"];
        if(or__3824__auto____5187) {
          return or__3824__auto____5187
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-entry-key", coll);
        }
      }
    }().call(null, coll, entry)
  }
};
cljs.core._comparator = function _comparator(coll) {
  if(function() {
    var and__3822__auto____5192 = coll;
    if(and__3822__auto____5192) {
      return coll.cljs$core$ISorted$_comparator$arity$1
    }else {
      return and__3822__auto____5192
    }
  }()) {
    return coll.cljs$core$ISorted$_comparator$arity$1(coll)
  }else {
    var x__1014__auto____5193 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____5194 = cljs.core._comparator[goog.typeOf(x__1014__auto____5193)];
      if(or__3824__auto____5194) {
        return or__3824__auto____5194
      }else {
        var or__3824__auto____5195 = cljs.core._comparator["_"];
        if(or__3824__auto____5195) {
          return or__3824__auto____5195
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-comparator", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IPrintable = {};
cljs.core._pr_seq = function _pr_seq(o, opts) {
  if(function() {
    var and__3822__auto____5200 = o;
    if(and__3822__auto____5200) {
      return o.cljs$core$IPrintable$_pr_seq$arity$2
    }else {
      return and__3822__auto____5200
    }
  }()) {
    return o.cljs$core$IPrintable$_pr_seq$arity$2(o, opts)
  }else {
    var x__1014__auto____5201 = o == null ? null : o;
    return function() {
      var or__3824__auto____5202 = cljs.core._pr_seq[goog.typeOf(x__1014__auto____5201)];
      if(or__3824__auto____5202) {
        return or__3824__auto____5202
      }else {
        var or__3824__auto____5203 = cljs.core._pr_seq["_"];
        if(or__3824__auto____5203) {
          return or__3824__auto____5203
        }else {
          throw cljs.core.missing_protocol.call(null, "IPrintable.-pr-seq", o);
        }
      }
    }().call(null, o, opts)
  }
};
cljs.core.IPending = {};
cljs.core._realized_QMARK_ = function _realized_QMARK_(d) {
  if(function() {
    var and__3822__auto____5208 = d;
    if(and__3822__auto____5208) {
      return d.cljs$core$IPending$_realized_QMARK_$arity$1
    }else {
      return and__3822__auto____5208
    }
  }()) {
    return d.cljs$core$IPending$_realized_QMARK_$arity$1(d)
  }else {
    var x__1014__auto____5209 = d == null ? null : d;
    return function() {
      var or__3824__auto____5210 = cljs.core._realized_QMARK_[goog.typeOf(x__1014__auto____5209)];
      if(or__3824__auto____5210) {
        return or__3824__auto____5210
      }else {
        var or__3824__auto____5211 = cljs.core._realized_QMARK_["_"];
        if(or__3824__auto____5211) {
          return or__3824__auto____5211
        }else {
          throw cljs.core.missing_protocol.call(null, "IPending.-realized?", d);
        }
      }
    }().call(null, d)
  }
};
cljs.core.IWatchable = {};
cljs.core._notify_watches = function _notify_watches(this$, oldval, newval) {
  if(function() {
    var and__3822__auto____5216 = this$;
    if(and__3822__auto____5216) {
      return this$.cljs$core$IWatchable$_notify_watches$arity$3
    }else {
      return and__3822__auto____5216
    }
  }()) {
    return this$.cljs$core$IWatchable$_notify_watches$arity$3(this$, oldval, newval)
  }else {
    var x__1014__auto____5217 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____5218 = cljs.core._notify_watches[goog.typeOf(x__1014__auto____5217)];
      if(or__3824__auto____5218) {
        return or__3824__auto____5218
      }else {
        var or__3824__auto____5219 = cljs.core._notify_watches["_"];
        if(or__3824__auto____5219) {
          return or__3824__auto____5219
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-notify-watches", this$);
        }
      }
    }().call(null, this$, oldval, newval)
  }
};
cljs.core._add_watch = function _add_watch(this$, key, f) {
  if(function() {
    var and__3822__auto____5224 = this$;
    if(and__3822__auto____5224) {
      return this$.cljs$core$IWatchable$_add_watch$arity$3
    }else {
      return and__3822__auto____5224
    }
  }()) {
    return this$.cljs$core$IWatchable$_add_watch$arity$3(this$, key, f)
  }else {
    var x__1014__auto____5225 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____5226 = cljs.core._add_watch[goog.typeOf(x__1014__auto____5225)];
      if(or__3824__auto____5226) {
        return or__3824__auto____5226
      }else {
        var or__3824__auto____5227 = cljs.core._add_watch["_"];
        if(or__3824__auto____5227) {
          return or__3824__auto____5227
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-add-watch", this$);
        }
      }
    }().call(null, this$, key, f)
  }
};
cljs.core._remove_watch = function _remove_watch(this$, key) {
  if(function() {
    var and__3822__auto____5232 = this$;
    if(and__3822__auto____5232) {
      return this$.cljs$core$IWatchable$_remove_watch$arity$2
    }else {
      return and__3822__auto____5232
    }
  }()) {
    return this$.cljs$core$IWatchable$_remove_watch$arity$2(this$, key)
  }else {
    var x__1014__auto____5233 = this$ == null ? null : this$;
    return function() {
      var or__3824__auto____5234 = cljs.core._remove_watch[goog.typeOf(x__1014__auto____5233)];
      if(or__3824__auto____5234) {
        return or__3824__auto____5234
      }else {
        var or__3824__auto____5235 = cljs.core._remove_watch["_"];
        if(or__3824__auto____5235) {
          return or__3824__auto____5235
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-remove-watch", this$);
        }
      }
    }().call(null, this$, key)
  }
};
cljs.core.IEditableCollection = {};
cljs.core._as_transient = function _as_transient(coll) {
  if(function() {
    var and__3822__auto____5240 = coll;
    if(and__3822__auto____5240) {
      return coll.cljs$core$IEditableCollection$_as_transient$arity$1
    }else {
      return and__3822__auto____5240
    }
  }()) {
    return coll.cljs$core$IEditableCollection$_as_transient$arity$1(coll)
  }else {
    var x__1014__auto____5241 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____5242 = cljs.core._as_transient[goog.typeOf(x__1014__auto____5241)];
      if(or__3824__auto____5242) {
        return or__3824__auto____5242
      }else {
        var or__3824__auto____5243 = cljs.core._as_transient["_"];
        if(or__3824__auto____5243) {
          return or__3824__auto____5243
        }else {
          throw cljs.core.missing_protocol.call(null, "IEditableCollection.-as-transient", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ITransientCollection = {};
cljs.core._conj_BANG_ = function _conj_BANG_(tcoll, val) {
  if(function() {
    var and__3822__auto____5248 = tcoll;
    if(and__3822__auto____5248) {
      return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2
    }else {
      return and__3822__auto____5248
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
  }else {
    var x__1014__auto____5249 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____5250 = cljs.core._conj_BANG_[goog.typeOf(x__1014__auto____5249)];
      if(or__3824__auto____5250) {
        return or__3824__auto____5250
      }else {
        var or__3824__auto____5251 = cljs.core._conj_BANG_["_"];
        if(or__3824__auto____5251) {
          return or__3824__auto____5251
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientCollection.-conj!", tcoll);
        }
      }
    }().call(null, tcoll, val)
  }
};
cljs.core._persistent_BANG_ = function _persistent_BANG_(tcoll) {
  if(function() {
    var and__3822__auto____5256 = tcoll;
    if(and__3822__auto____5256) {
      return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1
    }else {
      return and__3822__auto____5256
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1(tcoll)
  }else {
    var x__1014__auto____5257 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____5258 = cljs.core._persistent_BANG_[goog.typeOf(x__1014__auto____5257)];
      if(or__3824__auto____5258) {
        return or__3824__auto____5258
      }else {
        var or__3824__auto____5259 = cljs.core._persistent_BANG_["_"];
        if(or__3824__auto____5259) {
          return or__3824__auto____5259
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientCollection.-persistent!", tcoll);
        }
      }
    }().call(null, tcoll)
  }
};
cljs.core.ITransientAssociative = {};
cljs.core._assoc_BANG_ = function _assoc_BANG_(tcoll, key, val) {
  if(function() {
    var and__3822__auto____5264 = tcoll;
    if(and__3822__auto____5264) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3
    }else {
      return and__3822__auto____5264
    }
  }()) {
    return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, key, val)
  }else {
    var x__1014__auto____5265 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____5266 = cljs.core._assoc_BANG_[goog.typeOf(x__1014__auto____5265)];
      if(or__3824__auto____5266) {
        return or__3824__auto____5266
      }else {
        var or__3824__auto____5267 = cljs.core._assoc_BANG_["_"];
        if(or__3824__auto____5267) {
          return or__3824__auto____5267
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientAssociative.-assoc!", tcoll);
        }
      }
    }().call(null, tcoll, key, val)
  }
};
cljs.core.ITransientMap = {};
cljs.core._dissoc_BANG_ = function _dissoc_BANG_(tcoll, key) {
  if(function() {
    var and__3822__auto____5272 = tcoll;
    if(and__3822__auto____5272) {
      return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2
    }else {
      return and__3822__auto____5272
    }
  }()) {
    return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2(tcoll, key)
  }else {
    var x__1014__auto____5273 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____5274 = cljs.core._dissoc_BANG_[goog.typeOf(x__1014__auto____5273)];
      if(or__3824__auto____5274) {
        return or__3824__auto____5274
      }else {
        var or__3824__auto____5275 = cljs.core._dissoc_BANG_["_"];
        if(or__3824__auto____5275) {
          return or__3824__auto____5275
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientMap.-dissoc!", tcoll);
        }
      }
    }().call(null, tcoll, key)
  }
};
cljs.core.ITransientVector = {};
cljs.core._assoc_n_BANG_ = function _assoc_n_BANG_(tcoll, n, val) {
  if(function() {
    var and__3822__auto____5280 = tcoll;
    if(and__3822__auto____5280) {
      return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3
    }else {
      return and__3822__auto____5280
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, n, val)
  }else {
    var x__1014__auto____5281 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____5282 = cljs.core._assoc_n_BANG_[goog.typeOf(x__1014__auto____5281)];
      if(or__3824__auto____5282) {
        return or__3824__auto____5282
      }else {
        var or__3824__auto____5283 = cljs.core._assoc_n_BANG_["_"];
        if(or__3824__auto____5283) {
          return or__3824__auto____5283
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientVector.-assoc-n!", tcoll);
        }
      }
    }().call(null, tcoll, n, val)
  }
};
cljs.core._pop_BANG_ = function _pop_BANG_(tcoll) {
  if(function() {
    var and__3822__auto____5288 = tcoll;
    if(and__3822__auto____5288) {
      return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1
    }else {
      return and__3822__auto____5288
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1(tcoll)
  }else {
    var x__1014__auto____5289 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____5290 = cljs.core._pop_BANG_[goog.typeOf(x__1014__auto____5289)];
      if(or__3824__auto____5290) {
        return or__3824__auto____5290
      }else {
        var or__3824__auto____5291 = cljs.core._pop_BANG_["_"];
        if(or__3824__auto____5291) {
          return or__3824__auto____5291
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientVector.-pop!", tcoll);
        }
      }
    }().call(null, tcoll)
  }
};
cljs.core.ITransientSet = {};
cljs.core._disjoin_BANG_ = function _disjoin_BANG_(tcoll, v) {
  if(function() {
    var and__3822__auto____5296 = tcoll;
    if(and__3822__auto____5296) {
      return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2
    }else {
      return and__3822__auto____5296
    }
  }()) {
    return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2(tcoll, v)
  }else {
    var x__1014__auto____5297 = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto____5298 = cljs.core._disjoin_BANG_[goog.typeOf(x__1014__auto____5297)];
      if(or__3824__auto____5298) {
        return or__3824__auto____5298
      }else {
        var or__3824__auto____5299 = cljs.core._disjoin_BANG_["_"];
        if(or__3824__auto____5299) {
          return or__3824__auto____5299
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientSet.-disjoin!", tcoll);
        }
      }
    }().call(null, tcoll, v)
  }
};
cljs.core.IComparable = {};
cljs.core._compare = function _compare(x, y) {
  if(function() {
    var and__3822__auto____5304 = x;
    if(and__3822__auto____5304) {
      return x.cljs$core$IComparable$_compare$arity$2
    }else {
      return and__3822__auto____5304
    }
  }()) {
    return x.cljs$core$IComparable$_compare$arity$2(x, y)
  }else {
    var x__1014__auto____5305 = x == null ? null : x;
    return function() {
      var or__3824__auto____5306 = cljs.core._compare[goog.typeOf(x__1014__auto____5305)];
      if(or__3824__auto____5306) {
        return or__3824__auto____5306
      }else {
        var or__3824__auto____5307 = cljs.core._compare["_"];
        if(or__3824__auto____5307) {
          return or__3824__auto____5307
        }else {
          throw cljs.core.missing_protocol.call(null, "IComparable.-compare", x);
        }
      }
    }().call(null, x, y)
  }
};
cljs.core.IChunk = {};
cljs.core._drop_first = function _drop_first(coll) {
  if(function() {
    var and__3822__auto____5312 = coll;
    if(and__3822__auto____5312) {
      return coll.cljs$core$IChunk$_drop_first$arity$1
    }else {
      return and__3822__auto____5312
    }
  }()) {
    return coll.cljs$core$IChunk$_drop_first$arity$1(coll)
  }else {
    var x__1014__auto____5313 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____5314 = cljs.core._drop_first[goog.typeOf(x__1014__auto____5313)];
      if(or__3824__auto____5314) {
        return or__3824__auto____5314
      }else {
        var or__3824__auto____5315 = cljs.core._drop_first["_"];
        if(or__3824__auto____5315) {
          return or__3824__auto____5315
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunk.-drop-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IChunkedSeq = {};
cljs.core._chunked_first = function _chunked_first(coll) {
  if(function() {
    var and__3822__auto____5320 = coll;
    if(and__3822__auto____5320) {
      return coll.cljs$core$IChunkedSeq$_chunked_first$arity$1
    }else {
      return and__3822__auto____5320
    }
  }()) {
    return coll.cljs$core$IChunkedSeq$_chunked_first$arity$1(coll)
  }else {
    var x__1014__auto____5321 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____5322 = cljs.core._chunked_first[goog.typeOf(x__1014__auto____5321)];
      if(or__3824__auto____5322) {
        return or__3824__auto____5322
      }else {
        var or__3824__auto____5323 = cljs.core._chunked_first["_"];
        if(or__3824__auto____5323) {
          return or__3824__auto____5323
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedSeq.-chunked-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._chunked_rest = function _chunked_rest(coll) {
  if(function() {
    var and__3822__auto____5328 = coll;
    if(and__3822__auto____5328) {
      return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1
    }else {
      return and__3822__auto____5328
    }
  }()) {
    return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1(coll)
  }else {
    var x__1014__auto____5329 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____5330 = cljs.core._chunked_rest[goog.typeOf(x__1014__auto____5329)];
      if(or__3824__auto____5330) {
        return or__3824__auto____5330
      }else {
        var or__3824__auto____5331 = cljs.core._chunked_rest["_"];
        if(or__3824__auto____5331) {
          return or__3824__auto____5331
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedSeq.-chunked-rest", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IChunkedNext = {};
cljs.core._chunked_next = function _chunked_next(coll) {
  if(function() {
    var and__3822__auto____5336 = coll;
    if(and__3822__auto____5336) {
      return coll.cljs$core$IChunkedNext$_chunked_next$arity$1
    }else {
      return and__3822__auto____5336
    }
  }()) {
    return coll.cljs$core$IChunkedNext$_chunked_next$arity$1(coll)
  }else {
    var x__1014__auto____5337 = coll == null ? null : coll;
    return function() {
      var or__3824__auto____5338 = cljs.core._chunked_next[goog.typeOf(x__1014__auto____5337)];
      if(or__3824__auto____5338) {
        return or__3824__auto____5338
      }else {
        var or__3824__auto____5339 = cljs.core._chunked_next["_"];
        if(or__3824__auto____5339) {
          return or__3824__auto____5339
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedNext.-chunked-next", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.identical_QMARK_ = function identical_QMARK_(x, y) {
  return x === y
};
cljs.core._EQ_ = function() {
  var _EQ_ = null;
  var _EQ___1 = function(x) {
    return true
  };
  var _EQ___2 = function(x, y) {
    var or__3824__auto____5341 = x === y;
    if(or__3824__auto____5341) {
      return or__3824__auto____5341
    }else {
      return cljs.core._equiv.call(null, x, y)
    }
  };
  var _EQ___3 = function() {
    var G__5342__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ_.call(null, x, y))) {
          if(cljs.core.next.call(null, more)) {
            var G__5343 = y;
            var G__5344 = cljs.core.first.call(null, more);
            var G__5345 = cljs.core.next.call(null, more);
            x = G__5343;
            y = G__5344;
            more = G__5345;
            continue
          }else {
            return _EQ_.call(null, y, cljs.core.first.call(null, more))
          }
        }else {
          return false
        }
        break
      }
    };
    var G__5342 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__5342__delegate.call(this, x, y, more)
    };
    G__5342.cljs$lang$maxFixedArity = 2;
    G__5342.cljs$lang$applyTo = function(arglist__5346) {
      var x = cljs.core.first(arglist__5346);
      var y = cljs.core.first(cljs.core.next(arglist__5346));
      var more = cljs.core.rest(cljs.core.next(arglist__5346));
      return G__5342__delegate(x, y, more)
    };
    G__5342.cljs$lang$arity$variadic = G__5342__delegate;
    return G__5342
  }();
  _EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _EQ___1.call(this, x);
      case 2:
        return _EQ___2.call(this, x, y);
      default:
        return _EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _EQ_.cljs$lang$maxFixedArity = 2;
  _EQ_.cljs$lang$applyTo = _EQ___3.cljs$lang$applyTo;
  _EQ_.cljs$lang$arity$1 = _EQ___1;
  _EQ_.cljs$lang$arity$2 = _EQ___2;
  _EQ_.cljs$lang$arity$variadic = _EQ___3.cljs$lang$arity$variadic;
  return _EQ_
}();
cljs.core.nil_QMARK_ = function nil_QMARK_(x) {
  return x == null
};
cljs.core.type = function type(x) {
  if(x == null) {
    return null
  }else {
    return x.constructor
  }
};
cljs.core.instance_QMARK_ = function instance_QMARK_(t, o) {
  return o instanceof t
};
cljs.core.IHash["null"] = true;
cljs.core._hash["null"] = function(o) {
  return 0
};
cljs.core.ILookup["null"] = true;
cljs.core._lookup["null"] = function() {
  var G__5347 = null;
  var G__5347__2 = function(o, k) {
    return null
  };
  var G__5347__3 = function(o, k, not_found) {
    return not_found
  };
  G__5347 = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__5347__2.call(this, o, k);
      case 3:
        return G__5347__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5347
}();
cljs.core.IAssociative["null"] = true;
cljs.core._assoc["null"] = function(_, k, v) {
  return cljs.core.hash_map.call(null, k, v)
};
cljs.core.INext["null"] = true;
cljs.core._next["null"] = function(_) {
  return null
};
cljs.core.ICollection["null"] = true;
cljs.core._conj["null"] = function(_, o) {
  return cljs.core.list.call(null, o)
};
cljs.core.IReduce["null"] = true;
cljs.core._reduce["null"] = function() {
  var G__5348 = null;
  var G__5348__2 = function(_, f) {
    return f.call(null)
  };
  var G__5348__3 = function(_, f, start) {
    return start
  };
  G__5348 = function(_, f, start) {
    switch(arguments.length) {
      case 2:
        return G__5348__2.call(this, _, f);
      case 3:
        return G__5348__3.call(this, _, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5348
}();
cljs.core.IPrintable["null"] = true;
cljs.core._pr_seq["null"] = function(o) {
  return cljs.core.list.call(null, "nil")
};
cljs.core.ISet["null"] = true;
cljs.core._disjoin["null"] = function(_, v) {
  return null
};
cljs.core.ICounted["null"] = true;
cljs.core._count["null"] = function(_) {
  return 0
};
cljs.core.IStack["null"] = true;
cljs.core._peek["null"] = function(_) {
  return null
};
cljs.core._pop["null"] = function(_) {
  return null
};
cljs.core.ISeq["null"] = true;
cljs.core._first["null"] = function(_) {
  return null
};
cljs.core._rest["null"] = function(_) {
  return cljs.core.list.call(null)
};
cljs.core.IEquiv["null"] = true;
cljs.core._equiv["null"] = function(_, o) {
  return o == null
};
cljs.core.IWithMeta["null"] = true;
cljs.core._with_meta["null"] = function(_, meta) {
  return null
};
cljs.core.IMeta["null"] = true;
cljs.core._meta["null"] = function(_) {
  return null
};
cljs.core.IIndexed["null"] = true;
cljs.core._nth["null"] = function() {
  var G__5349 = null;
  var G__5349__2 = function(_, n) {
    return null
  };
  var G__5349__3 = function(_, n, not_found) {
    return not_found
  };
  G__5349 = function(_, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__5349__2.call(this, _, n);
      case 3:
        return G__5349__3.call(this, _, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5349
}();
cljs.core.IEmptyableCollection["null"] = true;
cljs.core._empty["null"] = function(_) {
  return null
};
cljs.core.IMap["null"] = true;
cljs.core._dissoc["null"] = function(_, k) {
  return null
};
Date.prototype.cljs$core$IEquiv$ = true;
Date.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var and__3822__auto____5350 = cljs.core.instance_QMARK_.call(null, Date, other);
  if(and__3822__auto____5350) {
    return o.toString() === other.toString()
  }else {
    return and__3822__auto____5350
  }
};
cljs.core.IHash["number"] = true;
cljs.core._hash["number"] = function(o) {
  return o
};
cljs.core.IEquiv["number"] = true;
cljs.core._equiv["number"] = function(x, o) {
  return x === o
};
cljs.core.IHash["boolean"] = true;
cljs.core._hash["boolean"] = function(o) {
  if(o === true) {
    return 1
  }else {
    return 0
  }
};
cljs.core.IHash["_"] = true;
cljs.core._hash["_"] = function(o) {
  return goog.getUid(o)
};
cljs.core.inc = function inc(x) {
  return x + 1
};
cljs.core.ci_reduce = function() {
  var ci_reduce = null;
  var ci_reduce__2 = function(cicoll, f) {
    var cnt__5363 = cljs.core._count.call(null, cicoll);
    if(cnt__5363 === 0) {
      return f.call(null)
    }else {
      var val__5364 = cljs.core._nth.call(null, cicoll, 0);
      var n__5365 = 1;
      while(true) {
        if(n__5365 < cnt__5363) {
          var nval__5366 = f.call(null, val__5364, cljs.core._nth.call(null, cicoll, n__5365));
          if(cljs.core.reduced_QMARK_.call(null, nval__5366)) {
            return cljs.core.deref.call(null, nval__5366)
          }else {
            var G__5375 = nval__5366;
            var G__5376 = n__5365 + 1;
            val__5364 = G__5375;
            n__5365 = G__5376;
            continue
          }
        }else {
          return val__5364
        }
        break
      }
    }
  };
  var ci_reduce__3 = function(cicoll, f, val) {
    var cnt__5367 = cljs.core._count.call(null, cicoll);
    var val__5368 = val;
    var n__5369 = 0;
    while(true) {
      if(n__5369 < cnt__5367) {
        var nval__5370 = f.call(null, val__5368, cljs.core._nth.call(null, cicoll, n__5369));
        if(cljs.core.reduced_QMARK_.call(null, nval__5370)) {
          return cljs.core.deref.call(null, nval__5370)
        }else {
          var G__5377 = nval__5370;
          var G__5378 = n__5369 + 1;
          val__5368 = G__5377;
          n__5369 = G__5378;
          continue
        }
      }else {
        return val__5368
      }
      break
    }
  };
  var ci_reduce__4 = function(cicoll, f, val, idx) {
    var cnt__5371 = cljs.core._count.call(null, cicoll);
    var val__5372 = val;
    var n__5373 = idx;
    while(true) {
      if(n__5373 < cnt__5371) {
        var nval__5374 = f.call(null, val__5372, cljs.core._nth.call(null, cicoll, n__5373));
        if(cljs.core.reduced_QMARK_.call(null, nval__5374)) {
          return cljs.core.deref.call(null, nval__5374)
        }else {
          var G__5379 = nval__5374;
          var G__5380 = n__5373 + 1;
          val__5372 = G__5379;
          n__5373 = G__5380;
          continue
        }
      }else {
        return val__5372
      }
      break
    }
  };
  ci_reduce = function(cicoll, f, val, idx) {
    switch(arguments.length) {
      case 2:
        return ci_reduce__2.call(this, cicoll, f);
      case 3:
        return ci_reduce__3.call(this, cicoll, f, val);
      case 4:
        return ci_reduce__4.call(this, cicoll, f, val, idx)
    }
    throw"Invalid arity: " + arguments.length;
  };
  ci_reduce.cljs$lang$arity$2 = ci_reduce__2;
  ci_reduce.cljs$lang$arity$3 = ci_reduce__3;
  ci_reduce.cljs$lang$arity$4 = ci_reduce__4;
  return ci_reduce
}();
cljs.core.array_reduce = function() {
  var array_reduce = null;
  var array_reduce__2 = function(arr, f) {
    var cnt__5393 = arr.length;
    if(arr.length === 0) {
      return f.call(null)
    }else {
      var val__5394 = arr[0];
      var n__5395 = 1;
      while(true) {
        if(n__5395 < cnt__5393) {
          var nval__5396 = f.call(null, val__5394, arr[n__5395]);
          if(cljs.core.reduced_QMARK_.call(null, nval__5396)) {
            return cljs.core.deref.call(null, nval__5396)
          }else {
            var G__5405 = nval__5396;
            var G__5406 = n__5395 + 1;
            val__5394 = G__5405;
            n__5395 = G__5406;
            continue
          }
        }else {
          return val__5394
        }
        break
      }
    }
  };
  var array_reduce__3 = function(arr, f, val) {
    var cnt__5397 = arr.length;
    var val__5398 = val;
    var n__5399 = 0;
    while(true) {
      if(n__5399 < cnt__5397) {
        var nval__5400 = f.call(null, val__5398, arr[n__5399]);
        if(cljs.core.reduced_QMARK_.call(null, nval__5400)) {
          return cljs.core.deref.call(null, nval__5400)
        }else {
          var G__5407 = nval__5400;
          var G__5408 = n__5399 + 1;
          val__5398 = G__5407;
          n__5399 = G__5408;
          continue
        }
      }else {
        return val__5398
      }
      break
    }
  };
  var array_reduce__4 = function(arr, f, val, idx) {
    var cnt__5401 = arr.length;
    var val__5402 = val;
    var n__5403 = idx;
    while(true) {
      if(n__5403 < cnt__5401) {
        var nval__5404 = f.call(null, val__5402, arr[n__5403]);
        if(cljs.core.reduced_QMARK_.call(null, nval__5404)) {
          return cljs.core.deref.call(null, nval__5404)
        }else {
          var G__5409 = nval__5404;
          var G__5410 = n__5403 + 1;
          val__5402 = G__5409;
          n__5403 = G__5410;
          continue
        }
      }else {
        return val__5402
      }
      break
    }
  };
  array_reduce = function(arr, f, val, idx) {
    switch(arguments.length) {
      case 2:
        return array_reduce__2.call(this, arr, f);
      case 3:
        return array_reduce__3.call(this, arr, f, val);
      case 4:
        return array_reduce__4.call(this, arr, f, val, idx)
    }
    throw"Invalid arity: " + arguments.length;
  };
  array_reduce.cljs$lang$arity$2 = array_reduce__2;
  array_reduce.cljs$lang$arity$3 = array_reduce__3;
  array_reduce.cljs$lang$arity$4 = array_reduce__4;
  return array_reduce
}();
cljs.core.IndexedSeq = function(a, i) {
  this.a = a;
  this.i = i;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 166199546
};
cljs.core.IndexedSeq.cljs$lang$type = true;
cljs.core.IndexedSeq.cljs$lang$ctorPrSeq = function(this__960__auto__) {
  return cljs.core.list.call(null, "cljs.core/IndexedSeq")
};
cljs.core.IndexedSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__5411 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$INext$_next$arity$1 = function(_) {
  var this__5412 = this;
  if(this__5412.i + 1 < this__5412.a.length) {
    return new cljs.core.IndexedSeq(this__5412.a, this__5412.i + 1)
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__5413 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__5414 = this;
  var c__5415 = coll.cljs$core$ICounted$_count$arity$1(coll);
  if(c__5415 > 0) {
    return new cljs.core.RSeq(coll, c__5415 - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.IndexedSeq.prototype.toString = function() {
  var this__5416 = this;
  var this__5417 = this;
  return cljs.core.pr_str.call(null, this__5417)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__5418 = this;
  if(cljs.core.counted_QMARK_.call(null, this__5418.a)) {
    return cljs.core.ci_reduce.call(null, this__5418.a, f, this__5418.a[this__5418.i], this__5418.i + 1)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, this__5418.a[this__5418.i], 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__5419 = this;
  if(cljs.core.counted_QMARK_.call(null, this__5419.a)) {
    return cljs.core.ci_reduce.call(null, this__5419.a, f, start, this__5419.i)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, start, 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__5420 = this;
  return this$
};
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__5421 = this;
  return this__5421.a.length - this__5421.i
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(_) {
  var this__5422 = this;
  return this__5422.a[this__5422.i]
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(_) {
  var this__5423 = this;
  if(this__5423.i + 1 < this__5423.a.length) {
    return new cljs.core.IndexedSeq(this__5423.a, this__5423.i + 1)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__5424 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__5425 = this;
  var i__5426 = n + this__5425.i;
  if(i__5426 < this__5425.a.length) {
    return this__5425.a[i__5426]
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__5427 = this;
  var i__5428 = n + this__5427.i;
  if(i__5428 < this__5427.a.length) {
    return this__5427.a[i__5428]
  }else {
    return not_found
  }
};
cljs.core.IndexedSeq;
cljs.core.prim_seq = function() {
  var prim_seq = null;
  var prim_seq__1 = function(prim) {
    return prim_seq.call(null, prim, 0)
  };
  var prim_seq__2 = function(prim, i) {
    if(prim.length === 0) {
      return null
    }else {
      return new cljs.core.IndexedSeq(prim, i)
    }
  };
  prim_seq = function(prim, i) {
    switch(arguments.length) {
      case 1:
        return prim_seq__1.call(this, prim);
      case 2:
        return prim_seq__2.call(this, prim, i)
    }
    throw"Invalid arity: " + arguments.length;
  };
  prim_seq.cljs$lang$arity$1 = prim_seq__1;
  prim_seq.cljs$lang$arity$2 = prim_seq__2;
  return prim_seq
}();
cljs.core.array_seq = function() {
  var array_seq = null;
  var array_seq__1 = function(array) {
    return cljs.core.prim_seq.call(null, array, 0)
  };
  var array_seq__2 = function(array, i) {
    return cljs.core.prim_seq.call(null, array, i)
  };
  array_seq = function(array, i) {
    switch(arguments.length) {
      case 1:
        return array_seq__1.call(this, array);
      case 2:
        return array_seq__2.call(this, array, i)
    }
    throw"Invalid arity: " + arguments.length;
  };
  array_seq.cljs$lang$arity$1 = array_seq__1;
  array_seq.cljs$lang$arity$2 = array_seq__2;
  return array_seq
}();
cljs.core.IReduce["array"] = true;
cljs.core._reduce["array"] = function() {
  var G__5429 = null;
  var G__5429__2 = function(array, f) {
    return cljs.core.ci_reduce.call(null, array, f)
  };
  var G__5429__3 = function(array, f, start) {
    return cljs.core.ci_reduce.call(null, array, f, start)
  };
  G__5429 = function(array, f, start) {
    switch(arguments.length) {
      case 2:
        return G__5429__2.call(this, array, f);
      case 3:
        return G__5429__3.call(this, array, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5429
}();
cljs.core.ILookup["array"] = true;
cljs.core._lookup["array"] = function() {
  var G__5430 = null;
  var G__5430__2 = function(array, k) {
    return array[k]
  };
  var G__5430__3 = function(array, k, not_found) {
    return cljs.core._nth.call(null, array, k, not_found)
  };
  G__5430 = function(array, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__5430__2.call(this, array, k);
      case 3:
        return G__5430__3.call(this, array, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5430
}();
cljs.core.IIndexed["array"] = true;
cljs.core._nth["array"] = function() {
  var G__5431 = null;
  var G__5431__2 = function(array, n) {
    if(n < array.length) {
      return array[n]
    }else {
      return null
    }
  };
  var G__5431__3 = function(array, n, not_found) {
    if(n < array.length) {
      return array[n]
    }else {
      return not_found
    }
  };
  G__5431 = function(array, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__5431__2.call(this, array, n);
      case 3:
        return G__5431__3.call(this, array, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5431
}();
cljs.core.ICounted["array"] = true;
cljs.core._count["array"] = function(a) {
  return a.length
};
cljs.core.ISeqable["array"] = true;
cljs.core._seq["array"] = function(array) {
  return cljs.core.array_seq.call(null, array, 0)
};
cljs.core.RSeq = function(ci, i, meta) {
  this.ci = ci;
  this.i = i;
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850570
};
cljs.core.RSeq.cljs$lang$type = true;
cljs.core.RSeq.cljs$lang$ctorPrSeq = function(this__960__auto__) {
  return cljs.core.list.call(null, "cljs.core/RSeq")
};
cljs.core.RSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__5432 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.RSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__5433 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.RSeq.prototype.toString = function() {
  var this__5434 = this;
  var this__5435 = this;
  return cljs.core.pr_str.call(null, this__5435)
};
cljs.core.RSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__5436 = this;
  return coll
};
cljs.core.RSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__5437 = this;
  return this__5437.i + 1
};
cljs.core.RSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__5438 = this;
  return cljs.core._nth.call(null, this__5438.ci, this__5438.i)
};
cljs.core.RSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__5439 = this;
  if(this__5439.i > 0) {
    return new cljs.core.RSeq(this__5439.ci, this__5439.i - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.RSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__5440 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, new_meta) {
  var this__5441 = this;
  return new cljs.core.RSeq(this__5441.ci, this__5441.i, new_meta)
};
cljs.core.RSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__5442 = this;
  return this__5442.meta
};
cljs.core.RSeq;
cljs.core.seq = function seq(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__5446__5447 = coll;
      if(G__5446__5447) {
        if(function() {
          var or__3824__auto____5448 = G__5446__5447.cljs$lang$protocol_mask$partition0$ & 32;
          if(or__3824__auto____5448) {
            return or__3824__auto____5448
          }else {
            return G__5446__5447.cljs$core$ASeq$
          }
        }()) {
          return true
        }else {
          if(!G__5446__5447.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__5446__5447)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__5446__5447)
      }
    }()) {
      return coll
    }else {
      return cljs.core._seq.call(null, coll)
    }
  }
};
cljs.core.first = function first(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__5453__5454 = coll;
      if(G__5453__5454) {
        if(function() {
          var or__3824__auto____5455 = G__5453__5454.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____5455) {
            return or__3824__auto____5455
          }else {
            return G__5453__5454.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__5453__5454.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__5453__5454)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__5453__5454)
      }
    }()) {
      return cljs.core._first.call(null, coll)
    }else {
      var s__5456 = cljs.core.seq.call(null, coll);
      if(s__5456 == null) {
        return null
      }else {
        return cljs.core._first.call(null, s__5456)
      }
    }
  }
};
cljs.core.rest = function rest(coll) {
  if(!(coll == null)) {
    if(function() {
      var G__5461__5462 = coll;
      if(G__5461__5462) {
        if(function() {
          var or__3824__auto____5463 = G__5461__5462.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____5463) {
            return or__3824__auto____5463
          }else {
            return G__5461__5462.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__5461__5462.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__5461__5462)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__5461__5462)
      }
    }()) {
      return cljs.core._rest.call(null, coll)
    }else {
      var s__5464 = cljs.core.seq.call(null, coll);
      if(!(s__5464 == null)) {
        return cljs.core._rest.call(null, s__5464)
      }else {
        return cljs.core.List.EMPTY
      }
    }
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.next = function next(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__5468__5469 = coll;
      if(G__5468__5469) {
        if(function() {
          var or__3824__auto____5470 = G__5468__5469.cljs$lang$protocol_mask$partition0$ & 128;
          if(or__3824__auto____5470) {
            return or__3824__auto____5470
          }else {
            return G__5468__5469.cljs$core$INext$
          }
        }()) {
          return true
        }else {
          if(!G__5468__5469.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.INext, G__5468__5469)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.INext, G__5468__5469)
      }
    }()) {
      return cljs.core._next.call(null, coll)
    }else {
      return cljs.core.seq.call(null, cljs.core.rest.call(null, coll))
    }
  }
};
cljs.core.second = function second(coll) {
  return cljs.core.first.call(null, cljs.core.next.call(null, coll))
};
cljs.core.ffirst = function ffirst(coll) {
  return cljs.core.first.call(null, cljs.core.first.call(null, coll))
};
cljs.core.nfirst = function nfirst(coll) {
  return cljs.core.next.call(null, cljs.core.first.call(null, coll))
};
cljs.core.fnext = function fnext(coll) {
  return cljs.core.first.call(null, cljs.core.next.call(null, coll))
};
cljs.core.nnext = function nnext(coll) {
  return cljs.core.next.call(null, cljs.core.next.call(null, coll))
};
cljs.core.last = function last(s) {
  while(true) {
    var sn__5472 = cljs.core.next.call(null, s);
    if(!(sn__5472 == null)) {
      var G__5473 = sn__5472;
      s = G__5473;
      continue
    }else {
      return cljs.core.first.call(null, s)
    }
    break
  }
};
cljs.core.IEquiv["_"] = true;
cljs.core._equiv["_"] = function(x, o) {
  return x === o
};
cljs.core.not = function not(x) {
  if(cljs.core.truth_(x)) {
    return false
  }else {
    return true
  }
};
cljs.core.conj = function() {
  var conj = null;
  var conj__2 = function(coll, x) {
    return cljs.core._conj.call(null, coll, x)
  };
  var conj__3 = function() {
    var G__5474__delegate = function(coll, x, xs) {
      while(true) {
        if(cljs.core.truth_(xs)) {
          var G__5475 = conj.call(null, coll, x);
          var G__5476 = cljs.core.first.call(null, xs);
          var G__5477 = cljs.core.next.call(null, xs);
          coll = G__5475;
          x = G__5476;
          xs = G__5477;
          continue
        }else {
          return conj.call(null, coll, x)
        }
        break
      }
    };
    var G__5474 = function(coll, x, var_args) {
      var xs = null;
      if(goog.isDef(var_args)) {
        xs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__5474__delegate.call(this, coll, x, xs)
    };
    G__5474.cljs$lang$maxFixedArity = 2;
    G__5474.cljs$lang$applyTo = function(arglist__5478) {
      var coll = cljs.core.first(arglist__5478);
      var x = cljs.core.first(cljs.core.next(arglist__5478));
      var xs = cljs.core.rest(cljs.core.next(arglist__5478));
      return G__5474__delegate(coll, x, xs)
    };
    G__5474.cljs$lang$arity$variadic = G__5474__delegate;
    return G__5474
  }();
  conj = function(coll, x, var_args) {
    var xs = var_args;
    switch(arguments.length) {
      case 2:
        return conj__2.call(this, coll, x);
      default:
        return conj__3.cljs$lang$arity$variadic(coll, x, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  conj.cljs$lang$maxFixedArity = 2;
  conj.cljs$lang$applyTo = conj__3.cljs$lang$applyTo;
  conj.cljs$lang$arity$2 = conj__2;
  conj.cljs$lang$arity$variadic = conj__3.cljs$lang$arity$variadic;
  return conj
}();
cljs.core.empty = function empty(coll) {
  return cljs.core._empty.call(null, coll)
};
cljs.core.accumulating_seq_count = function accumulating_seq_count(coll) {
  var s__5481 = cljs.core.seq.call(null, coll);
  var acc__5482 = 0;
  while(true) {
    if(cljs.core.counted_QMARK_.call(null, s__5481)) {
      return acc__5482 + cljs.core._count.call(null, s__5481)
    }else {
      var G__5483 = cljs.core.next.call(null, s__5481);
      var G__5484 = acc__5482 + 1;
      s__5481 = G__5483;
      acc__5482 = G__5484;
      continue
    }
    break
  }
};
cljs.core.count = function count(coll) {
  if(cljs.core.counted_QMARK_.call(null, coll)) {
    return cljs.core._count.call(null, coll)
  }else {
    return cljs.core.accumulating_seq_count.call(null, coll)
  }
};
cljs.core.linear_traversal_nth = function() {
  var linear_traversal_nth = null;
  var linear_traversal_nth__2 = function(coll, n) {
    if(coll == null) {
      throw new Error("Index out of bounds");
    }else {
      if(n === 0) {
        if(cljs.core.seq.call(null, coll)) {
          return cljs.core.first.call(null, coll)
        }else {
          throw new Error("Index out of bounds");
        }
      }else {
        if(cljs.core.indexed_QMARK_.call(null, coll)) {
          return cljs.core._nth.call(null, coll, n)
        }else {
          if(cljs.core.seq.call(null, coll)) {
            return linear_traversal_nth.call(null, cljs.core.next.call(null, coll), n - 1)
          }else {
            if("\ufdd0'else") {
              throw new Error("Index out of bounds");
            }else {
              return null
            }
          }
        }
      }
    }
  };
  var linear_traversal_nth__3 = function(coll, n, not_found) {
    if(coll == null) {
      return not_found
    }else {
      if(n === 0) {
        if(cljs.core.seq.call(null, coll)) {
          return cljs.core.first.call(null, coll)
        }else {
          return not_found
        }
      }else {
        if(cljs.core.indexed_QMARK_.call(null, coll)) {
          return cljs.core._nth.call(null, coll, n, not_found)
        }else {
          if(cljs.core.seq.call(null, coll)) {
            return linear_traversal_nth.call(null, cljs.core.next.call(null, coll), n - 1, not_found)
          }else {
            if("\ufdd0'else") {
              return not_found
            }else {
              return null
            }
          }
        }
      }
    }
  };
  linear_traversal_nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return linear_traversal_nth__2.call(this, coll, n);
      case 3:
        return linear_traversal_nth__3.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  linear_traversal_nth.cljs$lang$arity$2 = linear_traversal_nth__2;
  linear_traversal_nth.cljs$lang$arity$3 = linear_traversal_nth__3;
  return linear_traversal_nth
}();
cljs.core.nth = function() {
  var nth = null;
  var nth__2 = function(coll, n) {
    if(coll == null) {
      return null
    }else {
      if(function() {
        var G__5491__5492 = coll;
        if(G__5491__5492) {
          if(function() {
            var or__3824__auto____5493 = G__5491__5492.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3824__auto____5493) {
              return or__3824__auto____5493
            }else {
              return G__5491__5492.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__5491__5492.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__5491__5492)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__5491__5492)
        }
      }()) {
        return cljs.core._nth.call(null, coll, Math.floor(n))
      }else {
        return cljs.core.linear_traversal_nth.call(null, coll, Math.floor(n))
      }
    }
  };
  var nth__3 = function(coll, n, not_found) {
    if(!(coll == null)) {
      if(function() {
        var G__5494__5495 = coll;
        if(G__5494__5495) {
          if(function() {
            var or__3824__auto____5496 = G__5494__5495.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3824__auto____5496) {
              return or__3824__auto____5496
            }else {
              return G__5494__5495.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__5494__5495.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__5494__5495)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__5494__5495)
        }
      }()) {
        return cljs.core._nth.call(null, coll, Math.floor(n), not_found)
      }else {
        return cljs.core.linear_traversal_nth.call(null, coll, Math.floor(n), not_found)
      }
    }else {
      return not_found
    }
  };
  nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return nth__2.call(this, coll, n);
      case 3:
        return nth__3.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  nth.cljs$lang$arity$2 = nth__2;
  nth.cljs$lang$arity$3 = nth__3;
  return nth
}();
cljs.core.get = function() {
  var get = null;
  var get__2 = function(o, k) {
    return cljs.core._lookup.call(null, o, k)
  };
  var get__3 = function(o, k, not_found) {
    return cljs.core._lookup.call(null, o, k, not_found)
  };
  get = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return get__2.call(this, o, k);
      case 3:
        return get__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  get.cljs$lang$arity$2 = get__2;
  get.cljs$lang$arity$3 = get__3;
  return get
}();
cljs.core.assoc = function() {
  var assoc = null;
  var assoc__3 = function(coll, k, v) {
    return cljs.core._assoc.call(null, coll, k, v)
  };
  var assoc__4 = function() {
    var G__5499__delegate = function(coll, k, v, kvs) {
      while(true) {
        var ret__5498 = assoc.call(null, coll, k, v);
        if(cljs.core.truth_(kvs)) {
          var G__5500 = ret__5498;
          var G__5501 = cljs.core.first.call(null, kvs);
          var G__5502 = cljs.core.second.call(null, kvs);
          var G__5503 = cljs.core.nnext.call(null, kvs);
          coll = G__5500;
          k = G__5501;
          v = G__5502;
          kvs = G__5503;
          continue
        }else {
          return ret__5498
        }
        break
      }
    };
    var G__5499 = function(coll, k, v, var_args) {
      var kvs = null;
      if(goog.isDef(var_args)) {
        kvs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__5499__delegate.call(this, coll, k, v, kvs)
    };
    G__5499.cljs$lang$maxFixedArity = 3;
    G__5499.cljs$lang$applyTo = function(arglist__5504) {
      var coll = cljs.core.first(arglist__5504);
      var k = cljs.core.first(cljs.core.next(arglist__5504));
      var v = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5504)));
      var kvs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5504)));
      return G__5499__delegate(coll, k, v, kvs)
    };
    G__5499.cljs$lang$arity$variadic = G__5499__delegate;
    return G__5499
  }();
  assoc = function(coll, k, v, var_args) {
    var kvs = var_args;
    switch(arguments.length) {
      case 3:
        return assoc__3.call(this, coll, k, v);
      default:
        return assoc__4.cljs$lang$arity$variadic(coll, k, v, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  assoc.cljs$lang$maxFixedArity = 3;
  assoc.cljs$lang$applyTo = assoc__4.cljs$lang$applyTo;
  assoc.cljs$lang$arity$3 = assoc__3;
  assoc.cljs$lang$arity$variadic = assoc__4.cljs$lang$arity$variadic;
  return assoc
}();
cljs.core.dissoc = function() {
  var dissoc = null;
  var dissoc__1 = function(coll) {
    return coll
  };
  var dissoc__2 = function(coll, k) {
    return cljs.core._dissoc.call(null, coll, k)
  };
  var dissoc__3 = function() {
    var G__5507__delegate = function(coll, k, ks) {
      while(true) {
        var ret__5506 = dissoc.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__5508 = ret__5506;
          var G__5509 = cljs.core.first.call(null, ks);
          var G__5510 = cljs.core.next.call(null, ks);
          coll = G__5508;
          k = G__5509;
          ks = G__5510;
          continue
        }else {
          return ret__5506
        }
        break
      }
    };
    var G__5507 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__5507__delegate.call(this, coll, k, ks)
    };
    G__5507.cljs$lang$maxFixedArity = 2;
    G__5507.cljs$lang$applyTo = function(arglist__5511) {
      var coll = cljs.core.first(arglist__5511);
      var k = cljs.core.first(cljs.core.next(arglist__5511));
      var ks = cljs.core.rest(cljs.core.next(arglist__5511));
      return G__5507__delegate(coll, k, ks)
    };
    G__5507.cljs$lang$arity$variadic = G__5507__delegate;
    return G__5507
  }();
  dissoc = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return dissoc__1.call(this, coll);
      case 2:
        return dissoc__2.call(this, coll, k);
      default:
        return dissoc__3.cljs$lang$arity$variadic(coll, k, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  dissoc.cljs$lang$maxFixedArity = 2;
  dissoc.cljs$lang$applyTo = dissoc__3.cljs$lang$applyTo;
  dissoc.cljs$lang$arity$1 = dissoc__1;
  dissoc.cljs$lang$arity$2 = dissoc__2;
  dissoc.cljs$lang$arity$variadic = dissoc__3.cljs$lang$arity$variadic;
  return dissoc
}();
cljs.core.with_meta = function with_meta(o, meta) {
  return cljs.core._with_meta.call(null, o, meta)
};
cljs.core.meta = function meta(o) {
  if(function() {
    var G__5515__5516 = o;
    if(G__5515__5516) {
      if(function() {
        var or__3824__auto____5517 = G__5515__5516.cljs$lang$protocol_mask$partition0$ & 131072;
        if(or__3824__auto____5517) {
          return or__3824__auto____5517
        }else {
          return G__5515__5516.cljs$core$IMeta$
        }
      }()) {
        return true
      }else {
        if(!G__5515__5516.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__5515__5516)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__5515__5516)
    }
  }()) {
    return cljs.core._meta.call(null, o)
  }else {
    return null
  }
};
cljs.core.peek = function peek(coll) {
  return cljs.core._peek.call(null, coll)
};
cljs.core.pop = function pop(coll) {
  return cljs.core._pop.call(null, coll)
};
cljs.core.disj = function() {
  var disj = null;
  var disj__1 = function(coll) {
    return coll
  };
  var disj__2 = function(coll, k) {
    return cljs.core._disjoin.call(null, coll, k)
  };
  var disj__3 = function() {
    var G__5520__delegate = function(coll, k, ks) {
      while(true) {
        var ret__5519 = disj.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__5521 = ret__5519;
          var G__5522 = cljs.core.first.call(null, ks);
          var G__5523 = cljs.core.next.call(null, ks);
          coll = G__5521;
          k = G__5522;
          ks = G__5523;
          continue
        }else {
          return ret__5519
        }
        break
      }
    };
    var G__5520 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__5520__delegate.call(this, coll, k, ks)
    };
    G__5520.cljs$lang$maxFixedArity = 2;
    G__5520.cljs$lang$applyTo = function(arglist__5524) {
      var coll = cljs.core.first(arglist__5524);
      var k = cljs.core.first(cljs.core.next(arglist__5524));
      var ks = cljs.core.rest(cljs.core.next(arglist__5524));
      return G__5520__delegate(coll, k, ks)
    };
    G__5520.cljs$lang$arity$variadic = G__5520__delegate;
    return G__5520
  }();
  disj = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return disj__1.call(this, coll);
      case 2:
        return disj__2.call(this, coll, k);
      default:
        return disj__3.cljs$lang$arity$variadic(coll, k, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  disj.cljs$lang$maxFixedArity = 2;
  disj.cljs$lang$applyTo = disj__3.cljs$lang$applyTo;
  disj.cljs$lang$arity$1 = disj__1;
  disj.cljs$lang$arity$2 = disj__2;
  disj.cljs$lang$arity$variadic = disj__3.cljs$lang$arity$variadic;
  return disj
}();
cljs.core.string_hash_cache = {};
cljs.core.string_hash_cache_count = 0;
cljs.core.add_to_string_hash_cache = function add_to_string_hash_cache(k) {
  var h__5526 = goog.string.hashCode(k);
  cljs.core.string_hash_cache[k] = h__5526;
  cljs.core.string_hash_cache_count = cljs.core.string_hash_cache_count + 1;
  return h__5526
};
cljs.core.check_string_hash_cache = function check_string_hash_cache(k) {
  if(cljs.core.string_hash_cache_count > 255) {
    cljs.core.string_hash_cache = {};
    cljs.core.string_hash_cache_count = 0
  }else {
  }
  var h__5528 = cljs.core.string_hash_cache[k];
  if(!(h__5528 == null)) {
    return h__5528
  }else {
    return cljs.core.add_to_string_hash_cache.call(null, k)
  }
};
cljs.core.hash = function() {
  var hash = null;
  var hash__1 = function(o) {
    return hash.call(null, o, true)
  };
  var hash__2 = function(o, check_cache) {
    if(function() {
      var and__3822__auto____5530 = goog.isString(o);
      if(and__3822__auto____5530) {
        return check_cache
      }else {
        return and__3822__auto____5530
      }
    }()) {
      return cljs.core.check_string_hash_cache.call(null, o)
    }else {
      return cljs.core._hash.call(null, o)
    }
  };
  hash = function(o, check_cache) {
    switch(arguments.length) {
      case 1:
        return hash__1.call(this, o);
      case 2:
        return hash__2.call(this, o, check_cache)
    }
    throw"Invalid arity: " + arguments.length;
  };
  hash.cljs$lang$arity$1 = hash__1;
  hash.cljs$lang$arity$2 = hash__2;
  return hash
}();
cljs.core.empty_QMARK_ = function empty_QMARK_(coll) {
  return cljs.core.not.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.coll_QMARK_ = function coll_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__5534__5535 = x;
    if(G__5534__5535) {
      if(function() {
        var or__3824__auto____5536 = G__5534__5535.cljs$lang$protocol_mask$partition0$ & 8;
        if(or__3824__auto____5536) {
          return or__3824__auto____5536
        }else {
          return G__5534__5535.cljs$core$ICollection$
        }
      }()) {
        return true
      }else {
        if(!G__5534__5535.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__5534__5535)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__5534__5535)
    }
  }
};
cljs.core.set_QMARK_ = function set_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__5540__5541 = x;
    if(G__5540__5541) {
      if(function() {
        var or__3824__auto____5542 = G__5540__5541.cljs$lang$protocol_mask$partition0$ & 4096;
        if(or__3824__auto____5542) {
          return or__3824__auto____5542
        }else {
          return G__5540__5541.cljs$core$ISet$
        }
      }()) {
        return true
      }else {
        if(!G__5540__5541.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__5540__5541)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__5540__5541)
    }
  }
};
cljs.core.associative_QMARK_ = function associative_QMARK_(x) {
  var G__5546__5547 = x;
  if(G__5546__5547) {
    if(function() {
      var or__3824__auto____5548 = G__5546__5547.cljs$lang$protocol_mask$partition0$ & 512;
      if(or__3824__auto____5548) {
        return or__3824__auto____5548
      }else {
        return G__5546__5547.cljs$core$IAssociative$
      }
    }()) {
      return true
    }else {
      if(!G__5546__5547.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__5546__5547)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__5546__5547)
  }
};
cljs.core.sequential_QMARK_ = function sequential_QMARK_(x) {
  var G__5552__5553 = x;
  if(G__5552__5553) {
    if(function() {
      var or__3824__auto____5554 = G__5552__5553.cljs$lang$protocol_mask$partition0$ & 16777216;
      if(or__3824__auto____5554) {
        return or__3824__auto____5554
      }else {
        return G__5552__5553.cljs$core$ISequential$
      }
    }()) {
      return true
    }else {
      if(!G__5552__5553.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__5552__5553)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__5552__5553)
  }
};
cljs.core.counted_QMARK_ = function counted_QMARK_(x) {
  var G__5558__5559 = x;
  if(G__5558__5559) {
    if(function() {
      var or__3824__auto____5560 = G__5558__5559.cljs$lang$protocol_mask$partition0$ & 2;
      if(or__3824__auto____5560) {
        return or__3824__auto____5560
      }else {
        return G__5558__5559.cljs$core$ICounted$
      }
    }()) {
      return true
    }else {
      if(!G__5558__5559.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__5558__5559)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__5558__5559)
  }
};
cljs.core.indexed_QMARK_ = function indexed_QMARK_(x) {
  var G__5564__5565 = x;
  if(G__5564__5565) {
    if(function() {
      var or__3824__auto____5566 = G__5564__5565.cljs$lang$protocol_mask$partition0$ & 16;
      if(or__3824__auto____5566) {
        return or__3824__auto____5566
      }else {
        return G__5564__5565.cljs$core$IIndexed$
      }
    }()) {
      return true
    }else {
      if(!G__5564__5565.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__5564__5565)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__5564__5565)
  }
};
cljs.core.reduceable_QMARK_ = function reduceable_QMARK_(x) {
  var G__5570__5571 = x;
  if(G__5570__5571) {
    if(function() {
      var or__3824__auto____5572 = G__5570__5571.cljs$lang$protocol_mask$partition0$ & 524288;
      if(or__3824__auto____5572) {
        return or__3824__auto____5572
      }else {
        return G__5570__5571.cljs$core$IReduce$
      }
    }()) {
      return true
    }else {
      if(!G__5570__5571.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__5570__5571)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__5570__5571)
  }
};
cljs.core.map_QMARK_ = function map_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__5576__5577 = x;
    if(G__5576__5577) {
      if(function() {
        var or__3824__auto____5578 = G__5576__5577.cljs$lang$protocol_mask$partition0$ & 1024;
        if(or__3824__auto____5578) {
          return or__3824__auto____5578
        }else {
          return G__5576__5577.cljs$core$IMap$
        }
      }()) {
        return true
      }else {
        if(!G__5576__5577.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__5576__5577)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__5576__5577)
    }
  }
};
cljs.core.vector_QMARK_ = function vector_QMARK_(x) {
  var G__5582__5583 = x;
  if(G__5582__5583) {
    if(function() {
      var or__3824__auto____5584 = G__5582__5583.cljs$lang$protocol_mask$partition0$ & 16384;
      if(or__3824__auto____5584) {
        return or__3824__auto____5584
      }else {
        return G__5582__5583.cljs$core$IVector$
      }
    }()) {
      return true
    }else {
      if(!G__5582__5583.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__5582__5583)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__5582__5583)
  }
};
cljs.core.chunked_seq_QMARK_ = function chunked_seq_QMARK_(x) {
  var G__5588__5589 = x;
  if(G__5588__5589) {
    if(cljs.core.truth_(function() {
      var or__3824__auto____5590 = null;
      if(cljs.core.truth_(or__3824__auto____5590)) {
        return or__3824__auto____5590
      }else {
        return G__5588__5589.cljs$core$IChunkedSeq$
      }
    }())) {
      return true
    }else {
      if(!G__5588__5589.cljs$lang$protocol_mask$partition$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedSeq, G__5588__5589)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedSeq, G__5588__5589)
  }
};
cljs.core.js_obj = function() {
  var js_obj = null;
  var js_obj__0 = function() {
    return{}
  };
  var js_obj__1 = function() {
    var G__5591__delegate = function(keyvals) {
      return cljs.core.apply.call(null, goog.object.create, keyvals)
    };
    var G__5591 = function(var_args) {
      var keyvals = null;
      if(goog.isDef(var_args)) {
        keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__5591__delegate.call(this, keyvals)
    };
    G__5591.cljs$lang$maxFixedArity = 0;
    G__5591.cljs$lang$applyTo = function(arglist__5592) {
      var keyvals = cljs.core.seq(arglist__5592);
      return G__5591__delegate(keyvals)
    };
    G__5591.cljs$lang$arity$variadic = G__5591__delegate;
    return G__5591
  }();
  js_obj = function(var_args) {
    var keyvals = var_args;
    switch(arguments.length) {
      case 0:
        return js_obj__0.call(this);
      default:
        return js_obj__1.cljs$lang$arity$variadic(cljs.core.array_seq(arguments, 0))
    }
    throw"Invalid arity: " + arguments.length;
  };
  js_obj.cljs$lang$maxFixedArity = 0;
  js_obj.cljs$lang$applyTo = js_obj__1.cljs$lang$applyTo;
  js_obj.cljs$lang$arity$0 = js_obj__0;
  js_obj.cljs$lang$arity$variadic = js_obj__1.cljs$lang$arity$variadic;
  return js_obj
}();
cljs.core.js_keys = function js_keys(obj) {
  var keys__5594 = [];
  goog.object.forEach(obj, function(val, key, obj) {
    return keys__5594.push(key)
  });
  return keys__5594
};
cljs.core.js_delete = function js_delete(obj, key) {
  return delete obj[key]
};
cljs.core.array_copy = function array_copy(from, i, to, j, len) {
  var i__5598 = i;
  var j__5599 = j;
  var len__5600 = len;
  while(true) {
    if(len__5600 === 0) {
      return to
    }else {
      to[j__5599] = from[i__5598];
      var G__5601 = i__5598 + 1;
      var G__5602 = j__5599 + 1;
      var G__5603 = len__5600 - 1;
      i__5598 = G__5601;
      j__5599 = G__5602;
      len__5600 = G__5603;
      continue
    }
    break
  }
};
cljs.core.array_copy_downward = function array_copy_downward(from, i, to, j, len) {
  var i__5607 = i + (len - 1);
  var j__5608 = j + (len - 1);
  var len__5609 = len;
  while(true) {
    if(len__5609 === 0) {
      return to
    }else {
      to[j__5608] = from[i__5607];
      var G__5610 = i__5607 - 1;
      var G__5611 = j__5608 - 1;
      var G__5612 = len__5609 - 1;
      i__5607 = G__5610;
      j__5608 = G__5611;
      len__5609 = G__5612;
      continue
    }
    break
  }
};
cljs.core.lookup_sentinel = {};
cljs.core.false_QMARK_ = function false_QMARK_(x) {
  return x === false
};
cljs.core.true_QMARK_ = function true_QMARK_(x) {
  return x === true
};
cljs.core.undefined_QMARK_ = function undefined_QMARK_(x) {
  return void 0 === x
};
cljs.core.seq_QMARK_ = function seq_QMARK_(s) {
  if(s == null) {
    return false
  }else {
    var G__5616__5617 = s;
    if(G__5616__5617) {
      if(function() {
        var or__3824__auto____5618 = G__5616__5617.cljs$lang$protocol_mask$partition0$ & 64;
        if(or__3824__auto____5618) {
          return or__3824__auto____5618
        }else {
          return G__5616__5617.cljs$core$ISeq$
        }
      }()) {
        return true
      }else {
        if(!G__5616__5617.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__5616__5617)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__5616__5617)
    }
  }
};
cljs.core.seqable_QMARK_ = function seqable_QMARK_(s) {
  var G__5622__5623 = s;
  if(G__5622__5623) {
    if(function() {
      var or__3824__auto____5624 = G__5622__5623.cljs$lang$protocol_mask$partition0$ & 8388608;
      if(or__3824__auto____5624) {
        return or__3824__auto____5624
      }else {
        return G__5622__5623.cljs$core$ISeqable$
      }
    }()) {
      return true
    }else {
      if(!G__5622__5623.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__5622__5623)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__5622__5623)
  }
};
cljs.core.boolean$ = function boolean$(x) {
  if(cljs.core.truth_(x)) {
    return true
  }else {
    return false
  }
};
cljs.core.string_QMARK_ = function string_QMARK_(x) {
  var and__3822__auto____5627 = goog.isString(x);
  if(and__3822__auto____5627) {
    return!function() {
      var or__3824__auto____5628 = x.charAt(0) === "\ufdd0";
      if(or__3824__auto____5628) {
        return or__3824__auto____5628
      }else {
        return x.charAt(0) === "\ufdd1"
      }
    }()
  }else {
    return and__3822__auto____5627
  }
};
cljs.core.keyword_QMARK_ = function keyword_QMARK_(x) {
  var and__3822__auto____5630 = goog.isString(x);
  if(and__3822__auto____5630) {
    return x.charAt(0) === "\ufdd0"
  }else {
    return and__3822__auto____5630
  }
};
cljs.core.symbol_QMARK_ = function symbol_QMARK_(x) {
  var and__3822__auto____5632 = goog.isString(x);
  if(and__3822__auto____5632) {
    return x.charAt(0) === "\ufdd1"
  }else {
    return and__3822__auto____5632
  }
};
cljs.core.number_QMARK_ = function number_QMARK_(n) {
  return goog.isNumber(n)
};
cljs.core.fn_QMARK_ = function fn_QMARK_(f) {
  return goog.isFunction(f)
};
cljs.core.ifn_QMARK_ = function ifn_QMARK_(f) {
  var or__3824__auto____5637 = cljs.core.fn_QMARK_.call(null, f);
  if(or__3824__auto____5637) {
    return or__3824__auto____5637
  }else {
    var G__5638__5639 = f;
    if(G__5638__5639) {
      if(function() {
        var or__3824__auto____5640 = G__5638__5639.cljs$lang$protocol_mask$partition0$ & 1;
        if(or__3824__auto____5640) {
          return or__3824__auto____5640
        }else {
          return G__5638__5639.cljs$core$IFn$
        }
      }()) {
        return true
      }else {
        if(!G__5638__5639.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__5638__5639)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__5638__5639)
    }
  }
};
cljs.core.integer_QMARK_ = function integer_QMARK_(n) {
  var and__3822__auto____5642 = cljs.core.number_QMARK_.call(null, n);
  if(and__3822__auto____5642) {
    return n == n.toFixed()
  }else {
    return and__3822__auto____5642
  }
};
cljs.core.contains_QMARK_ = function contains_QMARK_(coll, v) {
  if(cljs.core._lookup.call(null, coll, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return false
  }else {
    return true
  }
};
cljs.core.find = function find(coll, k) {
  if(cljs.core.truth_(function() {
    var and__3822__auto____5645 = coll;
    if(cljs.core.truth_(and__3822__auto____5645)) {
      var and__3822__auto____5646 = cljs.core.associative_QMARK_.call(null, coll);
      if(and__3822__auto____5646) {
        return cljs.core.contains_QMARK_.call(null, coll, k)
      }else {
        return and__3822__auto____5646
      }
    }else {
      return and__3822__auto____5645
    }
  }())) {
    return cljs.core.PersistentVector.fromArray([k, cljs.core._lookup.call(null, coll, k)], true)
  }else {
    return null
  }
};
cljs.core.distinct_QMARK_ = function() {
  var distinct_QMARK_ = null;
  var distinct_QMARK___1 = function(x) {
    return true
  };
  var distinct_QMARK___2 = function(x, y) {
    return!cljs.core._EQ_.call(null, x, y)
  };
  var distinct_QMARK___3 = function() {
    var G__5655__delegate = function(x, y, more) {
      if(!cljs.core._EQ_.call(null, x, y)) {
        var s__5651 = cljs.core.PersistentHashSet.fromArray([y, x]);
        var xs__5652 = more;
        while(true) {
          var x__5653 = cljs.core.first.call(null, xs__5652);
          var etc__5654 = cljs.core.next.call(null, xs__5652);
          if(cljs.core.truth_(xs__5652)) {
            if(cljs.core.contains_QMARK_.call(null, s__5651, x__5653)) {
              return false
            }else {
              var G__5656 = cljs.core.conj.call(null, s__5651, x__5653);
              var G__5657 = etc__5654;
              s__5651 = G__5656;
              xs__5652 = G__5657;
              continue
            }
          }else {
            return true
          }
          break
        }
      }else {
        return false
      }
    };
    var G__5655 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__5655__delegate.call(this, x, y, more)
    };
    G__5655.cljs$lang$maxFixedArity = 2;
    G__5655.cljs$lang$applyTo = function(arglist__5658) {
      var x = cljs.core.first(arglist__5658);
      var y = cljs.core.first(cljs.core.next(arglist__5658));
      var more = cljs.core.rest(cljs.core.next(arglist__5658));
      return G__5655__delegate(x, y, more)
    };
    G__5655.cljs$lang$arity$variadic = G__5655__delegate;
    return G__5655
  }();
  distinct_QMARK_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return distinct_QMARK___1.call(this, x);
      case 2:
        return distinct_QMARK___2.call(this, x, y);
      default:
        return distinct_QMARK___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  distinct_QMARK_.cljs$lang$maxFixedArity = 2;
  distinct_QMARK_.cljs$lang$applyTo = distinct_QMARK___3.cljs$lang$applyTo;
  distinct_QMARK_.cljs$lang$arity$1 = distinct_QMARK___1;
  distinct_QMARK_.cljs$lang$arity$2 = distinct_QMARK___2;
  distinct_QMARK_.cljs$lang$arity$variadic = distinct_QMARK___3.cljs$lang$arity$variadic;
  return distinct_QMARK_
}();
cljs.core.compare = function compare(x, y) {
  if(x === y) {
    return 0
  }else {
    if(x == null) {
      return-1
    }else {
      if(y == null) {
        return 1
      }else {
        if(cljs.core.type.call(null, x) === cljs.core.type.call(null, y)) {
          if(function() {
            var G__5662__5663 = x;
            if(G__5662__5663) {
              if(cljs.core.truth_(function() {
                var or__3824__auto____5664 = null;
                if(cljs.core.truth_(or__3824__auto____5664)) {
                  return or__3824__auto____5664
                }else {
                  return G__5662__5663.cljs$core$IComparable$
                }
              }())) {
                return true
              }else {
                if(!G__5662__5663.cljs$lang$protocol_mask$partition$) {
                  return cljs.core.type_satisfies_.call(null, cljs.core.IComparable, G__5662__5663)
                }else {
                  return false
                }
              }
            }else {
              return cljs.core.type_satisfies_.call(null, cljs.core.IComparable, G__5662__5663)
            }
          }()) {
            return cljs.core._compare.call(null, x, y)
          }else {
            return goog.array.defaultCompare(x, y)
          }
        }else {
          if("\ufdd0'else") {
            throw new Error("compare on non-nil objects of different types");
          }else {
            return null
          }
        }
      }
    }
  }
};
cljs.core.compare_indexed = function() {
  var compare_indexed = null;
  var compare_indexed__2 = function(xs, ys) {
    var xl__5669 = cljs.core.count.call(null, xs);
    var yl__5670 = cljs.core.count.call(null, ys);
    if(xl__5669 < yl__5670) {
      return-1
    }else {
      if(xl__5669 > yl__5670) {
        return 1
      }else {
        if("\ufdd0'else") {
          return compare_indexed.call(null, xs, ys, xl__5669, 0)
        }else {
          return null
        }
      }
    }
  };
  var compare_indexed__4 = function(xs, ys, len, n) {
    while(true) {
      var d__5671 = cljs.core.compare.call(null, cljs.core.nth.call(null, xs, n), cljs.core.nth.call(null, ys, n));
      if(function() {
        var and__3822__auto____5672 = d__5671 === 0;
        if(and__3822__auto____5672) {
          return n + 1 < len
        }else {
          return and__3822__auto____5672
        }
      }()) {
        var G__5673 = xs;
        var G__5674 = ys;
        var G__5675 = len;
        var G__5676 = n + 1;
        xs = G__5673;
        ys = G__5674;
        len = G__5675;
        n = G__5676;
        continue
      }else {
        return d__5671
      }
      break
    }
  };
  compare_indexed = function(xs, ys, len, n) {
    switch(arguments.length) {
      case 2:
        return compare_indexed__2.call(this, xs, ys);
      case 4:
        return compare_indexed__4.call(this, xs, ys, len, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  compare_indexed.cljs$lang$arity$2 = compare_indexed__2;
  compare_indexed.cljs$lang$arity$4 = compare_indexed__4;
  return compare_indexed
}();
cljs.core.fn__GT_comparator = function fn__GT_comparator(f) {
  if(cljs.core._EQ_.call(null, f, cljs.core.compare)) {
    return cljs.core.compare
  }else {
    return function(x, y) {
      var r__5678 = f.call(null, x, y);
      if(cljs.core.number_QMARK_.call(null, r__5678)) {
        return r__5678
      }else {
        if(cljs.core.truth_(r__5678)) {
          return-1
        }else {
          if(cljs.core.truth_(f.call(null, y, x))) {
            return 1
          }else {
            return 0
          }
        }
      }
    }
  }
};
cljs.core.sort = function() {
  var sort = null;
  var sort__1 = function(coll) {
    return sort.call(null, cljs.core.compare, coll)
  };
  var sort__2 = function(comp, coll) {
    if(cljs.core.seq.call(null, coll)) {
      var a__5680 = cljs.core.to_array.call(null, coll);
      goog.array.stableSort(a__5680, cljs.core.fn__GT_comparator.call(null, comp));
      return cljs.core.seq.call(null, a__5680)
    }else {
      return cljs.core.List.EMPTY
    }
  };
  sort = function(comp, coll) {
    switch(arguments.length) {
      case 1:
        return sort__1.call(this, comp);
      case 2:
        return sort__2.call(this, comp, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  sort.cljs$lang$arity$1 = sort__1;
  sort.cljs$lang$arity$2 = sort__2;
  return sort
}();
cljs.core.sort_by = function() {
  var sort_by = null;
  var sort_by__2 = function(keyfn, coll) {
    return sort_by.call(null, keyfn, cljs.core.compare, coll)
  };
  var sort_by__3 = function(keyfn, comp, coll) {
    return cljs.core.sort.call(null, function(x, y) {
      return cljs.core.fn__GT_comparator.call(null, comp).call(null, keyfn.call(null, x), keyfn.call(null, y))
    }, coll)
  };
  sort_by = function(keyfn, comp, coll) {
    switch(arguments.length) {
      case 2:
        return sort_by__2.call(this, keyfn, comp);
      case 3:
        return sort_by__3.call(this, keyfn, comp, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  sort_by.cljs$lang$arity$2 = sort_by__2;
  sort_by.cljs$lang$arity$3 = sort_by__3;
  return sort_by
}();
cljs.core.seq_reduce = function() {
  var seq_reduce = null;
  var seq_reduce__2 = function(f, coll) {
    var temp__3971__auto____5686 = cljs.core.seq.call(null, coll);
    if(temp__3971__auto____5686) {
      var s__5687 = temp__3971__auto____5686;
      return cljs.core.reduce.call(null, f, cljs.core.first.call(null, s__5687), cljs.core.next.call(null, s__5687))
    }else {
      return f.call(null)
    }
  };
  var seq_reduce__3 = function(f, val, coll) {
    var val__5688 = val;
    var coll__5689 = cljs.core.seq.call(null, coll);
    while(true) {
      if(coll__5689) {
        var nval__5690 = f.call(null, val__5688, cljs.core.first.call(null, coll__5689));
        if(cljs.core.reduced_QMARK_.call(null, nval__5690)) {
          return cljs.core.deref.call(null, nval__5690)
        }else {
          var G__5691 = nval__5690;
          var G__5692 = cljs.core.next.call(null, coll__5689);
          val__5688 = G__5691;
          coll__5689 = G__5692;
          continue
        }
      }else {
        return val__5688
      }
      break
    }
  };
  seq_reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return seq_reduce__2.call(this, f, val);
      case 3:
        return seq_reduce__3.call(this, f, val, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  seq_reduce.cljs$lang$arity$2 = seq_reduce__2;
  seq_reduce.cljs$lang$arity$3 = seq_reduce__3;
  return seq_reduce
}();
cljs.core.shuffle = function shuffle(coll) {
  var a__5694 = cljs.core.to_array.call(null, coll);
  goog.array.shuffle(a__5694);
  return cljs.core.vec.call(null, a__5694)
};
cljs.core.reduce = function() {
  var reduce = null;
  var reduce__2 = function(f, coll) {
    if(function() {
      var G__5701__5702 = coll;
      if(G__5701__5702) {
        if(function() {
          var or__3824__auto____5703 = G__5701__5702.cljs$lang$protocol_mask$partition0$ & 524288;
          if(or__3824__auto____5703) {
            return or__3824__auto____5703
          }else {
            return G__5701__5702.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__5701__5702.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__5701__5702)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__5701__5702)
      }
    }()) {
      return cljs.core._reduce.call(null, coll, f)
    }else {
      return cljs.core.seq_reduce.call(null, f, coll)
    }
  };
  var reduce__3 = function(f, val, coll) {
    if(function() {
      var G__5704__5705 = coll;
      if(G__5704__5705) {
        if(function() {
          var or__3824__auto____5706 = G__5704__5705.cljs$lang$protocol_mask$partition0$ & 524288;
          if(or__3824__auto____5706) {
            return or__3824__auto____5706
          }else {
            return G__5704__5705.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__5704__5705.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__5704__5705)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__5704__5705)
      }
    }()) {
      return cljs.core._reduce.call(null, coll, f, val)
    }else {
      return cljs.core.seq_reduce.call(null, f, val, coll)
    }
  };
  reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return reduce__2.call(this, f, val);
      case 3:
        return reduce__3.call(this, f, val, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  reduce.cljs$lang$arity$2 = reduce__2;
  reduce.cljs$lang$arity$3 = reduce__3;
  return reduce
}();
cljs.core.reduce_kv = function reduce_kv(f, init, coll) {
  return cljs.core._kv_reduce.call(null, coll, f, init)
};
cljs.core.Reduced = function(val) {
  this.val = val;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32768
};
cljs.core.Reduced.cljs$lang$type = true;
cljs.core.Reduced.cljs$lang$ctorPrSeq = function(this__960__auto__) {
  return cljs.core.list.call(null, "cljs.core/Reduced")
};
cljs.core.Reduced.prototype.cljs$core$IDeref$_deref$arity$1 = function(o) {
  var this__5707 = this;
  return this__5707.val
};
cljs.core.Reduced;
cljs.core.reduced_QMARK_ = function reduced_QMARK_(r) {
  return cljs.core.instance_QMARK_.call(null, cljs.core.Reduced, r)
};
cljs.core.reduced = function reduced(x) {
  return new cljs.core.Reduced(x)
};
cljs.core._PLUS_ = function() {
  var _PLUS_ = null;
  var _PLUS___0 = function() {
    return 0
  };
  var _PLUS___1 = function(x) {
    return x
  };
  var _PLUS___2 = function(x, y) {
    return x + y
  };
  var _PLUS___3 = function() {
    var G__5708__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _PLUS_, x + y, more)
    };
    var G__5708 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__5708__delegate.call(this, x, y, more)
    };
    G__5708.cljs$lang$maxFixedArity = 2;
    G__5708.cljs$lang$applyTo = function(arglist__5709) {
      var x = cljs.core.first(arglist__5709);
      var y = cljs.core.first(cljs.core.next(arglist__5709));
      var more = cljs.core.rest(cljs.core.next(arglist__5709));
      return G__5708__delegate(x, y, more)
    };
    G__5708.cljs$lang$arity$variadic = G__5708__delegate;
    return G__5708
  }();
  _PLUS_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _PLUS___0.call(this);
      case 1:
        return _PLUS___1.call(this, x);
      case 2:
        return _PLUS___2.call(this, x, y);
      default:
        return _PLUS___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _PLUS_.cljs$lang$maxFixedArity = 2;
  _PLUS_.cljs$lang$applyTo = _PLUS___3.cljs$lang$applyTo;
  _PLUS_.cljs$lang$arity$0 = _PLUS___0;
  _PLUS_.cljs$lang$arity$1 = _PLUS___1;
  _PLUS_.cljs$lang$arity$2 = _PLUS___2;
  _PLUS_.cljs$lang$arity$variadic = _PLUS___3.cljs$lang$arity$variadic;
  return _PLUS_
}();
cljs.core._ = function() {
  var _ = null;
  var ___1 = function(x) {
    return-x
  };
  var ___2 = function(x, y) {
    return x - y
  };
  var ___3 = function() {
    var G__5710__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _, x - y, more)
    };
    var G__5710 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__5710__delegate.call(this, x, y, more)
    };
    G__5710.cljs$lang$maxFixedArity = 2;
    G__5710.cljs$lang$applyTo = function(arglist__5711) {
      var x = cljs.core.first(arglist__5711);
      var y = cljs.core.first(cljs.core.next(arglist__5711));
      var more = cljs.core.rest(cljs.core.next(arglist__5711));
      return G__5710__delegate(x, y, more)
    };
    G__5710.cljs$lang$arity$variadic = G__5710__delegate;
    return G__5710
  }();
  _ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return ___1.call(this, x);
      case 2:
        return ___2.call(this, x, y);
      default:
        return ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _.cljs$lang$maxFixedArity = 2;
  _.cljs$lang$applyTo = ___3.cljs$lang$applyTo;
  _.cljs$lang$arity$1 = ___1;
  _.cljs$lang$arity$2 = ___2;
  _.cljs$lang$arity$variadic = ___3.cljs$lang$arity$variadic;
  return _
}();
cljs.core._STAR_ = function() {
  var _STAR_ = null;
  var _STAR___0 = function() {
    return 1
  };
  var _STAR___1 = function(x) {
    return x
  };
  var _STAR___2 = function(x, y) {
    return x * y
  };
  var _STAR___3 = function() {
    var G__5712__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _STAR_, x * y, more)
    };
    var G__5712 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__5712__delegate.call(this, x, y, more)
    };
    G__5712.cljs$lang$maxFixedArity = 2;
    G__5712.cljs$lang$applyTo = function(arglist__5713) {
      var x = cljs.core.first(arglist__5713);
      var y = cljs.core.first(cljs.core.next(arglist__5713));
      var more = cljs.core.rest(cljs.core.next(arglist__5713));
      return G__5712__delegate(x, y, more)
    };
    G__5712.cljs$lang$arity$variadic = G__5712__delegate;
    return G__5712
  }();
  _STAR_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _STAR___0.call(this);
      case 1:
        return _STAR___1.call(this, x);
      case 2:
        return _STAR___2.call(this, x, y);
      default:
        return _STAR___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _STAR_.cljs$lang$maxFixedArity = 2;
  _STAR_.cljs$lang$applyTo = _STAR___3.cljs$lang$applyTo;
  _STAR_.cljs$lang$arity$0 = _STAR___0;
  _STAR_.cljs$lang$arity$1 = _STAR___1;
  _STAR_.cljs$lang$arity$2 = _STAR___2;
  _STAR_.cljs$lang$arity$variadic = _STAR___3.cljs$lang$arity$variadic;
  return _STAR_
}();
cljs.core._SLASH_ = function() {
  var _SLASH_ = null;
  var _SLASH___1 = function(x) {
    return _SLASH_.call(null, 1, x)
  };
  var _SLASH___2 = function(x, y) {
    return x / y
  };
  var _SLASH___3 = function() {
    var G__5714__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _SLASH_, _SLASH_.call(null, x, y), more)
    };
    var G__5714 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__5714__delegate.call(this, x, y, more)
    };
    G__5714.cljs$lang$maxFixedArity = 2;
    G__5714.cljs$lang$applyTo = function(arglist__5715) {
      var x = cljs.core.first(arglist__5715);
      var y = cljs.core.first(cljs.core.next(arglist__5715));
      var more = cljs.core.rest(cljs.core.next(arglist__5715));
      return G__5714__delegate(x, y, more)
    };
    G__5714.cljs$lang$arity$variadic = G__5714__delegate;
    return G__5714
  }();
  _SLASH_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _SLASH___1.call(this, x);
      case 2:
        return _SLASH___2.call(this, x, y);
      default:
        return _SLASH___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _SLASH_.cljs$lang$maxFixedArity = 2;
  _SLASH_.cljs$lang$applyTo = _SLASH___3.cljs$lang$applyTo;
  _SLASH_.cljs$lang$arity$1 = _SLASH___1;
  _SLASH_.cljs$lang$arity$2 = _SLASH___2;
  _SLASH_.cljs$lang$arity$variadic = _SLASH___3.cljs$lang$arity$variadic;
  return _SLASH_
}();
cljs.core._LT_ = function() {
  var _LT_ = null;
  var _LT___1 = function(x) {
    return true
  };
  var _LT___2 = function(x, y) {
    return x < y
  };
  var _LT___3 = function() {
    var G__5716__delegate = function(x, y, more) {
      while(true) {
        if(x < y) {
          if(cljs.core.next.call(null, more)) {
            var G__5717 = y;
            var G__5718 = cljs.core.first.call(null, more);
            var G__5719 = cljs.core.next.call(null, more);
            x = G__5717;
            y = G__5718;
            more = G__5719;
            continue
          }else {
            return y < cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__5716 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__5716__delegate.call(this, x, y, more)
    };
    G__5716.cljs$lang$maxFixedArity = 2;
    G__5716.cljs$lang$applyTo = function(arglist__5720) {
      var x = cljs.core.first(arglist__5720);
      var y = cljs.core.first(cljs.core.next(arglist__5720));
      var more = cljs.core.rest(cljs.core.next(arglist__5720));
      return G__5716__delegate(x, y, more)
    };
    G__5716.cljs$lang$arity$variadic = G__5716__delegate;
    return G__5716
  }();
  _LT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT___1.call(this, x);
      case 2:
        return _LT___2.call(this, x, y);
      default:
        return _LT___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _LT_.cljs$lang$maxFixedArity = 2;
  _LT_.cljs$lang$applyTo = _LT___3.cljs$lang$applyTo;
  _LT_.cljs$lang$arity$1 = _LT___1;
  _LT_.cljs$lang$arity$2 = _LT___2;
  _LT_.cljs$lang$arity$variadic = _LT___3.cljs$lang$arity$variadic;
  return _LT_
}();
cljs.core._LT__EQ_ = function() {
  var _LT__EQ_ = null;
  var _LT__EQ___1 = function(x) {
    return true
  };
  var _LT__EQ___2 = function(x, y) {
    return x <= y
  };
  var _LT__EQ___3 = function() {
    var G__5721__delegate = function(x, y, more) {
      while(true) {
        if(x <= y) {
          if(cljs.core.next.call(null, more)) {
            var G__5722 = y;
            var G__5723 = cljs.core.first.call(null, more);
            var G__5724 = cljs.core.next.call(null, more);
            x = G__5722;
            y = G__5723;
            more = G__5724;
            continue
          }else {
            return y <= cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__5721 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__5721__delegate.call(this, x, y, more)
    };
    G__5721.cljs$lang$maxFixedArity = 2;
    G__5721.cljs$lang$applyTo = function(arglist__5725) {
      var x = cljs.core.first(arglist__5725);
      var y = cljs.core.first(cljs.core.next(arglist__5725));
      var more = cljs.core.rest(cljs.core.next(arglist__5725));
      return G__5721__delegate(x, y, more)
    };
    G__5721.cljs$lang$arity$variadic = G__5721__delegate;
    return G__5721
  }();
  _LT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT__EQ___1.call(this, x);
      case 2:
        return _LT__EQ___2.call(this, x, y);
      default:
        return _LT__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _LT__EQ_.cljs$lang$maxFixedArity = 2;
  _LT__EQ_.cljs$lang$applyTo = _LT__EQ___3.cljs$lang$applyTo;
  _LT__EQ_.cljs$lang$arity$1 = _LT__EQ___1;
  _LT__EQ_.cljs$lang$arity$2 = _LT__EQ___2;
  _LT__EQ_.cljs$lang$arity$variadic = _LT__EQ___3.cljs$lang$arity$variadic;
  return _LT__EQ_
}();
cljs.core._GT_ = function() {
  var _GT_ = null;
  var _GT___1 = function(x) {
    return true
  };
  var _GT___2 = function(x, y) {
    return x > y
  };
  var _GT___3 = function() {
    var G__5726__delegate = function(x, y, more) {
      while(true) {
        if(x > y) {
          if(cljs.core.next.call(null, more)) {
            var G__5727 = y;
            var G__5728 = cljs.core.first.call(null, more);
            var G__5729 = cljs.core.next.call(null, more);
            x = G__5727;
            y = G__5728;
            more = G__5729;
            continue
          }else {
            return y > cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__5726 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__5726__delegate.call(this, x, y, more)
    };
    G__5726.cljs$lang$maxFixedArity = 2;
    G__5726.cljs$lang$applyTo = function(arglist__5730) {
      var x = cljs.core.first(arglist__5730);
      var y = cljs.core.first(cljs.core.next(arglist__5730));
      var more = cljs.core.rest(cljs.core.next(arglist__5730));
      return G__5726__delegate(x, y, more)
    };
    G__5726.cljs$lang$arity$variadic = G__5726__delegate;
    return G__5726
  }();
  _GT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT___1.call(this, x);
      case 2:
        return _GT___2.call(this, x, y);
      default:
        return _GT___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _GT_.cljs$lang$maxFixedArity = 2;
  _GT_.cljs$lang$applyTo = _GT___3.cljs$lang$applyTo;
  _GT_.cljs$lang$arity$1 = _GT___1;
  _GT_.cljs$lang$arity$2 = _GT___2;
  _GT_.cljs$lang$arity$variadic = _GT___3.cljs$lang$arity$variadic;
  return _GT_
}();
cljs.core._GT__EQ_ = function() {
  var _GT__EQ_ = null;
  var _GT__EQ___1 = function(x) {
    return true
  };
  var _GT__EQ___2 = function(x, y) {
    return x >= y
  };
  var _GT__EQ___3 = function() {
    var G__5731__delegate = function(x, y, more) {
      while(true) {
        if(x >= y) {
          if(cljs.core.next.call(null, more)) {
            var G__5732 = y;
            var G__5733 = cljs.core.first.call(null, more);
            var G__5734 = cljs.core.next.call(null, more);
            x = G__5732;
            y = G__5733;
            more = G__5734;
            continue
          }else {
            return y >= cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__5731 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__5731__delegate.call(this, x, y, more)
    };
    G__5731.cljs$lang$maxFixedArity = 2;
    G__5731.cljs$lang$applyTo = function(arglist__5735) {
      var x = cljs.core.first(arglist__5735);
      var y = cljs.core.first(cljs.core.next(arglist__5735));
      var more = cljs.core.rest(cljs.core.next(arglist__5735));
      return G__5731__delegate(x, y, more)
    };
    G__5731.cljs$lang$arity$variadic = G__5731__delegate;
    return G__5731
  }();
  _GT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT__EQ___1.call(this, x);
      case 2:
        return _GT__EQ___2.call(this, x, y);
      default:
        return _GT__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _GT__EQ_.cljs$lang$maxFixedArity = 2;
  _GT__EQ_.cljs$lang$applyTo = _GT__EQ___3.cljs$lang$applyTo;
  _GT__EQ_.cljs$lang$arity$1 = _GT__EQ___1;
  _GT__EQ_.cljs$lang$arity$2 = _GT__EQ___2;
  _GT__EQ_.cljs$lang$arity$variadic = _GT__EQ___3.cljs$lang$arity$variadic;
  return _GT__EQ_
}();
cljs.core.dec = function dec(x) {
  return x - 1
};
cljs.core.max = function() {
  var max = null;
  var max__1 = function(x) {
    return x
  };
  var max__2 = function(x, y) {
    return x > y ? x : y
  };
  var max__3 = function() {
    var G__5736__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, max, x > y ? x : y, more)
    };
    var G__5736 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__5736__delegate.call(this, x, y, more)
    };
    G__5736.cljs$lang$maxFixedArity = 2;
    G__5736.cljs$lang$applyTo = function(arglist__5737) {
      var x = cljs.core.first(arglist__5737);
      var y = cljs.core.first(cljs.core.next(arglist__5737));
      var more = cljs.core.rest(cljs.core.next(arglist__5737));
      return G__5736__delegate(x, y, more)
    };
    G__5736.cljs$lang$arity$variadic = G__5736__delegate;
    return G__5736
  }();
  max = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return max__1.call(this, x);
      case 2:
        return max__2.call(this, x, y);
      default:
        return max__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  max.cljs$lang$maxFixedArity = 2;
  max.cljs$lang$applyTo = max__3.cljs$lang$applyTo;
  max.cljs$lang$arity$1 = max__1;
  max.cljs$lang$arity$2 = max__2;
  max.cljs$lang$arity$variadic = max__3.cljs$lang$arity$variadic;
  return max
}();
cljs.core.min = function() {
  var min = null;
  var min__1 = function(x) {
    return x
  };
  var min__2 = function(x, y) {
    return x < y ? x : y
  };
  var min__3 = function() {
    var G__5738__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, min, x < y ? x : y, more)
    };
    var G__5738 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__5738__delegate.call(this, x, y, more)
    };
    G__5738.cljs$lang$maxFixedArity = 2;
    G__5738.cljs$lang$applyTo = function(arglist__5739) {
      var x = cljs.core.first(arglist__5739);
      var y = cljs.core.first(cljs.core.next(arglist__5739));
      var more = cljs.core.rest(cljs.core.next(arglist__5739));
      return G__5738__delegate(x, y, more)
    };
    G__5738.cljs$lang$arity$variadic = G__5738__delegate;
    return G__5738
  }();
  min = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return min__1.call(this, x);
      case 2:
        return min__2.call(this, x, y);
      default:
        return min__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  min.cljs$lang$maxFixedArity = 2;
  min.cljs$lang$applyTo = min__3.cljs$lang$applyTo;
  min.cljs$lang$arity$1 = min__1;
  min.cljs$lang$arity$2 = min__2;
  min.cljs$lang$arity$variadic = min__3.cljs$lang$arity$variadic;
  return min
}();
cljs.core.fix = function fix(q) {
  if(q >= 0) {
    return Math.floor.call(null, q)
  }else {
    return Math.ceil.call(null, q)
  }
};
cljs.core.int$ = function int$(x) {
  return cljs.core.fix.call(null, x)
};
cljs.core.long$ = function long$(x) {
  return cljs.core.fix.call(null, x)
};
cljs.core.mod = function mod(n, d) {
  return n % d
};
cljs.core.quot = function quot(n, d) {
  var rem__5741 = n % d;
  return cljs.core.fix.call(null, (n - rem__5741) / d)
};
cljs.core.rem = function rem(n, d) {
  var q__5743 = cljs.core.quot.call(null, n, d);
  return n - d * q__5743
};
cljs.core.rand = function() {
  var rand = null;
  var rand__0 = function() {
    return Math.random.call(null)
  };
  var rand__1 = function(n) {
    return n * rand.call(null)
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__0.call(this);
      case 1:
        return rand__1.call(this, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  rand.cljs$lang$arity$0 = rand__0;
  rand.cljs$lang$arity$1 = rand__1;
  return rand
}();
cljs.core.rand_int = function rand_int(n) {
  return cljs.core.fix.call(null, cljs.core.rand.call(null, n))
};
cljs.core.bit_xor = function bit_xor(x, y) {
  return x ^ y
};
cljs.core.bit_and = function bit_and(x, y) {
  return x & y
};
cljs.core.bit_or = function bit_or(x, y) {
  return x | y
};
cljs.core.bit_and_not = function bit_and_not(x, y) {
  return x & ~y
};
cljs.core.bit_clear = function bit_clear(x, n) {
  return x & ~(1 << n)
};
cljs.core.bit_flip = function bit_flip(x, n) {
  return x ^ 1 << n
};
cljs.core.bit_not = function bit_not(x) {
  return~x
};
cljs.core.bit_set = function bit_set(x, n) {
  return x | 1 << n
};
cljs.core.bit_test = function bit_test(x, n) {
  return(x & 1 << n) != 0
};
cljs.core.bit_shift_left = function bit_shift_left(x, n) {
  return x << n
};
cljs.core.bit_shift_right = function bit_shift_right(x, n) {
  return x >> n
};
cljs.core.bit_shift_right_zero_fill = function bit_shift_right_zero_fill(x, n) {
  return x >>> n
};
cljs.core.bit_count = function bit_count(v) {
  var v__5746 = v - (v >> 1 & 1431655765);
  var v__5747 = (v__5746 & 858993459) + (v__5746 >> 2 & 858993459);
  return(v__5747 + (v__5747 >> 4) & 252645135) * 16843009 >> 24
};
cljs.core._EQ__EQ_ = function() {
  var _EQ__EQ_ = null;
  var _EQ__EQ___1 = function(x) {
    return true
  };
  var _EQ__EQ___2 = function(x, y) {
    return cljs.core._equiv.call(null, x, y)
  };
  var _EQ__EQ___3 = function() {
    var G__5748__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ__EQ_.call(null, x, y))) {
          if(cljs.core.next.call(null, more)) {
            var G__5749 = y;
            var G__5750 = cljs.core.first.call(null, more);
            var G__5751 = cljs.core.next.call(null, more);
            x = G__5749;
            y = G__5750;
            more = G__5751;
            continue
          }else {
            return _EQ__EQ_.call(null, y, cljs.core.first.call(null, more))
          }
        }else {
          return false
        }
        break
      }
    };
    var G__5748 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__5748__delegate.call(this, x, y, more)
    };
    G__5748.cljs$lang$maxFixedArity = 2;
    G__5748.cljs$lang$applyTo = function(arglist__5752) {
      var x = cljs.core.first(arglist__5752);
      var y = cljs.core.first(cljs.core.next(arglist__5752));
      var more = cljs.core.rest(cljs.core.next(arglist__5752));
      return G__5748__delegate(x, y, more)
    };
    G__5748.cljs$lang$arity$variadic = G__5748__delegate;
    return G__5748
  }();
  _EQ__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _EQ__EQ___1.call(this, x);
      case 2:
        return _EQ__EQ___2.call(this, x, y);
      default:
        return _EQ__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _EQ__EQ_.cljs$lang$maxFixedArity = 2;
  _EQ__EQ_.cljs$lang$applyTo = _EQ__EQ___3.cljs$lang$applyTo;
  _EQ__EQ_.cljs$lang$arity$1 = _EQ__EQ___1;
  _EQ__EQ_.cljs$lang$arity$2 = _EQ__EQ___2;
  _EQ__EQ_.cljs$lang$arity$variadic = _EQ__EQ___3.cljs$lang$arity$variadic;
  return _EQ__EQ_
}();
cljs.core.pos_QMARK_ = function pos_QMARK_(n) {
  return n > 0
};
cljs.core.zero_QMARK_ = function zero_QMARK_(n) {
  return n === 0
};
cljs.core.neg_QMARK_ = function neg_QMARK_(x) {
  return x < 0
};
cljs.core.nthnext = function nthnext(coll, n) {
  var n__5756 = n;
  var xs__5757 = cljs.core.seq.call(null, coll);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____5758 = xs__5757;
      if(and__3822__auto____5758) {
        return n__5756 > 0
      }else {
        return and__3822__auto____5758
      }
    }())) {
      var G__5759 = n__5756 - 1;
      var G__5760 = cljs.core.next.call(null, xs__5757);
      n__5756 = G__5759;
      xs__5757 = G__5760;
      continue
    }else {
      return xs__5757
    }
    break
  }
};
cljs.core.str_STAR_ = function() {
  var str_STAR_ = null;
  var str_STAR___0 = function() {
    return""
  };
  var str_STAR___1 = function(x) {
    if(x == null) {
      return""
    }else {
      if("\ufdd0'else") {
        return x.toString()
      }else {
        return null
      }
    }
  };
  var str_STAR___2 = function() {
    var G__5761__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__5762 = sb.append(str_STAR_.call(null, cljs.core.first.call(null, more)));
            var G__5763 = cljs.core.next.call(null, more);
            sb = G__5762;
            more = G__5763;
            continue
          }else {
            return str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str_STAR_.call(null, x)), ys)
    };
    var G__5761 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__5761__delegate.call(this, x, ys)
    };
    G__5761.cljs$lang$maxFixedArity = 1;
    G__5761.cljs$lang$applyTo = function(arglist__5764) {
      var x = cljs.core.first(arglist__5764);
      var ys = cljs.core.rest(arglist__5764);
      return G__5761__delegate(x, ys)
    };
    G__5761.cljs$lang$arity$variadic = G__5761__delegate;
    return G__5761
  }();
  str_STAR_ = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str_STAR___0.call(this);
      case 1:
        return str_STAR___1.call(this, x);
      default:
        return str_STAR___2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  str_STAR_.cljs$lang$maxFixedArity = 1;
  str_STAR_.cljs$lang$applyTo = str_STAR___2.cljs$lang$applyTo;
  str_STAR_.cljs$lang$arity$0 = str_STAR___0;
  str_STAR_.cljs$lang$arity$1 = str_STAR___1;
  str_STAR_.cljs$lang$arity$variadic = str_STAR___2.cljs$lang$arity$variadic;
  return str_STAR_
}();
cljs.core.str = function() {
  var str = null;
  var str__0 = function() {
    return""
  };
  var str__1 = function(x) {
    if(cljs.core.symbol_QMARK_.call(null, x)) {
      return x.substring(2, x.length)
    }else {
      if(cljs.core.keyword_QMARK_.call(null, x)) {
        return cljs.core.str_STAR_.call(null, ":", x.substring(2, x.length))
      }else {
        if(x == null) {
          return""
        }else {
          if("\ufdd0'else") {
            return x.toString()
          }else {
            return null
          }
        }
      }
    }
  };
  var str__2 = function() {
    var G__5765__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__5766 = sb.append(str.call(null, cljs.core.first.call(null, more)));
            var G__5767 = cljs.core.next.call(null, more);
            sb = G__5766;
            more = G__5767;
            continue
          }else {
            return cljs.core.str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str.call(null, x)), ys)
    };
    var G__5765 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__5765__delegate.call(this, x, ys)
    };
    G__5765.cljs$lang$maxFixedArity = 1;
    G__5765.cljs$lang$applyTo = function(arglist__5768) {
      var x = cljs.core.first(arglist__5768);
      var ys = cljs.core.rest(arglist__5768);
      return G__5765__delegate(x, ys)
    };
    G__5765.cljs$lang$arity$variadic = G__5765__delegate;
    return G__5765
  }();
  str = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str__0.call(this);
      case 1:
        return str__1.call(this, x);
      default:
        return str__2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  str.cljs$lang$maxFixedArity = 1;
  str.cljs$lang$applyTo = str__2.cljs$lang$applyTo;
  str.cljs$lang$arity$0 = str__0;
  str.cljs$lang$arity$1 = str__1;
  str.cljs$lang$arity$variadic = str__2.cljs$lang$arity$variadic;
  return str
}();
cljs.core.subs = function() {
  var subs = null;
  var subs__2 = function(s, start) {
    return s.substring(start)
  };
  var subs__3 = function(s, start, end) {
    return s.substring(start, end)
  };
  subs = function(s, start, end) {
    switch(arguments.length) {
      case 2:
        return subs__2.call(this, s, start);
      case 3:
        return subs__3.call(this, s, start, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  subs.cljs$lang$arity$2 = subs__2;
  subs.cljs$lang$arity$3 = subs__3;
  return subs
}();
cljs.core.format = function() {
  var format__delegate = function(fmt, args) {
    return cljs.core.apply.call(null, goog.string.format, fmt, args)
  };
  var format = function(fmt, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return format__delegate.call(this, fmt, args)
  };
  format.cljs$lang$maxFixedArity = 1;
  format.cljs$lang$applyTo = function(arglist__5769) {
    var fmt = cljs.core.first(arglist__5769);
    var args = cljs.core.rest(arglist__5769);
    return format__delegate(fmt, args)
  };
  format.cljs$lang$arity$variadic = format__delegate;
  return format
}();
cljs.core.symbol = function() {
  var symbol = null;
  var symbol__1 = function(name) {
    if(cljs.core.symbol_QMARK_.call(null, name)) {
      name
    }else {
      if(cljs.core.keyword_QMARK_.call(null, name)) {
        cljs.core.str_STAR_.call(null, "\ufdd1", "'", cljs.core.subs.call(null, name, 2))
      }else {
      }
    }
    return cljs.core.str_STAR_.call(null, "\ufdd1", "'", name)
  };
  var symbol__2 = function(ns, name) {
    return symbol.call(null, cljs.core.str_STAR_.call(null, ns, "/", name))
  };
  symbol = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return symbol__1.call(this, ns);
      case 2:
        return symbol__2.call(this, ns, name)
    }
    throw"Invalid arity: " + arguments.length;
  };
  symbol.cljs$lang$arity$1 = symbol__1;
  symbol.cljs$lang$arity$2 = symbol__2;
  return symbol
}();
cljs.core.keyword = function() {
  var keyword = null;
  var keyword__1 = function(name) {
    if(cljs.core.keyword_QMARK_.call(null, name)) {
      return name
    }else {
      if(cljs.core.symbol_QMARK_.call(null, name)) {
        return cljs.core.str_STAR_.call(null, "\ufdd0", "'", cljs.core.subs.call(null, name, 2))
      }else {
        if("\ufdd0'else") {
          return cljs.core.str_STAR_.call(null, "\ufdd0", "'", name)
        }else {
          return null
        }
      }
    }
  };
  var keyword__2 = function(ns, name) {
    return keyword.call(null, cljs.core.str_STAR_.call(null, ns, "/", name))
  };
  keyword = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return keyword__1.call(this, ns);
      case 2:
        return keyword__2.call(this, ns, name)
    }
    throw"Invalid arity: " + arguments.length;
  };
  keyword.cljs$lang$arity$1 = keyword__1;
  keyword.cljs$lang$arity$2 = keyword__2;
  return keyword
}();
cljs.core.equiv_sequential = function equiv_sequential(x, y) {
  return cljs.core.boolean$.call(null, cljs.core.sequential_QMARK_.call(null, y) ? function() {
    var xs__5772 = cljs.core.seq.call(null, x);
    var ys__5773 = cljs.core.seq.call(null, y);
    while(true) {
      if(xs__5772 == null) {
        return ys__5773 == null
      }else {
        if(ys__5773 == null) {
          return false
        }else {
          if(cljs.core._EQ_.call(null, cljs.core.first.call(null, xs__5772), cljs.core.first.call(null, ys__5773))) {
            var G__5774 = cljs.core.next.call(null, xs__5772);
            var G__5775 = cljs.core.next.call(null, ys__5773);
            xs__5772 = G__5774;
            ys__5773 = G__5775;
            continue
          }else {
            if("\ufdd0'else") {
              return false
            }else {
              return null
            }
          }
        }
      }
      break
    }
  }() : null)
};
cljs.core.hash_combine = function hash_combine(seed, hash) {
  return seed ^ hash + 2654435769 + (seed << 6) + (seed >> 2)
};
cljs.core.hash_coll = function hash_coll(coll) {
  return cljs.core.reduce.call(null, function(p1__5776_SHARP_, p2__5777_SHARP_) {
    return cljs.core.hash_combine.call(null, p1__5776_SHARP_, cljs.core.hash.call(null, p2__5777_SHARP_, false))
  }, cljs.core.hash.call(null, cljs.core.first.call(null, coll), false), cljs.core.next.call(null, coll))
};
cljs.core.hash_imap = function hash_imap(m) {
  var h__5781 = 0;
  var s__5782 = cljs.core.seq.call(null, m);
  while(true) {
    if(s__5782) {
      var e__5783 = cljs.core.first.call(null, s__5782);
      var G__5784 = (h__5781 + (cljs.core.hash.call(null, cljs.core.key.call(null, e__5783)) ^ cljs.core.hash.call(null, cljs.core.val.call(null, e__5783)))) % 4503599627370496;
      var G__5785 = cljs.core.next.call(null, s__5782);
      h__5781 = G__5784;
      s__5782 = G__5785;
      continue
    }else {
      return h__5781
    }
    break
  }
};
cljs.core.hash_iset = function hash_iset(s) {
  var h__5789 = 0;
  var s__5790 = cljs.core.seq.call(null, s);
  while(true) {
    if(s__5790) {
      var e__5791 = cljs.core.first.call(null, s__5790);
      var G__5792 = (h__5789 + cljs.core.hash.call(null, e__5791)) % 4503599627370496;
      var G__5793 = cljs.core.next.call(null, s__5790);
      h__5789 = G__5792;
      s__5790 = G__5793;
      continue
    }else {
      return h__5789
    }
    break
  }
};
cljs.core.extend_object_BANG_ = function extend_object_BANG_(obj, fn_map) {
  var G__5814__5815 = cljs.core.seq.call(null, fn_map);
  if(G__5814__5815) {
    var G__5817__5819 = cljs.core.first.call(null, G__5814__5815);
    var vec__5818__5820 = G__5817__5819;
    var key_name__5821 = cljs.core.nth.call(null, vec__5818__5820, 0, null);
    var f__5822 = cljs.core.nth.call(null, vec__5818__5820, 1, null);
    var G__5814__5823 = G__5814__5815;
    var G__5817__5824 = G__5817__5819;
    var G__5814__5825 = G__5814__5823;
    while(true) {
      var vec__5826__5827 = G__5817__5824;
      var key_name__5828 = cljs.core.nth.call(null, vec__5826__5827, 0, null);
      var f__5829 = cljs.core.nth.call(null, vec__5826__5827, 1, null);
      var G__5814__5830 = G__5814__5825;
      var str_name__5831 = cljs.core.name.call(null, key_name__5828);
      obj[str_name__5831] = f__5829;
      var temp__3974__auto____5832 = cljs.core.next.call(null, G__5814__5830);
      if(temp__3974__auto____5832) {
        var G__5814__5833 = temp__3974__auto____5832;
        var G__5834 = cljs.core.first.call(null, G__5814__5833);
        var G__5835 = G__5814__5833;
        G__5817__5824 = G__5834;
        G__5814__5825 = G__5835;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return obj
};
cljs.core.List = function(meta, first, rest, count, __hash) {
  this.meta = meta;
  this.first = first;
  this.rest = rest;
  this.count = count;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 65413358
};
cljs.core.List.cljs$lang$type = true;
cljs.core.List.cljs$lang$ctorPrSeq = function(this__960__auto__) {
  return cljs.core.list.call(null, "cljs.core/List")
};
cljs.core.List.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__5836 = this;
  var h__843__auto____5837 = this__5836.__hash;
  if(!(h__843__auto____5837 == null)) {
    return h__843__auto____5837
  }else {
    var h__843__auto____5838 = cljs.core.hash_coll.call(null, coll);
    this__5836.__hash = h__843__auto____5838;
    return h__843__auto____5838
  }
};
cljs.core.List.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__5839 = this;
  if(this__5839.count === 1) {
    return null
  }else {
    return this__5839.rest
  }
};
cljs.core.List.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__5840 = this;
  return new cljs.core.List(this__5840.meta, o, coll, this__5840.count + 1, null)
};
cljs.core.List.prototype.toString = function() {
  var this__5841 = this;
  var this__5842 = this;
  return cljs.core.pr_str.call(null, this__5842)
};
cljs.core.List.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__5843 = this;
  return coll
};
cljs.core.List.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__5844 = this;
  return this__5844.count
};
cljs.core.List.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__5845 = this;
  return this__5845.first
};
cljs.core.List.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__5846 = this;
  return coll.cljs$core$ISeq$_rest$arity$1(coll)
};
cljs.core.List.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__5847 = this;
  return this__5847.first
};
cljs.core.List.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__5848 = this;
  if(this__5848.count === 1) {
    return cljs.core.List.EMPTY
  }else {
    return this__5848.rest
  }
};
cljs.core.List.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__5849 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.List.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__5850 = this;
  return new cljs.core.List(meta, this__5850.first, this__5850.rest, this__5850.count, this__5850.__hash)
};
cljs.core.List.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__5851 = this;
  return this__5851.meta
};
cljs.core.List.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__5852 = this;
  return cljs.core.List.EMPTY
};
cljs.core.List;
cljs.core.EmptyList = function(meta) {
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 65413326
};
cljs.core.EmptyList.cljs$lang$type = true;
cljs.core.EmptyList.cljs$lang$ctorPrSeq = function(this__960__auto__) {
  return cljs.core.list.call(null, "cljs.core/EmptyList")
};
cljs.core.EmptyList.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__5853 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__5854 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__5855 = this;
  return new cljs.core.List(this__5855.meta, o, null, 1, null)
};
cljs.core.EmptyList.prototype.toString = function() {
  var this__5856 = this;
  var this__5857 = this;
  return cljs.core.pr_str.call(null, this__5857)
};
cljs.core.EmptyList.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__5858 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__5859 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__5860 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__5861 = this;
  throw new Error("Can't pop empty list");
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__5862 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__5863 = this;
  return cljs.core.List.EMPTY
};
cljs.core.EmptyList.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__5864 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__5865 = this;
  return new cljs.core.EmptyList(meta)
};
cljs.core.EmptyList.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__5866 = this;
  return this__5866.meta
};
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__5867 = this;
  return coll
};
cljs.core.EmptyList;
cljs.core.List.EMPTY = new cljs.core.EmptyList(null);
cljs.core.reversible_QMARK_ = function reversible_QMARK_(coll) {
  var G__5871__5872 = coll;
  if(G__5871__5872) {
    if(function() {
      var or__3824__auto____5873 = G__5871__5872.cljs$lang$protocol_mask$partition0$ & 134217728;
      if(or__3824__auto____5873) {
        return or__3824__auto____5873
      }else {
        return G__5871__5872.cljs$core$IReversible$
      }
    }()) {
      return true
    }else {
      if(!G__5871__5872.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__5871__5872)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__5871__5872)
  }
};
cljs.core.rseq = function rseq(coll) {
  return cljs.core._rseq.call(null, coll)
};
cljs.core.reverse = function reverse(coll) {
  if(cljs.core.reversible_QMARK_.call(null, coll)) {
    return cljs.core.rseq.call(null, coll)
  }else {
    return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, coll)
  }
};
cljs.core.list = function() {
  var list = null;
  var list__0 = function() {
    return cljs.core.List.EMPTY
  };
  var list__1 = function(x) {
    return cljs.core.conj.call(null, cljs.core.List.EMPTY, x)
  };
  var list__2 = function(x, y) {
    return cljs.core.conj.call(null, list.call(null, y), x)
  };
  var list__3 = function(x, y, z) {
    return cljs.core.conj.call(null, list.call(null, y, z), x)
  };
  var list__4 = function() {
    var G__5874__delegate = function(x, y, z, items) {
      return cljs.core.conj.call(null, cljs.core.conj.call(null, cljs.core.conj.call(null, cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, cljs.core.reverse.call(null, items)), z), y), x)
    };
    var G__5874 = function(x, y, z, var_args) {
      var items = null;
      if(goog.isDef(var_args)) {
        items = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__5874__delegate.call(this, x, y, z, items)
    };
    G__5874.cljs$lang$maxFixedArity = 3;
    G__5874.cljs$lang$applyTo = function(arglist__5875) {
      var x = cljs.core.first(arglist__5875);
      var y = cljs.core.first(cljs.core.next(arglist__5875));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5875)));
      var items = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5875)));
      return G__5874__delegate(x, y, z, items)
    };
    G__5874.cljs$lang$arity$variadic = G__5874__delegate;
    return G__5874
  }();
  list = function(x, y, z, var_args) {
    var items = var_args;
    switch(arguments.length) {
      case 0:
        return list__0.call(this);
      case 1:
        return list__1.call(this, x);
      case 2:
        return list__2.call(this, x, y);
      case 3:
        return list__3.call(this, x, y, z);
      default:
        return list__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  list.cljs$lang$maxFixedArity = 3;
  list.cljs$lang$applyTo = list__4.cljs$lang$applyTo;
  list.cljs$lang$arity$0 = list__0;
  list.cljs$lang$arity$1 = list__1;
  list.cljs$lang$arity$2 = list__2;
  list.cljs$lang$arity$3 = list__3;
  list.cljs$lang$arity$variadic = list__4.cljs$lang$arity$variadic;
  return list
}();
cljs.core.Cons = function(meta, first, rest, __hash) {
  this.meta = meta;
  this.first = first;
  this.rest = rest;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 65405164
};
cljs.core.Cons.cljs$lang$type = true;
cljs.core.Cons.cljs$lang$ctorPrSeq = function(this__960__auto__) {
  return cljs.core.list.call(null, "cljs.core/Cons")
};
cljs.core.Cons.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__5876 = this;
  var h__843__auto____5877 = this__5876.__hash;
  if(!(h__843__auto____5877 == null)) {
    return h__843__auto____5877
  }else {
    var h__843__auto____5878 = cljs.core.hash_coll.call(null, coll);
    this__5876.__hash = h__843__auto____5878;
    return h__843__auto____5878
  }
};
cljs.core.Cons.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__5879 = this;
  if(this__5879.rest == null) {
    return null
  }else {
    return cljs.core._seq.call(null, this__5879.rest)
  }
};
cljs.core.Cons.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__5880 = this;
  return new cljs.core.Cons(null, o, coll, this__5880.__hash)
};
cljs.core.Cons.prototype.toString = function() {
  var this__5881 = this;
  var this__5882 = this;
  return cljs.core.pr_str.call(null, this__5882)
};
cljs.core.Cons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__5883 = this;
  return coll
};
cljs.core.Cons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__5884 = this;
  return this__5884.first
};
cljs.core.Cons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__5885 = this;
  if(this__5885.rest == null) {
    return cljs.core.List.EMPTY
  }else {
    return this__5885.rest
  }
};
cljs.core.Cons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__5886 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Cons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__5887 = this;
  return new cljs.core.Cons(meta, this__5887.first, this__5887.rest, this__5887.__hash)
};
cljs.core.Cons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__5888 = this;
  return this__5888.meta
};
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__5889 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__5889.meta)
};
cljs.core.Cons;
cljs.core.cons = function cons(x, coll) {
  if(function() {
    var or__3824__auto____5894 = coll == null;
    if(or__3824__auto____5894) {
      return or__3824__auto____5894
    }else {
      var G__5895__5896 = coll;
      if(G__5895__5896) {
        if(function() {
          var or__3824__auto____5897 = G__5895__5896.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____5897) {
            return or__3824__auto____5897
          }else {
            return G__5895__5896.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__5895__5896.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__5895__5896)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__5895__5896)
      }
    }
  }()) {
    return new cljs.core.Cons(null, x, coll, null)
  }else {
    return new cljs.core.Cons(null, x, cljs.core.seq.call(null, coll), null)
  }
};
cljs.core.list_QMARK_ = function list_QMARK_(x) {
  var G__5901__5902 = x;
  if(G__5901__5902) {
    if(function() {
      var or__3824__auto____5903 = G__5901__5902.cljs$lang$protocol_mask$partition0$ & 33554432;
      if(or__3824__auto____5903) {
        return or__3824__auto____5903
      }else {
        return G__5901__5902.cljs$core$IList$
      }
    }()) {
      return true
    }else {
      if(!G__5901__5902.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__5901__5902)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__5901__5902)
  }
};
cljs.core.IReduce["string"] = true;
cljs.core._reduce["string"] = function() {
  var G__5904 = null;
  var G__5904__2 = function(string, f) {
    return cljs.core.ci_reduce.call(null, string, f)
  };
  var G__5904__3 = function(string, f, start) {
    return cljs.core.ci_reduce.call(null, string, f, start)
  };
  G__5904 = function(string, f, start) {
    switch(arguments.length) {
      case 2:
        return G__5904__2.call(this, string, f);
      case 3:
        return G__5904__3.call(this, string, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5904
}();
cljs.core.ILookup["string"] = true;
cljs.core._lookup["string"] = function() {
  var G__5905 = null;
  var G__5905__2 = function(string, k) {
    return cljs.core._nth.call(null, string, k)
  };
  var G__5905__3 = function(string, k, not_found) {
    return cljs.core._nth.call(null, string, k, not_found)
  };
  G__5905 = function(string, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__5905__2.call(this, string, k);
      case 3:
        return G__5905__3.call(this, string, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5905
}();
cljs.core.IIndexed["string"] = true;
cljs.core._nth["string"] = function() {
  var G__5906 = null;
  var G__5906__2 = function(string, n) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return null
    }
  };
  var G__5906__3 = function(string, n, not_found) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return not_found
    }
  };
  G__5906 = function(string, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__5906__2.call(this, string, n);
      case 3:
        return G__5906__3.call(this, string, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5906
}();
cljs.core.ICounted["string"] = true;
cljs.core._count["string"] = function(s) {
  return s.length
};
cljs.core.ISeqable["string"] = true;
cljs.core._seq["string"] = function(string) {
  return cljs.core.prim_seq.call(null, string, 0)
};
cljs.core.IHash["string"] = true;
cljs.core._hash["string"] = function(o) {
  return goog.string.hashCode(o)
};
cljs.core.Keyword = function(k) {
  this.k = k;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 1
};
cljs.core.Keyword.cljs$lang$type = true;
cljs.core.Keyword.cljs$lang$ctorPrSeq = function(this__960__auto__) {
  return cljs.core.list.call(null, "cljs.core/Keyword")
};
cljs.core.Keyword.prototype.call = function() {
  var G__5918 = null;
  var G__5918__2 = function(this_sym5909, coll) {
    var this__5911 = this;
    var this_sym5909__5912 = this;
    var ___5913 = this_sym5909__5912;
    if(coll == null) {
      return null
    }else {
      var strobj__5914 = coll.strobj;
      if(strobj__5914 == null) {
        return cljs.core._lookup.call(null, coll, this__5911.k, null)
      }else {
        return strobj__5914[this__5911.k]
      }
    }
  };
  var G__5918__3 = function(this_sym5910, coll, not_found) {
    var this__5911 = this;
    var this_sym5910__5915 = this;
    var ___5916 = this_sym5910__5915;
    if(coll == null) {
      return not_found
    }else {
      return cljs.core._lookup.call(null, coll, this__5911.k, not_found)
    }
  };
  G__5918 = function(this_sym5910, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__5918__2.call(this, this_sym5910, coll);
      case 3:
        return G__5918__3.call(this, this_sym5910, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5918
}();
cljs.core.Keyword.prototype.apply = function(this_sym5907, args5908) {
  var this__5917 = this;
  return this_sym5907.call.apply(this_sym5907, [this_sym5907].concat(args5908.slice()))
};
cljs.core.Keyword;
String.prototype.cljs$core$IFn$ = true;
String.prototype.call = function() {
  var G__5927 = null;
  var G__5927__2 = function(this_sym5921, coll) {
    var this_sym5921__5923 = this;
    var this__5924 = this_sym5921__5923;
    return cljs.core._lookup.call(null, coll, this__5924.toString(), null)
  };
  var G__5927__3 = function(this_sym5922, coll, not_found) {
    var this_sym5922__5925 = this;
    var this__5926 = this_sym5922__5925;
    return cljs.core._lookup.call(null, coll, this__5926.toString(), not_found)
  };
  G__5927 = function(this_sym5922, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__5927__2.call(this, this_sym5922, coll);
      case 3:
        return G__5927__3.call(this, this_sym5922, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5927
}();
String.prototype.apply = function(this_sym5919, args5920) {
  return this_sym5919.call.apply(this_sym5919, [this_sym5919].concat(args5920.slice()))
};
String.prototype.apply = function(s, args) {
  if(cljs.core.count.call(null, args) < 2) {
    return cljs.core._lookup.call(null, args[0], s, null)
  }else {
    return cljs.core._lookup.call(null, args[0], s, args[1])
  }
};
cljs.core.lazy_seq_value = function lazy_seq_value(lazy_seq) {
  var x__5929 = lazy_seq.x;
  if(lazy_seq.realized) {
    return x__5929
  }else {
    lazy_seq.x = x__5929.call(null);
    lazy_seq.realized = true;
    return lazy_seq.x
  }
};
cljs.core.LazySeq = function(meta, realized, x, __hash) {
  this.meta = meta;
  this.realized = realized;
  this.x = x;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850700
};
cljs.core.LazySeq.cljs$lang$type = true;
cljs.core.LazySeq.cljs$lang$ctorPrSeq = function(this__960__auto__) {
  return cljs.core.list.call(null, "cljs.core/LazySeq")
};
cljs.core.LazySeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__5930 = this;
  var h__843__auto____5931 = this__5930.__hash;
  if(!(h__843__auto____5931 == null)) {
    return h__843__auto____5931
  }else {
    var h__843__auto____5932 = cljs.core.hash_coll.call(null, coll);
    this__5930.__hash = h__843__auto____5932;
    return h__843__auto____5932
  }
};
cljs.core.LazySeq.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__5933 = this;
  return cljs.core._seq.call(null, coll.cljs$core$ISeq$_rest$arity$1(coll))
};
cljs.core.LazySeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__5934 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.LazySeq.prototype.toString = function() {
  var this__5935 = this;
  var this__5936 = this;
  return cljs.core.pr_str.call(null, this__5936)
};
cljs.core.LazySeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__5937 = this;
  return cljs.core.seq.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__5938 = this;
  return cljs.core.first.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__5939 = this;
  return cljs.core.rest.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__5940 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__5941 = this;
  return new cljs.core.LazySeq(meta, this__5941.realized, this__5941.x, this__5941.__hash)
};
cljs.core.LazySeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__5942 = this;
  return this__5942.meta
};
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__5943 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__5943.meta)
};
cljs.core.LazySeq;
cljs.core.ChunkBuffer = function(buf, end) {
  this.buf = buf;
  this.end = end;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2
};
cljs.core.ChunkBuffer.cljs$lang$type = true;
cljs.core.ChunkBuffer.cljs$lang$ctorPrSeq = function(this__960__auto__) {
  return cljs.core.list.call(null, "cljs.core/ChunkBuffer")
};
cljs.core.ChunkBuffer.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__5944 = this;
  return this__5944.end
};
cljs.core.ChunkBuffer.prototype.add = function(o) {
  var this__5945 = this;
  var ___5946 = this;
  this__5945.buf[this__5945.end] = o;
  return this__5945.end = this__5945.end + 1
};
cljs.core.ChunkBuffer.prototype.chunk = function(o) {
  var this__5947 = this;
  var ___5948 = this;
  var ret__5949 = new cljs.core.ArrayChunk(this__5947.buf, 0, this__5947.end);
  this__5947.buf = null;
  return ret__5949
};
cljs.core.ChunkBuffer;
cljs.core.chunk_buffer = function chunk_buffer(capacity) {
  return new cljs.core.ChunkBuffer(cljs.core.make_array.call(null, capacity), 0)
};
cljs.core.ArrayChunk = function(arr, off, end) {
  this.arr = arr;
  this.off = off;
  this.end = end;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 524306
};
cljs.core.ArrayChunk.cljs$lang$type = true;
cljs.core.ArrayChunk.cljs$lang$ctorPrSeq = function(this__960__auto__) {
  return cljs.core.list.call(null, "cljs.core/ArrayChunk")
};
cljs.core.ArrayChunk.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__5950 = this;
  return cljs.core.ci_reduce.call(null, coll, f, this__5950.arr[this__5950.off], this__5950.off + 1)
};
cljs.core.ArrayChunk.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__5951 = this;
  return cljs.core.ci_reduce.call(null, coll, f, start, this__5951.off)
};
cljs.core.ArrayChunk.prototype.cljs$core$IChunk$ = true;
cljs.core.ArrayChunk.prototype.cljs$core$IChunk$_drop_first$arity$1 = function(coll) {
  var this__5952 = this;
  if(this__5952.off === this__5952.end) {
    throw new Error("-drop-first of empty chunk");
  }else {
    return new cljs.core.ArrayChunk(this__5952.arr, this__5952.off + 1, this__5952.end)
  }
};
cljs.core.ArrayChunk.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, i) {
  var this__5953 = this;
  return this__5953.arr[this__5953.off + i]
};
cljs.core.ArrayChunk.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, i, not_found) {
  var this__5954 = this;
  if(function() {
    var and__3822__auto____5955 = i >= 0;
    if(and__3822__auto____5955) {
      return i < this__5954.end - this__5954.off
    }else {
      return and__3822__auto____5955
    }
  }()) {
    return this__5954.arr[this__5954.off + i]
  }else {
    return not_found
  }
};
cljs.core.ArrayChunk.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__5956 = this;
  return this__5956.end - this__5956.off
};
cljs.core.ArrayChunk;
cljs.core.array_chunk = function() {
  var array_chunk = null;
  var array_chunk__1 = function(arr) {
    return array_chunk.call(null, arr, 0, arr.length)
  };
  var array_chunk__2 = function(arr, off) {
    return array_chunk.call(null, arr, off, arr.length)
  };
  var array_chunk__3 = function(arr, off, end) {
    return new cljs.core.ArrayChunk(arr, off, end)
  };
  array_chunk = function(arr, off, end) {
    switch(arguments.length) {
      case 1:
        return array_chunk__1.call(this, arr);
      case 2:
        return array_chunk__2.call(this, arr, off);
      case 3:
        return array_chunk__3.call(this, arr, off, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  array_chunk.cljs$lang$arity$1 = array_chunk__1;
  array_chunk.cljs$lang$arity$2 = array_chunk__2;
  array_chunk.cljs$lang$arity$3 = array_chunk__3;
  return array_chunk
}();
cljs.core.ChunkedCons = function(chunk, more, meta) {
  this.chunk = chunk;
  this.more = more;
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 27656296
};
cljs.core.ChunkedCons.cljs$lang$type = true;
cljs.core.ChunkedCons.cljs$lang$ctorPrSeq = function(this__960__auto__) {
  return cljs.core.list.call(null, "cljs.core/ChunkedCons")
};
cljs.core.ChunkedCons.prototype.cljs$core$ICollection$_conj$arity$2 = function(this$, o) {
  var this__5957 = this;
  return cljs.core.cons.call(null, o, this$)
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__5958 = this;
  return coll
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__5959 = this;
  return cljs.core._nth.call(null, this__5959.chunk, 0)
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__5960 = this;
  if(cljs.core._count.call(null, this__5960.chunk) > 1) {
    return new cljs.core.ChunkedCons(cljs.core._drop_first.call(null, this__5960.chunk), this__5960.more, this__5960.meta)
  }else {
    if(this__5960.more == null) {
      return cljs.core.List.EMPTY
    }else {
      return this__5960.more
    }
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedNext$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedNext$_chunked_next$arity$1 = function(coll) {
  var this__5961 = this;
  if(this__5961.more == null) {
    return null
  }else {
    return this__5961.more
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__5962 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ChunkedCons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, m) {
  var this__5963 = this;
  return new cljs.core.ChunkedCons(this__5963.chunk, this__5963.more, m)
};
cljs.core.ChunkedCons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__5964 = this;
  return this__5964.meta
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$_chunked_first$arity$1 = function(coll) {
  var this__5965 = this;
  return this__5965.chunk
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$_chunked_rest$arity$1 = function(coll) {
  var this__5966 = this;
  if(this__5966.more == null) {
    return cljs.core.List.EMPTY
  }else {
    return this__5966.more
  }
};
cljs.core.ChunkedCons;
cljs.core.chunk_cons = function chunk_cons(chunk, rest) {
  if(cljs.core._count.call(null, chunk) === 0) {
    return rest
  }else {
    return new cljs.core.ChunkedCons(chunk, rest, null)
  }
};
cljs.core.chunk_append = function chunk_append(b, x) {
  return b.add(x)
};
cljs.core.chunk = function chunk(b) {
  return b.chunk()
};
cljs.core.chunk_first = function chunk_first(s) {
  return cljs.core._chunked_first.call(null, s)
};
cljs.core.chunk_rest = function chunk_rest(s) {
  return cljs.core._chunked_rest.call(null, s)
};
cljs.core.chunk_next = function chunk_next(s) {
  if(function() {
    var G__5970__5971 = s;
    if(G__5970__5971) {
      if(cljs.core.truth_(function() {
        var or__3824__auto____5972 = null;
        if(cljs.core.truth_(or__3824__auto____5972)) {
          return or__3824__auto____5972
        }else {
          return G__5970__5971.cljs$core$IChunkedNext$
        }
      }())) {
        return true
      }else {
        if(!G__5970__5971.cljs$lang$protocol_mask$partition$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedNext, G__5970__5971)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedNext, G__5970__5971)
    }
  }()) {
    return cljs.core._chunked_next.call(null, s)
  }else {
    return cljs.core.seq.call(null, cljs.core._chunked_rest.call(null, s))
  }
};
cljs.core.to_array = function to_array(s) {
  var ary__5975 = [];
  var s__5976 = s;
  while(true) {
    if(cljs.core.seq.call(null, s__5976)) {
      ary__5975.push(cljs.core.first.call(null, s__5976));
      var G__5977 = cljs.core.next.call(null, s__5976);
      s__5976 = G__5977;
      continue
    }else {
      return ary__5975
    }
    break
  }
};
cljs.core.to_array_2d = function to_array_2d(coll) {
  var ret__5981 = cljs.core.make_array.call(null, cljs.core.count.call(null, coll));
  var i__5982 = 0;
  var xs__5983 = cljs.core.seq.call(null, coll);
  while(true) {
    if(xs__5983) {
      ret__5981[i__5982] = cljs.core.to_array.call(null, cljs.core.first.call(null, xs__5983));
      var G__5984 = i__5982 + 1;
      var G__5985 = cljs.core.next.call(null, xs__5983);
      i__5982 = G__5984;
      xs__5983 = G__5985;
      continue
    }else {
    }
    break
  }
  return ret__5981
};
cljs.core.long_array = function() {
  var long_array = null;
  var long_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return long_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("long-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var long_array__2 = function(size, init_val_or_seq) {
    var a__5993 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__5994 = cljs.core.seq.call(null, init_val_or_seq);
      var i__5995 = 0;
      var s__5996 = s__5994;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____5997 = s__5996;
          if(and__3822__auto____5997) {
            return i__5995 < size
          }else {
            return and__3822__auto____5997
          }
        }())) {
          a__5993[i__5995] = cljs.core.first.call(null, s__5996);
          var G__6000 = i__5995 + 1;
          var G__6001 = cljs.core.next.call(null, s__5996);
          i__5995 = G__6000;
          s__5996 = G__6001;
          continue
        }else {
          return a__5993
        }
        break
      }
    }else {
      var n__1178__auto____5998 = size;
      var i__5999 = 0;
      while(true) {
        if(i__5999 < n__1178__auto____5998) {
          a__5993[i__5999] = init_val_or_seq;
          var G__6002 = i__5999 + 1;
          i__5999 = G__6002;
          continue
        }else {
        }
        break
      }
      return a__5993
    }
  };
  long_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return long_array__1.call(this, size);
      case 2:
        return long_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  long_array.cljs$lang$arity$1 = long_array__1;
  long_array.cljs$lang$arity$2 = long_array__2;
  return long_array
}();
cljs.core.double_array = function() {
  var double_array = null;
  var double_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return double_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("double-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var double_array__2 = function(size, init_val_or_seq) {
    var a__6010 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__6011 = cljs.core.seq.call(null, init_val_or_seq);
      var i__6012 = 0;
      var s__6013 = s__6011;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____6014 = s__6013;
          if(and__3822__auto____6014) {
            return i__6012 < size
          }else {
            return and__3822__auto____6014
          }
        }())) {
          a__6010[i__6012] = cljs.core.first.call(null, s__6013);
          var G__6017 = i__6012 + 1;
          var G__6018 = cljs.core.next.call(null, s__6013);
          i__6012 = G__6017;
          s__6013 = G__6018;
          continue
        }else {
          return a__6010
        }
        break
      }
    }else {
      var n__1178__auto____6015 = size;
      var i__6016 = 0;
      while(true) {
        if(i__6016 < n__1178__auto____6015) {
          a__6010[i__6016] = init_val_or_seq;
          var G__6019 = i__6016 + 1;
          i__6016 = G__6019;
          continue
        }else {
        }
        break
      }
      return a__6010
    }
  };
  double_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return double_array__1.call(this, size);
      case 2:
        return double_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  double_array.cljs$lang$arity$1 = double_array__1;
  double_array.cljs$lang$arity$2 = double_array__2;
  return double_array
}();
cljs.core.object_array = function() {
  var object_array = null;
  var object_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return object_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("object-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var object_array__2 = function(size, init_val_or_seq) {
    var a__6027 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__6028 = cljs.core.seq.call(null, init_val_or_seq);
      var i__6029 = 0;
      var s__6030 = s__6028;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____6031 = s__6030;
          if(and__3822__auto____6031) {
            return i__6029 < size
          }else {
            return and__3822__auto____6031
          }
        }())) {
          a__6027[i__6029] = cljs.core.first.call(null, s__6030);
          var G__6034 = i__6029 + 1;
          var G__6035 = cljs.core.next.call(null, s__6030);
          i__6029 = G__6034;
          s__6030 = G__6035;
          continue
        }else {
          return a__6027
        }
        break
      }
    }else {
      var n__1178__auto____6032 = size;
      var i__6033 = 0;
      while(true) {
        if(i__6033 < n__1178__auto____6032) {
          a__6027[i__6033] = init_val_or_seq;
          var G__6036 = i__6033 + 1;
          i__6033 = G__6036;
          continue
        }else {
        }
        break
      }
      return a__6027
    }
  };
  object_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return object_array__1.call(this, size);
      case 2:
        return object_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  object_array.cljs$lang$arity$1 = object_array__1;
  object_array.cljs$lang$arity$2 = object_array__2;
  return object_array
}();
cljs.core.bounded_count = function bounded_count(s, n) {
  if(cljs.core.counted_QMARK_.call(null, s)) {
    return cljs.core.count.call(null, s)
  }else {
    var s__6041 = s;
    var i__6042 = n;
    var sum__6043 = 0;
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3822__auto____6044 = i__6042 > 0;
        if(and__3822__auto____6044) {
          return cljs.core.seq.call(null, s__6041)
        }else {
          return and__3822__auto____6044
        }
      }())) {
        var G__6045 = cljs.core.next.call(null, s__6041);
        var G__6046 = i__6042 - 1;
        var G__6047 = sum__6043 + 1;
        s__6041 = G__6045;
        i__6042 = G__6046;
        sum__6043 = G__6047;
        continue
      }else {
        return sum__6043
      }
      break
    }
  }
};
cljs.core.spread = function spread(arglist) {
  if(arglist == null) {
    return null
  }else {
    if(cljs.core.next.call(null, arglist) == null) {
      return cljs.core.seq.call(null, cljs.core.first.call(null, arglist))
    }else {
      if("\ufdd0'else") {
        return cljs.core.cons.call(null, cljs.core.first.call(null, arglist), spread.call(null, cljs.core.next.call(null, arglist)))
      }else {
        return null
      }
    }
  }
};
cljs.core.concat = function() {
  var concat = null;
  var concat__0 = function() {
    return new cljs.core.LazySeq(null, false, function() {
      return null
    }, null)
  };
  var concat__1 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return x
    }, null)
  };
  var concat__2 = function(x, y) {
    return new cljs.core.LazySeq(null, false, function() {
      var s__6052 = cljs.core.seq.call(null, x);
      if(s__6052) {
        if(cljs.core.chunked_seq_QMARK_.call(null, s__6052)) {
          return cljs.core.chunk_cons.call(null, cljs.core.chunk_first.call(null, s__6052), concat.call(null, cljs.core.chunk_rest.call(null, s__6052), y))
        }else {
          return cljs.core.cons.call(null, cljs.core.first.call(null, s__6052), concat.call(null, cljs.core.rest.call(null, s__6052), y))
        }
      }else {
        return y
      }
    }, null)
  };
  var concat__3 = function() {
    var G__6056__delegate = function(x, y, zs) {
      var cat__6055 = function cat(xys, zs) {
        return new cljs.core.LazySeq(null, false, function() {
          var xys__6054 = cljs.core.seq.call(null, xys);
          if(xys__6054) {
            if(cljs.core.chunked_seq_QMARK_.call(null, xys__6054)) {
              return cljs.core.chunk_cons.call(null, cljs.core.chunk_first.call(null, xys__6054), cat.call(null, cljs.core.chunk_rest.call(null, xys__6054), zs))
            }else {
              return cljs.core.cons.call(null, cljs.core.first.call(null, xys__6054), cat.call(null, cljs.core.rest.call(null, xys__6054), zs))
            }
          }else {
            if(cljs.core.truth_(zs)) {
              return cat.call(null, cljs.core.first.call(null, zs), cljs.core.next.call(null, zs))
            }else {
              return null
            }
          }
        }, null)
      };
      return cat__6055.call(null, concat.call(null, x, y), zs)
    };
    var G__6056 = function(x, y, var_args) {
      var zs = null;
      if(goog.isDef(var_args)) {
        zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6056__delegate.call(this, x, y, zs)
    };
    G__6056.cljs$lang$maxFixedArity = 2;
    G__6056.cljs$lang$applyTo = function(arglist__6057) {
      var x = cljs.core.first(arglist__6057);
      var y = cljs.core.first(cljs.core.next(arglist__6057));
      var zs = cljs.core.rest(cljs.core.next(arglist__6057));
      return G__6056__delegate(x, y, zs)
    };
    G__6056.cljs$lang$arity$variadic = G__6056__delegate;
    return G__6056
  }();
  concat = function(x, y, var_args) {
    var zs = var_args;
    switch(arguments.length) {
      case 0:
        return concat__0.call(this);
      case 1:
        return concat__1.call(this, x);
      case 2:
        return concat__2.call(this, x, y);
      default:
        return concat__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  concat.cljs$lang$maxFixedArity = 2;
  concat.cljs$lang$applyTo = concat__3.cljs$lang$applyTo;
  concat.cljs$lang$arity$0 = concat__0;
  concat.cljs$lang$arity$1 = concat__1;
  concat.cljs$lang$arity$2 = concat__2;
  concat.cljs$lang$arity$variadic = concat__3.cljs$lang$arity$variadic;
  return concat
}();
cljs.core.list_STAR_ = function() {
  var list_STAR_ = null;
  var list_STAR___1 = function(args) {
    return cljs.core.seq.call(null, args)
  };
  var list_STAR___2 = function(a, args) {
    return cljs.core.cons.call(null, a, args)
  };
  var list_STAR___3 = function(a, b, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, args))
  };
  var list_STAR___4 = function(a, b, c, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, args)))
  };
  var list_STAR___5 = function() {
    var G__6058__delegate = function(a, b, c, d, more) {
      return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, more)))))
    };
    var G__6058 = function(a, b, c, d, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__6058__delegate.call(this, a, b, c, d, more)
    };
    G__6058.cljs$lang$maxFixedArity = 4;
    G__6058.cljs$lang$applyTo = function(arglist__6059) {
      var a = cljs.core.first(arglist__6059);
      var b = cljs.core.first(cljs.core.next(arglist__6059));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6059)));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__6059))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__6059))));
      return G__6058__delegate(a, b, c, d, more)
    };
    G__6058.cljs$lang$arity$variadic = G__6058__delegate;
    return G__6058
  }();
  list_STAR_ = function(a, b, c, d, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return list_STAR___1.call(this, a);
      case 2:
        return list_STAR___2.call(this, a, b);
      case 3:
        return list_STAR___3.call(this, a, b, c);
      case 4:
        return list_STAR___4.call(this, a, b, c, d);
      default:
        return list_STAR___5.cljs$lang$arity$variadic(a, b, c, d, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  list_STAR_.cljs$lang$maxFixedArity = 4;
  list_STAR_.cljs$lang$applyTo = list_STAR___5.cljs$lang$applyTo;
  list_STAR_.cljs$lang$arity$1 = list_STAR___1;
  list_STAR_.cljs$lang$arity$2 = list_STAR___2;
  list_STAR_.cljs$lang$arity$3 = list_STAR___3;
  list_STAR_.cljs$lang$arity$4 = list_STAR___4;
  list_STAR_.cljs$lang$arity$variadic = list_STAR___5.cljs$lang$arity$variadic;
  return list_STAR_
}();
cljs.core.transient$ = function transient$(coll) {
  return cljs.core._as_transient.call(null, coll)
};
cljs.core.persistent_BANG_ = function persistent_BANG_(tcoll) {
  return cljs.core._persistent_BANG_.call(null, tcoll)
};
cljs.core.conj_BANG_ = function conj_BANG_(tcoll, val) {
  return cljs.core._conj_BANG_.call(null, tcoll, val)
};
cljs.core.assoc_BANG_ = function assoc_BANG_(tcoll, key, val) {
  return cljs.core._assoc_BANG_.call(null, tcoll, key, val)
};
cljs.core.dissoc_BANG_ = function dissoc_BANG_(tcoll, key) {
  return cljs.core._dissoc_BANG_.call(null, tcoll, key)
};
cljs.core.pop_BANG_ = function pop_BANG_(tcoll) {
  return cljs.core._pop_BANG_.call(null, tcoll)
};
cljs.core.disj_BANG_ = function disj_BANG_(tcoll, val) {
  return cljs.core._disjoin_BANG_.call(null, tcoll, val)
};
cljs.core.apply_to = function apply_to(f, argc, args) {
  var args__6101 = cljs.core.seq.call(null, args);
  if(argc === 0) {
    return f.call(null)
  }else {
    var a__6102 = cljs.core._first.call(null, args__6101);
    var args__6103 = cljs.core._rest.call(null, args__6101);
    if(argc === 1) {
      if(f.cljs$lang$arity$1) {
        return f.cljs$lang$arity$1(a__6102)
      }else {
        return f.call(null, a__6102)
      }
    }else {
      var b__6104 = cljs.core._first.call(null, args__6103);
      var args__6105 = cljs.core._rest.call(null, args__6103);
      if(argc === 2) {
        if(f.cljs$lang$arity$2) {
          return f.cljs$lang$arity$2(a__6102, b__6104)
        }else {
          return f.call(null, a__6102, b__6104)
        }
      }else {
        var c__6106 = cljs.core._first.call(null, args__6105);
        var args__6107 = cljs.core._rest.call(null, args__6105);
        if(argc === 3) {
          if(f.cljs$lang$arity$3) {
            return f.cljs$lang$arity$3(a__6102, b__6104, c__6106)
          }else {
            return f.call(null, a__6102, b__6104, c__6106)
          }
        }else {
          var d__6108 = cljs.core._first.call(null, args__6107);
          var args__6109 = cljs.core._rest.call(null, args__6107);
          if(argc === 4) {
            if(f.cljs$lang$arity$4) {
              return f.cljs$lang$arity$4(a__6102, b__6104, c__6106, d__6108)
            }else {
              return f.call(null, a__6102, b__6104, c__6106, d__6108)
            }
          }else {
            var e__6110 = cljs.core._first.call(null, args__6109);
            var args__6111 = cljs.core._rest.call(null, args__6109);
            if(argc === 5) {
              if(f.cljs$lang$arity$5) {
                return f.cljs$lang$arity$5(a__6102, b__6104, c__6106, d__6108, e__6110)
              }else {
                return f.call(null, a__6102, b__6104, c__6106, d__6108, e__6110)
              }
            }else {
              var f__6112 = cljs.core._first.call(null, args__6111);
              var args__6113 = cljs.core._rest.call(null, args__6111);
              if(argc === 6) {
                if(f__6112.cljs$lang$arity$6) {
                  return f__6112.cljs$lang$arity$6(a__6102, b__6104, c__6106, d__6108, e__6110, f__6112)
                }else {
                  return f__6112.call(null, a__6102, b__6104, c__6106, d__6108, e__6110, f__6112)
                }
              }else {
                var g__6114 = cljs.core._first.call(null, args__6113);
                var args__6115 = cljs.core._rest.call(null, args__6113);
                if(argc === 7) {
                  if(f__6112.cljs$lang$arity$7) {
                    return f__6112.cljs$lang$arity$7(a__6102, b__6104, c__6106, d__6108, e__6110, f__6112, g__6114)
                  }else {
                    return f__6112.call(null, a__6102, b__6104, c__6106, d__6108, e__6110, f__6112, g__6114)
                  }
                }else {
                  var h__6116 = cljs.core._first.call(null, args__6115);
                  var args__6117 = cljs.core._rest.call(null, args__6115);
                  if(argc === 8) {
                    if(f__6112.cljs$lang$arity$8) {
                      return f__6112.cljs$lang$arity$8(a__6102, b__6104, c__6106, d__6108, e__6110, f__6112, g__6114, h__6116)
                    }else {
                      return f__6112.call(null, a__6102, b__6104, c__6106, d__6108, e__6110, f__6112, g__6114, h__6116)
                    }
                  }else {
                    var i__6118 = cljs.core._first.call(null, args__6117);
                    var args__6119 = cljs.core._rest.call(null, args__6117);
                    if(argc === 9) {
                      if(f__6112.cljs$lang$arity$9) {
                        return f__6112.cljs$lang$arity$9(a__6102, b__6104, c__6106, d__6108, e__6110, f__6112, g__6114, h__6116, i__6118)
                      }else {
                        return f__6112.call(null, a__6102, b__6104, c__6106, d__6108, e__6110, f__6112, g__6114, h__6116, i__6118)
                      }
                    }else {
                      var j__6120 = cljs.core._first.call(null, args__6119);
                      var args__6121 = cljs.core._rest.call(null, args__6119);
                      if(argc === 10) {
                        if(f__6112.cljs$lang$arity$10) {
                          return f__6112.cljs$lang$arity$10(a__6102, b__6104, c__6106, d__6108, e__6110, f__6112, g__6114, h__6116, i__6118, j__6120)
                        }else {
                          return f__6112.call(null, a__6102, b__6104, c__6106, d__6108, e__6110, f__6112, g__6114, h__6116, i__6118, j__6120)
                        }
                      }else {
                        var k__6122 = cljs.core._first.call(null, args__6121);
                        var args__6123 = cljs.core._rest.call(null, args__6121);
                        if(argc === 11) {
                          if(f__6112.cljs$lang$arity$11) {
                            return f__6112.cljs$lang$arity$11(a__6102, b__6104, c__6106, d__6108, e__6110, f__6112, g__6114, h__6116, i__6118, j__6120, k__6122)
                          }else {
                            return f__6112.call(null, a__6102, b__6104, c__6106, d__6108, e__6110, f__6112, g__6114, h__6116, i__6118, j__6120, k__6122)
                          }
                        }else {
                          var l__6124 = cljs.core._first.call(null, args__6123);
                          var args__6125 = cljs.core._rest.call(null, args__6123);
                          if(argc === 12) {
                            if(f__6112.cljs$lang$arity$12) {
                              return f__6112.cljs$lang$arity$12(a__6102, b__6104, c__6106, d__6108, e__6110, f__6112, g__6114, h__6116, i__6118, j__6120, k__6122, l__6124)
                            }else {
                              return f__6112.call(null, a__6102, b__6104, c__6106, d__6108, e__6110, f__6112, g__6114, h__6116, i__6118, j__6120, k__6122, l__6124)
                            }
                          }else {
                            var m__6126 = cljs.core._first.call(null, args__6125);
                            var args__6127 = cljs.core._rest.call(null, args__6125);
                            if(argc === 13) {
                              if(f__6112.cljs$lang$arity$13) {
                                return f__6112.cljs$lang$arity$13(a__6102, b__6104, c__6106, d__6108, e__6110, f__6112, g__6114, h__6116, i__6118, j__6120, k__6122, l__6124, m__6126)
                              }else {
                                return f__6112.call(null, a__6102, b__6104, c__6106, d__6108, e__6110, f__6112, g__6114, h__6116, i__6118, j__6120, k__6122, l__6124, m__6126)
                              }
                            }else {
                              var n__6128 = cljs.core._first.call(null, args__6127);
                              var args__6129 = cljs.core._rest.call(null, args__6127);
                              if(argc === 14) {
                                if(f__6112.cljs$lang$arity$14) {
                                  return f__6112.cljs$lang$arity$14(a__6102, b__6104, c__6106, d__6108, e__6110, f__6112, g__6114, h__6116, i__6118, j__6120, k__6122, l__6124, m__6126, n__6128)
                                }else {
                                  return f__6112.call(null, a__6102, b__6104, c__6106, d__6108, e__6110, f__6112, g__6114, h__6116, i__6118, j__6120, k__6122, l__6124, m__6126, n__6128)
                                }
                              }else {
                                var o__6130 = cljs.core._first.call(null, args__6129);
                                var args__6131 = cljs.core._rest.call(null, args__6129);
                                if(argc === 15) {
                                  if(f__6112.cljs$lang$arity$15) {
                                    return f__6112.cljs$lang$arity$15(a__6102, b__6104, c__6106, d__6108, e__6110, f__6112, g__6114, h__6116, i__6118, j__6120, k__6122, l__6124, m__6126, n__6128, o__6130)
                                  }else {
                                    return f__6112.call(null, a__6102, b__6104, c__6106, d__6108, e__6110, f__6112, g__6114, h__6116, i__6118, j__6120, k__6122, l__6124, m__6126, n__6128, o__6130)
                                  }
                                }else {
                                  var p__6132 = cljs.core._first.call(null, args__6131);
                                  var args__6133 = cljs.core._rest.call(null, args__6131);
                                  if(argc === 16) {
                                    if(f__6112.cljs$lang$arity$16) {
                                      return f__6112.cljs$lang$arity$16(a__6102, b__6104, c__6106, d__6108, e__6110, f__6112, g__6114, h__6116, i__6118, j__6120, k__6122, l__6124, m__6126, n__6128, o__6130, p__6132)
                                    }else {
                                      return f__6112.call(null, a__6102, b__6104, c__6106, d__6108, e__6110, f__6112, g__6114, h__6116, i__6118, j__6120, k__6122, l__6124, m__6126, n__6128, o__6130, p__6132)
                                    }
                                  }else {
                                    var q__6134 = cljs.core._first.call(null, args__6133);
                                    var args__6135 = cljs.core._rest.call(null, args__6133);
                                    if(argc === 17) {
                                      if(f__6112.cljs$lang$arity$17) {
                                        return f__6112.cljs$lang$arity$17(a__6102, b__6104, c__6106, d__6108, e__6110, f__6112, g__6114, h__6116, i__6118, j__6120, k__6122, l__6124, m__6126, n__6128, o__6130, p__6132, q__6134)
                                      }else {
                                        return f__6112.call(null, a__6102, b__6104, c__6106, d__6108, e__6110, f__6112, g__6114, h__6116, i__6118, j__6120, k__6122, l__6124, m__6126, n__6128, o__6130, p__6132, q__6134)
                                      }
                                    }else {
                                      var r__6136 = cljs.core._first.call(null, args__6135);
                                      var args__6137 = cljs.core._rest.call(null, args__6135);
                                      if(argc === 18) {
                                        if(f__6112.cljs$lang$arity$18) {
                                          return f__6112.cljs$lang$arity$18(a__6102, b__6104, c__6106, d__6108, e__6110, f__6112, g__6114, h__6116, i__6118, j__6120, k__6122, l__6124, m__6126, n__6128, o__6130, p__6132, q__6134, r__6136)
                                        }else {
                                          return f__6112.call(null, a__6102, b__6104, c__6106, d__6108, e__6110, f__6112, g__6114, h__6116, i__6118, j__6120, k__6122, l__6124, m__6126, n__6128, o__6130, p__6132, q__6134, r__6136)
                                        }
                                      }else {
                                        var s__6138 = cljs.core._first.call(null, args__6137);
                                        var args__6139 = cljs.core._rest.call(null, args__6137);
                                        if(argc === 19) {
                                          if(f__6112.cljs$lang$arity$19) {
                                            return f__6112.cljs$lang$arity$19(a__6102, b__6104, c__6106, d__6108, e__6110, f__6112, g__6114, h__6116, i__6118, j__6120, k__6122, l__6124, m__6126, n__6128, o__6130, p__6132, q__6134, r__6136, s__6138)
                                          }else {
                                            return f__6112.call(null, a__6102, b__6104, c__6106, d__6108, e__6110, f__6112, g__6114, h__6116, i__6118, j__6120, k__6122, l__6124, m__6126, n__6128, o__6130, p__6132, q__6134, r__6136, s__6138)
                                          }
                                        }else {
                                          var t__6140 = cljs.core._first.call(null, args__6139);
                                          var args__6141 = cljs.core._rest.call(null, args__6139);
                                          if(argc === 20) {
                                            if(f__6112.cljs$lang$arity$20) {
                                              return f__6112.cljs$lang$arity$20(a__6102, b__6104, c__6106, d__6108, e__6110, f__6112, g__6114, h__6116, i__6118, j__6120, k__6122, l__6124, m__6126, n__6128, o__6130, p__6132, q__6134, r__6136, s__6138, t__6140)
                                            }else {
                                              return f__6112.call(null, a__6102, b__6104, c__6106, d__6108, e__6110, f__6112, g__6114, h__6116, i__6118, j__6120, k__6122, l__6124, m__6126, n__6128, o__6130, p__6132, q__6134, r__6136, s__6138, t__6140)
                                            }
                                          }else {
                                            throw new Error("Only up to 20 arguments supported on functions");
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};
cljs.core.apply = function() {
  var apply = null;
  var apply__2 = function(f, args) {
    var fixed_arity__6156 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__6157 = cljs.core.bounded_count.call(null, args, fixed_arity__6156 + 1);
      if(bc__6157 <= fixed_arity__6156) {
        return cljs.core.apply_to.call(null, f, bc__6157, args)
      }else {
        return f.cljs$lang$applyTo(args)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, args))
    }
  };
  var apply__3 = function(f, x, args) {
    var arglist__6158 = cljs.core.list_STAR_.call(null, x, args);
    var fixed_arity__6159 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__6160 = cljs.core.bounded_count.call(null, arglist__6158, fixed_arity__6159 + 1);
      if(bc__6160 <= fixed_arity__6159) {
        return cljs.core.apply_to.call(null, f, bc__6160, arglist__6158)
      }else {
        return f.cljs$lang$applyTo(arglist__6158)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__6158))
    }
  };
  var apply__4 = function(f, x, y, args) {
    var arglist__6161 = cljs.core.list_STAR_.call(null, x, y, args);
    var fixed_arity__6162 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__6163 = cljs.core.bounded_count.call(null, arglist__6161, fixed_arity__6162 + 1);
      if(bc__6163 <= fixed_arity__6162) {
        return cljs.core.apply_to.call(null, f, bc__6163, arglist__6161)
      }else {
        return f.cljs$lang$applyTo(arglist__6161)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__6161))
    }
  };
  var apply__5 = function(f, x, y, z, args) {
    var arglist__6164 = cljs.core.list_STAR_.call(null, x, y, z, args);
    var fixed_arity__6165 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__6166 = cljs.core.bounded_count.call(null, arglist__6164, fixed_arity__6165 + 1);
      if(bc__6166 <= fixed_arity__6165) {
        return cljs.core.apply_to.call(null, f, bc__6166, arglist__6164)
      }else {
        return f.cljs$lang$applyTo(arglist__6164)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__6164))
    }
  };
  var apply__6 = function() {
    var G__6170__delegate = function(f, a, b, c, d, args) {
      var arglist__6167 = cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, args)))));
      var fixed_arity__6168 = f.cljs$lang$maxFixedArity;
      if(cljs.core.truth_(f.cljs$lang$applyTo)) {
        var bc__6169 = cljs.core.bounded_count.call(null, arglist__6167, fixed_arity__6168 + 1);
        if(bc__6169 <= fixed_arity__6168) {
          return cljs.core.apply_to.call(null, f, bc__6169, arglist__6167)
        }else {
          return f.cljs$lang$applyTo(arglist__6167)
        }
      }else {
        return f.apply(f, cljs.core.to_array.call(null, arglist__6167))
      }
    };
    var G__6170 = function(f, a, b, c, d, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__6170__delegate.call(this, f, a, b, c, d, args)
    };
    G__6170.cljs$lang$maxFixedArity = 5;
    G__6170.cljs$lang$applyTo = function(arglist__6171) {
      var f = cljs.core.first(arglist__6171);
      var a = cljs.core.first(cljs.core.next(arglist__6171));
      var b = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6171)));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__6171))));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__6171)))));
      var args = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__6171)))));
      return G__6170__delegate(f, a, b, c, d, args)
    };
    G__6170.cljs$lang$arity$variadic = G__6170__delegate;
    return G__6170
  }();
  apply = function(f, a, b, c, d, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 2:
        return apply__2.call(this, f, a);
      case 3:
        return apply__3.call(this, f, a, b);
      case 4:
        return apply__4.call(this, f, a, b, c);
      case 5:
        return apply__5.call(this, f, a, b, c, d);
      default:
        return apply__6.cljs$lang$arity$variadic(f, a, b, c, d, cljs.core.array_seq(arguments, 5))
    }
    throw"Invalid arity: " + arguments.length;
  };
  apply.cljs$lang$maxFixedArity = 5;
  apply.cljs$lang$applyTo = apply__6.cljs$lang$applyTo;
  apply.cljs$lang$arity$2 = apply__2;
  apply.cljs$lang$arity$3 = apply__3;
  apply.cljs$lang$arity$4 = apply__4;
  apply.cljs$lang$arity$5 = apply__5;
  apply.cljs$lang$arity$variadic = apply__6.cljs$lang$arity$variadic;
  return apply
}();
cljs.core.vary_meta = function() {
  var vary_meta__delegate = function(obj, f, args) {
    return cljs.core.with_meta.call(null, obj, cljs.core.apply.call(null, f, cljs.core.meta.call(null, obj), args))
  };
  var vary_meta = function(obj, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return vary_meta__delegate.call(this, obj, f, args)
  };
  vary_meta.cljs$lang$maxFixedArity = 2;
  vary_meta.cljs$lang$applyTo = function(arglist__6172) {
    var obj = cljs.core.first(arglist__6172);
    var f = cljs.core.first(cljs.core.next(arglist__6172));
    var args = cljs.core.rest(cljs.core.next(arglist__6172));
    return vary_meta__delegate(obj, f, args)
  };
  vary_meta.cljs$lang$arity$variadic = vary_meta__delegate;
  return vary_meta
}();
cljs.core.not_EQ_ = function() {
  var not_EQ_ = null;
  var not_EQ___1 = function(x) {
    return false
  };
  var not_EQ___2 = function(x, y) {
    return!cljs.core._EQ_.call(null, x, y)
  };
  var not_EQ___3 = function() {
    var G__6173__delegate = function(x, y, more) {
      return cljs.core.not.call(null, cljs.core.apply.call(null, cljs.core._EQ_, x, y, more))
    };
    var G__6173 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6173__delegate.call(this, x, y, more)
    };
    G__6173.cljs$lang$maxFixedArity = 2;
    G__6173.cljs$lang$applyTo = function(arglist__6174) {
      var x = cljs.core.first(arglist__6174);
      var y = cljs.core.first(cljs.core.next(arglist__6174));
      var more = cljs.core.rest(cljs.core.next(arglist__6174));
      return G__6173__delegate(x, y, more)
    };
    G__6173.cljs$lang$arity$variadic = G__6173__delegate;
    return G__6173
  }();
  not_EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return not_EQ___1.call(this, x);
      case 2:
        return not_EQ___2.call(this, x, y);
      default:
        return not_EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  not_EQ_.cljs$lang$maxFixedArity = 2;
  not_EQ_.cljs$lang$applyTo = not_EQ___3.cljs$lang$applyTo;
  not_EQ_.cljs$lang$arity$1 = not_EQ___1;
  not_EQ_.cljs$lang$arity$2 = not_EQ___2;
  not_EQ_.cljs$lang$arity$variadic = not_EQ___3.cljs$lang$arity$variadic;
  return not_EQ_
}();
cljs.core.not_empty = function not_empty(coll) {
  if(cljs.core.seq.call(null, coll)) {
    return coll
  }else {
    return null
  }
};
cljs.core.every_QMARK_ = function every_QMARK_(pred, coll) {
  while(true) {
    if(cljs.core.seq.call(null, coll) == null) {
      return true
    }else {
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, coll)))) {
        var G__6175 = pred;
        var G__6176 = cljs.core.next.call(null, coll);
        pred = G__6175;
        coll = G__6176;
        continue
      }else {
        if("\ufdd0'else") {
          return false
        }else {
          return null
        }
      }
    }
    break
  }
};
cljs.core.not_every_QMARK_ = function not_every_QMARK_(pred, coll) {
  return!cljs.core.every_QMARK_.call(null, pred, coll)
};
cljs.core.some = function some(pred, coll) {
  while(true) {
    if(cljs.core.seq.call(null, coll)) {
      var or__3824__auto____6178 = pred.call(null, cljs.core.first.call(null, coll));
      if(cljs.core.truth_(or__3824__auto____6178)) {
        return or__3824__auto____6178
      }else {
        var G__6179 = pred;
        var G__6180 = cljs.core.next.call(null, coll);
        pred = G__6179;
        coll = G__6180;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.not_any_QMARK_ = function not_any_QMARK_(pred, coll) {
  return cljs.core.not.call(null, cljs.core.some.call(null, pred, coll))
};
cljs.core.even_QMARK_ = function even_QMARK_(n) {
  if(cljs.core.integer_QMARK_.call(null, n)) {
    return(n & 1) === 0
  }else {
    throw new Error([cljs.core.str("Argument must be an integer: "), cljs.core.str(n)].join(""));
  }
};
cljs.core.odd_QMARK_ = function odd_QMARK_(n) {
  return!cljs.core.even_QMARK_.call(null, n)
};
cljs.core.identity = function identity(x) {
  return x
};
cljs.core.complement = function complement(f) {
  return function() {
    var G__6181 = null;
    var G__6181__0 = function() {
      return cljs.core.not.call(null, f.call(null))
    };
    var G__6181__1 = function(x) {
      return cljs.core.not.call(null, f.call(null, x))
    };
    var G__6181__2 = function(x, y) {
      return cljs.core.not.call(null, f.call(null, x, y))
    };
    var G__6181__3 = function() {
      var G__6182__delegate = function(x, y, zs) {
        return cljs.core.not.call(null, cljs.core.apply.call(null, f, x, y, zs))
      };
      var G__6182 = function(x, y, var_args) {
        var zs = null;
        if(goog.isDef(var_args)) {
          zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
        }
        return G__6182__delegate.call(this, x, y, zs)
      };
      G__6182.cljs$lang$maxFixedArity = 2;
      G__6182.cljs$lang$applyTo = function(arglist__6183) {
        var x = cljs.core.first(arglist__6183);
        var y = cljs.core.first(cljs.core.next(arglist__6183));
        var zs = cljs.core.rest(cljs.core.next(arglist__6183));
        return G__6182__delegate(x, y, zs)
      };
      G__6182.cljs$lang$arity$variadic = G__6182__delegate;
      return G__6182
    }();
    G__6181 = function(x, y, var_args) {
      var zs = var_args;
      switch(arguments.length) {
        case 0:
          return G__6181__0.call(this);
        case 1:
          return G__6181__1.call(this, x);
        case 2:
          return G__6181__2.call(this, x, y);
        default:
          return G__6181__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
      }
      throw"Invalid arity: " + arguments.length;
    };
    G__6181.cljs$lang$maxFixedArity = 2;
    G__6181.cljs$lang$applyTo = G__6181__3.cljs$lang$applyTo;
    return G__6181
  }()
};
cljs.core.constantly = function constantly(x) {
  return function() {
    var G__6184__delegate = function(args) {
      return x
    };
    var G__6184 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__6184__delegate.call(this, args)
    };
    G__6184.cljs$lang$maxFixedArity = 0;
    G__6184.cljs$lang$applyTo = function(arglist__6185) {
      var args = cljs.core.seq(arglist__6185);
      return G__6184__delegate(args)
    };
    G__6184.cljs$lang$arity$variadic = G__6184__delegate;
    return G__6184
  }()
};
cljs.core.comp = function() {
  var comp = null;
  var comp__0 = function() {
    return cljs.core.identity
  };
  var comp__1 = function(f) {
    return f
  };
  var comp__2 = function(f, g) {
    return function() {
      var G__6192 = null;
      var G__6192__0 = function() {
        return f.call(null, g.call(null))
      };
      var G__6192__1 = function(x) {
        return f.call(null, g.call(null, x))
      };
      var G__6192__2 = function(x, y) {
        return f.call(null, g.call(null, x, y))
      };
      var G__6192__3 = function(x, y, z) {
        return f.call(null, g.call(null, x, y, z))
      };
      var G__6192__4 = function() {
        var G__6193__delegate = function(x, y, z, args) {
          return f.call(null, cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__6193 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__6193__delegate.call(this, x, y, z, args)
        };
        G__6193.cljs$lang$maxFixedArity = 3;
        G__6193.cljs$lang$applyTo = function(arglist__6194) {
          var x = cljs.core.first(arglist__6194);
          var y = cljs.core.first(cljs.core.next(arglist__6194));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6194)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__6194)));
          return G__6193__delegate(x, y, z, args)
        };
        G__6193.cljs$lang$arity$variadic = G__6193__delegate;
        return G__6193
      }();
      G__6192 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__6192__0.call(this);
          case 1:
            return G__6192__1.call(this, x);
          case 2:
            return G__6192__2.call(this, x, y);
          case 3:
            return G__6192__3.call(this, x, y, z);
          default:
            return G__6192__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__6192.cljs$lang$maxFixedArity = 3;
      G__6192.cljs$lang$applyTo = G__6192__4.cljs$lang$applyTo;
      return G__6192
    }()
  };
  var comp__3 = function(f, g, h) {
    return function() {
      var G__6195 = null;
      var G__6195__0 = function() {
        return f.call(null, g.call(null, h.call(null)))
      };
      var G__6195__1 = function(x) {
        return f.call(null, g.call(null, h.call(null, x)))
      };
      var G__6195__2 = function(x, y) {
        return f.call(null, g.call(null, h.call(null, x, y)))
      };
      var G__6195__3 = function(x, y, z) {
        return f.call(null, g.call(null, h.call(null, x, y, z)))
      };
      var G__6195__4 = function() {
        var G__6196__delegate = function(x, y, z, args) {
          return f.call(null, g.call(null, cljs.core.apply.call(null, h, x, y, z, args)))
        };
        var G__6196 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__6196__delegate.call(this, x, y, z, args)
        };
        G__6196.cljs$lang$maxFixedArity = 3;
        G__6196.cljs$lang$applyTo = function(arglist__6197) {
          var x = cljs.core.first(arglist__6197);
          var y = cljs.core.first(cljs.core.next(arglist__6197));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6197)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__6197)));
          return G__6196__delegate(x, y, z, args)
        };
        G__6196.cljs$lang$arity$variadic = G__6196__delegate;
        return G__6196
      }();
      G__6195 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__6195__0.call(this);
          case 1:
            return G__6195__1.call(this, x);
          case 2:
            return G__6195__2.call(this, x, y);
          case 3:
            return G__6195__3.call(this, x, y, z);
          default:
            return G__6195__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__6195.cljs$lang$maxFixedArity = 3;
      G__6195.cljs$lang$applyTo = G__6195__4.cljs$lang$applyTo;
      return G__6195
    }()
  };
  var comp__4 = function() {
    var G__6198__delegate = function(f1, f2, f3, fs) {
      var fs__6189 = cljs.core.reverse.call(null, cljs.core.list_STAR_.call(null, f1, f2, f3, fs));
      return function() {
        var G__6199__delegate = function(args) {
          var ret__6190 = cljs.core.apply.call(null, cljs.core.first.call(null, fs__6189), args);
          var fs__6191 = cljs.core.next.call(null, fs__6189);
          while(true) {
            if(fs__6191) {
              var G__6200 = cljs.core.first.call(null, fs__6191).call(null, ret__6190);
              var G__6201 = cljs.core.next.call(null, fs__6191);
              ret__6190 = G__6200;
              fs__6191 = G__6201;
              continue
            }else {
              return ret__6190
            }
            break
          }
        };
        var G__6199 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__6199__delegate.call(this, args)
        };
        G__6199.cljs$lang$maxFixedArity = 0;
        G__6199.cljs$lang$applyTo = function(arglist__6202) {
          var args = cljs.core.seq(arglist__6202);
          return G__6199__delegate(args)
        };
        G__6199.cljs$lang$arity$variadic = G__6199__delegate;
        return G__6199
      }()
    };
    var G__6198 = function(f1, f2, f3, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__6198__delegate.call(this, f1, f2, f3, fs)
    };
    G__6198.cljs$lang$maxFixedArity = 3;
    G__6198.cljs$lang$applyTo = function(arglist__6203) {
      var f1 = cljs.core.first(arglist__6203);
      var f2 = cljs.core.first(cljs.core.next(arglist__6203));
      var f3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6203)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__6203)));
      return G__6198__delegate(f1, f2, f3, fs)
    };
    G__6198.cljs$lang$arity$variadic = G__6198__delegate;
    return G__6198
  }();
  comp = function(f1, f2, f3, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 0:
        return comp__0.call(this);
      case 1:
        return comp__1.call(this, f1);
      case 2:
        return comp__2.call(this, f1, f2);
      case 3:
        return comp__3.call(this, f1, f2, f3);
      default:
        return comp__4.cljs$lang$arity$variadic(f1, f2, f3, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  comp.cljs$lang$maxFixedArity = 3;
  comp.cljs$lang$applyTo = comp__4.cljs$lang$applyTo;
  comp.cljs$lang$arity$0 = comp__0;
  comp.cljs$lang$arity$1 = comp__1;
  comp.cljs$lang$arity$2 = comp__2;
  comp.cljs$lang$arity$3 = comp__3;
  comp.cljs$lang$arity$variadic = comp__4.cljs$lang$arity$variadic;
  return comp
}();
cljs.core.partial = function() {
  var partial = null;
  var partial__2 = function(f, arg1) {
    return function() {
      var G__6204__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, args)
      };
      var G__6204 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__6204__delegate.call(this, args)
      };
      G__6204.cljs$lang$maxFixedArity = 0;
      G__6204.cljs$lang$applyTo = function(arglist__6205) {
        var args = cljs.core.seq(arglist__6205);
        return G__6204__delegate(args)
      };
      G__6204.cljs$lang$arity$variadic = G__6204__delegate;
      return G__6204
    }()
  };
  var partial__3 = function(f, arg1, arg2) {
    return function() {
      var G__6206__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, args)
      };
      var G__6206 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__6206__delegate.call(this, args)
      };
      G__6206.cljs$lang$maxFixedArity = 0;
      G__6206.cljs$lang$applyTo = function(arglist__6207) {
        var args = cljs.core.seq(arglist__6207);
        return G__6206__delegate(args)
      };
      G__6206.cljs$lang$arity$variadic = G__6206__delegate;
      return G__6206
    }()
  };
  var partial__4 = function(f, arg1, arg2, arg3) {
    return function() {
      var G__6208__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, arg3, args)
      };
      var G__6208 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__6208__delegate.call(this, args)
      };
      G__6208.cljs$lang$maxFixedArity = 0;
      G__6208.cljs$lang$applyTo = function(arglist__6209) {
        var args = cljs.core.seq(arglist__6209);
        return G__6208__delegate(args)
      };
      G__6208.cljs$lang$arity$variadic = G__6208__delegate;
      return G__6208
    }()
  };
  var partial__5 = function() {
    var G__6210__delegate = function(f, arg1, arg2, arg3, more) {
      return function() {
        var G__6211__delegate = function(args) {
          return cljs.core.apply.call(null, f, arg1, arg2, arg3, cljs.core.concat.call(null, more, args))
        };
        var G__6211 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__6211__delegate.call(this, args)
        };
        G__6211.cljs$lang$maxFixedArity = 0;
        G__6211.cljs$lang$applyTo = function(arglist__6212) {
          var args = cljs.core.seq(arglist__6212);
          return G__6211__delegate(args)
        };
        G__6211.cljs$lang$arity$variadic = G__6211__delegate;
        return G__6211
      }()
    };
    var G__6210 = function(f, arg1, arg2, arg3, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__6210__delegate.call(this, f, arg1, arg2, arg3, more)
    };
    G__6210.cljs$lang$maxFixedArity = 4;
    G__6210.cljs$lang$applyTo = function(arglist__6213) {
      var f = cljs.core.first(arglist__6213);
      var arg1 = cljs.core.first(cljs.core.next(arglist__6213));
      var arg2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6213)));
      var arg3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__6213))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__6213))));
      return G__6210__delegate(f, arg1, arg2, arg3, more)
    };
    G__6210.cljs$lang$arity$variadic = G__6210__delegate;
    return G__6210
  }();
  partial = function(f, arg1, arg2, arg3, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return partial__2.call(this, f, arg1);
      case 3:
        return partial__3.call(this, f, arg1, arg2);
      case 4:
        return partial__4.call(this, f, arg1, arg2, arg3);
      default:
        return partial__5.cljs$lang$arity$variadic(f, arg1, arg2, arg3, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  partial.cljs$lang$maxFixedArity = 4;
  partial.cljs$lang$applyTo = partial__5.cljs$lang$applyTo;
  partial.cljs$lang$arity$2 = partial__2;
  partial.cljs$lang$arity$3 = partial__3;
  partial.cljs$lang$arity$4 = partial__4;
  partial.cljs$lang$arity$variadic = partial__5.cljs$lang$arity$variadic;
  return partial
}();
cljs.core.fnil = function() {
  var fnil = null;
  var fnil__2 = function(f, x) {
    return function() {
      var G__6214 = null;
      var G__6214__1 = function(a) {
        return f.call(null, a == null ? x : a)
      };
      var G__6214__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b)
      };
      var G__6214__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b, c)
      };
      var G__6214__4 = function() {
        var G__6215__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b, c, ds)
        };
        var G__6215 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__6215__delegate.call(this, a, b, c, ds)
        };
        G__6215.cljs$lang$maxFixedArity = 3;
        G__6215.cljs$lang$applyTo = function(arglist__6216) {
          var a = cljs.core.first(arglist__6216);
          var b = cljs.core.first(cljs.core.next(arglist__6216));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6216)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__6216)));
          return G__6215__delegate(a, b, c, ds)
        };
        G__6215.cljs$lang$arity$variadic = G__6215__delegate;
        return G__6215
      }();
      G__6214 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 1:
            return G__6214__1.call(this, a);
          case 2:
            return G__6214__2.call(this, a, b);
          case 3:
            return G__6214__3.call(this, a, b, c);
          default:
            return G__6214__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__6214.cljs$lang$maxFixedArity = 3;
      G__6214.cljs$lang$applyTo = G__6214__4.cljs$lang$applyTo;
      return G__6214
    }()
  };
  var fnil__3 = function(f, x, y) {
    return function() {
      var G__6217 = null;
      var G__6217__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__6217__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c)
      };
      var G__6217__4 = function() {
        var G__6218__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c, ds)
        };
        var G__6218 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__6218__delegate.call(this, a, b, c, ds)
        };
        G__6218.cljs$lang$maxFixedArity = 3;
        G__6218.cljs$lang$applyTo = function(arglist__6219) {
          var a = cljs.core.first(arglist__6219);
          var b = cljs.core.first(cljs.core.next(arglist__6219));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6219)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__6219)));
          return G__6218__delegate(a, b, c, ds)
        };
        G__6218.cljs$lang$arity$variadic = G__6218__delegate;
        return G__6218
      }();
      G__6217 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__6217__2.call(this, a, b);
          case 3:
            return G__6217__3.call(this, a, b, c);
          default:
            return G__6217__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__6217.cljs$lang$maxFixedArity = 3;
      G__6217.cljs$lang$applyTo = G__6217__4.cljs$lang$applyTo;
      return G__6217
    }()
  };
  var fnil__4 = function(f, x, y, z) {
    return function() {
      var G__6220 = null;
      var G__6220__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__6220__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c == null ? z : c)
      };
      var G__6220__4 = function() {
        var G__6221__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c == null ? z : c, ds)
        };
        var G__6221 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__6221__delegate.call(this, a, b, c, ds)
        };
        G__6221.cljs$lang$maxFixedArity = 3;
        G__6221.cljs$lang$applyTo = function(arglist__6222) {
          var a = cljs.core.first(arglist__6222);
          var b = cljs.core.first(cljs.core.next(arglist__6222));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6222)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__6222)));
          return G__6221__delegate(a, b, c, ds)
        };
        G__6221.cljs$lang$arity$variadic = G__6221__delegate;
        return G__6221
      }();
      G__6220 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__6220__2.call(this, a, b);
          case 3:
            return G__6220__3.call(this, a, b, c);
          default:
            return G__6220__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__6220.cljs$lang$maxFixedArity = 3;
      G__6220.cljs$lang$applyTo = G__6220__4.cljs$lang$applyTo;
      return G__6220
    }()
  };
  fnil = function(f, x, y, z) {
    switch(arguments.length) {
      case 2:
        return fnil__2.call(this, f, x);
      case 3:
        return fnil__3.call(this, f, x, y);
      case 4:
        return fnil__4.call(this, f, x, y, z)
    }
    throw"Invalid arity: " + arguments.length;
  };
  fnil.cljs$lang$arity$2 = fnil__2;
  fnil.cljs$lang$arity$3 = fnil__3;
  fnil.cljs$lang$arity$4 = fnil__4;
  return fnil
}();
cljs.core.map_indexed = function map_indexed(f, coll) {
  var mapi__6238 = function mapi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____6246 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____6246) {
        var s__6247 = temp__3974__auto____6246;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__6247)) {
          var c__6248 = cljs.core.chunk_first.call(null, s__6247);
          var size__6249 = cljs.core.count.call(null, c__6248);
          var b__6250 = cljs.core.chunk_buffer.call(null, size__6249);
          var n__1178__auto____6251 = size__6249;
          var i__6252 = 0;
          while(true) {
            if(i__6252 < n__1178__auto____6251) {
              cljs.core.chunk_append.call(null, b__6250, f.call(null, idx + i__6252, cljs.core._nth.call(null, c__6248, i__6252)));
              var G__6253 = i__6252 + 1;
              i__6252 = G__6253;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__6250), mapi.call(null, idx + size__6249, cljs.core.chunk_rest.call(null, s__6247)))
        }else {
          return cljs.core.cons.call(null, f.call(null, idx, cljs.core.first.call(null, s__6247)), mapi.call(null, idx + 1, cljs.core.rest.call(null, s__6247)))
        }
      }else {
        return null
      }
    }, null)
  };
  return mapi__6238.call(null, 0, coll)
};
cljs.core.keep = function keep(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____6263 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____6263) {
      var s__6264 = temp__3974__auto____6263;
      if(cljs.core.chunked_seq_QMARK_.call(null, s__6264)) {
        var c__6265 = cljs.core.chunk_first.call(null, s__6264);
        var size__6266 = cljs.core.count.call(null, c__6265);
        var b__6267 = cljs.core.chunk_buffer.call(null, size__6266);
        var n__1178__auto____6268 = size__6266;
        var i__6269 = 0;
        while(true) {
          if(i__6269 < n__1178__auto____6268) {
            var x__6270 = f.call(null, cljs.core._nth.call(null, c__6265, i__6269));
            if(x__6270 == null) {
            }else {
              cljs.core.chunk_append.call(null, b__6267, x__6270)
            }
            var G__6272 = i__6269 + 1;
            i__6269 = G__6272;
            continue
          }else {
          }
          break
        }
        return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__6267), keep.call(null, f, cljs.core.chunk_rest.call(null, s__6264)))
      }else {
        var x__6271 = f.call(null, cljs.core.first.call(null, s__6264));
        if(x__6271 == null) {
          return keep.call(null, f, cljs.core.rest.call(null, s__6264))
        }else {
          return cljs.core.cons.call(null, x__6271, keep.call(null, f, cljs.core.rest.call(null, s__6264)))
        }
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.keep_indexed = function keep_indexed(f, coll) {
  var keepi__6298 = function keepi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____6308 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____6308) {
        var s__6309 = temp__3974__auto____6308;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__6309)) {
          var c__6310 = cljs.core.chunk_first.call(null, s__6309);
          var size__6311 = cljs.core.count.call(null, c__6310);
          var b__6312 = cljs.core.chunk_buffer.call(null, size__6311);
          var n__1178__auto____6313 = size__6311;
          var i__6314 = 0;
          while(true) {
            if(i__6314 < n__1178__auto____6313) {
              var x__6315 = f.call(null, idx + i__6314, cljs.core._nth.call(null, c__6310, i__6314));
              if(x__6315 == null) {
              }else {
                cljs.core.chunk_append.call(null, b__6312, x__6315)
              }
              var G__6317 = i__6314 + 1;
              i__6314 = G__6317;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__6312), keepi.call(null, idx + size__6311, cljs.core.chunk_rest.call(null, s__6309)))
        }else {
          var x__6316 = f.call(null, idx, cljs.core.first.call(null, s__6309));
          if(x__6316 == null) {
            return keepi.call(null, idx + 1, cljs.core.rest.call(null, s__6309))
          }else {
            return cljs.core.cons.call(null, x__6316, keepi.call(null, idx + 1, cljs.core.rest.call(null, s__6309)))
          }
        }
      }else {
        return null
      }
    }, null)
  };
  return keepi__6298.call(null, 0, coll)
};
cljs.core.every_pred = function() {
  var every_pred = null;
  var every_pred__1 = function(p) {
    return function() {
      var ep1 = null;
      var ep1__0 = function() {
        return true
      };
      var ep1__1 = function(x) {
        return cljs.core.boolean$.call(null, p.call(null, x))
      };
      var ep1__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____6403 = p.call(null, x);
          if(cljs.core.truth_(and__3822__auto____6403)) {
            return p.call(null, y)
          }else {
            return and__3822__auto____6403
          }
        }())
      };
      var ep1__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____6404 = p.call(null, x);
          if(cljs.core.truth_(and__3822__auto____6404)) {
            var and__3822__auto____6405 = p.call(null, y);
            if(cljs.core.truth_(and__3822__auto____6405)) {
              return p.call(null, z)
            }else {
              return and__3822__auto____6405
            }
          }else {
            return and__3822__auto____6404
          }
        }())
      };
      var ep1__4 = function() {
        var G__6474__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____6406 = ep1.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____6406)) {
              return cljs.core.every_QMARK_.call(null, p, args)
            }else {
              return and__3822__auto____6406
            }
          }())
        };
        var G__6474 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__6474__delegate.call(this, x, y, z, args)
        };
        G__6474.cljs$lang$maxFixedArity = 3;
        G__6474.cljs$lang$applyTo = function(arglist__6475) {
          var x = cljs.core.first(arglist__6475);
          var y = cljs.core.first(cljs.core.next(arglist__6475));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6475)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__6475)));
          return G__6474__delegate(x, y, z, args)
        };
        G__6474.cljs$lang$arity$variadic = G__6474__delegate;
        return G__6474
      }();
      ep1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep1__0.call(this);
          case 1:
            return ep1__1.call(this, x);
          case 2:
            return ep1__2.call(this, x, y);
          case 3:
            return ep1__3.call(this, x, y, z);
          default:
            return ep1__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep1.cljs$lang$maxFixedArity = 3;
      ep1.cljs$lang$applyTo = ep1__4.cljs$lang$applyTo;
      ep1.cljs$lang$arity$0 = ep1__0;
      ep1.cljs$lang$arity$1 = ep1__1;
      ep1.cljs$lang$arity$2 = ep1__2;
      ep1.cljs$lang$arity$3 = ep1__3;
      ep1.cljs$lang$arity$variadic = ep1__4.cljs$lang$arity$variadic;
      return ep1
    }()
  };
  var every_pred__2 = function(p1, p2) {
    return function() {
      var ep2 = null;
      var ep2__0 = function() {
        return true
      };
      var ep2__1 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____6418 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____6418)) {
            return p2.call(null, x)
          }else {
            return and__3822__auto____6418
          }
        }())
      };
      var ep2__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____6419 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____6419)) {
            var and__3822__auto____6420 = p1.call(null, y);
            if(cljs.core.truth_(and__3822__auto____6420)) {
              var and__3822__auto____6421 = p2.call(null, x);
              if(cljs.core.truth_(and__3822__auto____6421)) {
                return p2.call(null, y)
              }else {
                return and__3822__auto____6421
              }
            }else {
              return and__3822__auto____6420
            }
          }else {
            return and__3822__auto____6419
          }
        }())
      };
      var ep2__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____6422 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____6422)) {
            var and__3822__auto____6423 = p1.call(null, y);
            if(cljs.core.truth_(and__3822__auto____6423)) {
              var and__3822__auto____6424 = p1.call(null, z);
              if(cljs.core.truth_(and__3822__auto____6424)) {
                var and__3822__auto____6425 = p2.call(null, x);
                if(cljs.core.truth_(and__3822__auto____6425)) {
                  var and__3822__auto____6426 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____6426)) {
                    return p2.call(null, z)
                  }else {
                    return and__3822__auto____6426
                  }
                }else {
                  return and__3822__auto____6425
                }
              }else {
                return and__3822__auto____6424
              }
            }else {
              return and__3822__auto____6423
            }
          }else {
            return and__3822__auto____6422
          }
        }())
      };
      var ep2__4 = function() {
        var G__6476__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____6427 = ep2.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____6427)) {
              return cljs.core.every_QMARK_.call(null, function(p1__6273_SHARP_) {
                var and__3822__auto____6428 = p1.call(null, p1__6273_SHARP_);
                if(cljs.core.truth_(and__3822__auto____6428)) {
                  return p2.call(null, p1__6273_SHARP_)
                }else {
                  return and__3822__auto____6428
                }
              }, args)
            }else {
              return and__3822__auto____6427
            }
          }())
        };
        var G__6476 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__6476__delegate.call(this, x, y, z, args)
        };
        G__6476.cljs$lang$maxFixedArity = 3;
        G__6476.cljs$lang$applyTo = function(arglist__6477) {
          var x = cljs.core.first(arglist__6477);
          var y = cljs.core.first(cljs.core.next(arglist__6477));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6477)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__6477)));
          return G__6476__delegate(x, y, z, args)
        };
        G__6476.cljs$lang$arity$variadic = G__6476__delegate;
        return G__6476
      }();
      ep2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep2__0.call(this);
          case 1:
            return ep2__1.call(this, x);
          case 2:
            return ep2__2.call(this, x, y);
          case 3:
            return ep2__3.call(this, x, y, z);
          default:
            return ep2__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep2.cljs$lang$maxFixedArity = 3;
      ep2.cljs$lang$applyTo = ep2__4.cljs$lang$applyTo;
      ep2.cljs$lang$arity$0 = ep2__0;
      ep2.cljs$lang$arity$1 = ep2__1;
      ep2.cljs$lang$arity$2 = ep2__2;
      ep2.cljs$lang$arity$3 = ep2__3;
      ep2.cljs$lang$arity$variadic = ep2__4.cljs$lang$arity$variadic;
      return ep2
    }()
  };
  var every_pred__3 = function(p1, p2, p3) {
    return function() {
      var ep3 = null;
      var ep3__0 = function() {
        return true
      };
      var ep3__1 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____6447 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____6447)) {
            var and__3822__auto____6448 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____6448)) {
              return p3.call(null, x)
            }else {
              return and__3822__auto____6448
            }
          }else {
            return and__3822__auto____6447
          }
        }())
      };
      var ep3__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____6449 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____6449)) {
            var and__3822__auto____6450 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____6450)) {
              var and__3822__auto____6451 = p3.call(null, x);
              if(cljs.core.truth_(and__3822__auto____6451)) {
                var and__3822__auto____6452 = p1.call(null, y);
                if(cljs.core.truth_(and__3822__auto____6452)) {
                  var and__3822__auto____6453 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____6453)) {
                    return p3.call(null, y)
                  }else {
                    return and__3822__auto____6453
                  }
                }else {
                  return and__3822__auto____6452
                }
              }else {
                return and__3822__auto____6451
              }
            }else {
              return and__3822__auto____6450
            }
          }else {
            return and__3822__auto____6449
          }
        }())
      };
      var ep3__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____6454 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____6454)) {
            var and__3822__auto____6455 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____6455)) {
              var and__3822__auto____6456 = p3.call(null, x);
              if(cljs.core.truth_(and__3822__auto____6456)) {
                var and__3822__auto____6457 = p1.call(null, y);
                if(cljs.core.truth_(and__3822__auto____6457)) {
                  var and__3822__auto____6458 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____6458)) {
                    var and__3822__auto____6459 = p3.call(null, y);
                    if(cljs.core.truth_(and__3822__auto____6459)) {
                      var and__3822__auto____6460 = p1.call(null, z);
                      if(cljs.core.truth_(and__3822__auto____6460)) {
                        var and__3822__auto____6461 = p2.call(null, z);
                        if(cljs.core.truth_(and__3822__auto____6461)) {
                          return p3.call(null, z)
                        }else {
                          return and__3822__auto____6461
                        }
                      }else {
                        return and__3822__auto____6460
                      }
                    }else {
                      return and__3822__auto____6459
                    }
                  }else {
                    return and__3822__auto____6458
                  }
                }else {
                  return and__3822__auto____6457
                }
              }else {
                return and__3822__auto____6456
              }
            }else {
              return and__3822__auto____6455
            }
          }else {
            return and__3822__auto____6454
          }
        }())
      };
      var ep3__4 = function() {
        var G__6478__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____6462 = ep3.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____6462)) {
              return cljs.core.every_QMARK_.call(null, function(p1__6274_SHARP_) {
                var and__3822__auto____6463 = p1.call(null, p1__6274_SHARP_);
                if(cljs.core.truth_(and__3822__auto____6463)) {
                  var and__3822__auto____6464 = p2.call(null, p1__6274_SHARP_);
                  if(cljs.core.truth_(and__3822__auto____6464)) {
                    return p3.call(null, p1__6274_SHARP_)
                  }else {
                    return and__3822__auto____6464
                  }
                }else {
                  return and__3822__auto____6463
                }
              }, args)
            }else {
              return and__3822__auto____6462
            }
          }())
        };
        var G__6478 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__6478__delegate.call(this, x, y, z, args)
        };
        G__6478.cljs$lang$maxFixedArity = 3;
        G__6478.cljs$lang$applyTo = function(arglist__6479) {
          var x = cljs.core.first(arglist__6479);
          var y = cljs.core.first(cljs.core.next(arglist__6479));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6479)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__6479)));
          return G__6478__delegate(x, y, z, args)
        };
        G__6478.cljs$lang$arity$variadic = G__6478__delegate;
        return G__6478
      }();
      ep3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep3__0.call(this);
          case 1:
            return ep3__1.call(this, x);
          case 2:
            return ep3__2.call(this, x, y);
          case 3:
            return ep3__3.call(this, x, y, z);
          default:
            return ep3__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep3.cljs$lang$maxFixedArity = 3;
      ep3.cljs$lang$applyTo = ep3__4.cljs$lang$applyTo;
      ep3.cljs$lang$arity$0 = ep3__0;
      ep3.cljs$lang$arity$1 = ep3__1;
      ep3.cljs$lang$arity$2 = ep3__2;
      ep3.cljs$lang$arity$3 = ep3__3;
      ep3.cljs$lang$arity$variadic = ep3__4.cljs$lang$arity$variadic;
      return ep3
    }()
  };
  var every_pred__4 = function() {
    var G__6480__delegate = function(p1, p2, p3, ps) {
      var ps__6465 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var epn = null;
        var epn__0 = function() {
          return true
        };
        var epn__1 = function(x) {
          return cljs.core.every_QMARK_.call(null, function(p1__6275_SHARP_) {
            return p1__6275_SHARP_.call(null, x)
          }, ps__6465)
        };
        var epn__2 = function(x, y) {
          return cljs.core.every_QMARK_.call(null, function(p1__6276_SHARP_) {
            var and__3822__auto____6470 = p1__6276_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3822__auto____6470)) {
              return p1__6276_SHARP_.call(null, y)
            }else {
              return and__3822__auto____6470
            }
          }, ps__6465)
        };
        var epn__3 = function(x, y, z) {
          return cljs.core.every_QMARK_.call(null, function(p1__6277_SHARP_) {
            var and__3822__auto____6471 = p1__6277_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3822__auto____6471)) {
              var and__3822__auto____6472 = p1__6277_SHARP_.call(null, y);
              if(cljs.core.truth_(and__3822__auto____6472)) {
                return p1__6277_SHARP_.call(null, z)
              }else {
                return and__3822__auto____6472
              }
            }else {
              return and__3822__auto____6471
            }
          }, ps__6465)
        };
        var epn__4 = function() {
          var G__6481__delegate = function(x, y, z, args) {
            return cljs.core.boolean$.call(null, function() {
              var and__3822__auto____6473 = epn.call(null, x, y, z);
              if(cljs.core.truth_(and__3822__auto____6473)) {
                return cljs.core.every_QMARK_.call(null, function(p1__6278_SHARP_) {
                  return cljs.core.every_QMARK_.call(null, p1__6278_SHARP_, args)
                }, ps__6465)
              }else {
                return and__3822__auto____6473
              }
            }())
          };
          var G__6481 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__6481__delegate.call(this, x, y, z, args)
          };
          G__6481.cljs$lang$maxFixedArity = 3;
          G__6481.cljs$lang$applyTo = function(arglist__6482) {
            var x = cljs.core.first(arglist__6482);
            var y = cljs.core.first(cljs.core.next(arglist__6482));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6482)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__6482)));
            return G__6481__delegate(x, y, z, args)
          };
          G__6481.cljs$lang$arity$variadic = G__6481__delegate;
          return G__6481
        }();
        epn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return epn__0.call(this);
            case 1:
              return epn__1.call(this, x);
            case 2:
              return epn__2.call(this, x, y);
            case 3:
              return epn__3.call(this, x, y, z);
            default:
              return epn__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        epn.cljs$lang$maxFixedArity = 3;
        epn.cljs$lang$applyTo = epn__4.cljs$lang$applyTo;
        epn.cljs$lang$arity$0 = epn__0;
        epn.cljs$lang$arity$1 = epn__1;
        epn.cljs$lang$arity$2 = epn__2;
        epn.cljs$lang$arity$3 = epn__3;
        epn.cljs$lang$arity$variadic = epn__4.cljs$lang$arity$variadic;
        return epn
      }()
    };
    var G__6480 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__6480__delegate.call(this, p1, p2, p3, ps)
    };
    G__6480.cljs$lang$maxFixedArity = 3;
    G__6480.cljs$lang$applyTo = function(arglist__6483) {
      var p1 = cljs.core.first(arglist__6483);
      var p2 = cljs.core.first(cljs.core.next(arglist__6483));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6483)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__6483)));
      return G__6480__delegate(p1, p2, p3, ps)
    };
    G__6480.cljs$lang$arity$variadic = G__6480__delegate;
    return G__6480
  }();
  every_pred = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return every_pred__1.call(this, p1);
      case 2:
        return every_pred__2.call(this, p1, p2);
      case 3:
        return every_pred__3.call(this, p1, p2, p3);
      default:
        return every_pred__4.cljs$lang$arity$variadic(p1, p2, p3, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  every_pred.cljs$lang$maxFixedArity = 3;
  every_pred.cljs$lang$applyTo = every_pred__4.cljs$lang$applyTo;
  every_pred.cljs$lang$arity$1 = every_pred__1;
  every_pred.cljs$lang$arity$2 = every_pred__2;
  every_pred.cljs$lang$arity$3 = every_pred__3;
  every_pred.cljs$lang$arity$variadic = every_pred__4.cljs$lang$arity$variadic;
  return every_pred
}();
cljs.core.some_fn = function() {
  var some_fn = null;
  var some_fn__1 = function(p) {
    return function() {
      var sp1 = null;
      var sp1__0 = function() {
        return null
      };
      var sp1__1 = function(x) {
        return p.call(null, x)
      };
      var sp1__2 = function(x, y) {
        var or__3824__auto____6564 = p.call(null, x);
        if(cljs.core.truth_(or__3824__auto____6564)) {
          return or__3824__auto____6564
        }else {
          return p.call(null, y)
        }
      };
      var sp1__3 = function(x, y, z) {
        var or__3824__auto____6565 = p.call(null, x);
        if(cljs.core.truth_(or__3824__auto____6565)) {
          return or__3824__auto____6565
        }else {
          var or__3824__auto____6566 = p.call(null, y);
          if(cljs.core.truth_(or__3824__auto____6566)) {
            return or__3824__auto____6566
          }else {
            return p.call(null, z)
          }
        }
      };
      var sp1__4 = function() {
        var G__6635__delegate = function(x, y, z, args) {
          var or__3824__auto____6567 = sp1.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____6567)) {
            return or__3824__auto____6567
          }else {
            return cljs.core.some.call(null, p, args)
          }
        };
        var G__6635 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__6635__delegate.call(this, x, y, z, args)
        };
        G__6635.cljs$lang$maxFixedArity = 3;
        G__6635.cljs$lang$applyTo = function(arglist__6636) {
          var x = cljs.core.first(arglist__6636);
          var y = cljs.core.first(cljs.core.next(arglist__6636));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6636)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__6636)));
          return G__6635__delegate(x, y, z, args)
        };
        G__6635.cljs$lang$arity$variadic = G__6635__delegate;
        return G__6635
      }();
      sp1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp1__0.call(this);
          case 1:
            return sp1__1.call(this, x);
          case 2:
            return sp1__2.call(this, x, y);
          case 3:
            return sp1__3.call(this, x, y, z);
          default:
            return sp1__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp1.cljs$lang$maxFixedArity = 3;
      sp1.cljs$lang$applyTo = sp1__4.cljs$lang$applyTo;
      sp1.cljs$lang$arity$0 = sp1__0;
      sp1.cljs$lang$arity$1 = sp1__1;
      sp1.cljs$lang$arity$2 = sp1__2;
      sp1.cljs$lang$arity$3 = sp1__3;
      sp1.cljs$lang$arity$variadic = sp1__4.cljs$lang$arity$variadic;
      return sp1
    }()
  };
  var some_fn__2 = function(p1, p2) {
    return function() {
      var sp2 = null;
      var sp2__0 = function() {
        return null
      };
      var sp2__1 = function(x) {
        var or__3824__auto____6579 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____6579)) {
          return or__3824__auto____6579
        }else {
          return p2.call(null, x)
        }
      };
      var sp2__2 = function(x, y) {
        var or__3824__auto____6580 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____6580)) {
          return or__3824__auto____6580
        }else {
          var or__3824__auto____6581 = p1.call(null, y);
          if(cljs.core.truth_(or__3824__auto____6581)) {
            return or__3824__auto____6581
          }else {
            var or__3824__auto____6582 = p2.call(null, x);
            if(cljs.core.truth_(or__3824__auto____6582)) {
              return or__3824__auto____6582
            }else {
              return p2.call(null, y)
            }
          }
        }
      };
      var sp2__3 = function(x, y, z) {
        var or__3824__auto____6583 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____6583)) {
          return or__3824__auto____6583
        }else {
          var or__3824__auto____6584 = p1.call(null, y);
          if(cljs.core.truth_(or__3824__auto____6584)) {
            return or__3824__auto____6584
          }else {
            var or__3824__auto____6585 = p1.call(null, z);
            if(cljs.core.truth_(or__3824__auto____6585)) {
              return or__3824__auto____6585
            }else {
              var or__3824__auto____6586 = p2.call(null, x);
              if(cljs.core.truth_(or__3824__auto____6586)) {
                return or__3824__auto____6586
              }else {
                var or__3824__auto____6587 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____6587)) {
                  return or__3824__auto____6587
                }else {
                  return p2.call(null, z)
                }
              }
            }
          }
        }
      };
      var sp2__4 = function() {
        var G__6637__delegate = function(x, y, z, args) {
          var or__3824__auto____6588 = sp2.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____6588)) {
            return or__3824__auto____6588
          }else {
            return cljs.core.some.call(null, function(p1__6318_SHARP_) {
              var or__3824__auto____6589 = p1.call(null, p1__6318_SHARP_);
              if(cljs.core.truth_(or__3824__auto____6589)) {
                return or__3824__auto____6589
              }else {
                return p2.call(null, p1__6318_SHARP_)
              }
            }, args)
          }
        };
        var G__6637 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__6637__delegate.call(this, x, y, z, args)
        };
        G__6637.cljs$lang$maxFixedArity = 3;
        G__6637.cljs$lang$applyTo = function(arglist__6638) {
          var x = cljs.core.first(arglist__6638);
          var y = cljs.core.first(cljs.core.next(arglist__6638));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6638)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__6638)));
          return G__6637__delegate(x, y, z, args)
        };
        G__6637.cljs$lang$arity$variadic = G__6637__delegate;
        return G__6637
      }();
      sp2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp2__0.call(this);
          case 1:
            return sp2__1.call(this, x);
          case 2:
            return sp2__2.call(this, x, y);
          case 3:
            return sp2__3.call(this, x, y, z);
          default:
            return sp2__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp2.cljs$lang$maxFixedArity = 3;
      sp2.cljs$lang$applyTo = sp2__4.cljs$lang$applyTo;
      sp2.cljs$lang$arity$0 = sp2__0;
      sp2.cljs$lang$arity$1 = sp2__1;
      sp2.cljs$lang$arity$2 = sp2__2;
      sp2.cljs$lang$arity$3 = sp2__3;
      sp2.cljs$lang$arity$variadic = sp2__4.cljs$lang$arity$variadic;
      return sp2
    }()
  };
  var some_fn__3 = function(p1, p2, p3) {
    return function() {
      var sp3 = null;
      var sp3__0 = function() {
        return null
      };
      var sp3__1 = function(x) {
        var or__3824__auto____6608 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____6608)) {
          return or__3824__auto____6608
        }else {
          var or__3824__auto____6609 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____6609)) {
            return or__3824__auto____6609
          }else {
            return p3.call(null, x)
          }
        }
      };
      var sp3__2 = function(x, y) {
        var or__3824__auto____6610 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____6610)) {
          return or__3824__auto____6610
        }else {
          var or__3824__auto____6611 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____6611)) {
            return or__3824__auto____6611
          }else {
            var or__3824__auto____6612 = p3.call(null, x);
            if(cljs.core.truth_(or__3824__auto____6612)) {
              return or__3824__auto____6612
            }else {
              var or__3824__auto____6613 = p1.call(null, y);
              if(cljs.core.truth_(or__3824__auto____6613)) {
                return or__3824__auto____6613
              }else {
                var or__3824__auto____6614 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____6614)) {
                  return or__3824__auto____6614
                }else {
                  return p3.call(null, y)
                }
              }
            }
          }
        }
      };
      var sp3__3 = function(x, y, z) {
        var or__3824__auto____6615 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____6615)) {
          return or__3824__auto____6615
        }else {
          var or__3824__auto____6616 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____6616)) {
            return or__3824__auto____6616
          }else {
            var or__3824__auto____6617 = p3.call(null, x);
            if(cljs.core.truth_(or__3824__auto____6617)) {
              return or__3824__auto____6617
            }else {
              var or__3824__auto____6618 = p1.call(null, y);
              if(cljs.core.truth_(or__3824__auto____6618)) {
                return or__3824__auto____6618
              }else {
                var or__3824__auto____6619 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____6619)) {
                  return or__3824__auto____6619
                }else {
                  var or__3824__auto____6620 = p3.call(null, y);
                  if(cljs.core.truth_(or__3824__auto____6620)) {
                    return or__3824__auto____6620
                  }else {
                    var or__3824__auto____6621 = p1.call(null, z);
                    if(cljs.core.truth_(or__3824__auto____6621)) {
                      return or__3824__auto____6621
                    }else {
                      var or__3824__auto____6622 = p2.call(null, z);
                      if(cljs.core.truth_(or__3824__auto____6622)) {
                        return or__3824__auto____6622
                      }else {
                        return p3.call(null, z)
                      }
                    }
                  }
                }
              }
            }
          }
        }
      };
      var sp3__4 = function() {
        var G__6639__delegate = function(x, y, z, args) {
          var or__3824__auto____6623 = sp3.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____6623)) {
            return or__3824__auto____6623
          }else {
            return cljs.core.some.call(null, function(p1__6319_SHARP_) {
              var or__3824__auto____6624 = p1.call(null, p1__6319_SHARP_);
              if(cljs.core.truth_(or__3824__auto____6624)) {
                return or__3824__auto____6624
              }else {
                var or__3824__auto____6625 = p2.call(null, p1__6319_SHARP_);
                if(cljs.core.truth_(or__3824__auto____6625)) {
                  return or__3824__auto____6625
                }else {
                  return p3.call(null, p1__6319_SHARP_)
                }
              }
            }, args)
          }
        };
        var G__6639 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__6639__delegate.call(this, x, y, z, args)
        };
        G__6639.cljs$lang$maxFixedArity = 3;
        G__6639.cljs$lang$applyTo = function(arglist__6640) {
          var x = cljs.core.first(arglist__6640);
          var y = cljs.core.first(cljs.core.next(arglist__6640));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6640)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__6640)));
          return G__6639__delegate(x, y, z, args)
        };
        G__6639.cljs$lang$arity$variadic = G__6639__delegate;
        return G__6639
      }();
      sp3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp3__0.call(this);
          case 1:
            return sp3__1.call(this, x);
          case 2:
            return sp3__2.call(this, x, y);
          case 3:
            return sp3__3.call(this, x, y, z);
          default:
            return sp3__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp3.cljs$lang$maxFixedArity = 3;
      sp3.cljs$lang$applyTo = sp3__4.cljs$lang$applyTo;
      sp3.cljs$lang$arity$0 = sp3__0;
      sp3.cljs$lang$arity$1 = sp3__1;
      sp3.cljs$lang$arity$2 = sp3__2;
      sp3.cljs$lang$arity$3 = sp3__3;
      sp3.cljs$lang$arity$variadic = sp3__4.cljs$lang$arity$variadic;
      return sp3
    }()
  };
  var some_fn__4 = function() {
    var G__6641__delegate = function(p1, p2, p3, ps) {
      var ps__6626 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var spn = null;
        var spn__0 = function() {
          return null
        };
        var spn__1 = function(x) {
          return cljs.core.some.call(null, function(p1__6320_SHARP_) {
            return p1__6320_SHARP_.call(null, x)
          }, ps__6626)
        };
        var spn__2 = function(x, y) {
          return cljs.core.some.call(null, function(p1__6321_SHARP_) {
            var or__3824__auto____6631 = p1__6321_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3824__auto____6631)) {
              return or__3824__auto____6631
            }else {
              return p1__6321_SHARP_.call(null, y)
            }
          }, ps__6626)
        };
        var spn__3 = function(x, y, z) {
          return cljs.core.some.call(null, function(p1__6322_SHARP_) {
            var or__3824__auto____6632 = p1__6322_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3824__auto____6632)) {
              return or__3824__auto____6632
            }else {
              var or__3824__auto____6633 = p1__6322_SHARP_.call(null, y);
              if(cljs.core.truth_(or__3824__auto____6633)) {
                return or__3824__auto____6633
              }else {
                return p1__6322_SHARP_.call(null, z)
              }
            }
          }, ps__6626)
        };
        var spn__4 = function() {
          var G__6642__delegate = function(x, y, z, args) {
            var or__3824__auto____6634 = spn.call(null, x, y, z);
            if(cljs.core.truth_(or__3824__auto____6634)) {
              return or__3824__auto____6634
            }else {
              return cljs.core.some.call(null, function(p1__6323_SHARP_) {
                return cljs.core.some.call(null, p1__6323_SHARP_, args)
              }, ps__6626)
            }
          };
          var G__6642 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__6642__delegate.call(this, x, y, z, args)
          };
          G__6642.cljs$lang$maxFixedArity = 3;
          G__6642.cljs$lang$applyTo = function(arglist__6643) {
            var x = cljs.core.first(arglist__6643);
            var y = cljs.core.first(cljs.core.next(arglist__6643));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6643)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__6643)));
            return G__6642__delegate(x, y, z, args)
          };
          G__6642.cljs$lang$arity$variadic = G__6642__delegate;
          return G__6642
        }();
        spn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return spn__0.call(this);
            case 1:
              return spn__1.call(this, x);
            case 2:
              return spn__2.call(this, x, y);
            case 3:
              return spn__3.call(this, x, y, z);
            default:
              return spn__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        spn.cljs$lang$maxFixedArity = 3;
        spn.cljs$lang$applyTo = spn__4.cljs$lang$applyTo;
        spn.cljs$lang$arity$0 = spn__0;
        spn.cljs$lang$arity$1 = spn__1;
        spn.cljs$lang$arity$2 = spn__2;
        spn.cljs$lang$arity$3 = spn__3;
        spn.cljs$lang$arity$variadic = spn__4.cljs$lang$arity$variadic;
        return spn
      }()
    };
    var G__6641 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__6641__delegate.call(this, p1, p2, p3, ps)
    };
    G__6641.cljs$lang$maxFixedArity = 3;
    G__6641.cljs$lang$applyTo = function(arglist__6644) {
      var p1 = cljs.core.first(arglist__6644);
      var p2 = cljs.core.first(cljs.core.next(arglist__6644));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6644)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__6644)));
      return G__6641__delegate(p1, p2, p3, ps)
    };
    G__6641.cljs$lang$arity$variadic = G__6641__delegate;
    return G__6641
  }();
  some_fn = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return some_fn__1.call(this, p1);
      case 2:
        return some_fn__2.call(this, p1, p2);
      case 3:
        return some_fn__3.call(this, p1, p2, p3);
      default:
        return some_fn__4.cljs$lang$arity$variadic(p1, p2, p3, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  some_fn.cljs$lang$maxFixedArity = 3;
  some_fn.cljs$lang$applyTo = some_fn__4.cljs$lang$applyTo;
  some_fn.cljs$lang$arity$1 = some_fn__1;
  some_fn.cljs$lang$arity$2 = some_fn__2;
  some_fn.cljs$lang$arity$3 = some_fn__3;
  some_fn.cljs$lang$arity$variadic = some_fn__4.cljs$lang$arity$variadic;
  return some_fn
}();
cljs.core.map = function() {
  var map = null;
  var map__2 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____6663 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____6663) {
        var s__6664 = temp__3974__auto____6663;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__6664)) {
          var c__6665 = cljs.core.chunk_first.call(null, s__6664);
          var size__6666 = cljs.core.count.call(null, c__6665);
          var b__6667 = cljs.core.chunk_buffer.call(null, size__6666);
          var n__1178__auto____6668 = size__6666;
          var i__6669 = 0;
          while(true) {
            if(i__6669 < n__1178__auto____6668) {
              cljs.core.chunk_append.call(null, b__6667, f.call(null, cljs.core._nth.call(null, c__6665, i__6669)));
              var G__6681 = i__6669 + 1;
              i__6669 = G__6681;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__6667), map.call(null, f, cljs.core.chunk_rest.call(null, s__6664)))
        }else {
          return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s__6664)), map.call(null, f, cljs.core.rest.call(null, s__6664)))
        }
      }else {
        return null
      }
    }, null)
  };
  var map__3 = function(f, c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__6670 = cljs.core.seq.call(null, c1);
      var s2__6671 = cljs.core.seq.call(null, c2);
      if(function() {
        var and__3822__auto____6672 = s1__6670;
        if(and__3822__auto____6672) {
          return s2__6671
        }else {
          return and__3822__auto____6672
        }
      }()) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__6670), cljs.core.first.call(null, s2__6671)), map.call(null, f, cljs.core.rest.call(null, s1__6670), cljs.core.rest.call(null, s2__6671)))
      }else {
        return null
      }
    }, null)
  };
  var map__4 = function(f, c1, c2, c3) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__6673 = cljs.core.seq.call(null, c1);
      var s2__6674 = cljs.core.seq.call(null, c2);
      var s3__6675 = cljs.core.seq.call(null, c3);
      if(function() {
        var and__3822__auto____6676 = s1__6673;
        if(and__3822__auto____6676) {
          var and__3822__auto____6677 = s2__6674;
          if(and__3822__auto____6677) {
            return s3__6675
          }else {
            return and__3822__auto____6677
          }
        }else {
          return and__3822__auto____6676
        }
      }()) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__6673), cljs.core.first.call(null, s2__6674), cljs.core.first.call(null, s3__6675)), map.call(null, f, cljs.core.rest.call(null, s1__6673), cljs.core.rest.call(null, s2__6674), cljs.core.rest.call(null, s3__6675)))
      }else {
        return null
      }
    }, null)
  };
  var map__5 = function() {
    var G__6682__delegate = function(f, c1, c2, c3, colls) {
      var step__6680 = function step(cs) {
        return new cljs.core.LazySeq(null, false, function() {
          var ss__6679 = map.call(null, cljs.core.seq, cs);
          if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__6679)) {
            return cljs.core.cons.call(null, map.call(null, cljs.core.first, ss__6679), step.call(null, map.call(null, cljs.core.rest, ss__6679)))
          }else {
            return null
          }
        }, null)
      };
      return map.call(null, function(p1__6484_SHARP_) {
        return cljs.core.apply.call(null, f, p1__6484_SHARP_)
      }, step__6680.call(null, cljs.core.conj.call(null, colls, c3, c2, c1)))
    };
    var G__6682 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__6682__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__6682.cljs$lang$maxFixedArity = 4;
    G__6682.cljs$lang$applyTo = function(arglist__6683) {
      var f = cljs.core.first(arglist__6683);
      var c1 = cljs.core.first(cljs.core.next(arglist__6683));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6683)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__6683))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__6683))));
      return G__6682__delegate(f, c1, c2, c3, colls)
    };
    G__6682.cljs$lang$arity$variadic = G__6682__delegate;
    return G__6682
  }();
  map = function(f, c1, c2, c3, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return map__2.call(this, f, c1);
      case 3:
        return map__3.call(this, f, c1, c2);
      case 4:
        return map__4.call(this, f, c1, c2, c3);
      default:
        return map__5.cljs$lang$arity$variadic(f, c1, c2, c3, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  map.cljs$lang$maxFixedArity = 4;
  map.cljs$lang$applyTo = map__5.cljs$lang$applyTo;
  map.cljs$lang$arity$2 = map__2;
  map.cljs$lang$arity$3 = map__3;
  map.cljs$lang$arity$4 = map__4;
  map.cljs$lang$arity$variadic = map__5.cljs$lang$arity$variadic;
  return map
}();
cljs.core.take = function take(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    if(n > 0) {
      var temp__3974__auto____6686 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____6686) {
        var s__6687 = temp__3974__auto____6686;
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__6687), take.call(null, n - 1, cljs.core.rest.call(null, s__6687)))
      }else {
        return null
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.drop = function drop(n, coll) {
  var step__6693 = function(n, coll) {
    while(true) {
      var s__6691 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3822__auto____6692 = n > 0;
        if(and__3822__auto____6692) {
          return s__6691
        }else {
          return and__3822__auto____6692
        }
      }())) {
        var G__6694 = n - 1;
        var G__6695 = cljs.core.rest.call(null, s__6691);
        n = G__6694;
        coll = G__6695;
        continue
      }else {
        return s__6691
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__6693.call(null, n, coll)
  }, null)
};
cljs.core.drop_last = function() {
  var drop_last = null;
  var drop_last__1 = function(s) {
    return drop_last.call(null, 1, s)
  };
  var drop_last__2 = function(n, s) {
    return cljs.core.map.call(null, function(x, _) {
      return x
    }, s, cljs.core.drop.call(null, n, s))
  };
  drop_last = function(n, s) {
    switch(arguments.length) {
      case 1:
        return drop_last__1.call(this, n);
      case 2:
        return drop_last__2.call(this, n, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  drop_last.cljs$lang$arity$1 = drop_last__1;
  drop_last.cljs$lang$arity$2 = drop_last__2;
  return drop_last
}();
cljs.core.take_last = function take_last(n, coll) {
  var s__6698 = cljs.core.seq.call(null, coll);
  var lead__6699 = cljs.core.seq.call(null, cljs.core.drop.call(null, n, coll));
  while(true) {
    if(lead__6699) {
      var G__6700 = cljs.core.next.call(null, s__6698);
      var G__6701 = cljs.core.next.call(null, lead__6699);
      s__6698 = G__6700;
      lead__6699 = G__6701;
      continue
    }else {
      return s__6698
    }
    break
  }
};
cljs.core.drop_while = function drop_while(pred, coll) {
  var step__6707 = function(pred, coll) {
    while(true) {
      var s__6705 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3822__auto____6706 = s__6705;
        if(and__3822__auto____6706) {
          return pred.call(null, cljs.core.first.call(null, s__6705))
        }else {
          return and__3822__auto____6706
        }
      }())) {
        var G__6708 = pred;
        var G__6709 = cljs.core.rest.call(null, s__6705);
        pred = G__6708;
        coll = G__6709;
        continue
      }else {
        return s__6705
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__6707.call(null, pred, coll)
  }, null)
};
cljs.core.cycle = function cycle(coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____6712 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____6712) {
      var s__6713 = temp__3974__auto____6712;
      return cljs.core.concat.call(null, s__6713, cycle.call(null, s__6713))
    }else {
      return null
    }
  }, null)
};
cljs.core.split_at = function split_at(n, coll) {
  return cljs.core.PersistentVector.fromArray([cljs.core.take.call(null, n, coll), cljs.core.drop.call(null, n, coll)], true)
};
cljs.core.repeat = function() {
  var repeat = null;
  var repeat__1 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, x, repeat.call(null, x))
    }, null)
  };
  var repeat__2 = function(n, x) {
    return cljs.core.take.call(null, n, repeat.call(null, x))
  };
  repeat = function(n, x) {
    switch(arguments.length) {
      case 1:
        return repeat__1.call(this, n);
      case 2:
        return repeat__2.call(this, n, x)
    }
    throw"Invalid arity: " + arguments.length;
  };
  repeat.cljs$lang$arity$1 = repeat__1;
  repeat.cljs$lang$arity$2 = repeat__2;
  return repeat
}();
cljs.core.replicate = function replicate(n, x) {
  return cljs.core.take.call(null, n, cljs.core.repeat.call(null, x))
};
cljs.core.repeatedly = function() {
  var repeatedly = null;
  var repeatedly__1 = function(f) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, f.call(null), repeatedly.call(null, f))
    }, null)
  };
  var repeatedly__2 = function(n, f) {
    return cljs.core.take.call(null, n, repeatedly.call(null, f))
  };
  repeatedly = function(n, f) {
    switch(arguments.length) {
      case 1:
        return repeatedly__1.call(this, n);
      case 2:
        return repeatedly__2.call(this, n, f)
    }
    throw"Invalid arity: " + arguments.length;
  };
  repeatedly.cljs$lang$arity$1 = repeatedly__1;
  repeatedly.cljs$lang$arity$2 = repeatedly__2;
  return repeatedly
}();
cljs.core.iterate = function iterate(f, x) {
  return cljs.core.cons.call(null, x, new cljs.core.LazySeq(null, false, function() {
    return iterate.call(null, f, f.call(null, x))
  }, null))
};
cljs.core.interleave = function() {
  var interleave = null;
  var interleave__2 = function(c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__6718 = cljs.core.seq.call(null, c1);
      var s2__6719 = cljs.core.seq.call(null, c2);
      if(function() {
        var and__3822__auto____6720 = s1__6718;
        if(and__3822__auto____6720) {
          return s2__6719
        }else {
          return and__3822__auto____6720
        }
      }()) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s1__6718), cljs.core.cons.call(null, cljs.core.first.call(null, s2__6719), interleave.call(null, cljs.core.rest.call(null, s1__6718), cljs.core.rest.call(null, s2__6719))))
      }else {
        return null
      }
    }, null)
  };
  var interleave__3 = function() {
    var G__6722__delegate = function(c1, c2, colls) {
      return new cljs.core.LazySeq(null, false, function() {
        var ss__6721 = cljs.core.map.call(null, cljs.core.seq, cljs.core.conj.call(null, colls, c2, c1));
        if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__6721)) {
          return cljs.core.concat.call(null, cljs.core.map.call(null, cljs.core.first, ss__6721), cljs.core.apply.call(null, interleave, cljs.core.map.call(null, cljs.core.rest, ss__6721)))
        }else {
          return null
        }
      }, null)
    };
    var G__6722 = function(c1, c2, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6722__delegate.call(this, c1, c2, colls)
    };
    G__6722.cljs$lang$maxFixedArity = 2;
    G__6722.cljs$lang$applyTo = function(arglist__6723) {
      var c1 = cljs.core.first(arglist__6723);
      var c2 = cljs.core.first(cljs.core.next(arglist__6723));
      var colls = cljs.core.rest(cljs.core.next(arglist__6723));
      return G__6722__delegate(c1, c2, colls)
    };
    G__6722.cljs$lang$arity$variadic = G__6722__delegate;
    return G__6722
  }();
  interleave = function(c1, c2, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return interleave__2.call(this, c1, c2);
      default:
        return interleave__3.cljs$lang$arity$variadic(c1, c2, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  interleave.cljs$lang$maxFixedArity = 2;
  interleave.cljs$lang$applyTo = interleave__3.cljs$lang$applyTo;
  interleave.cljs$lang$arity$2 = interleave__2;
  interleave.cljs$lang$arity$variadic = interleave__3.cljs$lang$arity$variadic;
  return interleave
}();
cljs.core.interpose = function interpose(sep, coll) {
  return cljs.core.drop.call(null, 1, cljs.core.interleave.call(null, cljs.core.repeat.call(null, sep), coll))
};
cljs.core.flatten1 = function flatten1(colls) {
  var cat__6733 = function cat(coll, colls) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3971__auto____6731 = cljs.core.seq.call(null, coll);
      if(temp__3971__auto____6731) {
        var coll__6732 = temp__3971__auto____6731;
        return cljs.core.cons.call(null, cljs.core.first.call(null, coll__6732), cat.call(null, cljs.core.rest.call(null, coll__6732), colls))
      }else {
        if(cljs.core.seq.call(null, colls)) {
          return cat.call(null, cljs.core.first.call(null, colls), cljs.core.rest.call(null, colls))
        }else {
          return null
        }
      }
    }, null)
  };
  return cat__6733.call(null, null, colls)
};
cljs.core.mapcat = function() {
  var mapcat = null;
  var mapcat__2 = function(f, coll) {
    return cljs.core.flatten1.call(null, cljs.core.map.call(null, f, coll))
  };
  var mapcat__3 = function() {
    var G__6734__delegate = function(f, coll, colls) {
      return cljs.core.flatten1.call(null, cljs.core.apply.call(null, cljs.core.map, f, coll, colls))
    };
    var G__6734 = function(f, coll, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6734__delegate.call(this, f, coll, colls)
    };
    G__6734.cljs$lang$maxFixedArity = 2;
    G__6734.cljs$lang$applyTo = function(arglist__6735) {
      var f = cljs.core.first(arglist__6735);
      var coll = cljs.core.first(cljs.core.next(arglist__6735));
      var colls = cljs.core.rest(cljs.core.next(arglist__6735));
      return G__6734__delegate(f, coll, colls)
    };
    G__6734.cljs$lang$arity$variadic = G__6734__delegate;
    return G__6734
  }();
  mapcat = function(f, coll, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return mapcat__2.call(this, f, coll);
      default:
        return mapcat__3.cljs$lang$arity$variadic(f, coll, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  mapcat.cljs$lang$maxFixedArity = 2;
  mapcat.cljs$lang$applyTo = mapcat__3.cljs$lang$applyTo;
  mapcat.cljs$lang$arity$2 = mapcat__2;
  mapcat.cljs$lang$arity$variadic = mapcat__3.cljs$lang$arity$variadic;
  return mapcat
}();
cljs.core.filter = function filter(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____6745 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____6745) {
      var s__6746 = temp__3974__auto____6745;
      if(cljs.core.chunked_seq_QMARK_.call(null, s__6746)) {
        var c__6747 = cljs.core.chunk_first.call(null, s__6746);
        var size__6748 = cljs.core.count.call(null, c__6747);
        var b__6749 = cljs.core.chunk_buffer.call(null, size__6748);
        var n__1178__auto____6750 = size__6748;
        var i__6751 = 0;
        while(true) {
          if(i__6751 < n__1178__auto____6750) {
            if(cljs.core.truth_(pred.call(null, cljs.core._nth.call(null, c__6747, i__6751)))) {
              cljs.core.chunk_append.call(null, b__6749, cljs.core._nth.call(null, c__6747, i__6751))
            }else {
            }
            var G__6754 = i__6751 + 1;
            i__6751 = G__6754;
            continue
          }else {
          }
          break
        }
        return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__6749), filter.call(null, pred, cljs.core.chunk_rest.call(null, s__6746)))
      }else {
        var f__6752 = cljs.core.first.call(null, s__6746);
        var r__6753 = cljs.core.rest.call(null, s__6746);
        if(cljs.core.truth_(pred.call(null, f__6752))) {
          return cljs.core.cons.call(null, f__6752, filter.call(null, pred, r__6753))
        }else {
          return filter.call(null, pred, r__6753)
        }
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.remove = function remove(pred, coll) {
  return cljs.core.filter.call(null, cljs.core.complement.call(null, pred), coll)
};
cljs.core.tree_seq = function tree_seq(branch_QMARK_, children, root) {
  var walk__6757 = function walk(node) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, node, cljs.core.truth_(branch_QMARK_.call(null, node)) ? cljs.core.mapcat.call(null, walk, children.call(null, node)) : null)
    }, null)
  };
  return walk__6757.call(null, root)
};
cljs.core.flatten = function flatten(x) {
  return cljs.core.filter.call(null, function(p1__6755_SHARP_) {
    return!cljs.core.sequential_QMARK_.call(null, p1__6755_SHARP_)
  }, cljs.core.rest.call(null, cljs.core.tree_seq.call(null, cljs.core.sequential_QMARK_, cljs.core.seq, x)))
};
cljs.core.into = function into(to, from) {
  if(function() {
    var G__6761__6762 = to;
    if(G__6761__6762) {
      if(function() {
        var or__3824__auto____6763 = G__6761__6762.cljs$lang$protocol_mask$partition1$ & 1;
        if(or__3824__auto____6763) {
          return or__3824__auto____6763
        }else {
          return G__6761__6762.cljs$core$IEditableCollection$
        }
      }()) {
        return true
      }else {
        if(!G__6761__6762.cljs$lang$protocol_mask$partition1$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__6761__6762)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__6761__6762)
    }
  }()) {
    return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, cljs.core._conj_BANG_, cljs.core.transient$.call(null, to), from))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, to, from)
  }
};
cljs.core.mapv = function() {
  var mapv = null;
  var mapv__2 = function(f, coll) {
    return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(v, o) {
      return cljs.core.conj_BANG_.call(null, v, f.call(null, o))
    }, cljs.core.transient$.call(null, cljs.core.PersistentVector.EMPTY), coll))
  };
  var mapv__3 = function(f, c1, c2) {
    return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.map.call(null, f, c1, c2))
  };
  var mapv__4 = function(f, c1, c2, c3) {
    return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.map.call(null, f, c1, c2, c3))
  };
  var mapv__5 = function() {
    var G__6764__delegate = function(f, c1, c2, c3, colls) {
      return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.apply.call(null, cljs.core.map, f, c1, c2, c3, colls))
    };
    var G__6764 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__6764__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__6764.cljs$lang$maxFixedArity = 4;
    G__6764.cljs$lang$applyTo = function(arglist__6765) {
      var f = cljs.core.first(arglist__6765);
      var c1 = cljs.core.first(cljs.core.next(arglist__6765));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6765)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__6765))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__6765))));
      return G__6764__delegate(f, c1, c2, c3, colls)
    };
    G__6764.cljs$lang$arity$variadic = G__6764__delegate;
    return G__6764
  }();
  mapv = function(f, c1, c2, c3, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return mapv__2.call(this, f, c1);
      case 3:
        return mapv__3.call(this, f, c1, c2);
      case 4:
        return mapv__4.call(this, f, c1, c2, c3);
      default:
        return mapv__5.cljs$lang$arity$variadic(f, c1, c2, c3, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  mapv.cljs$lang$maxFixedArity = 4;
  mapv.cljs$lang$applyTo = mapv__5.cljs$lang$applyTo;
  mapv.cljs$lang$arity$2 = mapv__2;
  mapv.cljs$lang$arity$3 = mapv__3;
  mapv.cljs$lang$arity$4 = mapv__4;
  mapv.cljs$lang$arity$variadic = mapv__5.cljs$lang$arity$variadic;
  return mapv
}();
cljs.core.filterv = function filterv(pred, coll) {
  return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(v, o) {
    if(cljs.core.truth_(pred.call(null, o))) {
      return cljs.core.conj_BANG_.call(null, v, o)
    }else {
      return v
    }
  }, cljs.core.transient$.call(null, cljs.core.PersistentVector.EMPTY), coll))
};
cljs.core.partition = function() {
  var partition = null;
  var partition__2 = function(n, coll) {
    return partition.call(null, n, n, coll)
  };
  var partition__3 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____6772 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____6772) {
        var s__6773 = temp__3974__auto____6772;
        var p__6774 = cljs.core.take.call(null, n, s__6773);
        if(n === cljs.core.count.call(null, p__6774)) {
          return cljs.core.cons.call(null, p__6774, partition.call(null, n, step, cljs.core.drop.call(null, step, s__6773)))
        }else {
          return null
        }
      }else {
        return null
      }
    }, null)
  };
  var partition__4 = function(n, step, pad, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____6775 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____6775) {
        var s__6776 = temp__3974__auto____6775;
        var p__6777 = cljs.core.take.call(null, n, s__6776);
        if(n === cljs.core.count.call(null, p__6777)) {
          return cljs.core.cons.call(null, p__6777, partition.call(null, n, step, pad, cljs.core.drop.call(null, step, s__6776)))
        }else {
          return cljs.core.list.call(null, cljs.core.take.call(null, n, cljs.core.concat.call(null, p__6777, pad)))
        }
      }else {
        return null
      }
    }, null)
  };
  partition = function(n, step, pad, coll) {
    switch(arguments.length) {
      case 2:
        return partition__2.call(this, n, step);
      case 3:
        return partition__3.call(this, n, step, pad);
      case 4:
        return partition__4.call(this, n, step, pad, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  partition.cljs$lang$arity$2 = partition__2;
  partition.cljs$lang$arity$3 = partition__3;
  partition.cljs$lang$arity$4 = partition__4;
  return partition
}();
cljs.core.get_in = function() {
  var get_in = null;
  var get_in__2 = function(m, ks) {
    return cljs.core.reduce.call(null, cljs.core.get, m, ks)
  };
  var get_in__3 = function(m, ks, not_found) {
    var sentinel__6782 = cljs.core.lookup_sentinel;
    var m__6783 = m;
    var ks__6784 = cljs.core.seq.call(null, ks);
    while(true) {
      if(ks__6784) {
        var m__6785 = cljs.core._lookup.call(null, m__6783, cljs.core.first.call(null, ks__6784), sentinel__6782);
        if(sentinel__6782 === m__6785) {
          return not_found
        }else {
          var G__6786 = sentinel__6782;
          var G__6787 = m__6785;
          var G__6788 = cljs.core.next.call(null, ks__6784);
          sentinel__6782 = G__6786;
          m__6783 = G__6787;
          ks__6784 = G__6788;
          continue
        }
      }else {
        return m__6783
      }
      break
    }
  };
  get_in = function(m, ks, not_found) {
    switch(arguments.length) {
      case 2:
        return get_in__2.call(this, m, ks);
      case 3:
        return get_in__3.call(this, m, ks, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  get_in.cljs$lang$arity$2 = get_in__2;
  get_in.cljs$lang$arity$3 = get_in__3;
  return get_in
}();
cljs.core.assoc_in = function assoc_in(m, p__6789, v) {
  var vec__6794__6795 = p__6789;
  var k__6796 = cljs.core.nth.call(null, vec__6794__6795, 0, null);
  var ks__6797 = cljs.core.nthnext.call(null, vec__6794__6795, 1);
  if(cljs.core.truth_(ks__6797)) {
    return cljs.core.assoc.call(null, m, k__6796, assoc_in.call(null, cljs.core._lookup.call(null, m, k__6796, null), ks__6797, v))
  }else {
    return cljs.core.assoc.call(null, m, k__6796, v)
  }
};
cljs.core.update_in = function() {
  var update_in__delegate = function(m, p__6798, f, args) {
    var vec__6803__6804 = p__6798;
    var k__6805 = cljs.core.nth.call(null, vec__6803__6804, 0, null);
    var ks__6806 = cljs.core.nthnext.call(null, vec__6803__6804, 1);
    if(cljs.core.truth_(ks__6806)) {
      return cljs.core.assoc.call(null, m, k__6805, cljs.core.apply.call(null, update_in, cljs.core._lookup.call(null, m, k__6805, null), ks__6806, f, args))
    }else {
      return cljs.core.assoc.call(null, m, k__6805, cljs.core.apply.call(null, f, cljs.core._lookup.call(null, m, k__6805, null), args))
    }
  };
  var update_in = function(m, p__6798, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
    }
    return update_in__delegate.call(this, m, p__6798, f, args)
  };
  update_in.cljs$lang$maxFixedArity = 3;
  update_in.cljs$lang$applyTo = function(arglist__6807) {
    var m = cljs.core.first(arglist__6807);
    var p__6798 = cljs.core.first(cljs.core.next(arglist__6807));
    var f = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6807)));
    var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__6807)));
    return update_in__delegate(m, p__6798, f, args)
  };
  update_in.cljs$lang$arity$variadic = update_in__delegate;
  return update_in
}();
cljs.core.Vector = function(meta, array, __hash) {
  this.meta = meta;
  this.array = array;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32400159
};
cljs.core.Vector.cljs$lang$type = true;
cljs.core.Vector.cljs$lang$ctorPrSeq = function(this__960__auto__) {
  return cljs.core.list.call(null, "cljs.core/Vector")
};
cljs.core.Vector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6810 = this;
  var h__843__auto____6811 = this__6810.__hash;
  if(!(h__843__auto____6811 == null)) {
    return h__843__auto____6811
  }else {
    var h__843__auto____6812 = cljs.core.hash_coll.call(null, coll);
    this__6810.__hash = h__843__auto____6812;
    return h__843__auto____6812
  }
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__6813 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__6814 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.Vector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__6815 = this;
  var new_array__6816 = this__6815.array.slice();
  new_array__6816[k] = v;
  return new cljs.core.Vector(this__6815.meta, new_array__6816, null)
};
cljs.core.Vector.prototype.call = function() {
  var G__6847 = null;
  var G__6847__2 = function(this_sym6817, k) {
    var this__6819 = this;
    var this_sym6817__6820 = this;
    var coll__6821 = this_sym6817__6820;
    return coll__6821.cljs$core$ILookup$_lookup$arity$2(coll__6821, k)
  };
  var G__6847__3 = function(this_sym6818, k, not_found) {
    var this__6819 = this;
    var this_sym6818__6822 = this;
    var coll__6823 = this_sym6818__6822;
    return coll__6823.cljs$core$ILookup$_lookup$arity$3(coll__6823, k, not_found)
  };
  G__6847 = function(this_sym6818, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6847__2.call(this, this_sym6818, k);
      case 3:
        return G__6847__3.call(this, this_sym6818, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6847
}();
cljs.core.Vector.prototype.apply = function(this_sym6808, args6809) {
  var this__6824 = this;
  return this_sym6808.call.apply(this_sym6808, [this_sym6808].concat(args6809.slice()))
};
cljs.core.Vector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__6825 = this;
  var new_array__6826 = this__6825.array.slice();
  new_array__6826.push(o);
  return new cljs.core.Vector(this__6825.meta, new_array__6826, null)
};
cljs.core.Vector.prototype.toString = function() {
  var this__6827 = this;
  var this__6828 = this;
  return cljs.core.pr_str.call(null, this__6828)
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__6829 = this;
  return cljs.core.ci_reduce.call(null, this__6829.array, f)
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__6830 = this;
  return cljs.core.ci_reduce.call(null, this__6830.array, f, start)
};
cljs.core.Vector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__6831 = this;
  if(this__6831.array.length > 0) {
    var vector_seq__6832 = function vector_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < this__6831.array.length) {
          return cljs.core.cons.call(null, this__6831.array[i], vector_seq.call(null, i + 1))
        }else {
          return null
        }
      }, null)
    };
    return vector_seq__6832.call(null, 0)
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__6833 = this;
  return this__6833.array.length
};
cljs.core.Vector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__6834 = this;
  var count__6835 = this__6834.array.length;
  if(count__6835 > 0) {
    return this__6834.array[count__6835 - 1]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__6836 = this;
  if(this__6836.array.length > 0) {
    var new_array__6837 = this__6836.array.slice();
    new_array__6837.pop();
    return new cljs.core.Vector(this__6836.meta, new_array__6837, null)
  }else {
    throw new Error("Can't pop empty vector");
  }
};
cljs.core.Vector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__6838 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.Vector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6839 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Vector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__6840 = this;
  return new cljs.core.Vector(meta, this__6840.array, this__6840.__hash)
};
cljs.core.Vector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__6841 = this;
  return this__6841.meta
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__6842 = this;
  if(function() {
    var and__3822__auto____6843 = 0 <= n;
    if(and__3822__auto____6843) {
      return n < this__6842.array.length
    }else {
      return and__3822__auto____6843
    }
  }()) {
    return this__6842.array[n]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__6844 = this;
  if(function() {
    var and__3822__auto____6845 = 0 <= n;
    if(and__3822__auto____6845) {
      return n < this__6844.array.length
    }else {
      return and__3822__auto____6845
    }
  }()) {
    return this__6844.array[n]
  }else {
    return not_found
  }
};
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__6846 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__6846.meta)
};
cljs.core.Vector;
cljs.core.Vector.EMPTY = new cljs.core.Vector(null, [], 0);
cljs.core.Vector.fromArray = function(xs) {
  return new cljs.core.Vector(null, xs, null)
};
cljs.core.VectorNode = function(edit, arr) {
  this.edit = edit;
  this.arr = arr
};
cljs.core.VectorNode.cljs$lang$type = true;
cljs.core.VectorNode.cljs$lang$ctorPrSeq = function(this__961__auto__) {
  return cljs.core.list.call(null, "cljs.core/VectorNode")
};
cljs.core.VectorNode;
cljs.core.pv_fresh_node = function pv_fresh_node(edit) {
  return new cljs.core.VectorNode(edit, cljs.core.make_array.call(null, 32))
};
cljs.core.pv_aget = function pv_aget(node, idx) {
  return node.arr[idx]
};
cljs.core.pv_aset = function pv_aset(node, idx, val) {
  return node.arr[idx] = val
};
cljs.core.pv_clone_node = function pv_clone_node(node) {
  return new cljs.core.VectorNode(node.edit, node.arr.slice())
};
cljs.core.tail_off = function tail_off(pv) {
  var cnt__6849 = pv.cnt;
  if(cnt__6849 < 32) {
    return 0
  }else {
    return cnt__6849 - 1 >>> 5 << 5
  }
};
cljs.core.new_path = function new_path(edit, level, node) {
  var ll__6855 = level;
  var ret__6856 = node;
  while(true) {
    if(ll__6855 === 0) {
      return ret__6856
    }else {
      var embed__6857 = ret__6856;
      var r__6858 = cljs.core.pv_fresh_node.call(null, edit);
      var ___6859 = cljs.core.pv_aset.call(null, r__6858, 0, embed__6857);
      var G__6860 = ll__6855 - 5;
      var G__6861 = r__6858;
      ll__6855 = G__6860;
      ret__6856 = G__6861;
      continue
    }
    break
  }
};
cljs.core.push_tail = function push_tail(pv, level, parent, tailnode) {
  var ret__6867 = cljs.core.pv_clone_node.call(null, parent);
  var subidx__6868 = pv.cnt - 1 >>> level & 31;
  if(5 === level) {
    cljs.core.pv_aset.call(null, ret__6867, subidx__6868, tailnode);
    return ret__6867
  }else {
    var child__6869 = cljs.core.pv_aget.call(null, parent, subidx__6868);
    if(!(child__6869 == null)) {
      var node_to_insert__6870 = push_tail.call(null, pv, level - 5, child__6869, tailnode);
      cljs.core.pv_aset.call(null, ret__6867, subidx__6868, node_to_insert__6870);
      return ret__6867
    }else {
      var node_to_insert__6871 = cljs.core.new_path.call(null, null, level - 5, tailnode);
      cljs.core.pv_aset.call(null, ret__6867, subidx__6868, node_to_insert__6871);
      return ret__6867
    }
  }
};
cljs.core.array_for = function array_for(pv, i) {
  if(function() {
    var and__3822__auto____6875 = 0 <= i;
    if(and__3822__auto____6875) {
      return i < pv.cnt
    }else {
      return and__3822__auto____6875
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, pv)) {
      return pv.tail
    }else {
      var node__6876 = pv.root;
      var level__6877 = pv.shift;
      while(true) {
        if(level__6877 > 0) {
          var G__6878 = cljs.core.pv_aget.call(null, node__6876, i >>> level__6877 & 31);
          var G__6879 = level__6877 - 5;
          node__6876 = G__6878;
          level__6877 = G__6879;
          continue
        }else {
          return node__6876.arr
        }
        break
      }
    }
  }else {
    throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in vector of length "), cljs.core.str(pv.cnt)].join(""));
  }
};
cljs.core.do_assoc = function do_assoc(pv, level, node, i, val) {
  var ret__6882 = cljs.core.pv_clone_node.call(null, node);
  if(level === 0) {
    cljs.core.pv_aset.call(null, ret__6882, i & 31, val);
    return ret__6882
  }else {
    var subidx__6883 = i >>> level & 31;
    cljs.core.pv_aset.call(null, ret__6882, subidx__6883, do_assoc.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__6883), i, val));
    return ret__6882
  }
};
cljs.core.pop_tail = function pop_tail(pv, level, node) {
  var subidx__6889 = pv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__6890 = pop_tail.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__6889));
    if(function() {
      var and__3822__auto____6891 = new_child__6890 == null;
      if(and__3822__auto____6891) {
        return subidx__6889 === 0
      }else {
        return and__3822__auto____6891
      }
    }()) {
      return null
    }else {
      var ret__6892 = cljs.core.pv_clone_node.call(null, node);
      cljs.core.pv_aset.call(null, ret__6892, subidx__6889, new_child__6890);
      return ret__6892
    }
  }else {
    if(subidx__6889 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        var ret__6893 = cljs.core.pv_clone_node.call(null, node);
        cljs.core.pv_aset.call(null, ret__6893, subidx__6889, null);
        return ret__6893
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentVector = function(meta, cnt, shift, root, tail, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.shift = shift;
  this.root = root;
  this.tail = tail;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 167668511
};
cljs.core.PersistentVector.cljs$lang$type = true;
cljs.core.PersistentVector.cljs$lang$ctorPrSeq = function(this__960__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentVector")
};
cljs.core.PersistentVector.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__6896 = this;
  return new cljs.core.TransientVector(this__6896.cnt, this__6896.shift, cljs.core.tv_editable_root.call(null, this__6896.root), cljs.core.tv_editable_tail.call(null, this__6896.tail))
};
cljs.core.PersistentVector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6897 = this;
  var h__843__auto____6898 = this__6897.__hash;
  if(!(h__843__auto____6898 == null)) {
    return h__843__auto____6898
  }else {
    var h__843__auto____6899 = cljs.core.hash_coll.call(null, coll);
    this__6897.__hash = h__843__auto____6899;
    return h__843__auto____6899
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__6900 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__6901 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.PersistentVector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__6902 = this;
  if(function() {
    var and__3822__auto____6903 = 0 <= k;
    if(and__3822__auto____6903) {
      return k < this__6902.cnt
    }else {
      return and__3822__auto____6903
    }
  }()) {
    if(cljs.core.tail_off.call(null, coll) <= k) {
      var new_tail__6904 = this__6902.tail.slice();
      new_tail__6904[k & 31] = v;
      return new cljs.core.PersistentVector(this__6902.meta, this__6902.cnt, this__6902.shift, this__6902.root, new_tail__6904, null)
    }else {
      return new cljs.core.PersistentVector(this__6902.meta, this__6902.cnt, this__6902.shift, cljs.core.do_assoc.call(null, coll, this__6902.shift, this__6902.root, k, v), this__6902.tail, null)
    }
  }else {
    if(k === this__6902.cnt) {
      return coll.cljs$core$ICollection$_conj$arity$2(coll, v)
    }else {
      if("\ufdd0'else") {
        throw new Error([cljs.core.str("Index "), cljs.core.str(k), cljs.core.str(" out of bounds  [0,"), cljs.core.str(this__6902.cnt), cljs.core.str("]")].join(""));
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentVector.prototype.call = function() {
  var G__6952 = null;
  var G__6952__2 = function(this_sym6905, k) {
    var this__6907 = this;
    var this_sym6905__6908 = this;
    var coll__6909 = this_sym6905__6908;
    return coll__6909.cljs$core$ILookup$_lookup$arity$2(coll__6909, k)
  };
  var G__6952__3 = function(this_sym6906, k, not_found) {
    var this__6907 = this;
    var this_sym6906__6910 = this;
    var coll__6911 = this_sym6906__6910;
    return coll__6911.cljs$core$ILookup$_lookup$arity$3(coll__6911, k, not_found)
  };
  G__6952 = function(this_sym6906, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6952__2.call(this, this_sym6906, k);
      case 3:
        return G__6952__3.call(this, this_sym6906, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6952
}();
cljs.core.PersistentVector.prototype.apply = function(this_sym6894, args6895) {
  var this__6912 = this;
  return this_sym6894.call.apply(this_sym6894, [this_sym6894].concat(args6895.slice()))
};
cljs.core.PersistentVector.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(v, f, init) {
  var this__6913 = this;
  var step_init__6914 = [0, init];
  var i__6915 = 0;
  while(true) {
    if(i__6915 < this__6913.cnt) {
      var arr__6916 = cljs.core.array_for.call(null, v, i__6915);
      var len__6917 = arr__6916.length;
      var init__6921 = function() {
        var j__6918 = 0;
        var init__6919 = step_init__6914[1];
        while(true) {
          if(j__6918 < len__6917) {
            var init__6920 = f.call(null, init__6919, j__6918 + i__6915, arr__6916[j__6918]);
            if(cljs.core.reduced_QMARK_.call(null, init__6920)) {
              return init__6920
            }else {
              var G__6953 = j__6918 + 1;
              var G__6954 = init__6920;
              j__6918 = G__6953;
              init__6919 = G__6954;
              continue
            }
          }else {
            step_init__6914[0] = len__6917;
            step_init__6914[1] = init__6919;
            return init__6919
          }
          break
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__6921)) {
        return cljs.core.deref.call(null, init__6921)
      }else {
        var G__6955 = i__6915 + step_init__6914[0];
        i__6915 = G__6955;
        continue
      }
    }else {
      return step_init__6914[1]
    }
    break
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__6922 = this;
  if(this__6922.cnt - cljs.core.tail_off.call(null, coll) < 32) {
    var new_tail__6923 = this__6922.tail.slice();
    new_tail__6923.push(o);
    return new cljs.core.PersistentVector(this__6922.meta, this__6922.cnt + 1, this__6922.shift, this__6922.root, new_tail__6923, null)
  }else {
    var root_overflow_QMARK___6924 = this__6922.cnt >>> 5 > 1 << this__6922.shift;
    var new_shift__6925 = root_overflow_QMARK___6924 ? this__6922.shift + 5 : this__6922.shift;
    var new_root__6927 = root_overflow_QMARK___6924 ? function() {
      var n_r__6926 = cljs.core.pv_fresh_node.call(null, null);
      cljs.core.pv_aset.call(null, n_r__6926, 0, this__6922.root);
      cljs.core.pv_aset.call(null, n_r__6926, 1, cljs.core.new_path.call(null, null, this__6922.shift, new cljs.core.VectorNode(null, this__6922.tail)));
      return n_r__6926
    }() : cljs.core.push_tail.call(null, coll, this__6922.shift, this__6922.root, new cljs.core.VectorNode(null, this__6922.tail));
    return new cljs.core.PersistentVector(this__6922.meta, this__6922.cnt + 1, new_shift__6925, new_root__6927, [o], null)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__6928 = this;
  if(this__6928.cnt > 0) {
    return new cljs.core.RSeq(coll, this__6928.cnt - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_key$arity$1 = function(coll) {
  var this__6929 = this;
  return coll.cljs$core$IIndexed$_nth$arity$2(coll, 0)
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_val$arity$1 = function(coll) {
  var this__6930 = this;
  return coll.cljs$core$IIndexed$_nth$arity$2(coll, 1)
};
cljs.core.PersistentVector.prototype.toString = function() {
  var this__6931 = this;
  var this__6932 = this;
  return cljs.core.pr_str.call(null, this__6932)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__6933 = this;
  return cljs.core.ci_reduce.call(null, v, f)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__6934 = this;
  return cljs.core.ci_reduce.call(null, v, f, start)
};
cljs.core.PersistentVector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__6935 = this;
  if(this__6935.cnt === 0) {
    return null
  }else {
    return cljs.core.chunked_seq.call(null, coll, 0, 0)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__6936 = this;
  return this__6936.cnt
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__6937 = this;
  if(this__6937.cnt > 0) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, this__6937.cnt - 1)
  }else {
    return null
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__6938 = this;
  if(this__6938.cnt === 0) {
    throw new Error("Can't pop empty vector");
  }else {
    if(1 === this__6938.cnt) {
      return cljs.core._with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__6938.meta)
    }else {
      if(1 < this__6938.cnt - cljs.core.tail_off.call(null, coll)) {
        return new cljs.core.PersistentVector(this__6938.meta, this__6938.cnt - 1, this__6938.shift, this__6938.root, this__6938.tail.slice(0, -1), null)
      }else {
        if("\ufdd0'else") {
          var new_tail__6939 = cljs.core.array_for.call(null, coll, this__6938.cnt - 2);
          var nr__6940 = cljs.core.pop_tail.call(null, coll, this__6938.shift, this__6938.root);
          var new_root__6941 = nr__6940 == null ? cljs.core.PersistentVector.EMPTY_NODE : nr__6940;
          var cnt_1__6942 = this__6938.cnt - 1;
          if(function() {
            var and__3822__auto____6943 = 5 < this__6938.shift;
            if(and__3822__auto____6943) {
              return cljs.core.pv_aget.call(null, new_root__6941, 1) == null
            }else {
              return and__3822__auto____6943
            }
          }()) {
            return new cljs.core.PersistentVector(this__6938.meta, cnt_1__6942, this__6938.shift - 5, cljs.core.pv_aget.call(null, new_root__6941, 0), new_tail__6939, null)
          }else {
            return new cljs.core.PersistentVector(this__6938.meta, cnt_1__6942, this__6938.shift, new_root__6941, new_tail__6939, null)
          }
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__6944 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.PersistentVector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6945 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentVector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__6946 = this;
  return new cljs.core.PersistentVector(meta, this__6946.cnt, this__6946.shift, this__6946.root, this__6946.tail, this__6946.__hash)
};
cljs.core.PersistentVector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__6947 = this;
  return this__6947.meta
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__6948 = this;
  return cljs.core.array_for.call(null, coll, n)[n & 31]
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__6949 = this;
  if(function() {
    var and__3822__auto____6950 = 0 <= n;
    if(and__3822__auto____6950) {
      return n < this__6949.cnt
    }else {
      return and__3822__auto____6950
    }
  }()) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
  }else {
    return not_found
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__6951 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__6951.meta)
};
cljs.core.PersistentVector;
cljs.core.PersistentVector.EMPTY_NODE = cljs.core.pv_fresh_node.call(null, null);
cljs.core.PersistentVector.EMPTY = new cljs.core.PersistentVector(null, 0, 5, cljs.core.PersistentVector.EMPTY_NODE, [], 0);
cljs.core.PersistentVector.fromArray = function(xs, no_clone) {
  var l__6956 = xs.length;
  var xs__6957 = no_clone === true ? xs : xs.slice();
  if(l__6956 < 32) {
    return new cljs.core.PersistentVector(null, l__6956, 5, cljs.core.PersistentVector.EMPTY_NODE, xs__6957, null)
  }else {
    var node__6958 = xs__6957.slice(0, 32);
    var v__6959 = new cljs.core.PersistentVector(null, 32, 5, cljs.core.PersistentVector.EMPTY_NODE, node__6958, null);
    var i__6960 = 32;
    var out__6961 = cljs.core._as_transient.call(null, v__6959);
    while(true) {
      if(i__6960 < l__6956) {
        var G__6962 = i__6960 + 1;
        var G__6963 = cljs.core.conj_BANG_.call(null, out__6961, xs__6957[i__6960]);
        i__6960 = G__6962;
        out__6961 = G__6963;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out__6961)
      }
      break
    }
  }
};
cljs.core.vec = function vec(coll) {
  return cljs.core._persistent_BANG_.call(null, cljs.core.reduce.call(null, cljs.core._conj_BANG_, cljs.core._as_transient.call(null, cljs.core.PersistentVector.EMPTY), coll))
};
cljs.core.vector = function() {
  var vector__delegate = function(args) {
    return cljs.core.vec.call(null, args)
  };
  var vector = function(var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return vector__delegate.call(this, args)
  };
  vector.cljs$lang$maxFixedArity = 0;
  vector.cljs$lang$applyTo = function(arglist__6964) {
    var args = cljs.core.seq(arglist__6964);
    return vector__delegate(args)
  };
  vector.cljs$lang$arity$variadic = vector__delegate;
  return vector
}();
cljs.core.ChunkedSeq = function(vec, node, i, off, meta) {
  this.vec = vec;
  this.node = node;
  this.i = i;
  this.off = off;
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 27525356
};
cljs.core.ChunkedSeq.cljs$lang$type = true;
cljs.core.ChunkedSeq.cljs$lang$ctorPrSeq = function(this__960__auto__) {
  return cljs.core.list.call(null, "cljs.core/ChunkedSeq")
};
cljs.core.ChunkedSeq.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__6965 = this;
  if(this__6965.off + 1 < this__6965.node.length) {
    var s__6966 = cljs.core.chunked_seq.call(null, this__6965.vec, this__6965.node, this__6965.i, this__6965.off + 1);
    if(s__6966 == null) {
      return null
    }else {
      return s__6966
    }
  }else {
    return coll.cljs$core$IChunkedNext$_chunked_next$arity$1(coll)
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__6967 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__6968 = this;
  return coll
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__6969 = this;
  return this__6969.node[this__6969.off]
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__6970 = this;
  if(this__6970.off + 1 < this__6970.node.length) {
    var s__6971 = cljs.core.chunked_seq.call(null, this__6970.vec, this__6970.node, this__6970.i, this__6970.off + 1);
    if(s__6971 == null) {
      return cljs.core.List.EMPTY
    }else {
      return s__6971
    }
  }else {
    return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1(coll)
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedNext$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedNext$_chunked_next$arity$1 = function(coll) {
  var this__6972 = this;
  var l__6973 = this__6972.node.length;
  var s__6974 = this__6972.i + l__6973 < cljs.core._count.call(null, this__6972.vec) ? cljs.core.chunked_seq.call(null, this__6972.vec, this__6972.i + l__6973, 0) : null;
  if(s__6974 == null) {
    return null
  }else {
    return s__6974
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6975 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, m) {
  var this__6976 = this;
  return cljs.core.chunked_seq.call(null, this__6976.vec, this__6976.node, this__6976.i, this__6976.off, m)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IWithMeta$_meta$arity$1 = function(coll) {
  var this__6977 = this;
  return this__6977.meta
};
cljs.core.ChunkedSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__6978 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__6978.meta)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$_chunked_first$arity$1 = function(coll) {
  var this__6979 = this;
  return cljs.core.array_chunk.call(null, this__6979.node, this__6979.off)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$_chunked_rest$arity$1 = function(coll) {
  var this__6980 = this;
  var l__6981 = this__6980.node.length;
  var s__6982 = this__6980.i + l__6981 < cljs.core._count.call(null, this__6980.vec) ? cljs.core.chunked_seq.call(null, this__6980.vec, this__6980.i + l__6981, 0) : null;
  if(s__6982 == null) {
    return cljs.core.List.EMPTY
  }else {
    return s__6982
  }
};
cljs.core.ChunkedSeq;
cljs.core.chunked_seq = function() {
  var chunked_seq = null;
  var chunked_seq__3 = function(vec, i, off) {
    return chunked_seq.call(null, vec, cljs.core.array_for.call(null, vec, i), i, off, null)
  };
  var chunked_seq__4 = function(vec, node, i, off) {
    return chunked_seq.call(null, vec, node, i, off, null)
  };
  var chunked_seq__5 = function(vec, node, i, off, meta) {
    return new cljs.core.ChunkedSeq(vec, node, i, off, meta)
  };
  chunked_seq = function(vec, node, i, off, meta) {
    switch(arguments.length) {
      case 3:
        return chunked_seq__3.call(this, vec, node, i);
      case 4:
        return chunked_seq__4.call(this, vec, node, i, off);
      case 5:
        return chunked_seq__5.call(this, vec, node, i, off, meta)
    }
    throw"Invalid arity: " + arguments.length;
  };
  chunked_seq.cljs$lang$arity$3 = chunked_seq__3;
  chunked_seq.cljs$lang$arity$4 = chunked_seq__4;
  chunked_seq.cljs$lang$arity$5 = chunked_seq__5;
  return chunked_seq
}();
cljs.core.Subvec = function(meta, v, start, end, __hash) {
  this.meta = meta;
  this.v = v;
  this.start = start;
  this.end = end;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32400159
};
cljs.core.Subvec.cljs$lang$type = true;
cljs.core.Subvec.cljs$lang$ctorPrSeq = function(this__960__auto__) {
  return cljs.core.list.call(null, "cljs.core/Subvec")
};
cljs.core.Subvec.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6985 = this;
  var h__843__auto____6986 = this__6985.__hash;
  if(!(h__843__auto____6986 == null)) {
    return h__843__auto____6986
  }else {
    var h__843__auto____6987 = cljs.core.hash_coll.call(null, coll);
    this__6985.__hash = h__843__auto____6987;
    return h__843__auto____6987
  }
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__6988 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__6989 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, key, val) {
  var this__6990 = this;
  var v_pos__6991 = this__6990.start + key;
  return new cljs.core.Subvec(this__6990.meta, cljs.core._assoc.call(null, this__6990.v, v_pos__6991, val), this__6990.start, this__6990.end > v_pos__6991 + 1 ? this__6990.end : v_pos__6991 + 1, null)
};
cljs.core.Subvec.prototype.call = function() {
  var G__7017 = null;
  var G__7017__2 = function(this_sym6992, k) {
    var this__6994 = this;
    var this_sym6992__6995 = this;
    var coll__6996 = this_sym6992__6995;
    return coll__6996.cljs$core$ILookup$_lookup$arity$2(coll__6996, k)
  };
  var G__7017__3 = function(this_sym6993, k, not_found) {
    var this__6994 = this;
    var this_sym6993__6997 = this;
    var coll__6998 = this_sym6993__6997;
    return coll__6998.cljs$core$ILookup$_lookup$arity$3(coll__6998, k, not_found)
  };
  G__7017 = function(this_sym6993, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7017__2.call(this, this_sym6993, k);
      case 3:
        return G__7017__3.call(this, this_sym6993, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7017
}();
cljs.core.Subvec.prototype.apply = function(this_sym6983, args6984) {
  var this__6999 = this;
  return this_sym6983.call.apply(this_sym6983, [this_sym6983].concat(args6984.slice()))
};
cljs.core.Subvec.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7000 = this;
  return new cljs.core.Subvec(this__7000.meta, cljs.core._assoc_n.call(null, this__7000.v, this__7000.end, o), this__7000.start, this__7000.end + 1, null)
};
cljs.core.Subvec.prototype.toString = function() {
  var this__7001 = this;
  var this__7002 = this;
  return cljs.core.pr_str.call(null, this__7002)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__7003 = this;
  return cljs.core.ci_reduce.call(null, coll, f)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__7004 = this;
  return cljs.core.ci_reduce.call(null, coll, f, start)
};
cljs.core.Subvec.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7005 = this;
  var subvec_seq__7006 = function subvec_seq(i) {
    if(i === this__7005.end) {
      return null
    }else {
      return cljs.core.cons.call(null, cljs.core._nth.call(null, this__7005.v, i), new cljs.core.LazySeq(null, false, function() {
        return subvec_seq.call(null, i + 1)
      }, null))
    }
  };
  return subvec_seq__7006.call(null, this__7005.start)
};
cljs.core.Subvec.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__7007 = this;
  return this__7007.end - this__7007.start
};
cljs.core.Subvec.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__7008 = this;
  return cljs.core._nth.call(null, this__7008.v, this__7008.end - 1)
};
cljs.core.Subvec.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__7009 = this;
  if(this__7009.start === this__7009.end) {
    throw new Error("Can't pop empty vector");
  }else {
    return new cljs.core.Subvec(this__7009.meta, this__7009.v, this__7009.start, this__7009.end - 1, null)
  }
};
cljs.core.Subvec.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__7010 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.Subvec.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7011 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Subvec.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__7012 = this;
  return new cljs.core.Subvec(meta, this__7012.v, this__7012.start, this__7012.end, this__7012.__hash)
};
cljs.core.Subvec.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7013 = this;
  return this__7013.meta
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__7014 = this;
  return cljs.core._nth.call(null, this__7014.v, this__7014.start + n)
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__7015 = this;
  return cljs.core._nth.call(null, this__7015.v, this__7015.start + n, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7016 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__7016.meta)
};
cljs.core.Subvec;
cljs.core.subvec = function() {
  var subvec = null;
  var subvec__2 = function(v, start) {
    return subvec.call(null, v, start, cljs.core.count.call(null, v))
  };
  var subvec__3 = function(v, start, end) {
    return new cljs.core.Subvec(null, v, start, end, null)
  };
  subvec = function(v, start, end) {
    switch(arguments.length) {
      case 2:
        return subvec__2.call(this, v, start);
      case 3:
        return subvec__3.call(this, v, start, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  subvec.cljs$lang$arity$2 = subvec__2;
  subvec.cljs$lang$arity$3 = subvec__3;
  return subvec
}();
cljs.core.tv_ensure_editable = function tv_ensure_editable(edit, node) {
  if(edit === node.edit) {
    return node
  }else {
    return new cljs.core.VectorNode(edit, node.arr.slice())
  }
};
cljs.core.tv_editable_root = function tv_editable_root(node) {
  return new cljs.core.VectorNode({}, node.arr.slice())
};
cljs.core.tv_editable_tail = function tv_editable_tail(tl) {
  var ret__7019 = cljs.core.make_array.call(null, 32);
  cljs.core.array_copy.call(null, tl, 0, ret__7019, 0, tl.length);
  return ret__7019
};
cljs.core.tv_push_tail = function tv_push_tail(tv, level, parent, tail_node) {
  var ret__7023 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, parent);
  var subidx__7024 = tv.cnt - 1 >>> level & 31;
  cljs.core.pv_aset.call(null, ret__7023, subidx__7024, level === 5 ? tail_node : function() {
    var child__7025 = cljs.core.pv_aget.call(null, ret__7023, subidx__7024);
    if(!(child__7025 == null)) {
      return tv_push_tail.call(null, tv, level - 5, child__7025, tail_node)
    }else {
      return cljs.core.new_path.call(null, tv.root.edit, level - 5, tail_node)
    }
  }());
  return ret__7023
};
cljs.core.tv_pop_tail = function tv_pop_tail(tv, level, node) {
  var node__7030 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, node);
  var subidx__7031 = tv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__7032 = tv_pop_tail.call(null, tv, level - 5, cljs.core.pv_aget.call(null, node__7030, subidx__7031));
    if(function() {
      var and__3822__auto____7033 = new_child__7032 == null;
      if(and__3822__auto____7033) {
        return subidx__7031 === 0
      }else {
        return and__3822__auto____7033
      }
    }()) {
      return null
    }else {
      cljs.core.pv_aset.call(null, node__7030, subidx__7031, new_child__7032);
      return node__7030
    }
  }else {
    if(subidx__7031 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        cljs.core.pv_aset.call(null, node__7030, subidx__7031, null);
        return node__7030
      }else {
        return null
      }
    }
  }
};
cljs.core.editable_array_for = function editable_array_for(tv, i) {
  if(function() {
    var and__3822__auto____7038 = 0 <= i;
    if(and__3822__auto____7038) {
      return i < tv.cnt
    }else {
      return and__3822__auto____7038
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, tv)) {
      return tv.tail
    }else {
      var root__7039 = tv.root;
      var node__7040 = root__7039;
      var level__7041 = tv.shift;
      while(true) {
        if(level__7041 > 0) {
          var G__7042 = cljs.core.tv_ensure_editable.call(null, root__7039.edit, cljs.core.pv_aget.call(null, node__7040, i >>> level__7041 & 31));
          var G__7043 = level__7041 - 5;
          node__7040 = G__7042;
          level__7041 = G__7043;
          continue
        }else {
          return node__7040.arr
        }
        break
      }
    }
  }else {
    throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in transient vector of length "), cljs.core.str(tv.cnt)].join(""));
  }
};
cljs.core.TransientVector = function(cnt, shift, root, tail) {
  this.cnt = cnt;
  this.shift = shift;
  this.root = root;
  this.tail = tail;
  this.cljs$lang$protocol_mask$partition0$ = 275;
  this.cljs$lang$protocol_mask$partition1$ = 22
};
cljs.core.TransientVector.cljs$lang$type = true;
cljs.core.TransientVector.cljs$lang$ctorPrSeq = function(this__960__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientVector")
};
cljs.core.TransientVector.prototype.call = function() {
  var G__7083 = null;
  var G__7083__2 = function(this_sym7046, k) {
    var this__7048 = this;
    var this_sym7046__7049 = this;
    var coll__7050 = this_sym7046__7049;
    return coll__7050.cljs$core$ILookup$_lookup$arity$2(coll__7050, k)
  };
  var G__7083__3 = function(this_sym7047, k, not_found) {
    var this__7048 = this;
    var this_sym7047__7051 = this;
    var coll__7052 = this_sym7047__7051;
    return coll__7052.cljs$core$ILookup$_lookup$arity$3(coll__7052, k, not_found)
  };
  G__7083 = function(this_sym7047, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7083__2.call(this, this_sym7047, k);
      case 3:
        return G__7083__3.call(this, this_sym7047, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7083
}();
cljs.core.TransientVector.prototype.apply = function(this_sym7044, args7045) {
  var this__7053 = this;
  return this_sym7044.call.apply(this_sym7044, [this_sym7044].concat(args7045.slice()))
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__7054 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__7055 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__7056 = this;
  if(this__7056.root.edit) {
    return cljs.core.array_for.call(null, coll, n)[n & 31]
  }else {
    throw new Error("nth after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__7057 = this;
  if(function() {
    var and__3822__auto____7058 = 0 <= n;
    if(and__3822__auto____7058) {
      return n < this__7057.cnt
    }else {
      return and__3822__auto____7058
    }
  }()) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
  }else {
    return not_found
  }
};
cljs.core.TransientVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__7059 = this;
  if(this__7059.root.edit) {
    return this__7059.cnt
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3 = function(tcoll, n, val) {
  var this__7060 = this;
  if(this__7060.root.edit) {
    if(function() {
      var and__3822__auto____7061 = 0 <= n;
      if(and__3822__auto____7061) {
        return n < this__7060.cnt
      }else {
        return and__3822__auto____7061
      }
    }()) {
      if(cljs.core.tail_off.call(null, tcoll) <= n) {
        this__7060.tail[n & 31] = val;
        return tcoll
      }else {
        var new_root__7066 = function go(level, node) {
          var node__7064 = cljs.core.tv_ensure_editable.call(null, this__7060.root.edit, node);
          if(level === 0) {
            cljs.core.pv_aset.call(null, node__7064, n & 31, val);
            return node__7064
          }else {
            var subidx__7065 = n >>> level & 31;
            cljs.core.pv_aset.call(null, node__7064, subidx__7065, go.call(null, level - 5, cljs.core.pv_aget.call(null, node__7064, subidx__7065)));
            return node__7064
          }
        }.call(null, this__7060.shift, this__7060.root);
        this__7060.root = new_root__7066;
        return tcoll
      }
    }else {
      if(n === this__7060.cnt) {
        return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
      }else {
        if("\ufdd0'else") {
          throw new Error([cljs.core.str("Index "), cljs.core.str(n), cljs.core.str(" out of bounds for TransientVector of length"), cljs.core.str(this__7060.cnt)].join(""));
        }else {
          return null
        }
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_pop_BANG_$arity$1 = function(tcoll) {
  var this__7067 = this;
  if(this__7067.root.edit) {
    if(this__7067.cnt === 0) {
      throw new Error("Can't pop empty vector");
    }else {
      if(1 === this__7067.cnt) {
        this__7067.cnt = 0;
        return tcoll
      }else {
        if((this__7067.cnt - 1 & 31) > 0) {
          this__7067.cnt = this__7067.cnt - 1;
          return tcoll
        }else {
          if("\ufdd0'else") {
            var new_tail__7068 = cljs.core.editable_array_for.call(null, tcoll, this__7067.cnt - 2);
            var new_root__7070 = function() {
              var nr__7069 = cljs.core.tv_pop_tail.call(null, tcoll, this__7067.shift, this__7067.root);
              if(!(nr__7069 == null)) {
                return nr__7069
              }else {
                return new cljs.core.VectorNode(this__7067.root.edit, cljs.core.make_array.call(null, 32))
              }
            }();
            if(function() {
              var and__3822__auto____7071 = 5 < this__7067.shift;
              if(and__3822__auto____7071) {
                return cljs.core.pv_aget.call(null, new_root__7070, 1) == null
              }else {
                return and__3822__auto____7071
              }
            }()) {
              var new_root__7072 = cljs.core.tv_ensure_editable.call(null, this__7067.root.edit, cljs.core.pv_aget.call(null, new_root__7070, 0));
              this__7067.root = new_root__7072;
              this__7067.shift = this__7067.shift - 5;
              this__7067.cnt = this__7067.cnt - 1;
              this__7067.tail = new_tail__7068;
              return tcoll
            }else {
              this__7067.root = new_root__7070;
              this__7067.cnt = this__7067.cnt - 1;
              this__7067.tail = new_tail__7068;
              return tcoll
            }
          }else {
            return null
          }
        }
      }
    }
  }else {
    throw new Error("pop! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__7073 = this;
  return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, key, val)
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__7074 = this;
  if(this__7074.root.edit) {
    if(this__7074.cnt - cljs.core.tail_off.call(null, tcoll) < 32) {
      this__7074.tail[this__7074.cnt & 31] = o;
      this__7074.cnt = this__7074.cnt + 1;
      return tcoll
    }else {
      var tail_node__7075 = new cljs.core.VectorNode(this__7074.root.edit, this__7074.tail);
      var new_tail__7076 = cljs.core.make_array.call(null, 32);
      new_tail__7076[0] = o;
      this__7074.tail = new_tail__7076;
      if(this__7074.cnt >>> 5 > 1 << this__7074.shift) {
        var new_root_array__7077 = cljs.core.make_array.call(null, 32);
        var new_shift__7078 = this__7074.shift + 5;
        new_root_array__7077[0] = this__7074.root;
        new_root_array__7077[1] = cljs.core.new_path.call(null, this__7074.root.edit, this__7074.shift, tail_node__7075);
        this__7074.root = new cljs.core.VectorNode(this__7074.root.edit, new_root_array__7077);
        this__7074.shift = new_shift__7078;
        this__7074.cnt = this__7074.cnt + 1;
        return tcoll
      }else {
        var new_root__7079 = cljs.core.tv_push_tail.call(null, tcoll, this__7074.shift, this__7074.root, tail_node__7075);
        this__7074.root = new_root__7079;
        this__7074.cnt = this__7074.cnt + 1;
        return tcoll
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__7080 = this;
  if(this__7080.root.edit) {
    this__7080.root.edit = null;
    var len__7081 = this__7080.cnt - cljs.core.tail_off.call(null, tcoll);
    var trimmed_tail__7082 = cljs.core.make_array.call(null, len__7081);
    cljs.core.array_copy.call(null, this__7080.tail, 0, trimmed_tail__7082, 0, len__7081);
    return new cljs.core.PersistentVector(null, this__7080.cnt, this__7080.shift, this__7080.root, trimmed_tail__7082, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientVector;
cljs.core.PersistentQueueSeq = function(meta, front, rear, __hash) {
  this.meta = meta;
  this.front = front;
  this.rear = rear;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850572
};
cljs.core.PersistentQueueSeq.cljs$lang$type = true;
cljs.core.PersistentQueueSeq.cljs$lang$ctorPrSeq = function(this__960__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentQueueSeq")
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__7084 = this;
  var h__843__auto____7085 = this__7084.__hash;
  if(!(h__843__auto____7085 == null)) {
    return h__843__auto____7085
  }else {
    var h__843__auto____7086 = cljs.core.hash_coll.call(null, coll);
    this__7084.__hash = h__843__auto____7086;
    return h__843__auto____7086
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7087 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentQueueSeq.prototype.toString = function() {
  var this__7088 = this;
  var this__7089 = this;
  return cljs.core.pr_str.call(null, this__7089)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7090 = this;
  return coll
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7091 = this;
  return cljs.core._first.call(null, this__7091.front)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7092 = this;
  var temp__3971__auto____7093 = cljs.core.next.call(null, this__7092.front);
  if(temp__3971__auto____7093) {
    var f1__7094 = temp__3971__auto____7093;
    return new cljs.core.PersistentQueueSeq(this__7092.meta, f1__7094, this__7092.rear, null)
  }else {
    if(this__7092.rear == null) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
    }else {
      return new cljs.core.PersistentQueueSeq(this__7092.meta, this__7092.rear, null, null)
    }
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7095 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__7096 = this;
  return new cljs.core.PersistentQueueSeq(meta, this__7096.front, this__7096.rear, this__7096.__hash)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7097 = this;
  return this__7097.meta
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7098 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__7098.meta)
};
cljs.core.PersistentQueueSeq;
cljs.core.PersistentQueue = function(meta, count, front, rear, __hash) {
  this.meta = meta;
  this.count = count;
  this.front = front;
  this.rear = rear;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31858766
};
cljs.core.PersistentQueue.cljs$lang$type = true;
cljs.core.PersistentQueue.cljs$lang$ctorPrSeq = function(this__960__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentQueue")
};
cljs.core.PersistentQueue.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__7099 = this;
  var h__843__auto____7100 = this__7099.__hash;
  if(!(h__843__auto____7100 == null)) {
    return h__843__auto____7100
  }else {
    var h__843__auto____7101 = cljs.core.hash_coll.call(null, coll);
    this__7099.__hash = h__843__auto____7101;
    return h__843__auto____7101
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7102 = this;
  if(cljs.core.truth_(this__7102.front)) {
    return new cljs.core.PersistentQueue(this__7102.meta, this__7102.count + 1, this__7102.front, cljs.core.conj.call(null, function() {
      var or__3824__auto____7103 = this__7102.rear;
      if(cljs.core.truth_(or__3824__auto____7103)) {
        return or__3824__auto____7103
      }else {
        return cljs.core.PersistentVector.EMPTY
      }
    }(), o), null)
  }else {
    return new cljs.core.PersistentQueue(this__7102.meta, this__7102.count + 1, cljs.core.conj.call(null, this__7102.front, o), cljs.core.PersistentVector.EMPTY, null)
  }
};
cljs.core.PersistentQueue.prototype.toString = function() {
  var this__7104 = this;
  var this__7105 = this;
  return cljs.core.pr_str.call(null, this__7105)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7106 = this;
  var rear__7107 = cljs.core.seq.call(null, this__7106.rear);
  if(cljs.core.truth_(function() {
    var or__3824__auto____7108 = this__7106.front;
    if(cljs.core.truth_(or__3824__auto____7108)) {
      return or__3824__auto____7108
    }else {
      return rear__7107
    }
  }())) {
    return new cljs.core.PersistentQueueSeq(null, this__7106.front, cljs.core.seq.call(null, rear__7107), null)
  }else {
    return null
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__7109 = this;
  return this__7109.count
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__7110 = this;
  return cljs.core._first.call(null, this__7110.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__7111 = this;
  if(cljs.core.truth_(this__7111.front)) {
    var temp__3971__auto____7112 = cljs.core.next.call(null, this__7111.front);
    if(temp__3971__auto____7112) {
      var f1__7113 = temp__3971__auto____7112;
      return new cljs.core.PersistentQueue(this__7111.meta, this__7111.count - 1, f1__7113, this__7111.rear, null)
    }else {
      return new cljs.core.PersistentQueue(this__7111.meta, this__7111.count - 1, cljs.core.seq.call(null, this__7111.rear), cljs.core.PersistentVector.EMPTY, null)
    }
  }else {
    return coll
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7114 = this;
  return cljs.core.first.call(null, this__7114.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7115 = this;
  return cljs.core.rest.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7116 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__7117 = this;
  return new cljs.core.PersistentQueue(meta, this__7117.count, this__7117.front, this__7117.rear, this__7117.__hash)
};
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7118 = this;
  return this__7118.meta
};
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7119 = this;
  return cljs.core.PersistentQueue.EMPTY
};
cljs.core.PersistentQueue;
cljs.core.PersistentQueue.EMPTY = new cljs.core.PersistentQueue(null, 0, null, cljs.core.PersistentVector.EMPTY, 0);
cljs.core.NeverEquiv = function() {
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2097152
};
cljs.core.NeverEquiv.cljs$lang$type = true;
cljs.core.NeverEquiv.cljs$lang$ctorPrSeq = function(this__960__auto__) {
  return cljs.core.list.call(null, "cljs.core/NeverEquiv")
};
cljs.core.NeverEquiv.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var this__7120 = this;
  return false
};
cljs.core.NeverEquiv;
cljs.core.never_equiv = new cljs.core.NeverEquiv;
cljs.core.equiv_map = function equiv_map(x, y) {
  return cljs.core.boolean$.call(null, cljs.core.map_QMARK_.call(null, y) ? cljs.core.count.call(null, x) === cljs.core.count.call(null, y) ? cljs.core.every_QMARK_.call(null, cljs.core.identity, cljs.core.map.call(null, function(xkv) {
    return cljs.core._EQ_.call(null, cljs.core._lookup.call(null, y, cljs.core.first.call(null, xkv), cljs.core.never_equiv), cljs.core.second.call(null, xkv))
  }, x)) : null : null)
};
cljs.core.scan_array = function scan_array(incr, k, array) {
  var len__7123 = array.length;
  var i__7124 = 0;
  while(true) {
    if(i__7124 < len__7123) {
      if(k === array[i__7124]) {
        return i__7124
      }else {
        var G__7125 = i__7124 + incr;
        i__7124 = G__7125;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.obj_map_compare_keys = function obj_map_compare_keys(a, b) {
  var a__7128 = cljs.core.hash.call(null, a);
  var b__7129 = cljs.core.hash.call(null, b);
  if(a__7128 < b__7129) {
    return-1
  }else {
    if(a__7128 > b__7129) {
      return 1
    }else {
      if("\ufdd0'else") {
        return 0
      }else {
        return null
      }
    }
  }
};
cljs.core.obj_map__GT_hash_map = function obj_map__GT_hash_map(m, k, v) {
  var ks__7137 = m.keys;
  var len__7138 = ks__7137.length;
  var so__7139 = m.strobj;
  var out__7140 = cljs.core.with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, cljs.core.meta.call(null, m));
  var i__7141 = 0;
  var out__7142 = cljs.core.transient$.call(null, out__7140);
  while(true) {
    if(i__7141 < len__7138) {
      var k__7143 = ks__7137[i__7141];
      var G__7144 = i__7141 + 1;
      var G__7145 = cljs.core.assoc_BANG_.call(null, out__7142, k__7143, so__7139[k__7143]);
      i__7141 = G__7144;
      out__7142 = G__7145;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, out__7142, k, v))
    }
    break
  }
};
cljs.core.obj_clone = function obj_clone(obj, ks) {
  var new_obj__7151 = {};
  var l__7152 = ks.length;
  var i__7153 = 0;
  while(true) {
    if(i__7153 < l__7152) {
      var k__7154 = ks[i__7153];
      new_obj__7151[k__7154] = obj[k__7154];
      var G__7155 = i__7153 + 1;
      i__7153 = G__7155;
      continue
    }else {
    }
    break
  }
  return new_obj__7151
};
cljs.core.ObjMap = function(meta, keys, strobj, update_count, __hash) {
  this.meta = meta;
  this.keys = keys;
  this.strobj = strobj;
  this.update_count = update_count;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 15075087
};
cljs.core.ObjMap.cljs$lang$type = true;
cljs.core.ObjMap.cljs$lang$ctorPrSeq = function(this__960__auto__) {
  return cljs.core.list.call(null, "cljs.core/ObjMap")
};
cljs.core.ObjMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__7158 = this;
  return cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.hash_map.call(null), coll))
};
cljs.core.ObjMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__7159 = this;
  var h__843__auto____7160 = this__7159.__hash;
  if(!(h__843__auto____7160 == null)) {
    return h__843__auto____7160
  }else {
    var h__843__auto____7161 = cljs.core.hash_imap.call(null, coll);
    this__7159.__hash = h__843__auto____7161;
    return h__843__auto____7161
  }
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__7162 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__7163 = this;
  if(function() {
    var and__3822__auto____7164 = goog.isString(k);
    if(and__3822__auto____7164) {
      return!(cljs.core.scan_array.call(null, 1, k, this__7163.keys) == null)
    }else {
      return and__3822__auto____7164
    }
  }()) {
    return this__7163.strobj[k]
  }else {
    return not_found
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__7165 = this;
  if(goog.isString(k)) {
    if(function() {
      var or__3824__auto____7166 = this__7165.update_count > cljs.core.ObjMap.HASHMAP_THRESHOLD;
      if(or__3824__auto____7166) {
        return or__3824__auto____7166
      }else {
        return this__7165.keys.length >= cljs.core.ObjMap.HASHMAP_THRESHOLD
      }
    }()) {
      return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
    }else {
      if(!(cljs.core.scan_array.call(null, 1, k, this__7165.keys) == null)) {
        var new_strobj__7167 = cljs.core.obj_clone.call(null, this__7165.strobj, this__7165.keys);
        new_strobj__7167[k] = v;
        return new cljs.core.ObjMap(this__7165.meta, this__7165.keys, new_strobj__7167, this__7165.update_count + 1, null)
      }else {
        var new_strobj__7168 = cljs.core.obj_clone.call(null, this__7165.strobj, this__7165.keys);
        var new_keys__7169 = this__7165.keys.slice();
        new_strobj__7168[k] = v;
        new_keys__7169.push(k);
        return new cljs.core.ObjMap(this__7165.meta, new_keys__7169, new_strobj__7168, this__7165.update_count + 1, null)
      }
    }
  }else {
    return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__7170 = this;
  if(function() {
    var and__3822__auto____7171 = goog.isString(k);
    if(and__3822__auto____7171) {
      return!(cljs.core.scan_array.call(null, 1, k, this__7170.keys) == null)
    }else {
      return and__3822__auto____7171
    }
  }()) {
    return true
  }else {
    return false
  }
};
cljs.core.ObjMap.prototype.call = function() {
  var G__7193 = null;
  var G__7193__2 = function(this_sym7172, k) {
    var this__7174 = this;
    var this_sym7172__7175 = this;
    var coll__7176 = this_sym7172__7175;
    return coll__7176.cljs$core$ILookup$_lookup$arity$2(coll__7176, k)
  };
  var G__7193__3 = function(this_sym7173, k, not_found) {
    var this__7174 = this;
    var this_sym7173__7177 = this;
    var coll__7178 = this_sym7173__7177;
    return coll__7178.cljs$core$ILookup$_lookup$arity$3(coll__7178, k, not_found)
  };
  G__7193 = function(this_sym7173, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7193__2.call(this, this_sym7173, k);
      case 3:
        return G__7193__3.call(this, this_sym7173, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7193
}();
cljs.core.ObjMap.prototype.apply = function(this_sym7156, args7157) {
  var this__7179 = this;
  return this_sym7156.call.apply(this_sym7156, [this_sym7156].concat(args7157.slice()))
};
cljs.core.ObjMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__7180 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.ObjMap.prototype.toString = function() {
  var this__7181 = this;
  var this__7182 = this;
  return cljs.core.pr_str.call(null, this__7182)
};
cljs.core.ObjMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7183 = this;
  if(this__7183.keys.length > 0) {
    return cljs.core.map.call(null, function(p1__7146_SHARP_) {
      return cljs.core.vector.call(null, p1__7146_SHARP_, this__7183.strobj[p1__7146_SHARP_])
    }, this__7183.keys.sort(cljs.core.obj_map_compare_keys))
  }else {
    return null
  }
};
cljs.core.ObjMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__7184 = this;
  return this__7184.keys.length
};
cljs.core.ObjMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7185 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__7186 = this;
  return new cljs.core.ObjMap(meta, this__7186.keys, this__7186.strobj, this__7186.update_count, this__7186.__hash)
};
cljs.core.ObjMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7187 = this;
  return this__7187.meta
};
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7188 = this;
  return cljs.core.with_meta.call(null, cljs.core.ObjMap.EMPTY, this__7188.meta)
};
cljs.core.ObjMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__7189 = this;
  if(function() {
    var and__3822__auto____7190 = goog.isString(k);
    if(and__3822__auto____7190) {
      return!(cljs.core.scan_array.call(null, 1, k, this__7189.keys) == null)
    }else {
      return and__3822__auto____7190
    }
  }()) {
    var new_keys__7191 = this__7189.keys.slice();
    var new_strobj__7192 = cljs.core.obj_clone.call(null, this__7189.strobj, this__7189.keys);
    new_keys__7191.splice(cljs.core.scan_array.call(null, 1, k, new_keys__7191), 1);
    cljs.core.js_delete.call(null, new_strobj__7192, k);
    return new cljs.core.ObjMap(this__7189.meta, new_keys__7191, new_strobj__7192, this__7189.update_count + 1, null)
  }else {
    return coll
  }
};
cljs.core.ObjMap;
cljs.core.ObjMap.EMPTY = new cljs.core.ObjMap(null, [], {}, 0, 0);
cljs.core.ObjMap.HASHMAP_THRESHOLD = 32;
cljs.core.ObjMap.fromObject = function(ks, obj) {
  return new cljs.core.ObjMap(null, ks, obj, 0, null)
};
cljs.core.HashMap = function(meta, count, hashobj, __hash) {
  this.meta = meta;
  this.count = count;
  this.hashobj = hashobj;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 15075087
};
cljs.core.HashMap.cljs$lang$type = true;
cljs.core.HashMap.cljs$lang$ctorPrSeq = function(this__960__auto__) {
  return cljs.core.list.call(null, "cljs.core/HashMap")
};
cljs.core.HashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__7197 = this;
  var h__843__auto____7198 = this__7197.__hash;
  if(!(h__843__auto____7198 == null)) {
    return h__843__auto____7198
  }else {
    var h__843__auto____7199 = cljs.core.hash_imap.call(null, coll);
    this__7197.__hash = h__843__auto____7199;
    return h__843__auto____7199
  }
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__7200 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__7201 = this;
  var bucket__7202 = this__7201.hashobj[cljs.core.hash.call(null, k)];
  var i__7203 = cljs.core.truth_(bucket__7202) ? cljs.core.scan_array.call(null, 2, k, bucket__7202) : null;
  if(cljs.core.truth_(i__7203)) {
    return bucket__7202[i__7203 + 1]
  }else {
    return not_found
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__7204 = this;
  var h__7205 = cljs.core.hash.call(null, k);
  var bucket__7206 = this__7204.hashobj[h__7205];
  if(cljs.core.truth_(bucket__7206)) {
    var new_bucket__7207 = bucket__7206.slice();
    var new_hashobj__7208 = goog.object.clone(this__7204.hashobj);
    new_hashobj__7208[h__7205] = new_bucket__7207;
    var temp__3971__auto____7209 = cljs.core.scan_array.call(null, 2, k, new_bucket__7207);
    if(cljs.core.truth_(temp__3971__auto____7209)) {
      var i__7210 = temp__3971__auto____7209;
      new_bucket__7207[i__7210 + 1] = v;
      return new cljs.core.HashMap(this__7204.meta, this__7204.count, new_hashobj__7208, null)
    }else {
      new_bucket__7207.push(k, v);
      return new cljs.core.HashMap(this__7204.meta, this__7204.count + 1, new_hashobj__7208, null)
    }
  }else {
    var new_hashobj__7211 = goog.object.clone(this__7204.hashobj);
    new_hashobj__7211[h__7205] = [k, v];
    return new cljs.core.HashMap(this__7204.meta, this__7204.count + 1, new_hashobj__7211, null)
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__7212 = this;
  var bucket__7213 = this__7212.hashobj[cljs.core.hash.call(null, k)];
  var i__7214 = cljs.core.truth_(bucket__7213) ? cljs.core.scan_array.call(null, 2, k, bucket__7213) : null;
  if(cljs.core.truth_(i__7214)) {
    return true
  }else {
    return false
  }
};
cljs.core.HashMap.prototype.call = function() {
  var G__7239 = null;
  var G__7239__2 = function(this_sym7215, k) {
    var this__7217 = this;
    var this_sym7215__7218 = this;
    var coll__7219 = this_sym7215__7218;
    return coll__7219.cljs$core$ILookup$_lookup$arity$2(coll__7219, k)
  };
  var G__7239__3 = function(this_sym7216, k, not_found) {
    var this__7217 = this;
    var this_sym7216__7220 = this;
    var coll__7221 = this_sym7216__7220;
    return coll__7221.cljs$core$ILookup$_lookup$arity$3(coll__7221, k, not_found)
  };
  G__7239 = function(this_sym7216, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7239__2.call(this, this_sym7216, k);
      case 3:
        return G__7239__3.call(this, this_sym7216, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7239
}();
cljs.core.HashMap.prototype.apply = function(this_sym7195, args7196) {
  var this__7222 = this;
  return this_sym7195.call.apply(this_sym7195, [this_sym7195].concat(args7196.slice()))
};
cljs.core.HashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__7223 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.HashMap.prototype.toString = function() {
  var this__7224 = this;
  var this__7225 = this;
  return cljs.core.pr_str.call(null, this__7225)
};
cljs.core.HashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7226 = this;
  if(this__7226.count > 0) {
    var hashes__7227 = cljs.core.js_keys.call(null, this__7226.hashobj).sort();
    return cljs.core.mapcat.call(null, function(p1__7194_SHARP_) {
      return cljs.core.map.call(null, cljs.core.vec, cljs.core.partition.call(null, 2, this__7226.hashobj[p1__7194_SHARP_]))
    }, hashes__7227)
  }else {
    return null
  }
};
cljs.core.HashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__7228 = this;
  return this__7228.count
};
cljs.core.HashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7229 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.HashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__7230 = this;
  return new cljs.core.HashMap(meta, this__7230.count, this__7230.hashobj, this__7230.__hash)
};
cljs.core.HashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7231 = this;
  return this__7231.meta
};
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7232 = this;
  return cljs.core.with_meta.call(null, cljs.core.HashMap.EMPTY, this__7232.meta)
};
cljs.core.HashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__7233 = this;
  var h__7234 = cljs.core.hash.call(null, k);
  var bucket__7235 = this__7233.hashobj[h__7234];
  var i__7236 = cljs.core.truth_(bucket__7235) ? cljs.core.scan_array.call(null, 2, k, bucket__7235) : null;
  if(cljs.core.not.call(null, i__7236)) {
    return coll
  }else {
    var new_hashobj__7237 = goog.object.clone(this__7233.hashobj);
    if(3 > bucket__7235.length) {
      cljs.core.js_delete.call(null, new_hashobj__7237, h__7234)
    }else {
      var new_bucket__7238 = bucket__7235.slice();
      new_bucket__7238.splice(i__7236, 2);
      new_hashobj__7237[h__7234] = new_bucket__7238
    }
    return new cljs.core.HashMap(this__7233.meta, this__7233.count - 1, new_hashobj__7237, null)
  }
};
cljs.core.HashMap;
cljs.core.HashMap.EMPTY = new cljs.core.HashMap(null, 0, {}, 0);
cljs.core.HashMap.fromArrays = function(ks, vs) {
  var len__7240 = ks.length;
  var i__7241 = 0;
  var out__7242 = cljs.core.HashMap.EMPTY;
  while(true) {
    if(i__7241 < len__7240) {
      var G__7243 = i__7241 + 1;
      var G__7244 = cljs.core.assoc.call(null, out__7242, ks[i__7241], vs[i__7241]);
      i__7241 = G__7243;
      out__7242 = G__7244;
      continue
    }else {
      return out__7242
    }
    break
  }
};
cljs.core.array_map_index_of = function array_map_index_of(m, k) {
  var arr__7248 = m.arr;
  var len__7249 = arr__7248.length;
  var i__7250 = 0;
  while(true) {
    if(len__7249 <= i__7250) {
      return-1
    }else {
      if(cljs.core._EQ_.call(null, arr__7248[i__7250], k)) {
        return i__7250
      }else {
        if("\ufdd0'else") {
          var G__7251 = i__7250 + 2;
          i__7250 = G__7251;
          continue
        }else {
          return null
        }
      }
    }
    break
  }
};
cljs.core.PersistentArrayMap = function(meta, cnt, arr, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.arr = arr;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 16123663
};
cljs.core.PersistentArrayMap.cljs$lang$type = true;
cljs.core.PersistentArrayMap.cljs$lang$ctorPrSeq = function(this__960__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentArrayMap")
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__7254 = this;
  return new cljs.core.TransientArrayMap({}, this__7254.arr.length, this__7254.arr.slice())
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__7255 = this;
  var h__843__auto____7256 = this__7255.__hash;
  if(!(h__843__auto____7256 == null)) {
    return h__843__auto____7256
  }else {
    var h__843__auto____7257 = cljs.core.hash_imap.call(null, coll);
    this__7255.__hash = h__843__auto____7257;
    return h__843__auto____7257
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__7258 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__7259 = this;
  var idx__7260 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__7260 === -1) {
    return not_found
  }else {
    return this__7259.arr[idx__7260 + 1]
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__7261 = this;
  var idx__7262 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__7262 === -1) {
    if(this__7261.cnt < cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
      return new cljs.core.PersistentArrayMap(this__7261.meta, this__7261.cnt + 1, function() {
        var G__7263__7264 = this__7261.arr.slice();
        G__7263__7264.push(k);
        G__7263__7264.push(v);
        return G__7263__7264
      }(), null)
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.PersistentHashMap.EMPTY, coll)), k, v))
    }
  }else {
    if(v === this__7261.arr[idx__7262 + 1]) {
      return coll
    }else {
      if("\ufdd0'else") {
        return new cljs.core.PersistentArrayMap(this__7261.meta, this__7261.cnt, function() {
          var G__7265__7266 = this__7261.arr.slice();
          G__7265__7266[idx__7262 + 1] = v;
          return G__7265__7266
        }(), null)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__7267 = this;
  return!(cljs.core.array_map_index_of.call(null, coll, k) === -1)
};
cljs.core.PersistentArrayMap.prototype.call = function() {
  var G__7299 = null;
  var G__7299__2 = function(this_sym7268, k) {
    var this__7270 = this;
    var this_sym7268__7271 = this;
    var coll__7272 = this_sym7268__7271;
    return coll__7272.cljs$core$ILookup$_lookup$arity$2(coll__7272, k)
  };
  var G__7299__3 = function(this_sym7269, k, not_found) {
    var this__7270 = this;
    var this_sym7269__7273 = this;
    var coll__7274 = this_sym7269__7273;
    return coll__7274.cljs$core$ILookup$_lookup$arity$3(coll__7274, k, not_found)
  };
  G__7299 = function(this_sym7269, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7299__2.call(this, this_sym7269, k);
      case 3:
        return G__7299__3.call(this, this_sym7269, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7299
}();
cljs.core.PersistentArrayMap.prototype.apply = function(this_sym7252, args7253) {
  var this__7275 = this;
  return this_sym7252.call.apply(this_sym7252, [this_sym7252].concat(args7253.slice()))
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__7276 = this;
  var len__7277 = this__7276.arr.length;
  var i__7278 = 0;
  var init__7279 = init;
  while(true) {
    if(i__7278 < len__7277) {
      var init__7280 = f.call(null, init__7279, this__7276.arr[i__7278], this__7276.arr[i__7278 + 1]);
      if(cljs.core.reduced_QMARK_.call(null, init__7280)) {
        return cljs.core.deref.call(null, init__7280)
      }else {
        var G__7300 = i__7278 + 2;
        var G__7301 = init__7280;
        i__7278 = G__7300;
        init__7279 = G__7301;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__7281 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentArrayMap.prototype.toString = function() {
  var this__7282 = this;
  var this__7283 = this;
  return cljs.core.pr_str.call(null, this__7283)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7284 = this;
  if(this__7284.cnt > 0) {
    var len__7285 = this__7284.arr.length;
    var array_map_seq__7286 = function array_map_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < len__7285) {
          return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([this__7284.arr[i], this__7284.arr[i + 1]], true), array_map_seq.call(null, i + 2))
        }else {
          return null
        }
      }, null)
    };
    return array_map_seq__7286.call(null, 0)
  }else {
    return null
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__7287 = this;
  return this__7287.cnt
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7288 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__7289 = this;
  return new cljs.core.PersistentArrayMap(meta, this__7289.cnt, this__7289.arr, this__7289.__hash)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7290 = this;
  return this__7290.meta
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7291 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentArrayMap.EMPTY, this__7291.meta)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__7292 = this;
  var idx__7293 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__7293 >= 0) {
    var len__7294 = this__7292.arr.length;
    var new_len__7295 = len__7294 - 2;
    if(new_len__7295 === 0) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
    }else {
      var new_arr__7296 = cljs.core.make_array.call(null, new_len__7295);
      var s__7297 = 0;
      var d__7298 = 0;
      while(true) {
        if(s__7297 >= len__7294) {
          return new cljs.core.PersistentArrayMap(this__7292.meta, this__7292.cnt - 1, new_arr__7296, null)
        }else {
          if(cljs.core._EQ_.call(null, k, this__7292.arr[s__7297])) {
            var G__7302 = s__7297 + 2;
            var G__7303 = d__7298;
            s__7297 = G__7302;
            d__7298 = G__7303;
            continue
          }else {
            if("\ufdd0'else") {
              new_arr__7296[d__7298] = this__7292.arr[s__7297];
              new_arr__7296[d__7298 + 1] = this__7292.arr[s__7297 + 1];
              var G__7304 = s__7297 + 2;
              var G__7305 = d__7298 + 2;
              s__7297 = G__7304;
              d__7298 = G__7305;
              continue
            }else {
              return null
            }
          }
        }
        break
      }
    }
  }else {
    return coll
  }
};
cljs.core.PersistentArrayMap;
cljs.core.PersistentArrayMap.EMPTY = new cljs.core.PersistentArrayMap(null, 0, [], null);
cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD = 16;
cljs.core.PersistentArrayMap.fromArrays = function(ks, vs) {
  var len__7306 = cljs.core.count.call(null, ks);
  var i__7307 = 0;
  var out__7308 = cljs.core.transient$.call(null, cljs.core.PersistentArrayMap.EMPTY);
  while(true) {
    if(i__7307 < len__7306) {
      var G__7309 = i__7307 + 1;
      var G__7310 = cljs.core.assoc_BANG_.call(null, out__7308, ks[i__7307], vs[i__7307]);
      i__7307 = G__7309;
      out__7308 = G__7310;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__7308)
    }
    break
  }
};
cljs.core.TransientArrayMap = function(editable_QMARK_, len, arr) {
  this.editable_QMARK_ = editable_QMARK_;
  this.len = len;
  this.arr = arr;
  this.cljs$lang$protocol_mask$partition1$ = 14;
  this.cljs$lang$protocol_mask$partition0$ = 258
};
cljs.core.TransientArrayMap.cljs$lang$type = true;
cljs.core.TransientArrayMap.cljs$lang$ctorPrSeq = function(this__960__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientArrayMap")
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientMap$_dissoc_BANG_$arity$2 = function(tcoll, key) {
  var this__7311 = this;
  if(cljs.core.truth_(this__7311.editable_QMARK_)) {
    var idx__7312 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__7312 >= 0) {
      this__7311.arr[idx__7312] = this__7311.arr[this__7311.len - 2];
      this__7311.arr[idx__7312 + 1] = this__7311.arr[this__7311.len - 1];
      var G__7313__7314 = this__7311.arr;
      G__7313__7314.pop();
      G__7313__7314.pop();
      G__7313__7314;
      this__7311.len = this__7311.len - 2
    }else {
    }
    return tcoll
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__7315 = this;
  if(cljs.core.truth_(this__7315.editable_QMARK_)) {
    var idx__7316 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__7316 === -1) {
      if(this__7315.len + 2 <= 2 * cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
        this__7315.len = this__7315.len + 2;
        this__7315.arr.push(key);
        this__7315.arr.push(val);
        return tcoll
      }else {
        return cljs.core.assoc_BANG_.call(null, cljs.core.array__GT_transient_hash_map.call(null, this__7315.len, this__7315.arr), key, val)
      }
    }else {
      if(val === this__7315.arr[idx__7316 + 1]) {
        return tcoll
      }else {
        this__7315.arr[idx__7316 + 1] = val;
        return tcoll
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__7317 = this;
  if(cljs.core.truth_(this__7317.editable_QMARK_)) {
    if(function() {
      var G__7318__7319 = o;
      if(G__7318__7319) {
        if(function() {
          var or__3824__auto____7320 = G__7318__7319.cljs$lang$protocol_mask$partition0$ & 2048;
          if(or__3824__auto____7320) {
            return or__3824__auto____7320
          }else {
            return G__7318__7319.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__7318__7319.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__7318__7319)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__7318__7319)
      }
    }()) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__7321 = cljs.core.seq.call(null, o);
      var tcoll__7322 = tcoll;
      while(true) {
        var temp__3971__auto____7323 = cljs.core.first.call(null, es__7321);
        if(cljs.core.truth_(temp__3971__auto____7323)) {
          var e__7324 = temp__3971__auto____7323;
          var G__7330 = cljs.core.next.call(null, es__7321);
          var G__7331 = tcoll__7322.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll__7322, cljs.core.key.call(null, e__7324), cljs.core.val.call(null, e__7324));
          es__7321 = G__7330;
          tcoll__7322 = G__7331;
          continue
        }else {
          return tcoll__7322
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__7325 = this;
  if(cljs.core.truth_(this__7325.editable_QMARK_)) {
    this__7325.editable_QMARK_ = false;
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot.call(null, this__7325.len, 2), this__7325.arr, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__7326 = this;
  return tcoll.cljs$core$ILookup$_lookup$arity$3(tcoll, k, null)
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__7327 = this;
  if(cljs.core.truth_(this__7327.editable_QMARK_)) {
    var idx__7328 = cljs.core.array_map_index_of.call(null, tcoll, k);
    if(idx__7328 === -1) {
      return not_found
    }else {
      return this__7327.arr[idx__7328 + 1]
    }
  }else {
    throw new Error("lookup after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__7329 = this;
  if(cljs.core.truth_(this__7329.editable_QMARK_)) {
    return cljs.core.quot.call(null, this__7329.len, 2)
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientArrayMap;
cljs.core.array__GT_transient_hash_map = function array__GT_transient_hash_map(len, arr) {
  var out__7334 = cljs.core.transient$.call(null, cljs.core.ObjMap.EMPTY);
  var i__7335 = 0;
  while(true) {
    if(i__7335 < len) {
      var G__7336 = cljs.core.assoc_BANG_.call(null, out__7334, arr[i__7335], arr[i__7335 + 1]);
      var G__7337 = i__7335 + 2;
      out__7334 = G__7336;
      i__7335 = G__7337;
      continue
    }else {
      return out__7334
    }
    break
  }
};
cljs.core.Box = function(val) {
  this.val = val
};
cljs.core.Box.cljs$lang$type = true;
cljs.core.Box.cljs$lang$ctorPrSeq = function(this__961__auto__) {
  return cljs.core.list.call(null, "cljs.core/Box")
};
cljs.core.Box;
cljs.core.key_test = function key_test(key, other) {
  if(goog.isString(key)) {
    return key === other
  }else {
    return cljs.core._EQ_.call(null, key, other)
  }
};
cljs.core.mask = function mask(hash, shift) {
  return hash >>> shift & 31
};
cljs.core.clone_and_set = function() {
  var clone_and_set = null;
  var clone_and_set__3 = function(arr, i, a) {
    var G__7342__7343 = arr.slice();
    G__7342__7343[i] = a;
    return G__7342__7343
  };
  var clone_and_set__5 = function(arr, i, a, j, b) {
    var G__7344__7345 = arr.slice();
    G__7344__7345[i] = a;
    G__7344__7345[j] = b;
    return G__7344__7345
  };
  clone_and_set = function(arr, i, a, j, b) {
    switch(arguments.length) {
      case 3:
        return clone_and_set__3.call(this, arr, i, a);
      case 5:
        return clone_and_set__5.call(this, arr, i, a, j, b)
    }
    throw"Invalid arity: " + arguments.length;
  };
  clone_and_set.cljs$lang$arity$3 = clone_and_set__3;
  clone_and_set.cljs$lang$arity$5 = clone_and_set__5;
  return clone_and_set
}();
cljs.core.remove_pair = function remove_pair(arr, i) {
  var new_arr__7347 = cljs.core.make_array.call(null, arr.length - 2);
  cljs.core.array_copy.call(null, arr, 0, new_arr__7347, 0, 2 * i);
  cljs.core.array_copy.call(null, arr, 2 * (i + 1), new_arr__7347, 2 * i, new_arr__7347.length - 2 * i);
  return new_arr__7347
};
cljs.core.bitmap_indexed_node_index = function bitmap_indexed_node_index(bitmap, bit) {
  return cljs.core.bit_count.call(null, bitmap & bit - 1)
};
cljs.core.bitpos = function bitpos(hash, shift) {
  return 1 << (hash >>> shift & 31)
};
cljs.core.edit_and_set = function() {
  var edit_and_set = null;
  var edit_and_set__4 = function(inode, edit, i, a) {
    var editable__7350 = inode.ensure_editable(edit);
    editable__7350.arr[i] = a;
    return editable__7350
  };
  var edit_and_set__6 = function(inode, edit, i, a, j, b) {
    var editable__7351 = inode.ensure_editable(edit);
    editable__7351.arr[i] = a;
    editable__7351.arr[j] = b;
    return editable__7351
  };
  edit_and_set = function(inode, edit, i, a, j, b) {
    switch(arguments.length) {
      case 4:
        return edit_and_set__4.call(this, inode, edit, i, a);
      case 6:
        return edit_and_set__6.call(this, inode, edit, i, a, j, b)
    }
    throw"Invalid arity: " + arguments.length;
  };
  edit_and_set.cljs$lang$arity$4 = edit_and_set__4;
  edit_and_set.cljs$lang$arity$6 = edit_and_set__6;
  return edit_and_set
}();
cljs.core.inode_kv_reduce = function inode_kv_reduce(arr, f, init) {
  var len__7358 = arr.length;
  var i__7359 = 0;
  var init__7360 = init;
  while(true) {
    if(i__7359 < len__7358) {
      var init__7363 = function() {
        var k__7361 = arr[i__7359];
        if(!(k__7361 == null)) {
          return f.call(null, init__7360, k__7361, arr[i__7359 + 1])
        }else {
          var node__7362 = arr[i__7359 + 1];
          if(!(node__7362 == null)) {
            return node__7362.kv_reduce(f, init__7360)
          }else {
            return init__7360
          }
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__7363)) {
        return cljs.core.deref.call(null, init__7363)
      }else {
        var G__7364 = i__7359 + 2;
        var G__7365 = init__7363;
        i__7359 = G__7364;
        init__7360 = G__7365;
        continue
      }
    }else {
      return init__7360
    }
    break
  }
};
cljs.core.BitmapIndexedNode = function(edit, bitmap, arr) {
  this.edit = edit;
  this.bitmap = bitmap;
  this.arr = arr
};
cljs.core.BitmapIndexedNode.cljs$lang$type = true;
cljs.core.BitmapIndexedNode.cljs$lang$ctorPrSeq = function(this__960__auto__) {
  return cljs.core.list.call(null, "cljs.core/BitmapIndexedNode")
};
cljs.core.BitmapIndexedNode.prototype.edit_and_remove_pair = function(e, bit, i) {
  var this__7366 = this;
  var inode__7367 = this;
  if(this__7366.bitmap === bit) {
    return null
  }else {
    var editable__7368 = inode__7367.ensure_editable(e);
    var earr__7369 = editable__7368.arr;
    var len__7370 = earr__7369.length;
    editable__7368.bitmap = bit ^ editable__7368.bitmap;
    cljs.core.array_copy.call(null, earr__7369, 2 * (i + 1), earr__7369, 2 * i, len__7370 - 2 * (i + 1));
    earr__7369[len__7370 - 2] = null;
    earr__7369[len__7370 - 1] = null;
    return editable__7368
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__7371 = this;
  var inode__7372 = this;
  var bit__7373 = 1 << (hash >>> shift & 31);
  var idx__7374 = cljs.core.bitmap_indexed_node_index.call(null, this__7371.bitmap, bit__7373);
  if((this__7371.bitmap & bit__7373) === 0) {
    var n__7375 = cljs.core.bit_count.call(null, this__7371.bitmap);
    if(2 * n__7375 < this__7371.arr.length) {
      var editable__7376 = inode__7372.ensure_editable(edit);
      var earr__7377 = editable__7376.arr;
      added_leaf_QMARK_.val = true;
      cljs.core.array_copy_downward.call(null, earr__7377, 2 * idx__7374, earr__7377, 2 * (idx__7374 + 1), 2 * (n__7375 - idx__7374));
      earr__7377[2 * idx__7374] = key;
      earr__7377[2 * idx__7374 + 1] = val;
      editable__7376.bitmap = editable__7376.bitmap | bit__7373;
      return editable__7376
    }else {
      if(n__7375 >= 16) {
        var nodes__7378 = cljs.core.make_array.call(null, 32);
        var jdx__7379 = hash >>> shift & 31;
        nodes__7378[jdx__7379] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
        var i__7380 = 0;
        var j__7381 = 0;
        while(true) {
          if(i__7380 < 32) {
            if((this__7371.bitmap >>> i__7380 & 1) === 0) {
              var G__7434 = i__7380 + 1;
              var G__7435 = j__7381;
              i__7380 = G__7434;
              j__7381 = G__7435;
              continue
            }else {
              nodes__7378[i__7380] = !(this__7371.arr[j__7381] == null) ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, cljs.core.hash.call(null, this__7371.arr[j__7381]), this__7371.arr[j__7381], this__7371.arr[j__7381 + 1], added_leaf_QMARK_) : this__7371.arr[j__7381 + 1];
              var G__7436 = i__7380 + 1;
              var G__7437 = j__7381 + 2;
              i__7380 = G__7436;
              j__7381 = G__7437;
              continue
            }
          }else {
          }
          break
        }
        return new cljs.core.ArrayNode(edit, n__7375 + 1, nodes__7378)
      }else {
        if("\ufdd0'else") {
          var new_arr__7382 = cljs.core.make_array.call(null, 2 * (n__7375 + 4));
          cljs.core.array_copy.call(null, this__7371.arr, 0, new_arr__7382, 0, 2 * idx__7374);
          new_arr__7382[2 * idx__7374] = key;
          new_arr__7382[2 * idx__7374 + 1] = val;
          cljs.core.array_copy.call(null, this__7371.arr, 2 * idx__7374, new_arr__7382, 2 * (idx__7374 + 1), 2 * (n__7375 - idx__7374));
          added_leaf_QMARK_.val = true;
          var editable__7383 = inode__7372.ensure_editable(edit);
          editable__7383.arr = new_arr__7382;
          editable__7383.bitmap = editable__7383.bitmap | bit__7373;
          return editable__7383
        }else {
          return null
        }
      }
    }
  }else {
    var key_or_nil__7384 = this__7371.arr[2 * idx__7374];
    var val_or_node__7385 = this__7371.arr[2 * idx__7374 + 1];
    if(key_or_nil__7384 == null) {
      var n__7386 = val_or_node__7385.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__7386 === val_or_node__7385) {
        return inode__7372
      }else {
        return cljs.core.edit_and_set.call(null, inode__7372, edit, 2 * idx__7374 + 1, n__7386)
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__7384)) {
        if(val === val_or_node__7385) {
          return inode__7372
        }else {
          return cljs.core.edit_and_set.call(null, inode__7372, edit, 2 * idx__7374 + 1, val)
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_.val = true;
          return cljs.core.edit_and_set.call(null, inode__7372, edit, 2 * idx__7374, null, 2 * idx__7374 + 1, cljs.core.create_node.call(null, edit, shift + 5, key_or_nil__7384, val_or_node__7385, hash, key, val))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_seq = function() {
  var this__7387 = this;
  var inode__7388 = this;
  return cljs.core.create_inode_seq.call(null, this__7387.arr)
};
cljs.core.BitmapIndexedNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__7389 = this;
  var inode__7390 = this;
  var bit__7391 = 1 << (hash >>> shift & 31);
  if((this__7389.bitmap & bit__7391) === 0) {
    return inode__7390
  }else {
    var idx__7392 = cljs.core.bitmap_indexed_node_index.call(null, this__7389.bitmap, bit__7391);
    var key_or_nil__7393 = this__7389.arr[2 * idx__7392];
    var val_or_node__7394 = this__7389.arr[2 * idx__7392 + 1];
    if(key_or_nil__7393 == null) {
      var n__7395 = val_or_node__7394.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
      if(n__7395 === val_or_node__7394) {
        return inode__7390
      }else {
        if(!(n__7395 == null)) {
          return cljs.core.edit_and_set.call(null, inode__7390, edit, 2 * idx__7392 + 1, n__7395)
        }else {
          if(this__7389.bitmap === bit__7391) {
            return null
          }else {
            if("\ufdd0'else") {
              return inode__7390.edit_and_remove_pair(edit, bit__7391, idx__7392)
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__7393)) {
        removed_leaf_QMARK_[0] = true;
        return inode__7390.edit_and_remove_pair(edit, bit__7391, idx__7392)
      }else {
        if("\ufdd0'else") {
          return inode__7390
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.ensure_editable = function(e) {
  var this__7396 = this;
  var inode__7397 = this;
  if(e === this__7396.edit) {
    return inode__7397
  }else {
    var n__7398 = cljs.core.bit_count.call(null, this__7396.bitmap);
    var new_arr__7399 = cljs.core.make_array.call(null, n__7398 < 0 ? 4 : 2 * (n__7398 + 1));
    cljs.core.array_copy.call(null, this__7396.arr, 0, new_arr__7399, 0, 2 * n__7398);
    return new cljs.core.BitmapIndexedNode(e, this__7396.bitmap, new_arr__7399)
  }
};
cljs.core.BitmapIndexedNode.prototype.kv_reduce = function(f, init) {
  var this__7400 = this;
  var inode__7401 = this;
  return cljs.core.inode_kv_reduce.call(null, this__7400.arr, f, init)
};
cljs.core.BitmapIndexedNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__7402 = this;
  var inode__7403 = this;
  var bit__7404 = 1 << (hash >>> shift & 31);
  if((this__7402.bitmap & bit__7404) === 0) {
    return not_found
  }else {
    var idx__7405 = cljs.core.bitmap_indexed_node_index.call(null, this__7402.bitmap, bit__7404);
    var key_or_nil__7406 = this__7402.arr[2 * idx__7405];
    var val_or_node__7407 = this__7402.arr[2 * idx__7405 + 1];
    if(key_or_nil__7406 == null) {
      return val_or_node__7407.inode_find(shift + 5, hash, key, not_found)
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__7406)) {
        return cljs.core.PersistentVector.fromArray([key_or_nil__7406, val_or_node__7407], true)
      }else {
        if("\ufdd0'else") {
          return not_found
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_without = function(shift, hash, key) {
  var this__7408 = this;
  var inode__7409 = this;
  var bit__7410 = 1 << (hash >>> shift & 31);
  if((this__7408.bitmap & bit__7410) === 0) {
    return inode__7409
  }else {
    var idx__7411 = cljs.core.bitmap_indexed_node_index.call(null, this__7408.bitmap, bit__7410);
    var key_or_nil__7412 = this__7408.arr[2 * idx__7411];
    var val_or_node__7413 = this__7408.arr[2 * idx__7411 + 1];
    if(key_or_nil__7412 == null) {
      var n__7414 = val_or_node__7413.inode_without(shift + 5, hash, key);
      if(n__7414 === val_or_node__7413) {
        return inode__7409
      }else {
        if(!(n__7414 == null)) {
          return new cljs.core.BitmapIndexedNode(null, this__7408.bitmap, cljs.core.clone_and_set.call(null, this__7408.arr, 2 * idx__7411 + 1, n__7414))
        }else {
          if(this__7408.bitmap === bit__7410) {
            return null
          }else {
            if("\ufdd0'else") {
              return new cljs.core.BitmapIndexedNode(null, this__7408.bitmap ^ bit__7410, cljs.core.remove_pair.call(null, this__7408.arr, idx__7411))
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__7412)) {
        return new cljs.core.BitmapIndexedNode(null, this__7408.bitmap ^ bit__7410, cljs.core.remove_pair.call(null, this__7408.arr, idx__7411))
      }else {
        if("\ufdd0'else") {
          return inode__7409
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__7415 = this;
  var inode__7416 = this;
  var bit__7417 = 1 << (hash >>> shift & 31);
  var idx__7418 = cljs.core.bitmap_indexed_node_index.call(null, this__7415.bitmap, bit__7417);
  if((this__7415.bitmap & bit__7417) === 0) {
    var n__7419 = cljs.core.bit_count.call(null, this__7415.bitmap);
    if(n__7419 >= 16) {
      var nodes__7420 = cljs.core.make_array.call(null, 32);
      var jdx__7421 = hash >>> shift & 31;
      nodes__7420[jdx__7421] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      var i__7422 = 0;
      var j__7423 = 0;
      while(true) {
        if(i__7422 < 32) {
          if((this__7415.bitmap >>> i__7422 & 1) === 0) {
            var G__7438 = i__7422 + 1;
            var G__7439 = j__7423;
            i__7422 = G__7438;
            j__7423 = G__7439;
            continue
          }else {
            nodes__7420[i__7422] = !(this__7415.arr[j__7423] == null) ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, cljs.core.hash.call(null, this__7415.arr[j__7423]), this__7415.arr[j__7423], this__7415.arr[j__7423 + 1], added_leaf_QMARK_) : this__7415.arr[j__7423 + 1];
            var G__7440 = i__7422 + 1;
            var G__7441 = j__7423 + 2;
            i__7422 = G__7440;
            j__7423 = G__7441;
            continue
          }
        }else {
        }
        break
      }
      return new cljs.core.ArrayNode(null, n__7419 + 1, nodes__7420)
    }else {
      var new_arr__7424 = cljs.core.make_array.call(null, 2 * (n__7419 + 1));
      cljs.core.array_copy.call(null, this__7415.arr, 0, new_arr__7424, 0, 2 * idx__7418);
      new_arr__7424[2 * idx__7418] = key;
      new_arr__7424[2 * idx__7418 + 1] = val;
      cljs.core.array_copy.call(null, this__7415.arr, 2 * idx__7418, new_arr__7424, 2 * (idx__7418 + 1), 2 * (n__7419 - idx__7418));
      added_leaf_QMARK_.val = true;
      return new cljs.core.BitmapIndexedNode(null, this__7415.bitmap | bit__7417, new_arr__7424)
    }
  }else {
    var key_or_nil__7425 = this__7415.arr[2 * idx__7418];
    var val_or_node__7426 = this__7415.arr[2 * idx__7418 + 1];
    if(key_or_nil__7425 == null) {
      var n__7427 = val_or_node__7426.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__7427 === val_or_node__7426) {
        return inode__7416
      }else {
        return new cljs.core.BitmapIndexedNode(null, this__7415.bitmap, cljs.core.clone_and_set.call(null, this__7415.arr, 2 * idx__7418 + 1, n__7427))
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__7425)) {
        if(val === val_or_node__7426) {
          return inode__7416
        }else {
          return new cljs.core.BitmapIndexedNode(null, this__7415.bitmap, cljs.core.clone_and_set.call(null, this__7415.arr, 2 * idx__7418 + 1, val))
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_.val = true;
          return new cljs.core.BitmapIndexedNode(null, this__7415.bitmap, cljs.core.clone_and_set.call(null, this__7415.arr, 2 * idx__7418, null, 2 * idx__7418 + 1, cljs.core.create_node.call(null, shift + 5, key_or_nil__7425, val_or_node__7426, hash, key, val)))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__7428 = this;
  var inode__7429 = this;
  var bit__7430 = 1 << (hash >>> shift & 31);
  if((this__7428.bitmap & bit__7430) === 0) {
    return not_found
  }else {
    var idx__7431 = cljs.core.bitmap_indexed_node_index.call(null, this__7428.bitmap, bit__7430);
    var key_or_nil__7432 = this__7428.arr[2 * idx__7431];
    var val_or_node__7433 = this__7428.arr[2 * idx__7431 + 1];
    if(key_or_nil__7432 == null) {
      return val_or_node__7433.inode_lookup(shift + 5, hash, key, not_found)
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__7432)) {
        return val_or_node__7433
      }else {
        if("\ufdd0'else") {
          return not_found
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode;
cljs.core.BitmapIndexedNode.EMPTY = new cljs.core.BitmapIndexedNode(null, 0, cljs.core.make_array.call(null, 0));
cljs.core.pack_array_node = function pack_array_node(array_node, edit, idx) {
  var arr__7449 = array_node.arr;
  var len__7450 = 2 * (array_node.cnt - 1);
  var new_arr__7451 = cljs.core.make_array.call(null, len__7450);
  var i__7452 = 0;
  var j__7453 = 1;
  var bitmap__7454 = 0;
  while(true) {
    if(i__7452 < len__7450) {
      if(function() {
        var and__3822__auto____7455 = !(i__7452 === idx);
        if(and__3822__auto____7455) {
          return!(arr__7449[i__7452] == null)
        }else {
          return and__3822__auto____7455
        }
      }()) {
        new_arr__7451[j__7453] = arr__7449[i__7452];
        var G__7456 = i__7452 + 1;
        var G__7457 = j__7453 + 2;
        var G__7458 = bitmap__7454 | 1 << i__7452;
        i__7452 = G__7456;
        j__7453 = G__7457;
        bitmap__7454 = G__7458;
        continue
      }else {
        var G__7459 = i__7452 + 1;
        var G__7460 = j__7453;
        var G__7461 = bitmap__7454;
        i__7452 = G__7459;
        j__7453 = G__7460;
        bitmap__7454 = G__7461;
        continue
      }
    }else {
      return new cljs.core.BitmapIndexedNode(edit, bitmap__7454, new_arr__7451)
    }
    break
  }
};
cljs.core.ArrayNode = function(edit, cnt, arr) {
  this.edit = edit;
  this.cnt = cnt;
  this.arr = arr
};
cljs.core.ArrayNode.cljs$lang$type = true;
cljs.core.ArrayNode.cljs$lang$ctorPrSeq = function(this__960__auto__) {
  return cljs.core.list.call(null, "cljs.core/ArrayNode")
};
cljs.core.ArrayNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__7462 = this;
  var inode__7463 = this;
  var idx__7464 = hash >>> shift & 31;
  var node__7465 = this__7462.arr[idx__7464];
  if(node__7465 == null) {
    var editable__7466 = cljs.core.edit_and_set.call(null, inode__7463, edit, idx__7464, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_));
    editable__7466.cnt = editable__7466.cnt + 1;
    return editable__7466
  }else {
    var n__7467 = node__7465.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__7467 === node__7465) {
      return inode__7463
    }else {
      return cljs.core.edit_and_set.call(null, inode__7463, edit, idx__7464, n__7467)
    }
  }
};
cljs.core.ArrayNode.prototype.inode_seq = function() {
  var this__7468 = this;
  var inode__7469 = this;
  return cljs.core.create_array_node_seq.call(null, this__7468.arr)
};
cljs.core.ArrayNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__7470 = this;
  var inode__7471 = this;
  var idx__7472 = hash >>> shift & 31;
  var node__7473 = this__7470.arr[idx__7472];
  if(node__7473 == null) {
    return inode__7471
  }else {
    var n__7474 = node__7473.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
    if(n__7474 === node__7473) {
      return inode__7471
    }else {
      if(n__7474 == null) {
        if(this__7470.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__7471, edit, idx__7472)
        }else {
          var editable__7475 = cljs.core.edit_and_set.call(null, inode__7471, edit, idx__7472, n__7474);
          editable__7475.cnt = editable__7475.cnt - 1;
          return editable__7475
        }
      }else {
        if("\ufdd0'else") {
          return cljs.core.edit_and_set.call(null, inode__7471, edit, idx__7472, n__7474)
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.ArrayNode.prototype.ensure_editable = function(e) {
  var this__7476 = this;
  var inode__7477 = this;
  if(e === this__7476.edit) {
    return inode__7477
  }else {
    return new cljs.core.ArrayNode(e, this__7476.cnt, this__7476.arr.slice())
  }
};
cljs.core.ArrayNode.prototype.kv_reduce = function(f, init) {
  var this__7478 = this;
  var inode__7479 = this;
  var len__7480 = this__7478.arr.length;
  var i__7481 = 0;
  var init__7482 = init;
  while(true) {
    if(i__7481 < len__7480) {
      var node__7483 = this__7478.arr[i__7481];
      if(!(node__7483 == null)) {
        var init__7484 = node__7483.kv_reduce(f, init__7482);
        if(cljs.core.reduced_QMARK_.call(null, init__7484)) {
          return cljs.core.deref.call(null, init__7484)
        }else {
          var G__7503 = i__7481 + 1;
          var G__7504 = init__7484;
          i__7481 = G__7503;
          init__7482 = G__7504;
          continue
        }
      }else {
        return null
      }
    }else {
      return init__7482
    }
    break
  }
};
cljs.core.ArrayNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__7485 = this;
  var inode__7486 = this;
  var idx__7487 = hash >>> shift & 31;
  var node__7488 = this__7485.arr[idx__7487];
  if(!(node__7488 == null)) {
    return node__7488.inode_find(shift + 5, hash, key, not_found)
  }else {
    return not_found
  }
};
cljs.core.ArrayNode.prototype.inode_without = function(shift, hash, key) {
  var this__7489 = this;
  var inode__7490 = this;
  var idx__7491 = hash >>> shift & 31;
  var node__7492 = this__7489.arr[idx__7491];
  if(!(node__7492 == null)) {
    var n__7493 = node__7492.inode_without(shift + 5, hash, key);
    if(n__7493 === node__7492) {
      return inode__7490
    }else {
      if(n__7493 == null) {
        if(this__7489.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__7490, null, idx__7491)
        }else {
          return new cljs.core.ArrayNode(null, this__7489.cnt - 1, cljs.core.clone_and_set.call(null, this__7489.arr, idx__7491, n__7493))
        }
      }else {
        if("\ufdd0'else") {
          return new cljs.core.ArrayNode(null, this__7489.cnt, cljs.core.clone_and_set.call(null, this__7489.arr, idx__7491, n__7493))
        }else {
          return null
        }
      }
    }
  }else {
    return inode__7490
  }
};
cljs.core.ArrayNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__7494 = this;
  var inode__7495 = this;
  var idx__7496 = hash >>> shift & 31;
  var node__7497 = this__7494.arr[idx__7496];
  if(node__7497 == null) {
    return new cljs.core.ArrayNode(null, this__7494.cnt + 1, cljs.core.clone_and_set.call(null, this__7494.arr, idx__7496, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_)))
  }else {
    var n__7498 = node__7497.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__7498 === node__7497) {
      return inode__7495
    }else {
      return new cljs.core.ArrayNode(null, this__7494.cnt, cljs.core.clone_and_set.call(null, this__7494.arr, idx__7496, n__7498))
    }
  }
};
cljs.core.ArrayNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__7499 = this;
  var inode__7500 = this;
  var idx__7501 = hash >>> shift & 31;
  var node__7502 = this__7499.arr[idx__7501];
  if(!(node__7502 == null)) {
    return node__7502.inode_lookup(shift + 5, hash, key, not_found)
  }else {
    return not_found
  }
};
cljs.core.ArrayNode;
cljs.core.hash_collision_node_find_index = function hash_collision_node_find_index(arr, cnt, key) {
  var lim__7507 = 2 * cnt;
  var i__7508 = 0;
  while(true) {
    if(i__7508 < lim__7507) {
      if(cljs.core.key_test.call(null, key, arr[i__7508])) {
        return i__7508
      }else {
        var G__7509 = i__7508 + 2;
        i__7508 = G__7509;
        continue
      }
    }else {
      return-1
    }
    break
  }
};
cljs.core.HashCollisionNode = function(edit, collision_hash, cnt, arr) {
  this.edit = edit;
  this.collision_hash = collision_hash;
  this.cnt = cnt;
  this.arr = arr
};
cljs.core.HashCollisionNode.cljs$lang$type = true;
cljs.core.HashCollisionNode.cljs$lang$ctorPrSeq = function(this__960__auto__) {
  return cljs.core.list.call(null, "cljs.core/HashCollisionNode")
};
cljs.core.HashCollisionNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__7510 = this;
  var inode__7511 = this;
  if(hash === this__7510.collision_hash) {
    var idx__7512 = cljs.core.hash_collision_node_find_index.call(null, this__7510.arr, this__7510.cnt, key);
    if(idx__7512 === -1) {
      if(this__7510.arr.length > 2 * this__7510.cnt) {
        var editable__7513 = cljs.core.edit_and_set.call(null, inode__7511, edit, 2 * this__7510.cnt, key, 2 * this__7510.cnt + 1, val);
        added_leaf_QMARK_.val = true;
        editable__7513.cnt = editable__7513.cnt + 1;
        return editable__7513
      }else {
        var len__7514 = this__7510.arr.length;
        var new_arr__7515 = cljs.core.make_array.call(null, len__7514 + 2);
        cljs.core.array_copy.call(null, this__7510.arr, 0, new_arr__7515, 0, len__7514);
        new_arr__7515[len__7514] = key;
        new_arr__7515[len__7514 + 1] = val;
        added_leaf_QMARK_.val = true;
        return inode__7511.ensure_editable_array(edit, this__7510.cnt + 1, new_arr__7515)
      }
    }else {
      if(this__7510.arr[idx__7512 + 1] === val) {
        return inode__7511
      }else {
        return cljs.core.edit_and_set.call(null, inode__7511, edit, idx__7512 + 1, val)
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(edit, 1 << (this__7510.collision_hash >>> shift & 31), [null, inode__7511, null, null])).inode_assoc_BANG_(edit, shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_seq = function() {
  var this__7516 = this;
  var inode__7517 = this;
  return cljs.core.create_inode_seq.call(null, this__7516.arr)
};
cljs.core.HashCollisionNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__7518 = this;
  var inode__7519 = this;
  var idx__7520 = cljs.core.hash_collision_node_find_index.call(null, this__7518.arr, this__7518.cnt, key);
  if(idx__7520 === -1) {
    return inode__7519
  }else {
    removed_leaf_QMARK_[0] = true;
    if(this__7518.cnt === 1) {
      return null
    }else {
      var editable__7521 = inode__7519.ensure_editable(edit);
      var earr__7522 = editable__7521.arr;
      earr__7522[idx__7520] = earr__7522[2 * this__7518.cnt - 2];
      earr__7522[idx__7520 + 1] = earr__7522[2 * this__7518.cnt - 1];
      earr__7522[2 * this__7518.cnt - 1] = null;
      earr__7522[2 * this__7518.cnt - 2] = null;
      editable__7521.cnt = editable__7521.cnt - 1;
      return editable__7521
    }
  }
};
cljs.core.HashCollisionNode.prototype.ensure_editable = function(e) {
  var this__7523 = this;
  var inode__7524 = this;
  if(e === this__7523.edit) {
    return inode__7524
  }else {
    var new_arr__7525 = cljs.core.make_array.call(null, 2 * (this__7523.cnt + 1));
    cljs.core.array_copy.call(null, this__7523.arr, 0, new_arr__7525, 0, 2 * this__7523.cnt);
    return new cljs.core.HashCollisionNode(e, this__7523.collision_hash, this__7523.cnt, new_arr__7525)
  }
};
cljs.core.HashCollisionNode.prototype.kv_reduce = function(f, init) {
  var this__7526 = this;
  var inode__7527 = this;
  return cljs.core.inode_kv_reduce.call(null, this__7526.arr, f, init)
};
cljs.core.HashCollisionNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__7528 = this;
  var inode__7529 = this;
  var idx__7530 = cljs.core.hash_collision_node_find_index.call(null, this__7528.arr, this__7528.cnt, key);
  if(idx__7530 < 0) {
    return not_found
  }else {
    if(cljs.core.key_test.call(null, key, this__7528.arr[idx__7530])) {
      return cljs.core.PersistentVector.fromArray([this__7528.arr[idx__7530], this__7528.arr[idx__7530 + 1]], true)
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.inode_without = function(shift, hash, key) {
  var this__7531 = this;
  var inode__7532 = this;
  var idx__7533 = cljs.core.hash_collision_node_find_index.call(null, this__7531.arr, this__7531.cnt, key);
  if(idx__7533 === -1) {
    return inode__7532
  }else {
    if(this__7531.cnt === 1) {
      return null
    }else {
      if("\ufdd0'else") {
        return new cljs.core.HashCollisionNode(null, this__7531.collision_hash, this__7531.cnt - 1, cljs.core.remove_pair.call(null, this__7531.arr, cljs.core.quot.call(null, idx__7533, 2)))
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__7534 = this;
  var inode__7535 = this;
  if(hash === this__7534.collision_hash) {
    var idx__7536 = cljs.core.hash_collision_node_find_index.call(null, this__7534.arr, this__7534.cnt, key);
    if(idx__7536 === -1) {
      var len__7537 = this__7534.arr.length;
      var new_arr__7538 = cljs.core.make_array.call(null, len__7537 + 2);
      cljs.core.array_copy.call(null, this__7534.arr, 0, new_arr__7538, 0, len__7537);
      new_arr__7538[len__7537] = key;
      new_arr__7538[len__7537 + 1] = val;
      added_leaf_QMARK_.val = true;
      return new cljs.core.HashCollisionNode(null, this__7534.collision_hash, this__7534.cnt + 1, new_arr__7538)
    }else {
      if(cljs.core._EQ_.call(null, this__7534.arr[idx__7536], val)) {
        return inode__7535
      }else {
        return new cljs.core.HashCollisionNode(null, this__7534.collision_hash, this__7534.cnt, cljs.core.clone_and_set.call(null, this__7534.arr, idx__7536 + 1, val))
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(null, 1 << (this__7534.collision_hash >>> shift & 31), [null, inode__7535])).inode_assoc(shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__7539 = this;
  var inode__7540 = this;
  var idx__7541 = cljs.core.hash_collision_node_find_index.call(null, this__7539.arr, this__7539.cnt, key);
  if(idx__7541 < 0) {
    return not_found
  }else {
    if(cljs.core.key_test.call(null, key, this__7539.arr[idx__7541])) {
      return this__7539.arr[idx__7541 + 1]
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.ensure_editable_array = function(e, count, array) {
  var this__7542 = this;
  var inode__7543 = this;
  if(e === this__7542.edit) {
    this__7542.arr = array;
    this__7542.cnt = count;
    return inode__7543
  }else {
    return new cljs.core.HashCollisionNode(this__7542.edit, this__7542.collision_hash, count, array)
  }
};
cljs.core.HashCollisionNode;
cljs.core.create_node = function() {
  var create_node = null;
  var create_node__6 = function(shift, key1, val1, key2hash, key2, val2) {
    var key1hash__7548 = cljs.core.hash.call(null, key1);
    if(key1hash__7548 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__7548, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___7549 = new cljs.core.Box(false);
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift, key1hash__7548, key1, val1, added_leaf_QMARK___7549).inode_assoc(shift, key2hash, key2, val2, added_leaf_QMARK___7549)
    }
  };
  var create_node__7 = function(edit, shift, key1, val1, key2hash, key2, val2) {
    var key1hash__7550 = cljs.core.hash.call(null, key1);
    if(key1hash__7550 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__7550, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___7551 = new cljs.core.Box(false);
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift, key1hash__7550, key1, val1, added_leaf_QMARK___7551).inode_assoc_BANG_(edit, shift, key2hash, key2, val2, added_leaf_QMARK___7551)
    }
  };
  create_node = function(edit, shift, key1, val1, key2hash, key2, val2) {
    switch(arguments.length) {
      case 6:
        return create_node__6.call(this, edit, shift, key1, val1, key2hash, key2);
      case 7:
        return create_node__7.call(this, edit, shift, key1, val1, key2hash, key2, val2)
    }
    throw"Invalid arity: " + arguments.length;
  };
  create_node.cljs$lang$arity$6 = create_node__6;
  create_node.cljs$lang$arity$7 = create_node__7;
  return create_node
}();
cljs.core.NodeSeq = function(meta, nodes, i, s, __hash) {
  this.meta = meta;
  this.nodes = nodes;
  this.i = i;
  this.s = s;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850572
};
cljs.core.NodeSeq.cljs$lang$type = true;
cljs.core.NodeSeq.cljs$lang$ctorPrSeq = function(this__960__auto__) {
  return cljs.core.list.call(null, "cljs.core/NodeSeq")
};
cljs.core.NodeSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__7552 = this;
  var h__843__auto____7553 = this__7552.__hash;
  if(!(h__843__auto____7553 == null)) {
    return h__843__auto____7553
  }else {
    var h__843__auto____7554 = cljs.core.hash_coll.call(null, coll);
    this__7552.__hash = h__843__auto____7554;
    return h__843__auto____7554
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7555 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.NodeSeq.prototype.toString = function() {
  var this__7556 = this;
  var this__7557 = this;
  return cljs.core.pr_str.call(null, this__7557)
};
cljs.core.NodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__7558 = this;
  return this$
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7559 = this;
  if(this__7559.s == null) {
    return cljs.core.PersistentVector.fromArray([this__7559.nodes[this__7559.i], this__7559.nodes[this__7559.i + 1]], true)
  }else {
    return cljs.core.first.call(null, this__7559.s)
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7560 = this;
  if(this__7560.s == null) {
    return cljs.core.create_inode_seq.call(null, this__7560.nodes, this__7560.i + 2, null)
  }else {
    return cljs.core.create_inode_seq.call(null, this__7560.nodes, this__7560.i, cljs.core.next.call(null, this__7560.s))
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7561 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.NodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__7562 = this;
  return new cljs.core.NodeSeq(meta, this__7562.nodes, this__7562.i, this__7562.s, this__7562.__hash)
};
cljs.core.NodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7563 = this;
  return this__7563.meta
};
cljs.core.NodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7564 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__7564.meta)
};
cljs.core.NodeSeq;
cljs.core.create_inode_seq = function() {
  var create_inode_seq = null;
  var create_inode_seq__1 = function(nodes) {
    return create_inode_seq.call(null, nodes, 0, null)
  };
  var create_inode_seq__3 = function(nodes, i, s) {
    if(s == null) {
      var len__7571 = nodes.length;
      var j__7572 = i;
      while(true) {
        if(j__7572 < len__7571) {
          if(!(nodes[j__7572] == null)) {
            return new cljs.core.NodeSeq(null, nodes, j__7572, null, null)
          }else {
            var temp__3971__auto____7573 = nodes[j__7572 + 1];
            if(cljs.core.truth_(temp__3971__auto____7573)) {
              var node__7574 = temp__3971__auto____7573;
              var temp__3971__auto____7575 = node__7574.inode_seq();
              if(cljs.core.truth_(temp__3971__auto____7575)) {
                var node_seq__7576 = temp__3971__auto____7575;
                return new cljs.core.NodeSeq(null, nodes, j__7572 + 2, node_seq__7576, null)
              }else {
                var G__7577 = j__7572 + 2;
                j__7572 = G__7577;
                continue
              }
            }else {
              var G__7578 = j__7572 + 2;
              j__7572 = G__7578;
              continue
            }
          }
        }else {
          return null
        }
        break
      }
    }else {
      return new cljs.core.NodeSeq(null, nodes, i, s, null)
    }
  };
  create_inode_seq = function(nodes, i, s) {
    switch(arguments.length) {
      case 1:
        return create_inode_seq__1.call(this, nodes);
      case 3:
        return create_inode_seq__3.call(this, nodes, i, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  create_inode_seq.cljs$lang$arity$1 = create_inode_seq__1;
  create_inode_seq.cljs$lang$arity$3 = create_inode_seq__3;
  return create_inode_seq
}();
cljs.core.ArrayNodeSeq = function(meta, nodes, i, s, __hash) {
  this.meta = meta;
  this.nodes = nodes;
  this.i = i;
  this.s = s;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850572
};
cljs.core.ArrayNodeSeq.cljs$lang$type = true;
cljs.core.ArrayNodeSeq.cljs$lang$ctorPrSeq = function(this__960__auto__) {
  return cljs.core.list.call(null, "cljs.core/ArrayNodeSeq")
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__7579 = this;
  var h__843__auto____7580 = this__7579.__hash;
  if(!(h__843__auto____7580 == null)) {
    return h__843__auto____7580
  }else {
    var h__843__auto____7581 = cljs.core.hash_coll.call(null, coll);
    this__7579.__hash = h__843__auto____7581;
    return h__843__auto____7581
  }
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7582 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ArrayNodeSeq.prototype.toString = function() {
  var this__7583 = this;
  var this__7584 = this;
  return cljs.core.pr_str.call(null, this__7584)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__7585 = this;
  return this$
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7586 = this;
  return cljs.core.first.call(null, this__7586.s)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7587 = this;
  return cljs.core.create_array_node_seq.call(null, null, this__7587.nodes, this__7587.i, cljs.core.next.call(null, this__7587.s))
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7588 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__7589 = this;
  return new cljs.core.ArrayNodeSeq(meta, this__7589.nodes, this__7589.i, this__7589.s, this__7589.__hash)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7590 = this;
  return this__7590.meta
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7591 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__7591.meta)
};
cljs.core.ArrayNodeSeq;
cljs.core.create_array_node_seq = function() {
  var create_array_node_seq = null;
  var create_array_node_seq__1 = function(nodes) {
    return create_array_node_seq.call(null, null, nodes, 0, null)
  };
  var create_array_node_seq__4 = function(meta, nodes, i, s) {
    if(s == null) {
      var len__7598 = nodes.length;
      var j__7599 = i;
      while(true) {
        if(j__7599 < len__7598) {
          var temp__3971__auto____7600 = nodes[j__7599];
          if(cljs.core.truth_(temp__3971__auto____7600)) {
            var nj__7601 = temp__3971__auto____7600;
            var temp__3971__auto____7602 = nj__7601.inode_seq();
            if(cljs.core.truth_(temp__3971__auto____7602)) {
              var ns__7603 = temp__3971__auto____7602;
              return new cljs.core.ArrayNodeSeq(meta, nodes, j__7599 + 1, ns__7603, null)
            }else {
              var G__7604 = j__7599 + 1;
              j__7599 = G__7604;
              continue
            }
          }else {
            var G__7605 = j__7599 + 1;
            j__7599 = G__7605;
            continue
          }
        }else {
          return null
        }
        break
      }
    }else {
      return new cljs.core.ArrayNodeSeq(meta, nodes, i, s, null)
    }
  };
  create_array_node_seq = function(meta, nodes, i, s) {
    switch(arguments.length) {
      case 1:
        return create_array_node_seq__1.call(this, meta);
      case 4:
        return create_array_node_seq__4.call(this, meta, nodes, i, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  create_array_node_seq.cljs$lang$arity$1 = create_array_node_seq__1;
  create_array_node_seq.cljs$lang$arity$4 = create_array_node_seq__4;
  return create_array_node_seq
}();
cljs.core.PersistentHashMap = function(meta, cnt, root, has_nil_QMARK_, nil_val, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.root = root;
  this.has_nil_QMARK_ = has_nil_QMARK_;
  this.nil_val = nil_val;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 16123663
};
cljs.core.PersistentHashMap.cljs$lang$type = true;
cljs.core.PersistentHashMap.cljs$lang$ctorPrSeq = function(this__960__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentHashMap")
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__7608 = this;
  return new cljs.core.TransientHashMap({}, this__7608.root, this__7608.cnt, this__7608.has_nil_QMARK_, this__7608.nil_val)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__7609 = this;
  var h__843__auto____7610 = this__7609.__hash;
  if(!(h__843__auto____7610 == null)) {
    return h__843__auto____7610
  }else {
    var h__843__auto____7611 = cljs.core.hash_imap.call(null, coll);
    this__7609.__hash = h__843__auto____7611;
    return h__843__auto____7611
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__7612 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__7613 = this;
  if(k == null) {
    if(this__7613.has_nil_QMARK_) {
      return this__7613.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__7613.root == null) {
      return not_found
    }else {
      if("\ufdd0'else") {
        return this__7613.root.inode_lookup(0, cljs.core.hash.call(null, k), k, not_found)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__7614 = this;
  if(k == null) {
    if(function() {
      var and__3822__auto____7615 = this__7614.has_nil_QMARK_;
      if(and__3822__auto____7615) {
        return v === this__7614.nil_val
      }else {
        return and__3822__auto____7615
      }
    }()) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__7614.meta, this__7614.has_nil_QMARK_ ? this__7614.cnt : this__7614.cnt + 1, this__7614.root, true, v, null)
    }
  }else {
    var added_leaf_QMARK___7616 = new cljs.core.Box(false);
    var new_root__7617 = (this__7614.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__7614.root).inode_assoc(0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___7616);
    if(new_root__7617 === this__7614.root) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__7614.meta, added_leaf_QMARK___7616.val ? this__7614.cnt + 1 : this__7614.cnt, new_root__7617, this__7614.has_nil_QMARK_, this__7614.nil_val, null)
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__7618 = this;
  if(k == null) {
    return this__7618.has_nil_QMARK_
  }else {
    if(this__7618.root == null) {
      return false
    }else {
      if("\ufdd0'else") {
        return!(this__7618.root.inode_lookup(0, cljs.core.hash.call(null, k), k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.call = function() {
  var G__7641 = null;
  var G__7641__2 = function(this_sym7619, k) {
    var this__7621 = this;
    var this_sym7619__7622 = this;
    var coll__7623 = this_sym7619__7622;
    return coll__7623.cljs$core$ILookup$_lookup$arity$2(coll__7623, k)
  };
  var G__7641__3 = function(this_sym7620, k, not_found) {
    var this__7621 = this;
    var this_sym7620__7624 = this;
    var coll__7625 = this_sym7620__7624;
    return coll__7625.cljs$core$ILookup$_lookup$arity$3(coll__7625, k, not_found)
  };
  G__7641 = function(this_sym7620, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7641__2.call(this, this_sym7620, k);
      case 3:
        return G__7641__3.call(this, this_sym7620, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7641
}();
cljs.core.PersistentHashMap.prototype.apply = function(this_sym7606, args7607) {
  var this__7626 = this;
  return this_sym7606.call.apply(this_sym7606, [this_sym7606].concat(args7607.slice()))
};
cljs.core.PersistentHashMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__7627 = this;
  var init__7628 = this__7627.has_nil_QMARK_ ? f.call(null, init, null, this__7627.nil_val) : init;
  if(cljs.core.reduced_QMARK_.call(null, init__7628)) {
    return cljs.core.deref.call(null, init__7628)
  }else {
    if(!(this__7627.root == null)) {
      return this__7627.root.kv_reduce(f, init__7628)
    }else {
      if("\ufdd0'else") {
        return init__7628
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__7629 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentHashMap.prototype.toString = function() {
  var this__7630 = this;
  var this__7631 = this;
  return cljs.core.pr_str.call(null, this__7631)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7632 = this;
  if(this__7632.cnt > 0) {
    var s__7633 = !(this__7632.root == null) ? this__7632.root.inode_seq() : null;
    if(this__7632.has_nil_QMARK_) {
      return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([null, this__7632.nil_val], true), s__7633)
    }else {
      return s__7633
    }
  }else {
    return null
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__7634 = this;
  return this__7634.cnt
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7635 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__7636 = this;
  return new cljs.core.PersistentHashMap(meta, this__7636.cnt, this__7636.root, this__7636.has_nil_QMARK_, this__7636.nil_val, this__7636.__hash)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7637 = this;
  return this__7637.meta
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7638 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, this__7638.meta)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__7639 = this;
  if(k == null) {
    if(this__7639.has_nil_QMARK_) {
      return new cljs.core.PersistentHashMap(this__7639.meta, this__7639.cnt - 1, this__7639.root, false, null, null)
    }else {
      return coll
    }
  }else {
    if(this__7639.root == null) {
      return coll
    }else {
      if("\ufdd0'else") {
        var new_root__7640 = this__7639.root.inode_without(0, cljs.core.hash.call(null, k), k);
        if(new_root__7640 === this__7639.root) {
          return coll
        }else {
          return new cljs.core.PersistentHashMap(this__7639.meta, this__7639.cnt - 1, new_root__7640, this__7639.has_nil_QMARK_, this__7639.nil_val, null)
        }
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap;
cljs.core.PersistentHashMap.EMPTY = new cljs.core.PersistentHashMap(null, 0, null, false, null, 0);
cljs.core.PersistentHashMap.fromArrays = function(ks, vs) {
  var len__7642 = ks.length;
  var i__7643 = 0;
  var out__7644 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
  while(true) {
    if(i__7643 < len__7642) {
      var G__7645 = i__7643 + 1;
      var G__7646 = cljs.core.assoc_BANG_.call(null, out__7644, ks[i__7643], vs[i__7643]);
      i__7643 = G__7645;
      out__7644 = G__7646;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__7644)
    }
    break
  }
};
cljs.core.TransientHashMap = function(edit, root, count, has_nil_QMARK_, nil_val) {
  this.edit = edit;
  this.root = root;
  this.count = count;
  this.has_nil_QMARK_ = has_nil_QMARK_;
  this.nil_val = nil_val;
  this.cljs$lang$protocol_mask$partition1$ = 14;
  this.cljs$lang$protocol_mask$partition0$ = 258
};
cljs.core.TransientHashMap.cljs$lang$type = true;
cljs.core.TransientHashMap.cljs$lang$ctorPrSeq = function(this__960__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientHashMap")
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientMap$_dissoc_BANG_$arity$2 = function(tcoll, key) {
  var this__7647 = this;
  return tcoll.without_BANG_(key)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__7648 = this;
  return tcoll.assoc_BANG_(key, val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, val) {
  var this__7649 = this;
  return tcoll.conj_BANG_(val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__7650 = this;
  return tcoll.persistent_BANG_()
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__7651 = this;
  if(k == null) {
    if(this__7651.has_nil_QMARK_) {
      return this__7651.nil_val
    }else {
      return null
    }
  }else {
    if(this__7651.root == null) {
      return null
    }else {
      return this__7651.root.inode_lookup(0, cljs.core.hash.call(null, k), k)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__7652 = this;
  if(k == null) {
    if(this__7652.has_nil_QMARK_) {
      return this__7652.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__7652.root == null) {
      return not_found
    }else {
      return this__7652.root.inode_lookup(0, cljs.core.hash.call(null, k), k, not_found)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__7653 = this;
  if(this__7653.edit) {
    return this__7653.count
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.conj_BANG_ = function(o) {
  var this__7654 = this;
  var tcoll__7655 = this;
  if(this__7654.edit) {
    if(function() {
      var G__7656__7657 = o;
      if(G__7656__7657) {
        if(function() {
          var or__3824__auto____7658 = G__7656__7657.cljs$lang$protocol_mask$partition0$ & 2048;
          if(or__3824__auto____7658) {
            return or__3824__auto____7658
          }else {
            return G__7656__7657.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__7656__7657.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__7656__7657)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__7656__7657)
      }
    }()) {
      return tcoll__7655.assoc_BANG_(cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__7659 = cljs.core.seq.call(null, o);
      var tcoll__7660 = tcoll__7655;
      while(true) {
        var temp__3971__auto____7661 = cljs.core.first.call(null, es__7659);
        if(cljs.core.truth_(temp__3971__auto____7661)) {
          var e__7662 = temp__3971__auto____7661;
          var G__7673 = cljs.core.next.call(null, es__7659);
          var G__7674 = tcoll__7660.assoc_BANG_(cljs.core.key.call(null, e__7662), cljs.core.val.call(null, e__7662));
          es__7659 = G__7673;
          tcoll__7660 = G__7674;
          continue
        }else {
          return tcoll__7660
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent");
  }
};
cljs.core.TransientHashMap.prototype.assoc_BANG_ = function(k, v) {
  var this__7663 = this;
  var tcoll__7664 = this;
  if(this__7663.edit) {
    if(k == null) {
      if(this__7663.nil_val === v) {
      }else {
        this__7663.nil_val = v
      }
      if(this__7663.has_nil_QMARK_) {
      }else {
        this__7663.count = this__7663.count + 1;
        this__7663.has_nil_QMARK_ = true
      }
      return tcoll__7664
    }else {
      var added_leaf_QMARK___7665 = new cljs.core.Box(false);
      var node__7666 = (this__7663.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__7663.root).inode_assoc_BANG_(this__7663.edit, 0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___7665);
      if(node__7666 === this__7663.root) {
      }else {
        this__7663.root = node__7666
      }
      if(added_leaf_QMARK___7665.val) {
        this__7663.count = this__7663.count + 1
      }else {
      }
      return tcoll__7664
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.without_BANG_ = function(k) {
  var this__7667 = this;
  var tcoll__7668 = this;
  if(this__7667.edit) {
    if(k == null) {
      if(this__7667.has_nil_QMARK_) {
        this__7667.has_nil_QMARK_ = false;
        this__7667.nil_val = null;
        this__7667.count = this__7667.count - 1;
        return tcoll__7668
      }else {
        return tcoll__7668
      }
    }else {
      if(this__7667.root == null) {
        return tcoll__7668
      }else {
        var removed_leaf_QMARK___7669 = new cljs.core.Box(false);
        var node__7670 = this__7667.root.inode_without_BANG_(this__7667.edit, 0, cljs.core.hash.call(null, k), k, removed_leaf_QMARK___7669);
        if(node__7670 === this__7667.root) {
        }else {
          this__7667.root = node__7670
        }
        if(cljs.core.truth_(removed_leaf_QMARK___7669[0])) {
          this__7667.count = this__7667.count - 1
        }else {
        }
        return tcoll__7668
      }
    }
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.persistent_BANG_ = function() {
  var this__7671 = this;
  var tcoll__7672 = this;
  if(this__7671.edit) {
    this__7671.edit = null;
    return new cljs.core.PersistentHashMap(null, this__7671.count, this__7671.root, this__7671.has_nil_QMARK_, this__7671.nil_val, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientHashMap;
cljs.core.tree_map_seq_push = function tree_map_seq_push(node, stack, ascending_QMARK_) {
  var t__7677 = node;
  var stack__7678 = stack;
  while(true) {
    if(!(t__7677 == null)) {
      var G__7679 = ascending_QMARK_ ? t__7677.left : t__7677.right;
      var G__7680 = cljs.core.conj.call(null, stack__7678, t__7677);
      t__7677 = G__7679;
      stack__7678 = G__7680;
      continue
    }else {
      return stack__7678
    }
    break
  }
};
cljs.core.PersistentTreeMapSeq = function(meta, stack, ascending_QMARK_, cnt, __hash) {
  this.meta = meta;
  this.stack = stack;
  this.ascending_QMARK_ = ascending_QMARK_;
  this.cnt = cnt;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850570
};
cljs.core.PersistentTreeMapSeq.cljs$lang$type = true;
cljs.core.PersistentTreeMapSeq.cljs$lang$ctorPrSeq = function(this__960__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentTreeMapSeq")
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__7681 = this;
  var h__843__auto____7682 = this__7681.__hash;
  if(!(h__843__auto____7682 == null)) {
    return h__843__auto____7682
  }else {
    var h__843__auto____7683 = cljs.core.hash_coll.call(null, coll);
    this__7681.__hash = h__843__auto____7683;
    return h__843__auto____7683
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7684 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.toString = function() {
  var this__7685 = this;
  var this__7686 = this;
  return cljs.core.pr_str.call(null, this__7686)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__7687 = this;
  return this$
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__7688 = this;
  if(this__7688.cnt < 0) {
    return cljs.core.count.call(null, cljs.core.next.call(null, coll)) + 1
  }else {
    return this__7688.cnt
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(this$) {
  var this__7689 = this;
  return cljs.core.peek.call(null, this__7689.stack)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(this$) {
  var this__7690 = this;
  var t__7691 = cljs.core.first.call(null, this__7690.stack);
  var next_stack__7692 = cljs.core.tree_map_seq_push.call(null, this__7690.ascending_QMARK_ ? t__7691.right : t__7691.left, cljs.core.next.call(null, this__7690.stack), this__7690.ascending_QMARK_);
  if(!(next_stack__7692 == null)) {
    return new cljs.core.PersistentTreeMapSeq(null, next_stack__7692, this__7690.ascending_QMARK_, this__7690.cnt - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7693 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__7694 = this;
  return new cljs.core.PersistentTreeMapSeq(meta, this__7694.stack, this__7694.ascending_QMARK_, this__7694.cnt, this__7694.__hash)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7695 = this;
  return this__7695.meta
};
cljs.core.PersistentTreeMapSeq;
cljs.core.create_tree_map_seq = function create_tree_map_seq(tree, ascending_QMARK_, cnt) {
  return new cljs.core.PersistentTreeMapSeq(null, cljs.core.tree_map_seq_push.call(null, tree, null, ascending_QMARK_), ascending_QMARK_, cnt, null)
};
cljs.core.balance_left = function balance_left(key, val, ins, right) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins)) {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.left)) {
      return new cljs.core.RedNode(ins.key, ins.val, ins.left.blacken(), new cljs.core.BlackNode(key, val, ins.right, right, null), null)
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.right)) {
        return new cljs.core.RedNode(ins.right.key, ins.right.val, new cljs.core.BlackNode(ins.key, ins.val, ins.left, ins.right.left, null), new cljs.core.BlackNode(key, val, ins.right.right, right, null), null)
      }else {
        if("\ufdd0'else") {
          return new cljs.core.BlackNode(key, val, ins, right, null)
        }else {
          return null
        }
      }
    }
  }else {
    return new cljs.core.BlackNode(key, val, ins, right, null)
  }
};
cljs.core.balance_right = function balance_right(key, val, left, ins) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins)) {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.right)) {
      return new cljs.core.RedNode(ins.key, ins.val, new cljs.core.BlackNode(key, val, left, ins.left, null), ins.right.blacken(), null)
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.left)) {
        return new cljs.core.RedNode(ins.left.key, ins.left.val, new cljs.core.BlackNode(key, val, left, ins.left.left, null), new cljs.core.BlackNode(ins.key, ins.val, ins.left.right, ins.right, null), null)
      }else {
        if("\ufdd0'else") {
          return new cljs.core.BlackNode(key, val, left, ins, null)
        }else {
          return null
        }
      }
    }
  }else {
    return new cljs.core.BlackNode(key, val, left, ins, null)
  }
};
cljs.core.balance_left_del = function balance_left_del(key, val, del, right) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, del)) {
    return new cljs.core.RedNode(key, val, del.blacken(), right, null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, right)) {
      return cljs.core.balance_right.call(null, key, val, del, right.redden())
    }else {
      if(function() {
        var and__3822__auto____7697 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right);
        if(and__3822__auto____7697) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, right.left)
        }else {
          return and__3822__auto____7697
        }
      }()) {
        return new cljs.core.RedNode(right.left.key, right.left.val, new cljs.core.BlackNode(key, val, del, right.left.left, null), cljs.core.balance_right.call(null, right.key, right.val, right.left.right, right.right.redden()), null)
      }else {
        if("\ufdd0'else") {
          throw new Error("red-black tree invariant violation");
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.balance_right_del = function balance_right_del(key, val, left, del) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, del)) {
    return new cljs.core.RedNode(key, val, left, del.blacken(), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, left)) {
      return cljs.core.balance_left.call(null, key, val, left.redden(), del)
    }else {
      if(function() {
        var and__3822__auto____7699 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, left);
        if(and__3822__auto____7699) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, left.right)
        }else {
          return and__3822__auto____7699
        }
      }()) {
        return new cljs.core.RedNode(left.right.key, left.right.val, cljs.core.balance_left.call(null, left.key, left.val, left.left.redden(), left.right.left), new cljs.core.BlackNode(key, val, left.right.right, del, null), null)
      }else {
        if("\ufdd0'else") {
          throw new Error("red-black tree invariant violation");
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.tree_map_kv_reduce = function tree_map_kv_reduce(node, f, init) {
  var init__7703 = f.call(null, init, node.key, node.val);
  if(cljs.core.reduced_QMARK_.call(null, init__7703)) {
    return cljs.core.deref.call(null, init__7703)
  }else {
    var init__7704 = !(node.left == null) ? tree_map_kv_reduce.call(null, node.left, f, init__7703) : init__7703;
    if(cljs.core.reduced_QMARK_.call(null, init__7704)) {
      return cljs.core.deref.call(null, init__7704)
    }else {
      var init__7705 = !(node.right == null) ? tree_map_kv_reduce.call(null, node.right, f, init__7704) : init__7704;
      if(cljs.core.reduced_QMARK_.call(null, init__7705)) {
        return cljs.core.deref.call(null, init__7705)
      }else {
        return init__7705
      }
    }
  }
};
cljs.core.BlackNode = function(key, val, left, right, __hash) {
  this.key = key;
  this.val = val;
  this.left = left;
  this.right = right;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32402207
};
cljs.core.BlackNode.cljs$lang$type = true;
cljs.core.BlackNode.cljs$lang$ctorPrSeq = function(this__960__auto__) {
  return cljs.core.list.call(null, "cljs.core/BlackNode")
};
cljs.core.BlackNode.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__7708 = this;
  var h__843__auto____7709 = this__7708.__hash;
  if(!(h__843__auto____7709 == null)) {
    return h__843__auto____7709
  }else {
    var h__843__auto____7710 = cljs.core.hash_coll.call(null, coll);
    this__7708.__hash = h__843__auto____7710;
    return h__843__auto____7710
  }
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__7711 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, null)
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__7712 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, not_found)
};
cljs.core.BlackNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__7713 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__7713.key, this__7713.val], true), k, v)
};
cljs.core.BlackNode.prototype.call = function() {
  var G__7761 = null;
  var G__7761__2 = function(this_sym7714, k) {
    var this__7716 = this;
    var this_sym7714__7717 = this;
    var node__7718 = this_sym7714__7717;
    return node__7718.cljs$core$ILookup$_lookup$arity$2(node__7718, k)
  };
  var G__7761__3 = function(this_sym7715, k, not_found) {
    var this__7716 = this;
    var this_sym7715__7719 = this;
    var node__7720 = this_sym7715__7719;
    return node__7720.cljs$core$ILookup$_lookup$arity$3(node__7720, k, not_found)
  };
  G__7761 = function(this_sym7715, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7761__2.call(this, this_sym7715, k);
      case 3:
        return G__7761__3.call(this, this_sym7715, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7761
}();
cljs.core.BlackNode.prototype.apply = function(this_sym7706, args7707) {
  var this__7721 = this;
  return this_sym7706.call.apply(this_sym7706, [this_sym7706].concat(args7707.slice()))
};
cljs.core.BlackNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__7722 = this;
  return cljs.core.PersistentVector.fromArray([this__7722.key, this__7722.val, o], true)
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__7723 = this;
  return this__7723.key
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__7724 = this;
  return this__7724.val
};
cljs.core.BlackNode.prototype.add_right = function(ins) {
  var this__7725 = this;
  var node__7726 = this;
  return ins.balance_right(node__7726)
};
cljs.core.BlackNode.prototype.redden = function() {
  var this__7727 = this;
  var node__7728 = this;
  return new cljs.core.RedNode(this__7727.key, this__7727.val, this__7727.left, this__7727.right, null)
};
cljs.core.BlackNode.prototype.remove_right = function(del) {
  var this__7729 = this;
  var node__7730 = this;
  return cljs.core.balance_right_del.call(null, this__7729.key, this__7729.val, this__7729.left, del)
};
cljs.core.BlackNode.prototype.replace = function(key, val, left, right) {
  var this__7731 = this;
  var node__7732 = this;
  return new cljs.core.BlackNode(key, val, left, right, null)
};
cljs.core.BlackNode.prototype.kv_reduce = function(f, init) {
  var this__7733 = this;
  var node__7734 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__7734, f, init)
};
cljs.core.BlackNode.prototype.remove_left = function(del) {
  var this__7735 = this;
  var node__7736 = this;
  return cljs.core.balance_left_del.call(null, this__7735.key, this__7735.val, del, this__7735.right)
};
cljs.core.BlackNode.prototype.add_left = function(ins) {
  var this__7737 = this;
  var node__7738 = this;
  return ins.balance_left(node__7738)
};
cljs.core.BlackNode.prototype.balance_left = function(parent) {
  var this__7739 = this;
  var node__7740 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, node__7740, parent.right, null)
};
cljs.core.BlackNode.prototype.toString = function() {
  var G__7762 = null;
  var G__7762__0 = function() {
    var this__7741 = this;
    var this__7743 = this;
    return cljs.core.pr_str.call(null, this__7743)
  };
  G__7762 = function() {
    switch(arguments.length) {
      case 0:
        return G__7762__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7762
}();
cljs.core.BlackNode.prototype.balance_right = function(parent) {
  var this__7744 = this;
  var node__7745 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__7745, null)
};
cljs.core.BlackNode.prototype.blacken = function() {
  var this__7746 = this;
  var node__7747 = this;
  return node__7747
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__7748 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__7749 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.BlackNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__7750 = this;
  return cljs.core.list.call(null, this__7750.key, this__7750.val)
};
cljs.core.BlackNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__7751 = this;
  return 2
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__7752 = this;
  return this__7752.val
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__7753 = this;
  return cljs.core.PersistentVector.fromArray([this__7753.key], true)
};
cljs.core.BlackNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__7754 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__7754.key, this__7754.val], true), n, v)
};
cljs.core.BlackNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7755 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.BlackNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__7756 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__7756.key, this__7756.val], true), meta)
};
cljs.core.BlackNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__7757 = this;
  return null
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__7758 = this;
  if(n === 0) {
    return this__7758.key
  }else {
    if(n === 1) {
      return this__7758.val
    }else {
      if("\ufdd0'else") {
        return null
      }else {
        return null
      }
    }
  }
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$3 = function(node, n, not_found) {
  var this__7759 = this;
  if(n === 0) {
    return this__7759.key
  }else {
    if(n === 1) {
      return this__7759.val
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.BlackNode.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(node) {
  var this__7760 = this;
  return cljs.core.PersistentVector.EMPTY
};
cljs.core.BlackNode;
cljs.core.RedNode = function(key, val, left, right, __hash) {
  this.key = key;
  this.val = val;
  this.left = left;
  this.right = right;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32402207
};
cljs.core.RedNode.cljs$lang$type = true;
cljs.core.RedNode.cljs$lang$ctorPrSeq = function(this__960__auto__) {
  return cljs.core.list.call(null, "cljs.core/RedNode")
};
cljs.core.RedNode.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__7765 = this;
  var h__843__auto____7766 = this__7765.__hash;
  if(!(h__843__auto____7766 == null)) {
    return h__843__auto____7766
  }else {
    var h__843__auto____7767 = cljs.core.hash_coll.call(null, coll);
    this__7765.__hash = h__843__auto____7767;
    return h__843__auto____7767
  }
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__7768 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, null)
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__7769 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, not_found)
};
cljs.core.RedNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__7770 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__7770.key, this__7770.val], true), k, v)
};
cljs.core.RedNode.prototype.call = function() {
  var G__7818 = null;
  var G__7818__2 = function(this_sym7771, k) {
    var this__7773 = this;
    var this_sym7771__7774 = this;
    var node__7775 = this_sym7771__7774;
    return node__7775.cljs$core$ILookup$_lookup$arity$2(node__7775, k)
  };
  var G__7818__3 = function(this_sym7772, k, not_found) {
    var this__7773 = this;
    var this_sym7772__7776 = this;
    var node__7777 = this_sym7772__7776;
    return node__7777.cljs$core$ILookup$_lookup$arity$3(node__7777, k, not_found)
  };
  G__7818 = function(this_sym7772, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7818__2.call(this, this_sym7772, k);
      case 3:
        return G__7818__3.call(this, this_sym7772, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7818
}();
cljs.core.RedNode.prototype.apply = function(this_sym7763, args7764) {
  var this__7778 = this;
  return this_sym7763.call.apply(this_sym7763, [this_sym7763].concat(args7764.slice()))
};
cljs.core.RedNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__7779 = this;
  return cljs.core.PersistentVector.fromArray([this__7779.key, this__7779.val, o], true)
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__7780 = this;
  return this__7780.key
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__7781 = this;
  return this__7781.val
};
cljs.core.RedNode.prototype.add_right = function(ins) {
  var this__7782 = this;
  var node__7783 = this;
  return new cljs.core.RedNode(this__7782.key, this__7782.val, this__7782.left, ins, null)
};
cljs.core.RedNode.prototype.redden = function() {
  var this__7784 = this;
  var node__7785 = this;
  throw new Error("red-black tree invariant violation");
};
cljs.core.RedNode.prototype.remove_right = function(del) {
  var this__7786 = this;
  var node__7787 = this;
  return new cljs.core.RedNode(this__7786.key, this__7786.val, this__7786.left, del, null)
};
cljs.core.RedNode.prototype.replace = function(key, val, left, right) {
  var this__7788 = this;
  var node__7789 = this;
  return new cljs.core.RedNode(key, val, left, right, null)
};
cljs.core.RedNode.prototype.kv_reduce = function(f, init) {
  var this__7790 = this;
  var node__7791 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__7791, f, init)
};
cljs.core.RedNode.prototype.remove_left = function(del) {
  var this__7792 = this;
  var node__7793 = this;
  return new cljs.core.RedNode(this__7792.key, this__7792.val, del, this__7792.right, null)
};
cljs.core.RedNode.prototype.add_left = function(ins) {
  var this__7794 = this;
  var node__7795 = this;
  return new cljs.core.RedNode(this__7794.key, this__7794.val, ins, this__7794.right, null)
};
cljs.core.RedNode.prototype.balance_left = function(parent) {
  var this__7796 = this;
  var node__7797 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__7796.left)) {
    return new cljs.core.RedNode(this__7796.key, this__7796.val, this__7796.left.blacken(), new cljs.core.BlackNode(parent.key, parent.val, this__7796.right, parent.right, null), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__7796.right)) {
      return new cljs.core.RedNode(this__7796.right.key, this__7796.right.val, new cljs.core.BlackNode(this__7796.key, this__7796.val, this__7796.left, this__7796.right.left, null), new cljs.core.BlackNode(parent.key, parent.val, this__7796.right.right, parent.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, node__7797, parent.right, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.toString = function() {
  var G__7819 = null;
  var G__7819__0 = function() {
    var this__7798 = this;
    var this__7800 = this;
    return cljs.core.pr_str.call(null, this__7800)
  };
  G__7819 = function() {
    switch(arguments.length) {
      case 0:
        return G__7819__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7819
}();
cljs.core.RedNode.prototype.balance_right = function(parent) {
  var this__7801 = this;
  var node__7802 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__7801.right)) {
    return new cljs.core.RedNode(this__7801.key, this__7801.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__7801.left, null), this__7801.right.blacken(), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__7801.left)) {
      return new cljs.core.RedNode(this__7801.left.key, this__7801.left.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__7801.left.left, null), new cljs.core.BlackNode(this__7801.key, this__7801.val, this__7801.left.right, this__7801.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__7802, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.blacken = function() {
  var this__7803 = this;
  var node__7804 = this;
  return new cljs.core.BlackNode(this__7803.key, this__7803.val, this__7803.left, this__7803.right, null)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__7805 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__7806 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.RedNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__7807 = this;
  return cljs.core.list.call(null, this__7807.key, this__7807.val)
};
cljs.core.RedNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__7808 = this;
  return 2
};
cljs.core.RedNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__7809 = this;
  return this__7809.val
};
cljs.core.RedNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__7810 = this;
  return cljs.core.PersistentVector.fromArray([this__7810.key], true)
};
cljs.core.RedNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__7811 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__7811.key, this__7811.val], true), n, v)
};
cljs.core.RedNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7812 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RedNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__7813 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__7813.key, this__7813.val], true), meta)
};
cljs.core.RedNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__7814 = this;
  return null
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__7815 = this;
  if(n === 0) {
    return this__7815.key
  }else {
    if(n === 1) {
      return this__7815.val
    }else {
      if("\ufdd0'else") {
        return null
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$3 = function(node, n, not_found) {
  var this__7816 = this;
  if(n === 0) {
    return this__7816.key
  }else {
    if(n === 1) {
      return this__7816.val
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(node) {
  var this__7817 = this;
  return cljs.core.PersistentVector.EMPTY
};
cljs.core.RedNode;
cljs.core.tree_map_add = function tree_map_add(comp, tree, k, v, found) {
  if(tree == null) {
    return new cljs.core.RedNode(k, v, null, null, null)
  }else {
    var c__7823 = comp.call(null, k, tree.key);
    if(c__7823 === 0) {
      found[0] = tree;
      return null
    }else {
      if(c__7823 < 0) {
        var ins__7824 = tree_map_add.call(null, comp, tree.left, k, v, found);
        if(!(ins__7824 == null)) {
          return tree.add_left(ins__7824)
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var ins__7825 = tree_map_add.call(null, comp, tree.right, k, v, found);
          if(!(ins__7825 == null)) {
            return tree.add_right(ins__7825)
          }else {
            return null
          }
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.tree_map_append = function tree_map_append(left, right) {
  if(left == null) {
    return right
  }else {
    if(right == null) {
      return left
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, left)) {
        if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right)) {
          var app__7828 = tree_map_append.call(null, left.right, right.left);
          if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__7828)) {
            return new cljs.core.RedNode(app__7828.key, app__7828.val, new cljs.core.RedNode(left.key, left.val, left.left, app__7828.left, null), new cljs.core.RedNode(right.key, right.val, app__7828.right, right.right, null), null)
          }else {
            return new cljs.core.RedNode(left.key, left.val, left.left, new cljs.core.RedNode(right.key, right.val, app__7828, right.right, null), null)
          }
        }else {
          return new cljs.core.RedNode(left.key, left.val, left.left, tree_map_append.call(null, left.right, right), null)
        }
      }else {
        if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right)) {
          return new cljs.core.RedNode(right.key, right.val, tree_map_append.call(null, left, right.left), right.right, null)
        }else {
          if("\ufdd0'else") {
            var app__7829 = tree_map_append.call(null, left.right, right.left);
            if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__7829)) {
              return new cljs.core.RedNode(app__7829.key, app__7829.val, new cljs.core.BlackNode(left.key, left.val, left.left, app__7829.left, null), new cljs.core.BlackNode(right.key, right.val, app__7829.right, right.right, null), null)
            }else {
              return cljs.core.balance_left_del.call(null, left.key, left.val, left.left, new cljs.core.BlackNode(right.key, right.val, app__7829, right.right, null))
            }
          }else {
            return null
          }
        }
      }
    }
  }
};
cljs.core.tree_map_remove = function tree_map_remove(comp, tree, k, found) {
  if(!(tree == null)) {
    var c__7835 = comp.call(null, k, tree.key);
    if(c__7835 === 0) {
      found[0] = tree;
      return cljs.core.tree_map_append.call(null, tree.left, tree.right)
    }else {
      if(c__7835 < 0) {
        var del__7836 = tree_map_remove.call(null, comp, tree.left, k, found);
        if(function() {
          var or__3824__auto____7837 = !(del__7836 == null);
          if(or__3824__auto____7837) {
            return or__3824__auto____7837
          }else {
            return!(found[0] == null)
          }
        }()) {
          if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.left)) {
            return cljs.core.balance_left_del.call(null, tree.key, tree.val, del__7836, tree.right)
          }else {
            return new cljs.core.RedNode(tree.key, tree.val, del__7836, tree.right, null)
          }
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var del__7838 = tree_map_remove.call(null, comp, tree.right, k, found);
          if(function() {
            var or__3824__auto____7839 = !(del__7838 == null);
            if(or__3824__auto____7839) {
              return or__3824__auto____7839
            }else {
              return!(found[0] == null)
            }
          }()) {
            if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.right)) {
              return cljs.core.balance_right_del.call(null, tree.key, tree.val, tree.left, del__7838)
            }else {
              return new cljs.core.RedNode(tree.key, tree.val, tree.left, del__7838, null)
            }
          }else {
            return null
          }
        }else {
          return null
        }
      }
    }
  }else {
    return null
  }
};
cljs.core.tree_map_replace = function tree_map_replace(comp, tree, k, v) {
  var tk__7842 = tree.key;
  var c__7843 = comp.call(null, k, tk__7842);
  if(c__7843 === 0) {
    return tree.replace(tk__7842, v, tree.left, tree.right)
  }else {
    if(c__7843 < 0) {
      return tree.replace(tk__7842, tree.val, tree_map_replace.call(null, comp, tree.left, k, v), tree.right)
    }else {
      if("\ufdd0'else") {
        return tree.replace(tk__7842, tree.val, tree.left, tree_map_replace.call(null, comp, tree.right, k, v))
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentTreeMap = function(comp, tree, cnt, meta, __hash) {
  this.comp = comp;
  this.tree = tree;
  this.cnt = cnt;
  this.meta = meta;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 418776847
};
cljs.core.PersistentTreeMap.cljs$lang$type = true;
cljs.core.PersistentTreeMap.cljs$lang$ctorPrSeq = function(this__960__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentTreeMap")
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__7846 = this;
  var h__843__auto____7847 = this__7846.__hash;
  if(!(h__843__auto____7847 == null)) {
    return h__843__auto____7847
  }else {
    var h__843__auto____7848 = cljs.core.hash_imap.call(null, coll);
    this__7846.__hash = h__843__auto____7848;
    return h__843__auto____7848
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__7849 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__7850 = this;
  var n__7851 = coll.entry_at(k);
  if(!(n__7851 == null)) {
    return n__7851.val
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__7852 = this;
  var found__7853 = [null];
  var t__7854 = cljs.core.tree_map_add.call(null, this__7852.comp, this__7852.tree, k, v, found__7853);
  if(t__7854 == null) {
    var found_node__7855 = cljs.core.nth.call(null, found__7853, 0);
    if(cljs.core._EQ_.call(null, v, found_node__7855.val)) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__7852.comp, cljs.core.tree_map_replace.call(null, this__7852.comp, this__7852.tree, k, v), this__7852.cnt, this__7852.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__7852.comp, t__7854.blacken(), this__7852.cnt + 1, this__7852.meta, null)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__7856 = this;
  return!(coll.entry_at(k) == null)
};
cljs.core.PersistentTreeMap.prototype.call = function() {
  var G__7890 = null;
  var G__7890__2 = function(this_sym7857, k) {
    var this__7859 = this;
    var this_sym7857__7860 = this;
    var coll__7861 = this_sym7857__7860;
    return coll__7861.cljs$core$ILookup$_lookup$arity$2(coll__7861, k)
  };
  var G__7890__3 = function(this_sym7858, k, not_found) {
    var this__7859 = this;
    var this_sym7858__7862 = this;
    var coll__7863 = this_sym7858__7862;
    return coll__7863.cljs$core$ILookup$_lookup$arity$3(coll__7863, k, not_found)
  };
  G__7890 = function(this_sym7858, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7890__2.call(this, this_sym7858, k);
      case 3:
        return G__7890__3.call(this, this_sym7858, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7890
}();
cljs.core.PersistentTreeMap.prototype.apply = function(this_sym7844, args7845) {
  var this__7864 = this;
  return this_sym7844.call.apply(this_sym7844, [this_sym7844].concat(args7845.slice()))
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__7865 = this;
  if(!(this__7865.tree == null)) {
    return cljs.core.tree_map_kv_reduce.call(null, this__7865.tree, f, init)
  }else {
    return init
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__7866 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__7867 = this;
  if(this__7867.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__7867.tree, false, this__7867.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.toString = function() {
  var this__7868 = this;
  var this__7869 = this;
  return cljs.core.pr_str.call(null, this__7869)
};
cljs.core.PersistentTreeMap.prototype.entry_at = function(k) {
  var this__7870 = this;
  var coll__7871 = this;
  var t__7872 = this__7870.tree;
  while(true) {
    if(!(t__7872 == null)) {
      var c__7873 = this__7870.comp.call(null, k, t__7872.key);
      if(c__7873 === 0) {
        return t__7872
      }else {
        if(c__7873 < 0) {
          var G__7891 = t__7872.left;
          t__7872 = G__7891;
          continue
        }else {
          if("\ufdd0'else") {
            var G__7892 = t__7872.right;
            t__7872 = G__7892;
            continue
          }else {
            return null
          }
        }
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var this__7874 = this;
  if(this__7874.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__7874.tree, ascending_QMARK_, this__7874.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__7875 = this;
  if(this__7875.cnt > 0) {
    var stack__7876 = null;
    var t__7877 = this__7875.tree;
    while(true) {
      if(!(t__7877 == null)) {
        var c__7878 = this__7875.comp.call(null, k, t__7877.key);
        if(c__7878 === 0) {
          return new cljs.core.PersistentTreeMapSeq(null, cljs.core.conj.call(null, stack__7876, t__7877), ascending_QMARK_, -1, null)
        }else {
          if(cljs.core.truth_(ascending_QMARK_)) {
            if(c__7878 < 0) {
              var G__7893 = cljs.core.conj.call(null, stack__7876, t__7877);
              var G__7894 = t__7877.left;
              stack__7876 = G__7893;
              t__7877 = G__7894;
              continue
            }else {
              var G__7895 = stack__7876;
              var G__7896 = t__7877.right;
              stack__7876 = G__7895;
              t__7877 = G__7896;
              continue
            }
          }else {
            if("\ufdd0'else") {
              if(c__7878 > 0) {
                var G__7897 = cljs.core.conj.call(null, stack__7876, t__7877);
                var G__7898 = t__7877.right;
                stack__7876 = G__7897;
                t__7877 = G__7898;
                continue
              }else {
                var G__7899 = stack__7876;
                var G__7900 = t__7877.left;
                stack__7876 = G__7899;
                t__7877 = G__7900;
                continue
              }
            }else {
              return null
            }
          }
        }
      }else {
        if(stack__7876 == null) {
          return new cljs.core.PersistentTreeMapSeq(null, stack__7876, ascending_QMARK_, -1, null)
        }else {
          return null
        }
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var this__7879 = this;
  return cljs.core.key.call(null, entry)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__7880 = this;
  return this__7880.comp
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7881 = this;
  if(this__7881.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__7881.tree, true, this__7881.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__7882 = this;
  return this__7882.cnt
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7883 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__7884 = this;
  return new cljs.core.PersistentTreeMap(this__7884.comp, this__7884.tree, this__7884.cnt, meta, this__7884.__hash)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7885 = this;
  return this__7885.meta
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7886 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeMap.EMPTY, this__7886.meta)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__7887 = this;
  var found__7888 = [null];
  var t__7889 = cljs.core.tree_map_remove.call(null, this__7887.comp, this__7887.tree, k, found__7888);
  if(t__7889 == null) {
    if(cljs.core.nth.call(null, found__7888, 0) == null) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__7887.comp, null, 0, this__7887.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__7887.comp, t__7889.blacken(), this__7887.cnt - 1, this__7887.meta, null)
  }
};
cljs.core.PersistentTreeMap;
cljs.core.PersistentTreeMap.EMPTY = new cljs.core.PersistentTreeMap(cljs.core.compare, null, 0, null, 0);
cljs.core.hash_map = function() {
  var hash_map__delegate = function(keyvals) {
    var in__7903 = cljs.core.seq.call(null, keyvals);
    var out__7904 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
    while(true) {
      if(in__7903) {
        var G__7905 = cljs.core.nnext.call(null, in__7903);
        var G__7906 = cljs.core.assoc_BANG_.call(null, out__7904, cljs.core.first.call(null, in__7903), cljs.core.second.call(null, in__7903));
        in__7903 = G__7905;
        out__7904 = G__7906;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out__7904)
      }
      break
    }
  };
  var hash_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return hash_map__delegate.call(this, keyvals)
  };
  hash_map.cljs$lang$maxFixedArity = 0;
  hash_map.cljs$lang$applyTo = function(arglist__7907) {
    var keyvals = cljs.core.seq(arglist__7907);
    return hash_map__delegate(keyvals)
  };
  hash_map.cljs$lang$arity$variadic = hash_map__delegate;
  return hash_map
}();
cljs.core.array_map = function() {
  var array_map__delegate = function(keyvals) {
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot.call(null, cljs.core.count.call(null, keyvals), 2), cljs.core.apply.call(null, cljs.core.array, keyvals), null)
  };
  var array_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return array_map__delegate.call(this, keyvals)
  };
  array_map.cljs$lang$maxFixedArity = 0;
  array_map.cljs$lang$applyTo = function(arglist__7908) {
    var keyvals = cljs.core.seq(arglist__7908);
    return array_map__delegate(keyvals)
  };
  array_map.cljs$lang$arity$variadic = array_map__delegate;
  return array_map
}();
cljs.core.obj_map = function() {
  var obj_map__delegate = function(keyvals) {
    var ks__7912 = [];
    var obj__7913 = {};
    var kvs__7914 = cljs.core.seq.call(null, keyvals);
    while(true) {
      if(kvs__7914) {
        ks__7912.push(cljs.core.first.call(null, kvs__7914));
        obj__7913[cljs.core.first.call(null, kvs__7914)] = cljs.core.second.call(null, kvs__7914);
        var G__7915 = cljs.core.nnext.call(null, kvs__7914);
        kvs__7914 = G__7915;
        continue
      }else {
        return cljs.core.ObjMap.fromObject.call(null, ks__7912, obj__7913)
      }
      break
    }
  };
  var obj_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return obj_map__delegate.call(this, keyvals)
  };
  obj_map.cljs$lang$maxFixedArity = 0;
  obj_map.cljs$lang$applyTo = function(arglist__7916) {
    var keyvals = cljs.core.seq(arglist__7916);
    return obj_map__delegate(keyvals)
  };
  obj_map.cljs$lang$arity$variadic = obj_map__delegate;
  return obj_map
}();
cljs.core.sorted_map = function() {
  var sorted_map__delegate = function(keyvals) {
    var in__7919 = cljs.core.seq.call(null, keyvals);
    var out__7920 = cljs.core.PersistentTreeMap.EMPTY;
    while(true) {
      if(in__7919) {
        var G__7921 = cljs.core.nnext.call(null, in__7919);
        var G__7922 = cljs.core.assoc.call(null, out__7920, cljs.core.first.call(null, in__7919), cljs.core.second.call(null, in__7919));
        in__7919 = G__7921;
        out__7920 = G__7922;
        continue
      }else {
        return out__7920
      }
      break
    }
  };
  var sorted_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return sorted_map__delegate.call(this, keyvals)
  };
  sorted_map.cljs$lang$maxFixedArity = 0;
  sorted_map.cljs$lang$applyTo = function(arglist__7923) {
    var keyvals = cljs.core.seq(arglist__7923);
    return sorted_map__delegate(keyvals)
  };
  sorted_map.cljs$lang$arity$variadic = sorted_map__delegate;
  return sorted_map
}();
cljs.core.sorted_map_by = function() {
  var sorted_map_by__delegate = function(comparator, keyvals) {
    var in__7926 = cljs.core.seq.call(null, keyvals);
    var out__7927 = new cljs.core.PersistentTreeMap(comparator, null, 0, null, 0);
    while(true) {
      if(in__7926) {
        var G__7928 = cljs.core.nnext.call(null, in__7926);
        var G__7929 = cljs.core.assoc.call(null, out__7927, cljs.core.first.call(null, in__7926), cljs.core.second.call(null, in__7926));
        in__7926 = G__7928;
        out__7927 = G__7929;
        continue
      }else {
        return out__7927
      }
      break
    }
  };
  var sorted_map_by = function(comparator, var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return sorted_map_by__delegate.call(this, comparator, keyvals)
  };
  sorted_map_by.cljs$lang$maxFixedArity = 1;
  sorted_map_by.cljs$lang$applyTo = function(arglist__7930) {
    var comparator = cljs.core.first(arglist__7930);
    var keyvals = cljs.core.rest(arglist__7930);
    return sorted_map_by__delegate(comparator, keyvals)
  };
  sorted_map_by.cljs$lang$arity$variadic = sorted_map_by__delegate;
  return sorted_map_by
}();
cljs.core.keys = function keys(hash_map) {
  return cljs.core.seq.call(null, cljs.core.map.call(null, cljs.core.first, hash_map))
};
cljs.core.key = function key(map_entry) {
  return cljs.core._key.call(null, map_entry)
};
cljs.core.vals = function vals(hash_map) {
  return cljs.core.seq.call(null, cljs.core.map.call(null, cljs.core.second, hash_map))
};
cljs.core.val = function val(map_entry) {
  return cljs.core._val.call(null, map_entry)
};
cljs.core.merge = function() {
  var merge__delegate = function(maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      return cljs.core.reduce.call(null, function(p1__7931_SHARP_, p2__7932_SHARP_) {
        return cljs.core.conj.call(null, function() {
          var or__3824__auto____7934 = p1__7931_SHARP_;
          if(cljs.core.truth_(or__3824__auto____7934)) {
            return or__3824__auto____7934
          }else {
            return cljs.core.ObjMap.EMPTY
          }
        }(), p2__7932_SHARP_)
      }, maps)
    }else {
      return null
    }
  };
  var merge = function(var_args) {
    var maps = null;
    if(goog.isDef(var_args)) {
      maps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return merge__delegate.call(this, maps)
  };
  merge.cljs$lang$maxFixedArity = 0;
  merge.cljs$lang$applyTo = function(arglist__7935) {
    var maps = cljs.core.seq(arglist__7935);
    return merge__delegate(maps)
  };
  merge.cljs$lang$arity$variadic = merge__delegate;
  return merge
}();
cljs.core.merge_with = function() {
  var merge_with__delegate = function(f, maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      var merge_entry__7943 = function(m, e) {
        var k__7941 = cljs.core.first.call(null, e);
        var v__7942 = cljs.core.second.call(null, e);
        if(cljs.core.contains_QMARK_.call(null, m, k__7941)) {
          return cljs.core.assoc.call(null, m, k__7941, f.call(null, cljs.core._lookup.call(null, m, k__7941, null), v__7942))
        }else {
          return cljs.core.assoc.call(null, m, k__7941, v__7942)
        }
      };
      var merge2__7945 = function(m1, m2) {
        return cljs.core.reduce.call(null, merge_entry__7943, function() {
          var or__3824__auto____7944 = m1;
          if(cljs.core.truth_(or__3824__auto____7944)) {
            return or__3824__auto____7944
          }else {
            return cljs.core.ObjMap.EMPTY
          }
        }(), cljs.core.seq.call(null, m2))
      };
      return cljs.core.reduce.call(null, merge2__7945, maps)
    }else {
      return null
    }
  };
  var merge_with = function(f, var_args) {
    var maps = null;
    if(goog.isDef(var_args)) {
      maps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return merge_with__delegate.call(this, f, maps)
  };
  merge_with.cljs$lang$maxFixedArity = 1;
  merge_with.cljs$lang$applyTo = function(arglist__7946) {
    var f = cljs.core.first(arglist__7946);
    var maps = cljs.core.rest(arglist__7946);
    return merge_with__delegate(f, maps)
  };
  merge_with.cljs$lang$arity$variadic = merge_with__delegate;
  return merge_with
}();
cljs.core.select_keys = function select_keys(map, keyseq) {
  var ret__7951 = cljs.core.ObjMap.EMPTY;
  var keys__7952 = cljs.core.seq.call(null, keyseq);
  while(true) {
    if(keys__7952) {
      var key__7953 = cljs.core.first.call(null, keys__7952);
      var entry__7954 = cljs.core._lookup.call(null, map, key__7953, "\ufdd0'user/not-found");
      var G__7955 = cljs.core.not_EQ_.call(null, entry__7954, "\ufdd0'user/not-found") ? cljs.core.assoc.call(null, ret__7951, key__7953, entry__7954) : ret__7951;
      var G__7956 = cljs.core.next.call(null, keys__7952);
      ret__7951 = G__7955;
      keys__7952 = G__7956;
      continue
    }else {
      return ret__7951
    }
    break
  }
};
cljs.core.PersistentHashSet = function(meta, hash_map, __hash) {
  this.meta = meta;
  this.hash_map = hash_map;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 15077647
};
cljs.core.PersistentHashSet.cljs$lang$type = true;
cljs.core.PersistentHashSet.cljs$lang$ctorPrSeq = function(this__960__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentHashSet")
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__7960 = this;
  return new cljs.core.TransientHashSet(cljs.core.transient$.call(null, this__7960.hash_map))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__7961 = this;
  var h__843__auto____7962 = this__7961.__hash;
  if(!(h__843__auto____7962 == null)) {
    return h__843__auto____7962
  }else {
    var h__843__auto____7963 = cljs.core.hash_iset.call(null, coll);
    this__7961.__hash = h__843__auto____7963;
    return h__843__auto____7963
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__7964 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, v, null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__7965 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__7965.hash_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentHashSet.prototype.call = function() {
  var G__7986 = null;
  var G__7986__2 = function(this_sym7966, k) {
    var this__7968 = this;
    var this_sym7966__7969 = this;
    var coll__7970 = this_sym7966__7969;
    return coll__7970.cljs$core$ILookup$_lookup$arity$2(coll__7970, k)
  };
  var G__7986__3 = function(this_sym7967, k, not_found) {
    var this__7968 = this;
    var this_sym7967__7971 = this;
    var coll__7972 = this_sym7967__7971;
    return coll__7972.cljs$core$ILookup$_lookup$arity$3(coll__7972, k, not_found)
  };
  G__7986 = function(this_sym7967, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7986__2.call(this, this_sym7967, k);
      case 3:
        return G__7986__3.call(this, this_sym7967, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7986
}();
cljs.core.PersistentHashSet.prototype.apply = function(this_sym7958, args7959) {
  var this__7973 = this;
  return this_sym7958.call.apply(this_sym7958, [this_sym7958].concat(args7959.slice()))
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7974 = this;
  return new cljs.core.PersistentHashSet(this__7974.meta, cljs.core.assoc.call(null, this__7974.hash_map, o, null), null)
};
cljs.core.PersistentHashSet.prototype.toString = function() {
  var this__7975 = this;
  var this__7976 = this;
  return cljs.core.pr_str.call(null, this__7976)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7977 = this;
  return cljs.core.keys.call(null, this__7977.hash_map)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__7978 = this;
  return new cljs.core.PersistentHashSet(this__7978.meta, cljs.core.dissoc.call(null, this__7978.hash_map, v), null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__7979 = this;
  return cljs.core.count.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7980 = this;
  var and__3822__auto____7981 = cljs.core.set_QMARK_.call(null, other);
  if(and__3822__auto____7981) {
    var and__3822__auto____7982 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3822__auto____7982) {
      return cljs.core.every_QMARK_.call(null, function(p1__7957_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__7957_SHARP_)
      }, other)
    }else {
      return and__3822__auto____7982
    }
  }else {
    return and__3822__auto____7981
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__7983 = this;
  return new cljs.core.PersistentHashSet(meta, this__7983.hash_map, this__7983.__hash)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7984 = this;
  return this__7984.meta
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7985 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentHashSet.EMPTY, this__7985.meta)
};
cljs.core.PersistentHashSet;
cljs.core.PersistentHashSet.EMPTY = new cljs.core.PersistentHashSet(null, cljs.core.hash_map.call(null), 0);
cljs.core.PersistentHashSet.fromArray = function(items) {
  var len__7987 = cljs.core.count.call(null, items);
  var i__7988 = 0;
  var out__7989 = cljs.core.transient$.call(null, cljs.core.PersistentHashSet.EMPTY);
  while(true) {
    if(i__7988 < len__7987) {
      var G__7990 = i__7988 + 1;
      var G__7991 = cljs.core.conj_BANG_.call(null, out__7989, items[i__7988]);
      i__7988 = G__7990;
      out__7989 = G__7991;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__7989)
    }
    break
  }
};
cljs.core.TransientHashSet = function(transient_map) {
  this.transient_map = transient_map;
  this.cljs$lang$protocol_mask$partition0$ = 259;
  this.cljs$lang$protocol_mask$partition1$ = 34
};
cljs.core.TransientHashSet.cljs$lang$type = true;
cljs.core.TransientHashSet.cljs$lang$ctorPrSeq = function(this__960__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientHashSet")
};
cljs.core.TransientHashSet.prototype.call = function() {
  var G__8009 = null;
  var G__8009__2 = function(this_sym7995, k) {
    var this__7997 = this;
    var this_sym7995__7998 = this;
    var tcoll__7999 = this_sym7995__7998;
    if(cljs.core._lookup.call(null, this__7997.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return null
    }else {
      return k
    }
  };
  var G__8009__3 = function(this_sym7996, k, not_found) {
    var this__7997 = this;
    var this_sym7996__8000 = this;
    var tcoll__8001 = this_sym7996__8000;
    if(cljs.core._lookup.call(null, this__7997.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return not_found
    }else {
      return k
    }
  };
  G__8009 = function(this_sym7996, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8009__2.call(this, this_sym7996, k);
      case 3:
        return G__8009__3.call(this, this_sym7996, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8009
}();
cljs.core.TransientHashSet.prototype.apply = function(this_sym7993, args7994) {
  var this__8002 = this;
  return this_sym7993.call.apply(this_sym7993, [this_sym7993].concat(args7994.slice()))
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, v) {
  var this__8003 = this;
  return tcoll.cljs$core$ILookup$_lookup$arity$3(tcoll, v, null)
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, v, not_found) {
  var this__8004 = this;
  if(cljs.core._lookup.call(null, this__8004.transient_map, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return not_found
  }else {
    return v
  }
};
cljs.core.TransientHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__8005 = this;
  return cljs.core.count.call(null, this__8005.transient_map)
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientSet$_disjoin_BANG_$arity$2 = function(tcoll, v) {
  var this__8006 = this;
  this__8006.transient_map = cljs.core.dissoc_BANG_.call(null, this__8006.transient_map, v);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__8007 = this;
  this__8007.transient_map = cljs.core.assoc_BANG_.call(null, this__8007.transient_map, o, null);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__8008 = this;
  return new cljs.core.PersistentHashSet(null, cljs.core.persistent_BANG_.call(null, this__8008.transient_map), null)
};
cljs.core.TransientHashSet;
cljs.core.PersistentTreeSet = function(meta, tree_map, __hash) {
  this.meta = meta;
  this.tree_map = tree_map;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 417730831
};
cljs.core.PersistentTreeSet.cljs$lang$type = true;
cljs.core.PersistentTreeSet.cljs$lang$ctorPrSeq = function(this__960__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentTreeSet")
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8012 = this;
  var h__843__auto____8013 = this__8012.__hash;
  if(!(h__843__auto____8013 == null)) {
    return h__843__auto____8013
  }else {
    var h__843__auto____8014 = cljs.core.hash_iset.call(null, coll);
    this__8012.__hash = h__843__auto____8014;
    return h__843__auto____8014
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__8015 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, v, null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__8016 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__8016.tree_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeSet.prototype.call = function() {
  var G__8042 = null;
  var G__8042__2 = function(this_sym8017, k) {
    var this__8019 = this;
    var this_sym8017__8020 = this;
    var coll__8021 = this_sym8017__8020;
    return coll__8021.cljs$core$ILookup$_lookup$arity$2(coll__8021, k)
  };
  var G__8042__3 = function(this_sym8018, k, not_found) {
    var this__8019 = this;
    var this_sym8018__8022 = this;
    var coll__8023 = this_sym8018__8022;
    return coll__8023.cljs$core$ILookup$_lookup$arity$3(coll__8023, k, not_found)
  };
  G__8042 = function(this_sym8018, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8042__2.call(this, this_sym8018, k);
      case 3:
        return G__8042__3.call(this, this_sym8018, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8042
}();
cljs.core.PersistentTreeSet.prototype.apply = function(this_sym8010, args8011) {
  var this__8024 = this;
  return this_sym8010.call.apply(this_sym8010, [this_sym8010].concat(args8011.slice()))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8025 = this;
  return new cljs.core.PersistentTreeSet(this__8025.meta, cljs.core.assoc.call(null, this__8025.tree_map, o, null), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__8026 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core.rseq.call(null, this__8026.tree_map))
};
cljs.core.PersistentTreeSet.prototype.toString = function() {
  var this__8027 = this;
  var this__8028 = this;
  return cljs.core.pr_str.call(null, this__8028)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var this__8029 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq.call(null, this__8029.tree_map, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__8030 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq_from.call(null, this__8030.tree_map, k, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var this__8031 = this;
  return entry
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__8032 = this;
  return cljs.core._comparator.call(null, this__8032.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8033 = this;
  return cljs.core.keys.call(null, this__8033.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__8034 = this;
  return new cljs.core.PersistentTreeSet(this__8034.meta, cljs.core.dissoc.call(null, this__8034.tree_map, v), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8035 = this;
  return cljs.core.count.call(null, this__8035.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8036 = this;
  var and__3822__auto____8037 = cljs.core.set_QMARK_.call(null, other);
  if(and__3822__auto____8037) {
    var and__3822__auto____8038 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3822__auto____8038) {
      return cljs.core.every_QMARK_.call(null, function(p1__7992_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__7992_SHARP_)
      }, other)
    }else {
      return and__3822__auto____8038
    }
  }else {
    return and__3822__auto____8037
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8039 = this;
  return new cljs.core.PersistentTreeSet(meta, this__8039.tree_map, this__8039.__hash)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8040 = this;
  return this__8040.meta
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8041 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeSet.EMPTY, this__8041.meta)
};
cljs.core.PersistentTreeSet;
cljs.core.PersistentTreeSet.EMPTY = new cljs.core.PersistentTreeSet(null, cljs.core.sorted_map.call(null), 0);
cljs.core.hash_set = function() {
  var hash_set = null;
  var hash_set__0 = function() {
    return cljs.core.PersistentHashSet.EMPTY
  };
  var hash_set__1 = function() {
    var G__8047__delegate = function(keys) {
      var in__8045 = cljs.core.seq.call(null, keys);
      var out__8046 = cljs.core.transient$.call(null, cljs.core.PersistentHashSet.EMPTY);
      while(true) {
        if(cljs.core.seq.call(null, in__8045)) {
          var G__8048 = cljs.core.next.call(null, in__8045);
          var G__8049 = cljs.core.conj_BANG_.call(null, out__8046, cljs.core.first.call(null, in__8045));
          in__8045 = G__8048;
          out__8046 = G__8049;
          continue
        }else {
          return cljs.core.persistent_BANG_.call(null, out__8046)
        }
        break
      }
    };
    var G__8047 = function(var_args) {
      var keys = null;
      if(goog.isDef(var_args)) {
        keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__8047__delegate.call(this, keys)
    };
    G__8047.cljs$lang$maxFixedArity = 0;
    G__8047.cljs$lang$applyTo = function(arglist__8050) {
      var keys = cljs.core.seq(arglist__8050);
      return G__8047__delegate(keys)
    };
    G__8047.cljs$lang$arity$variadic = G__8047__delegate;
    return G__8047
  }();
  hash_set = function(var_args) {
    var keys = var_args;
    switch(arguments.length) {
      case 0:
        return hash_set__0.call(this);
      default:
        return hash_set__1.cljs$lang$arity$variadic(cljs.core.array_seq(arguments, 0))
    }
    throw"Invalid arity: " + arguments.length;
  };
  hash_set.cljs$lang$maxFixedArity = 0;
  hash_set.cljs$lang$applyTo = hash_set__1.cljs$lang$applyTo;
  hash_set.cljs$lang$arity$0 = hash_set__0;
  hash_set.cljs$lang$arity$variadic = hash_set__1.cljs$lang$arity$variadic;
  return hash_set
}();
cljs.core.set = function set(coll) {
  return cljs.core.apply.call(null, cljs.core.hash_set, coll)
};
cljs.core.sorted_set = function() {
  var sorted_set__delegate = function(keys) {
    return cljs.core.reduce.call(null, cljs.core._conj, cljs.core.PersistentTreeSet.EMPTY, keys)
  };
  var sorted_set = function(var_args) {
    var keys = null;
    if(goog.isDef(var_args)) {
      keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return sorted_set__delegate.call(this, keys)
  };
  sorted_set.cljs$lang$maxFixedArity = 0;
  sorted_set.cljs$lang$applyTo = function(arglist__8051) {
    var keys = cljs.core.seq(arglist__8051);
    return sorted_set__delegate(keys)
  };
  sorted_set.cljs$lang$arity$variadic = sorted_set__delegate;
  return sorted_set
}();
cljs.core.sorted_set_by = function() {
  var sorted_set_by__delegate = function(comparator, keys) {
    return cljs.core.reduce.call(null, cljs.core._conj, new cljs.core.PersistentTreeSet(null, cljs.core.sorted_map_by.call(null, comparator), 0), keys)
  };
  var sorted_set_by = function(comparator, var_args) {
    var keys = null;
    if(goog.isDef(var_args)) {
      keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return sorted_set_by__delegate.call(this, comparator, keys)
  };
  sorted_set_by.cljs$lang$maxFixedArity = 1;
  sorted_set_by.cljs$lang$applyTo = function(arglist__8053) {
    var comparator = cljs.core.first(arglist__8053);
    var keys = cljs.core.rest(arglist__8053);
    return sorted_set_by__delegate(comparator, keys)
  };
  sorted_set_by.cljs$lang$arity$variadic = sorted_set_by__delegate;
  return sorted_set_by
}();
cljs.core.replace = function replace(smap, coll) {
  if(cljs.core.vector_QMARK_.call(null, coll)) {
    var n__8059 = cljs.core.count.call(null, coll);
    return cljs.core.reduce.call(null, function(v, i) {
      var temp__3971__auto____8060 = cljs.core.find.call(null, smap, cljs.core.nth.call(null, v, i));
      if(cljs.core.truth_(temp__3971__auto____8060)) {
        var e__8061 = temp__3971__auto____8060;
        return cljs.core.assoc.call(null, v, i, cljs.core.second.call(null, e__8061))
      }else {
        return v
      }
    }, coll, cljs.core.take.call(null, n__8059, cljs.core.iterate.call(null, cljs.core.inc, 0)))
  }else {
    return cljs.core.map.call(null, function(p1__8052_SHARP_) {
      var temp__3971__auto____8062 = cljs.core.find.call(null, smap, p1__8052_SHARP_);
      if(cljs.core.truth_(temp__3971__auto____8062)) {
        var e__8063 = temp__3971__auto____8062;
        return cljs.core.second.call(null, e__8063)
      }else {
        return p1__8052_SHARP_
      }
    }, coll)
  }
};
cljs.core.distinct = function distinct(coll) {
  var step__8093 = function step(xs, seen) {
    return new cljs.core.LazySeq(null, false, function() {
      return function(p__8086, seen) {
        while(true) {
          var vec__8087__8088 = p__8086;
          var f__8089 = cljs.core.nth.call(null, vec__8087__8088, 0, null);
          var xs__8090 = vec__8087__8088;
          var temp__3974__auto____8091 = cljs.core.seq.call(null, xs__8090);
          if(temp__3974__auto____8091) {
            var s__8092 = temp__3974__auto____8091;
            if(cljs.core.contains_QMARK_.call(null, seen, f__8089)) {
              var G__8094 = cljs.core.rest.call(null, s__8092);
              var G__8095 = seen;
              p__8086 = G__8094;
              seen = G__8095;
              continue
            }else {
              return cljs.core.cons.call(null, f__8089, step.call(null, cljs.core.rest.call(null, s__8092), cljs.core.conj.call(null, seen, f__8089)))
            }
          }else {
            return null
          }
          break
        }
      }.call(null, xs, seen)
    }, null)
  };
  return step__8093.call(null, coll, cljs.core.PersistentHashSet.EMPTY)
};
cljs.core.butlast = function butlast(s) {
  var ret__8098 = cljs.core.PersistentVector.EMPTY;
  var s__8099 = s;
  while(true) {
    if(cljs.core.next.call(null, s__8099)) {
      var G__8100 = cljs.core.conj.call(null, ret__8098, cljs.core.first.call(null, s__8099));
      var G__8101 = cljs.core.next.call(null, s__8099);
      ret__8098 = G__8100;
      s__8099 = G__8101;
      continue
    }else {
      return cljs.core.seq.call(null, ret__8098)
    }
    break
  }
};
cljs.core.name = function name(x) {
  if(cljs.core.string_QMARK_.call(null, x)) {
    return x
  }else {
    if(function() {
      var or__3824__auto____8104 = cljs.core.keyword_QMARK_.call(null, x);
      if(or__3824__auto____8104) {
        return or__3824__auto____8104
      }else {
        return cljs.core.symbol_QMARK_.call(null, x)
      }
    }()) {
      var i__8105 = x.lastIndexOf("/");
      if(i__8105 < 0) {
        return cljs.core.subs.call(null, x, 2)
      }else {
        return cljs.core.subs.call(null, x, i__8105 + 1)
      }
    }else {
      if("\ufdd0'else") {
        throw new Error([cljs.core.str("Doesn't support name: "), cljs.core.str(x)].join(""));
      }else {
        return null
      }
    }
  }
};
cljs.core.namespace = function namespace(x) {
  if(function() {
    var or__3824__auto____8108 = cljs.core.keyword_QMARK_.call(null, x);
    if(or__3824__auto____8108) {
      return or__3824__auto____8108
    }else {
      return cljs.core.symbol_QMARK_.call(null, x)
    }
  }()) {
    var i__8109 = x.lastIndexOf("/");
    if(i__8109 > -1) {
      return cljs.core.subs.call(null, x, 2, i__8109)
    }else {
      return null
    }
  }else {
    throw new Error([cljs.core.str("Doesn't support namespace: "), cljs.core.str(x)].join(""));
  }
};
cljs.core.zipmap = function zipmap(keys, vals) {
  var map__8116 = cljs.core.ObjMap.EMPTY;
  var ks__8117 = cljs.core.seq.call(null, keys);
  var vs__8118 = cljs.core.seq.call(null, vals);
  while(true) {
    if(function() {
      var and__3822__auto____8119 = ks__8117;
      if(and__3822__auto____8119) {
        return vs__8118
      }else {
        return and__3822__auto____8119
      }
    }()) {
      var G__8120 = cljs.core.assoc.call(null, map__8116, cljs.core.first.call(null, ks__8117), cljs.core.first.call(null, vs__8118));
      var G__8121 = cljs.core.next.call(null, ks__8117);
      var G__8122 = cljs.core.next.call(null, vs__8118);
      map__8116 = G__8120;
      ks__8117 = G__8121;
      vs__8118 = G__8122;
      continue
    }else {
      return map__8116
    }
    break
  }
};
cljs.core.max_key = function() {
  var max_key = null;
  var max_key__2 = function(k, x) {
    return x
  };
  var max_key__3 = function(k, x, y) {
    if(k.call(null, x) > k.call(null, y)) {
      return x
    }else {
      return y
    }
  };
  var max_key__4 = function() {
    var G__8125__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__8110_SHARP_, p2__8111_SHARP_) {
        return max_key.call(null, k, p1__8110_SHARP_, p2__8111_SHARP_)
      }, max_key.call(null, k, x, y), more)
    };
    var G__8125 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__8125__delegate.call(this, k, x, y, more)
    };
    G__8125.cljs$lang$maxFixedArity = 3;
    G__8125.cljs$lang$applyTo = function(arglist__8126) {
      var k = cljs.core.first(arglist__8126);
      var x = cljs.core.first(cljs.core.next(arglist__8126));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8126)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8126)));
      return G__8125__delegate(k, x, y, more)
    };
    G__8125.cljs$lang$arity$variadic = G__8125__delegate;
    return G__8125
  }();
  max_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return max_key__2.call(this, k, x);
      case 3:
        return max_key__3.call(this, k, x, y);
      default:
        return max_key__4.cljs$lang$arity$variadic(k, x, y, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  max_key.cljs$lang$maxFixedArity = 3;
  max_key.cljs$lang$applyTo = max_key__4.cljs$lang$applyTo;
  max_key.cljs$lang$arity$2 = max_key__2;
  max_key.cljs$lang$arity$3 = max_key__3;
  max_key.cljs$lang$arity$variadic = max_key__4.cljs$lang$arity$variadic;
  return max_key
}();
cljs.core.min_key = function() {
  var min_key = null;
  var min_key__2 = function(k, x) {
    return x
  };
  var min_key__3 = function(k, x, y) {
    if(k.call(null, x) < k.call(null, y)) {
      return x
    }else {
      return y
    }
  };
  var min_key__4 = function() {
    var G__8127__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__8123_SHARP_, p2__8124_SHARP_) {
        return min_key.call(null, k, p1__8123_SHARP_, p2__8124_SHARP_)
      }, min_key.call(null, k, x, y), more)
    };
    var G__8127 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__8127__delegate.call(this, k, x, y, more)
    };
    G__8127.cljs$lang$maxFixedArity = 3;
    G__8127.cljs$lang$applyTo = function(arglist__8128) {
      var k = cljs.core.first(arglist__8128);
      var x = cljs.core.first(cljs.core.next(arglist__8128));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8128)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8128)));
      return G__8127__delegate(k, x, y, more)
    };
    G__8127.cljs$lang$arity$variadic = G__8127__delegate;
    return G__8127
  }();
  min_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return min_key__2.call(this, k, x);
      case 3:
        return min_key__3.call(this, k, x, y);
      default:
        return min_key__4.cljs$lang$arity$variadic(k, x, y, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  min_key.cljs$lang$maxFixedArity = 3;
  min_key.cljs$lang$applyTo = min_key__4.cljs$lang$applyTo;
  min_key.cljs$lang$arity$2 = min_key__2;
  min_key.cljs$lang$arity$3 = min_key__3;
  min_key.cljs$lang$arity$variadic = min_key__4.cljs$lang$arity$variadic;
  return min_key
}();
cljs.core.partition_all = function() {
  var partition_all = null;
  var partition_all__2 = function(n, coll) {
    return partition_all.call(null, n, n, coll)
  };
  var partition_all__3 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____8131 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____8131) {
        var s__8132 = temp__3974__auto____8131;
        return cljs.core.cons.call(null, cljs.core.take.call(null, n, s__8132), partition_all.call(null, n, step, cljs.core.drop.call(null, step, s__8132)))
      }else {
        return null
      }
    }, null)
  };
  partition_all = function(n, step, coll) {
    switch(arguments.length) {
      case 2:
        return partition_all__2.call(this, n, step);
      case 3:
        return partition_all__3.call(this, n, step, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  partition_all.cljs$lang$arity$2 = partition_all__2;
  partition_all.cljs$lang$arity$3 = partition_all__3;
  return partition_all
}();
cljs.core.take_while = function take_while(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____8135 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____8135) {
      var s__8136 = temp__3974__auto____8135;
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, s__8136)))) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__8136), take_while.call(null, pred, cljs.core.rest.call(null, s__8136)))
      }else {
        return null
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.mk_bound_fn = function mk_bound_fn(sc, test, key) {
  return function(e) {
    var comp__8138 = cljs.core._comparator.call(null, sc);
    return test.call(null, comp__8138.call(null, cljs.core._entry_key.call(null, sc, e), key), 0)
  }
};
cljs.core.subseq = function() {
  var subseq = null;
  var subseq__3 = function(sc, test, key) {
    var include__8150 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.PersistentHashSet.fromArray([cljs.core._GT_, cljs.core._GT__EQ_]).call(null, test))) {
      var temp__3974__auto____8151 = cljs.core._sorted_seq_from.call(null, sc, key, true);
      if(cljs.core.truth_(temp__3974__auto____8151)) {
        var vec__8152__8153 = temp__3974__auto____8151;
        var e__8154 = cljs.core.nth.call(null, vec__8152__8153, 0, null);
        var s__8155 = vec__8152__8153;
        if(cljs.core.truth_(include__8150.call(null, e__8154))) {
          return s__8155
        }else {
          return cljs.core.next.call(null, s__8155)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__8150, cljs.core._sorted_seq.call(null, sc, true))
    }
  };
  var subseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3974__auto____8156 = cljs.core._sorted_seq_from.call(null, sc, start_key, true);
    if(cljs.core.truth_(temp__3974__auto____8156)) {
      var vec__8157__8158 = temp__3974__auto____8156;
      var e__8159 = cljs.core.nth.call(null, vec__8157__8158, 0, null);
      var s__8160 = vec__8157__8158;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, end_test, end_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, start_test, start_key).call(null, e__8159)) ? s__8160 : cljs.core.next.call(null, s__8160))
    }else {
      return null
    }
  };
  subseq = function(sc, start_test, start_key, end_test, end_key) {
    switch(arguments.length) {
      case 3:
        return subseq__3.call(this, sc, start_test, start_key);
      case 5:
        return subseq__5.call(this, sc, start_test, start_key, end_test, end_key)
    }
    throw"Invalid arity: " + arguments.length;
  };
  subseq.cljs$lang$arity$3 = subseq__3;
  subseq.cljs$lang$arity$5 = subseq__5;
  return subseq
}();
cljs.core.rsubseq = function() {
  var rsubseq = null;
  var rsubseq__3 = function(sc, test, key) {
    var include__8172 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.PersistentHashSet.fromArray([cljs.core._LT_, cljs.core._LT__EQ_]).call(null, test))) {
      var temp__3974__auto____8173 = cljs.core._sorted_seq_from.call(null, sc, key, false);
      if(cljs.core.truth_(temp__3974__auto____8173)) {
        var vec__8174__8175 = temp__3974__auto____8173;
        var e__8176 = cljs.core.nth.call(null, vec__8174__8175, 0, null);
        var s__8177 = vec__8174__8175;
        if(cljs.core.truth_(include__8172.call(null, e__8176))) {
          return s__8177
        }else {
          return cljs.core.next.call(null, s__8177)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__8172, cljs.core._sorted_seq.call(null, sc, false))
    }
  };
  var rsubseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3974__auto____8178 = cljs.core._sorted_seq_from.call(null, sc, end_key, false);
    if(cljs.core.truth_(temp__3974__auto____8178)) {
      var vec__8179__8180 = temp__3974__auto____8178;
      var e__8181 = cljs.core.nth.call(null, vec__8179__8180, 0, null);
      var s__8182 = vec__8179__8180;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, start_test, start_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, end_test, end_key).call(null, e__8181)) ? s__8182 : cljs.core.next.call(null, s__8182))
    }else {
      return null
    }
  };
  rsubseq = function(sc, start_test, start_key, end_test, end_key) {
    switch(arguments.length) {
      case 3:
        return rsubseq__3.call(this, sc, start_test, start_key);
      case 5:
        return rsubseq__5.call(this, sc, start_test, start_key, end_test, end_key)
    }
    throw"Invalid arity: " + arguments.length;
  };
  rsubseq.cljs$lang$arity$3 = rsubseq__3;
  rsubseq.cljs$lang$arity$5 = rsubseq__5;
  return rsubseq
}();
cljs.core.Range = function(meta, start, end, step, __hash) {
  this.meta = meta;
  this.start = start;
  this.end = end;
  this.step = step;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32375006
};
cljs.core.Range.cljs$lang$type = true;
cljs.core.Range.cljs$lang$ctorPrSeq = function(this__960__auto__) {
  return cljs.core.list.call(null, "cljs.core/Range")
};
cljs.core.Range.prototype.cljs$core$IHash$_hash$arity$1 = function(rng) {
  var this__8183 = this;
  var h__843__auto____8184 = this__8183.__hash;
  if(!(h__843__auto____8184 == null)) {
    return h__843__auto____8184
  }else {
    var h__843__auto____8185 = cljs.core.hash_coll.call(null, rng);
    this__8183.__hash = h__843__auto____8185;
    return h__843__auto____8185
  }
};
cljs.core.Range.prototype.cljs$core$INext$_next$arity$1 = function(rng) {
  var this__8186 = this;
  if(this__8186.step > 0) {
    if(this__8186.start + this__8186.step < this__8186.end) {
      return new cljs.core.Range(this__8186.meta, this__8186.start + this__8186.step, this__8186.end, this__8186.step, null)
    }else {
      return null
    }
  }else {
    if(this__8186.start + this__8186.step > this__8186.end) {
      return new cljs.core.Range(this__8186.meta, this__8186.start + this__8186.step, this__8186.end, this__8186.step, null)
    }else {
      return null
    }
  }
};
cljs.core.Range.prototype.cljs$core$ICollection$_conj$arity$2 = function(rng, o) {
  var this__8187 = this;
  return cljs.core.cons.call(null, o, rng)
};
cljs.core.Range.prototype.toString = function() {
  var this__8188 = this;
  var this__8189 = this;
  return cljs.core.pr_str.call(null, this__8189)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$2 = function(rng, f) {
  var this__8190 = this;
  return cljs.core.ci_reduce.call(null, rng, f)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$3 = function(rng, f, s) {
  var this__8191 = this;
  return cljs.core.ci_reduce.call(null, rng, f, s)
};
cljs.core.Range.prototype.cljs$core$ISeqable$_seq$arity$1 = function(rng) {
  var this__8192 = this;
  if(this__8192.step > 0) {
    if(this__8192.start < this__8192.end) {
      return rng
    }else {
      return null
    }
  }else {
    if(this__8192.start > this__8192.end) {
      return rng
    }else {
      return null
    }
  }
};
cljs.core.Range.prototype.cljs$core$ICounted$_count$arity$1 = function(rng) {
  var this__8193 = this;
  if(cljs.core.not.call(null, rng.cljs$core$ISeqable$_seq$arity$1(rng))) {
    return 0
  }else {
    return Math.ceil((this__8193.end - this__8193.start) / this__8193.step)
  }
};
cljs.core.Range.prototype.cljs$core$ISeq$_first$arity$1 = function(rng) {
  var this__8194 = this;
  return this__8194.start
};
cljs.core.Range.prototype.cljs$core$ISeq$_rest$arity$1 = function(rng) {
  var this__8195 = this;
  if(!(rng.cljs$core$ISeqable$_seq$arity$1(rng) == null)) {
    return new cljs.core.Range(this__8195.meta, this__8195.start + this__8195.step, this__8195.end, this__8195.step, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.Range.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(rng, other) {
  var this__8196 = this;
  return cljs.core.equiv_sequential.call(null, rng, other)
};
cljs.core.Range.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(rng, meta) {
  var this__8197 = this;
  return new cljs.core.Range(meta, this__8197.start, this__8197.end, this__8197.step, this__8197.__hash)
};
cljs.core.Range.prototype.cljs$core$IMeta$_meta$arity$1 = function(rng) {
  var this__8198 = this;
  return this__8198.meta
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$2 = function(rng, n) {
  var this__8199 = this;
  if(n < rng.cljs$core$ICounted$_count$arity$1(rng)) {
    return this__8199.start + n * this__8199.step
  }else {
    if(function() {
      var and__3822__auto____8200 = this__8199.start > this__8199.end;
      if(and__3822__auto____8200) {
        return this__8199.step === 0
      }else {
        return and__3822__auto____8200
      }
    }()) {
      return this__8199.start
    }else {
      throw new Error("Index out of bounds");
    }
  }
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$3 = function(rng, n, not_found) {
  var this__8201 = this;
  if(n < rng.cljs$core$ICounted$_count$arity$1(rng)) {
    return this__8201.start + n * this__8201.step
  }else {
    if(function() {
      var and__3822__auto____8202 = this__8201.start > this__8201.end;
      if(and__3822__auto____8202) {
        return this__8201.step === 0
      }else {
        return and__3822__auto____8202
      }
    }()) {
      return this__8201.start
    }else {
      return not_found
    }
  }
};
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(rng) {
  var this__8203 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__8203.meta)
};
cljs.core.Range;
cljs.core.range = function() {
  var range = null;
  var range__0 = function() {
    return range.call(null, 0, Number.MAX_VALUE, 1)
  };
  var range__1 = function(end) {
    return range.call(null, 0, end, 1)
  };
  var range__2 = function(start, end) {
    return range.call(null, start, end, 1)
  };
  var range__3 = function(start, end, step) {
    return new cljs.core.Range(null, start, end, step, null)
  };
  range = function(start, end, step) {
    switch(arguments.length) {
      case 0:
        return range__0.call(this);
      case 1:
        return range__1.call(this, start);
      case 2:
        return range__2.call(this, start, end);
      case 3:
        return range__3.call(this, start, end, step)
    }
    throw"Invalid arity: " + arguments.length;
  };
  range.cljs$lang$arity$0 = range__0;
  range.cljs$lang$arity$1 = range__1;
  range.cljs$lang$arity$2 = range__2;
  range.cljs$lang$arity$3 = range__3;
  return range
}();
cljs.core.take_nth = function take_nth(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____8206 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____8206) {
      var s__8207 = temp__3974__auto____8206;
      return cljs.core.cons.call(null, cljs.core.first.call(null, s__8207), take_nth.call(null, n, cljs.core.drop.call(null, n, s__8207)))
    }else {
      return null
    }
  }, null)
};
cljs.core.split_with = function split_with(pred, coll) {
  return cljs.core.PersistentVector.fromArray([cljs.core.take_while.call(null, pred, coll), cljs.core.drop_while.call(null, pred, coll)], true)
};
cljs.core.partition_by = function partition_by(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____8214 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____8214) {
      var s__8215 = temp__3974__auto____8214;
      var fst__8216 = cljs.core.first.call(null, s__8215);
      var fv__8217 = f.call(null, fst__8216);
      var run__8218 = cljs.core.cons.call(null, fst__8216, cljs.core.take_while.call(null, function(p1__8208_SHARP_) {
        return cljs.core._EQ_.call(null, fv__8217, f.call(null, p1__8208_SHARP_))
      }, cljs.core.next.call(null, s__8215)));
      return cljs.core.cons.call(null, run__8218, partition_by.call(null, f, cljs.core.seq.call(null, cljs.core.drop.call(null, cljs.core.count.call(null, run__8218), s__8215))))
    }else {
      return null
    }
  }, null)
};
cljs.core.frequencies = function frequencies(coll) {
  return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(counts, x) {
    return cljs.core.assoc_BANG_.call(null, counts, x, cljs.core._lookup.call(null, counts, x, 0) + 1)
  }, cljs.core.transient$.call(null, cljs.core.ObjMap.EMPTY), coll))
};
cljs.core.reductions = function() {
  var reductions = null;
  var reductions__2 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3971__auto____8233 = cljs.core.seq.call(null, coll);
      if(temp__3971__auto____8233) {
        var s__8234 = temp__3971__auto____8233;
        return reductions.call(null, f, cljs.core.first.call(null, s__8234), cljs.core.rest.call(null, s__8234))
      }else {
        return cljs.core.list.call(null, f.call(null))
      }
    }, null)
  };
  var reductions__3 = function(f, init, coll) {
    return cljs.core.cons.call(null, init, new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____8235 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____8235) {
        var s__8236 = temp__3974__auto____8235;
        return reductions.call(null, f, f.call(null, init, cljs.core.first.call(null, s__8236)), cljs.core.rest.call(null, s__8236))
      }else {
        return null
      }
    }, null))
  };
  reductions = function(f, init, coll) {
    switch(arguments.length) {
      case 2:
        return reductions__2.call(this, f, init);
      case 3:
        return reductions__3.call(this, f, init, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  reductions.cljs$lang$arity$2 = reductions__2;
  reductions.cljs$lang$arity$3 = reductions__3;
  return reductions
}();
cljs.core.juxt = function() {
  var juxt = null;
  var juxt__1 = function(f) {
    return function() {
      var G__8239 = null;
      var G__8239__0 = function() {
        return cljs.core.vector.call(null, f.call(null))
      };
      var G__8239__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x))
      };
      var G__8239__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y))
      };
      var G__8239__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z))
      };
      var G__8239__4 = function() {
        var G__8240__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args))
        };
        var G__8240 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8240__delegate.call(this, x, y, z, args)
        };
        G__8240.cljs$lang$maxFixedArity = 3;
        G__8240.cljs$lang$applyTo = function(arglist__8241) {
          var x = cljs.core.first(arglist__8241);
          var y = cljs.core.first(cljs.core.next(arglist__8241));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8241)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8241)));
          return G__8240__delegate(x, y, z, args)
        };
        G__8240.cljs$lang$arity$variadic = G__8240__delegate;
        return G__8240
      }();
      G__8239 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__8239__0.call(this);
          case 1:
            return G__8239__1.call(this, x);
          case 2:
            return G__8239__2.call(this, x, y);
          case 3:
            return G__8239__3.call(this, x, y, z);
          default:
            return G__8239__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__8239.cljs$lang$maxFixedArity = 3;
      G__8239.cljs$lang$applyTo = G__8239__4.cljs$lang$applyTo;
      return G__8239
    }()
  };
  var juxt__2 = function(f, g) {
    return function() {
      var G__8242 = null;
      var G__8242__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null))
      };
      var G__8242__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x))
      };
      var G__8242__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y))
      };
      var G__8242__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z))
      };
      var G__8242__4 = function() {
        var G__8243__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__8243 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8243__delegate.call(this, x, y, z, args)
        };
        G__8243.cljs$lang$maxFixedArity = 3;
        G__8243.cljs$lang$applyTo = function(arglist__8244) {
          var x = cljs.core.first(arglist__8244);
          var y = cljs.core.first(cljs.core.next(arglist__8244));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8244)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8244)));
          return G__8243__delegate(x, y, z, args)
        };
        G__8243.cljs$lang$arity$variadic = G__8243__delegate;
        return G__8243
      }();
      G__8242 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__8242__0.call(this);
          case 1:
            return G__8242__1.call(this, x);
          case 2:
            return G__8242__2.call(this, x, y);
          case 3:
            return G__8242__3.call(this, x, y, z);
          default:
            return G__8242__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__8242.cljs$lang$maxFixedArity = 3;
      G__8242.cljs$lang$applyTo = G__8242__4.cljs$lang$applyTo;
      return G__8242
    }()
  };
  var juxt__3 = function(f, g, h) {
    return function() {
      var G__8245 = null;
      var G__8245__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null), h.call(null))
      };
      var G__8245__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x), h.call(null, x))
      };
      var G__8245__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y), h.call(null, x, y))
      };
      var G__8245__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z), h.call(null, x, y, z))
      };
      var G__8245__4 = function() {
        var G__8246__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args), cljs.core.apply.call(null, h, x, y, z, args))
        };
        var G__8246 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8246__delegate.call(this, x, y, z, args)
        };
        G__8246.cljs$lang$maxFixedArity = 3;
        G__8246.cljs$lang$applyTo = function(arglist__8247) {
          var x = cljs.core.first(arglist__8247);
          var y = cljs.core.first(cljs.core.next(arglist__8247));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8247)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8247)));
          return G__8246__delegate(x, y, z, args)
        };
        G__8246.cljs$lang$arity$variadic = G__8246__delegate;
        return G__8246
      }();
      G__8245 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__8245__0.call(this);
          case 1:
            return G__8245__1.call(this, x);
          case 2:
            return G__8245__2.call(this, x, y);
          case 3:
            return G__8245__3.call(this, x, y, z);
          default:
            return G__8245__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__8245.cljs$lang$maxFixedArity = 3;
      G__8245.cljs$lang$applyTo = G__8245__4.cljs$lang$applyTo;
      return G__8245
    }()
  };
  var juxt__4 = function() {
    var G__8248__delegate = function(f, g, h, fs) {
      var fs__8238 = cljs.core.list_STAR_.call(null, f, g, h, fs);
      return function() {
        var G__8249 = null;
        var G__8249__0 = function() {
          return cljs.core.reduce.call(null, function(p1__8219_SHARP_, p2__8220_SHARP_) {
            return cljs.core.conj.call(null, p1__8219_SHARP_, p2__8220_SHARP_.call(null))
          }, cljs.core.PersistentVector.EMPTY, fs__8238)
        };
        var G__8249__1 = function(x) {
          return cljs.core.reduce.call(null, function(p1__8221_SHARP_, p2__8222_SHARP_) {
            return cljs.core.conj.call(null, p1__8221_SHARP_, p2__8222_SHARP_.call(null, x))
          }, cljs.core.PersistentVector.EMPTY, fs__8238)
        };
        var G__8249__2 = function(x, y) {
          return cljs.core.reduce.call(null, function(p1__8223_SHARP_, p2__8224_SHARP_) {
            return cljs.core.conj.call(null, p1__8223_SHARP_, p2__8224_SHARP_.call(null, x, y))
          }, cljs.core.PersistentVector.EMPTY, fs__8238)
        };
        var G__8249__3 = function(x, y, z) {
          return cljs.core.reduce.call(null, function(p1__8225_SHARP_, p2__8226_SHARP_) {
            return cljs.core.conj.call(null, p1__8225_SHARP_, p2__8226_SHARP_.call(null, x, y, z))
          }, cljs.core.PersistentVector.EMPTY, fs__8238)
        };
        var G__8249__4 = function() {
          var G__8250__delegate = function(x, y, z, args) {
            return cljs.core.reduce.call(null, function(p1__8227_SHARP_, p2__8228_SHARP_) {
              return cljs.core.conj.call(null, p1__8227_SHARP_, cljs.core.apply.call(null, p2__8228_SHARP_, x, y, z, args))
            }, cljs.core.PersistentVector.EMPTY, fs__8238)
          };
          var G__8250 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__8250__delegate.call(this, x, y, z, args)
          };
          G__8250.cljs$lang$maxFixedArity = 3;
          G__8250.cljs$lang$applyTo = function(arglist__8251) {
            var x = cljs.core.first(arglist__8251);
            var y = cljs.core.first(cljs.core.next(arglist__8251));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8251)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8251)));
            return G__8250__delegate(x, y, z, args)
          };
          G__8250.cljs$lang$arity$variadic = G__8250__delegate;
          return G__8250
        }();
        G__8249 = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return G__8249__0.call(this);
            case 1:
              return G__8249__1.call(this, x);
            case 2:
              return G__8249__2.call(this, x, y);
            case 3:
              return G__8249__3.call(this, x, y, z);
            default:
              return G__8249__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        G__8249.cljs$lang$maxFixedArity = 3;
        G__8249.cljs$lang$applyTo = G__8249__4.cljs$lang$applyTo;
        return G__8249
      }()
    };
    var G__8248 = function(f, g, h, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__8248__delegate.call(this, f, g, h, fs)
    };
    G__8248.cljs$lang$maxFixedArity = 3;
    G__8248.cljs$lang$applyTo = function(arglist__8252) {
      var f = cljs.core.first(arglist__8252);
      var g = cljs.core.first(cljs.core.next(arglist__8252));
      var h = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8252)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8252)));
      return G__8248__delegate(f, g, h, fs)
    };
    G__8248.cljs$lang$arity$variadic = G__8248__delegate;
    return G__8248
  }();
  juxt = function(f, g, h, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 1:
        return juxt__1.call(this, f);
      case 2:
        return juxt__2.call(this, f, g);
      case 3:
        return juxt__3.call(this, f, g, h);
      default:
        return juxt__4.cljs$lang$arity$variadic(f, g, h, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  juxt.cljs$lang$maxFixedArity = 3;
  juxt.cljs$lang$applyTo = juxt__4.cljs$lang$applyTo;
  juxt.cljs$lang$arity$1 = juxt__1;
  juxt.cljs$lang$arity$2 = juxt__2;
  juxt.cljs$lang$arity$3 = juxt__3;
  juxt.cljs$lang$arity$variadic = juxt__4.cljs$lang$arity$variadic;
  return juxt
}();
cljs.core.dorun = function() {
  var dorun = null;
  var dorun__1 = function(coll) {
    while(true) {
      if(cljs.core.seq.call(null, coll)) {
        var G__8255 = cljs.core.next.call(null, coll);
        coll = G__8255;
        continue
      }else {
        return null
      }
      break
    }
  };
  var dorun__2 = function(n, coll) {
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3822__auto____8254 = cljs.core.seq.call(null, coll);
        if(and__3822__auto____8254) {
          return n > 0
        }else {
          return and__3822__auto____8254
        }
      }())) {
        var G__8256 = n - 1;
        var G__8257 = cljs.core.next.call(null, coll);
        n = G__8256;
        coll = G__8257;
        continue
      }else {
        return null
      }
      break
    }
  };
  dorun = function(n, coll) {
    switch(arguments.length) {
      case 1:
        return dorun__1.call(this, n);
      case 2:
        return dorun__2.call(this, n, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  dorun.cljs$lang$arity$1 = dorun__1;
  dorun.cljs$lang$arity$2 = dorun__2;
  return dorun
}();
cljs.core.doall = function() {
  var doall = null;
  var doall__1 = function(coll) {
    cljs.core.dorun.call(null, coll);
    return coll
  };
  var doall__2 = function(n, coll) {
    cljs.core.dorun.call(null, n, coll);
    return coll
  };
  doall = function(n, coll) {
    switch(arguments.length) {
      case 1:
        return doall__1.call(this, n);
      case 2:
        return doall__2.call(this, n, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  doall.cljs$lang$arity$1 = doall__1;
  doall.cljs$lang$arity$2 = doall__2;
  return doall
}();
cljs.core.regexp_QMARK_ = function regexp_QMARK_(o) {
  return o instanceof RegExp
};
cljs.core.re_matches = function re_matches(re, s) {
  var matches__8259 = re.exec(s);
  if(cljs.core._EQ_.call(null, cljs.core.first.call(null, matches__8259), s)) {
    if(cljs.core.count.call(null, matches__8259) === 1) {
      return cljs.core.first.call(null, matches__8259)
    }else {
      return cljs.core.vec.call(null, matches__8259)
    }
  }else {
    return null
  }
};
cljs.core.re_find = function re_find(re, s) {
  var matches__8261 = re.exec(s);
  if(matches__8261 == null) {
    return null
  }else {
    if(cljs.core.count.call(null, matches__8261) === 1) {
      return cljs.core.first.call(null, matches__8261)
    }else {
      return cljs.core.vec.call(null, matches__8261)
    }
  }
};
cljs.core.re_seq = function re_seq(re, s) {
  var match_data__8266 = cljs.core.re_find.call(null, re, s);
  var match_idx__8267 = s.search(re);
  var match_str__8268 = cljs.core.coll_QMARK_.call(null, match_data__8266) ? cljs.core.first.call(null, match_data__8266) : match_data__8266;
  var post_match__8269 = cljs.core.subs.call(null, s, match_idx__8267 + cljs.core.count.call(null, match_str__8268));
  if(cljs.core.truth_(match_data__8266)) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, match_data__8266, re_seq.call(null, re, post_match__8269))
    }, null)
  }else {
    return null
  }
};
cljs.core.re_pattern = function re_pattern(s) {
  var vec__8276__8277 = cljs.core.re_find.call(null, /^(?:\(\?([idmsux]*)\))?(.*)/, s);
  var ___8278 = cljs.core.nth.call(null, vec__8276__8277, 0, null);
  var flags__8279 = cljs.core.nth.call(null, vec__8276__8277, 1, null);
  var pattern__8280 = cljs.core.nth.call(null, vec__8276__8277, 2, null);
  return new RegExp(pattern__8280, flags__8279)
};
cljs.core.pr_sequential = function pr_sequential(print_one, begin, sep, end, opts, coll) {
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray([begin], true), cljs.core.flatten1.call(null, cljs.core.interpose.call(null, cljs.core.PersistentVector.fromArray([sep], true), cljs.core.map.call(null, function(p1__8270_SHARP_) {
    return print_one.call(null, p1__8270_SHARP_, opts)
  }, coll))), cljs.core.PersistentVector.fromArray([end], true))
};
cljs.core.string_print = function string_print(x) {
  cljs.core._STAR_print_fn_STAR_.call(null, x);
  return null
};
cljs.core.flush = function flush() {
  return null
};
cljs.core.pr_seq = function pr_seq(obj, opts) {
  if(obj == null) {
    return cljs.core.list.call(null, "nil")
  }else {
    if(void 0 === obj) {
      return cljs.core.list.call(null, "#<undefined>")
    }else {
      if("\ufdd0'else") {
        return cljs.core.concat.call(null, cljs.core.truth_(function() {
          var and__3822__auto____8290 = cljs.core._lookup.call(null, opts, "\ufdd0'meta", null);
          if(cljs.core.truth_(and__3822__auto____8290)) {
            var and__3822__auto____8294 = function() {
              var G__8291__8292 = obj;
              if(G__8291__8292) {
                if(function() {
                  var or__3824__auto____8293 = G__8291__8292.cljs$lang$protocol_mask$partition0$ & 131072;
                  if(or__3824__auto____8293) {
                    return or__3824__auto____8293
                  }else {
                    return G__8291__8292.cljs$core$IMeta$
                  }
                }()) {
                  return true
                }else {
                  if(!G__8291__8292.cljs$lang$protocol_mask$partition0$) {
                    return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__8291__8292)
                  }else {
                    return false
                  }
                }
              }else {
                return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__8291__8292)
              }
            }();
            if(cljs.core.truth_(and__3822__auto____8294)) {
              return cljs.core.meta.call(null, obj)
            }else {
              return and__3822__auto____8294
            }
          }else {
            return and__3822__auto____8290
          }
        }()) ? cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["^"], true), pr_seq.call(null, cljs.core.meta.call(null, obj), opts), cljs.core.PersistentVector.fromArray([" "], true)) : null, function() {
          var and__3822__auto____8295 = !(obj == null);
          if(and__3822__auto____8295) {
            return obj.cljs$lang$type
          }else {
            return and__3822__auto____8295
          }
        }() ? obj.cljs$lang$ctorPrSeq(obj) : function() {
          var G__8296__8297 = obj;
          if(G__8296__8297) {
            if(function() {
              var or__3824__auto____8298 = G__8296__8297.cljs$lang$protocol_mask$partition0$ & 536870912;
              if(or__3824__auto____8298) {
                return or__3824__auto____8298
              }else {
                return G__8296__8297.cljs$core$IPrintable$
              }
            }()) {
              return true
            }else {
              if(!G__8296__8297.cljs$lang$protocol_mask$partition0$) {
                return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__8296__8297)
              }else {
                return false
              }
            }
          }else {
            return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__8296__8297)
          }
        }() ? cljs.core._pr_seq.call(null, obj, opts) : cljs.core.truth_(cljs.core.regexp_QMARK_.call(null, obj)) ? cljs.core.list.call(null, '#"', obj.source, '"') : "\ufdd0'else" ? cljs.core.list.call(null, "#<", [cljs.core.str(obj)].join(""), ">") : null)
      }else {
        return null
      }
    }
  }
};
cljs.core.pr_sb = function pr_sb(objs, opts) {
  var sb__8318 = new goog.string.StringBuffer;
  var G__8319__8320 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, cljs.core.first.call(null, objs), opts));
  if(G__8319__8320) {
    var string__8321 = cljs.core.first.call(null, G__8319__8320);
    var G__8319__8322 = G__8319__8320;
    while(true) {
      sb__8318.append(string__8321);
      var temp__3974__auto____8323 = cljs.core.next.call(null, G__8319__8322);
      if(temp__3974__auto____8323) {
        var G__8319__8324 = temp__3974__auto____8323;
        var G__8337 = cljs.core.first.call(null, G__8319__8324);
        var G__8338 = G__8319__8324;
        string__8321 = G__8337;
        G__8319__8322 = G__8338;
        continue
      }else {
      }
      break
    }
  }else {
  }
  var G__8325__8326 = cljs.core.seq.call(null, cljs.core.next.call(null, objs));
  if(G__8325__8326) {
    var obj__8327 = cljs.core.first.call(null, G__8325__8326);
    var G__8325__8328 = G__8325__8326;
    while(true) {
      sb__8318.append(" ");
      var G__8329__8330 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__8327, opts));
      if(G__8329__8330) {
        var string__8331 = cljs.core.first.call(null, G__8329__8330);
        var G__8329__8332 = G__8329__8330;
        while(true) {
          sb__8318.append(string__8331);
          var temp__3974__auto____8333 = cljs.core.next.call(null, G__8329__8332);
          if(temp__3974__auto____8333) {
            var G__8329__8334 = temp__3974__auto____8333;
            var G__8339 = cljs.core.first.call(null, G__8329__8334);
            var G__8340 = G__8329__8334;
            string__8331 = G__8339;
            G__8329__8332 = G__8340;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3974__auto____8335 = cljs.core.next.call(null, G__8325__8328);
      if(temp__3974__auto____8335) {
        var G__8325__8336 = temp__3974__auto____8335;
        var G__8341 = cljs.core.first.call(null, G__8325__8336);
        var G__8342 = G__8325__8336;
        obj__8327 = G__8341;
        G__8325__8328 = G__8342;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return sb__8318
};
cljs.core.pr_str_with_opts = function pr_str_with_opts(objs, opts) {
  return[cljs.core.str(cljs.core.pr_sb.call(null, objs, opts))].join("")
};
cljs.core.prn_str_with_opts = function prn_str_with_opts(objs, opts) {
  var sb__8344 = cljs.core.pr_sb.call(null, objs, opts);
  sb__8344.append("\n");
  return[cljs.core.str(sb__8344)].join("")
};
cljs.core.pr_with_opts = function pr_with_opts(objs, opts) {
  var G__8363__8364 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, cljs.core.first.call(null, objs), opts));
  if(G__8363__8364) {
    var string__8365 = cljs.core.first.call(null, G__8363__8364);
    var G__8363__8366 = G__8363__8364;
    while(true) {
      cljs.core.string_print.call(null, string__8365);
      var temp__3974__auto____8367 = cljs.core.next.call(null, G__8363__8366);
      if(temp__3974__auto____8367) {
        var G__8363__8368 = temp__3974__auto____8367;
        var G__8381 = cljs.core.first.call(null, G__8363__8368);
        var G__8382 = G__8363__8368;
        string__8365 = G__8381;
        G__8363__8366 = G__8382;
        continue
      }else {
      }
      break
    }
  }else {
  }
  var G__8369__8370 = cljs.core.seq.call(null, cljs.core.next.call(null, objs));
  if(G__8369__8370) {
    var obj__8371 = cljs.core.first.call(null, G__8369__8370);
    var G__8369__8372 = G__8369__8370;
    while(true) {
      cljs.core.string_print.call(null, " ");
      var G__8373__8374 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__8371, opts));
      if(G__8373__8374) {
        var string__8375 = cljs.core.first.call(null, G__8373__8374);
        var G__8373__8376 = G__8373__8374;
        while(true) {
          cljs.core.string_print.call(null, string__8375);
          var temp__3974__auto____8377 = cljs.core.next.call(null, G__8373__8376);
          if(temp__3974__auto____8377) {
            var G__8373__8378 = temp__3974__auto____8377;
            var G__8383 = cljs.core.first.call(null, G__8373__8378);
            var G__8384 = G__8373__8378;
            string__8375 = G__8383;
            G__8373__8376 = G__8384;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3974__auto____8379 = cljs.core.next.call(null, G__8369__8372);
      if(temp__3974__auto____8379) {
        var G__8369__8380 = temp__3974__auto____8379;
        var G__8385 = cljs.core.first.call(null, G__8369__8380);
        var G__8386 = G__8369__8380;
        obj__8371 = G__8385;
        G__8369__8372 = G__8386;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.newline = function newline(opts) {
  cljs.core.string_print.call(null, "\n");
  if(cljs.core.truth_(cljs.core._lookup.call(null, opts, "\ufdd0'flush-on-newline", null))) {
    return cljs.core.flush.call(null)
  }else {
    return null
  }
};
cljs.core._STAR_flush_on_newline_STAR_ = true;
cljs.core._STAR_print_readably_STAR_ = true;
cljs.core._STAR_print_meta_STAR_ = false;
cljs.core._STAR_print_dup_STAR_ = false;
cljs.core.pr_opts = function pr_opts() {
  return cljs.core.ObjMap.fromObject(["\ufdd0'flush-on-newline", "\ufdd0'readably", "\ufdd0'meta", "\ufdd0'dup"], {"\ufdd0'flush-on-newline":cljs.core._STAR_flush_on_newline_STAR_, "\ufdd0'readably":cljs.core._STAR_print_readably_STAR_, "\ufdd0'meta":cljs.core._STAR_print_meta_STAR_, "\ufdd0'dup":cljs.core._STAR_print_dup_STAR_})
};
cljs.core.pr_str = function() {
  var pr_str__delegate = function(objs) {
    return cljs.core.pr_str_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var pr_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return pr_str__delegate.call(this, objs)
  };
  pr_str.cljs$lang$maxFixedArity = 0;
  pr_str.cljs$lang$applyTo = function(arglist__8387) {
    var objs = cljs.core.seq(arglist__8387);
    return pr_str__delegate(objs)
  };
  pr_str.cljs$lang$arity$variadic = pr_str__delegate;
  return pr_str
}();
cljs.core.prn_str = function() {
  var prn_str__delegate = function(objs) {
    return cljs.core.prn_str_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var prn_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return prn_str__delegate.call(this, objs)
  };
  prn_str.cljs$lang$maxFixedArity = 0;
  prn_str.cljs$lang$applyTo = function(arglist__8388) {
    var objs = cljs.core.seq(arglist__8388);
    return prn_str__delegate(objs)
  };
  prn_str.cljs$lang$arity$variadic = prn_str__delegate;
  return prn_str
}();
cljs.core.pr = function() {
  var pr__delegate = function(objs) {
    return cljs.core.pr_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var pr = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return pr__delegate.call(this, objs)
  };
  pr.cljs$lang$maxFixedArity = 0;
  pr.cljs$lang$applyTo = function(arglist__8389) {
    var objs = cljs.core.seq(arglist__8389);
    return pr__delegate(objs)
  };
  pr.cljs$lang$arity$variadic = pr__delegate;
  return pr
}();
cljs.core.print = function() {
  var cljs_core_print__delegate = function(objs) {
    return cljs.core.pr_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var cljs_core_print = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return cljs_core_print__delegate.call(this, objs)
  };
  cljs_core_print.cljs$lang$maxFixedArity = 0;
  cljs_core_print.cljs$lang$applyTo = function(arglist__8390) {
    var objs = cljs.core.seq(arglist__8390);
    return cljs_core_print__delegate(objs)
  };
  cljs_core_print.cljs$lang$arity$variadic = cljs_core_print__delegate;
  return cljs_core_print
}();
cljs.core.print_str = function() {
  var print_str__delegate = function(objs) {
    return cljs.core.pr_str_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var print_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return print_str__delegate.call(this, objs)
  };
  print_str.cljs$lang$maxFixedArity = 0;
  print_str.cljs$lang$applyTo = function(arglist__8391) {
    var objs = cljs.core.seq(arglist__8391);
    return print_str__delegate(objs)
  };
  print_str.cljs$lang$arity$variadic = print_str__delegate;
  return print_str
}();
cljs.core.println = function() {
  var println__delegate = function(objs) {
    cljs.core.pr_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false));
    return cljs.core.newline.call(null, cljs.core.pr_opts.call(null))
  };
  var println = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return println__delegate.call(this, objs)
  };
  println.cljs$lang$maxFixedArity = 0;
  println.cljs$lang$applyTo = function(arglist__8392) {
    var objs = cljs.core.seq(arglist__8392);
    return println__delegate(objs)
  };
  println.cljs$lang$arity$variadic = println__delegate;
  return println
}();
cljs.core.println_str = function() {
  var println_str__delegate = function(objs) {
    return cljs.core.prn_str_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var println_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return println_str__delegate.call(this, objs)
  };
  println_str.cljs$lang$maxFixedArity = 0;
  println_str.cljs$lang$applyTo = function(arglist__8393) {
    var objs = cljs.core.seq(arglist__8393);
    return println_str__delegate(objs)
  };
  println_str.cljs$lang$arity$variadic = println_str__delegate;
  return println_str
}();
cljs.core.prn = function() {
  var prn__delegate = function(objs) {
    cljs.core.pr_with_opts.call(null, objs, cljs.core.pr_opts.call(null));
    return cljs.core.newline.call(null, cljs.core.pr_opts.call(null))
  };
  var prn = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return prn__delegate.call(this, objs)
  };
  prn.cljs$lang$maxFixedArity = 0;
  prn.cljs$lang$applyTo = function(arglist__8394) {
    var objs = cljs.core.seq(arglist__8394);
    return prn__delegate(objs)
  };
  prn.cljs$lang$arity$variadic = prn__delegate;
  return prn
}();
cljs.core.printf = function() {
  var printf__delegate = function(fmt, args) {
    return cljs.core.print.call(null, cljs.core.apply.call(null, cljs.core.format, fmt, args))
  };
  var printf = function(fmt, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return printf__delegate.call(this, fmt, args)
  };
  printf.cljs$lang$maxFixedArity = 1;
  printf.cljs$lang$applyTo = function(arglist__8395) {
    var fmt = cljs.core.first(arglist__8395);
    var args = cljs.core.rest(arglist__8395);
    return printf__delegate(fmt, args)
  };
  printf.cljs$lang$arity$variadic = printf__delegate;
  return printf
}();
cljs.core.HashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.HashMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__8396 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__8396, "{", ", ", "}", opts, coll)
};
cljs.core.IPrintable["number"] = true;
cljs.core._pr_seq["number"] = function(n, opts) {
  return cljs.core.list.call(null, [cljs.core.str(n)].join(""))
};
cljs.core.IndexedSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Subvec.prototype.cljs$core$IPrintable$ = true;
cljs.core.Subvec.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.ChunkedCons.prototype.cljs$core$IPrintable$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__8397 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__8397, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__8398 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__8398, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentQueue.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#queue [", " ", "]", opts, cljs.core.seq.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.LazySeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.RSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.RSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#{", " ", "}", opts, coll)
};
cljs.core.IPrintable["boolean"] = true;
cljs.core._pr_seq["boolean"] = function(bool, opts) {
  return cljs.core.list.call(null, [cljs.core.str(bool)].join(""))
};
cljs.core.IPrintable["string"] = true;
cljs.core._pr_seq["string"] = function(obj, opts) {
  if(cljs.core.keyword_QMARK_.call(null, obj)) {
    return cljs.core.list.call(null, [cljs.core.str(":"), cljs.core.str(function() {
      var temp__3974__auto____8399 = cljs.core.namespace.call(null, obj);
      if(cljs.core.truth_(temp__3974__auto____8399)) {
        var nspc__8400 = temp__3974__auto____8399;
        return[cljs.core.str(nspc__8400), cljs.core.str("/")].join("")
      }else {
        return null
      }
    }()), cljs.core.str(cljs.core.name.call(null, obj))].join(""))
  }else {
    if(cljs.core.symbol_QMARK_.call(null, obj)) {
      return cljs.core.list.call(null, [cljs.core.str(function() {
        var temp__3974__auto____8401 = cljs.core.namespace.call(null, obj);
        if(cljs.core.truth_(temp__3974__auto____8401)) {
          var nspc__8402 = temp__3974__auto____8401;
          return[cljs.core.str(nspc__8402), cljs.core.str("/")].join("")
        }else {
          return null
        }
      }()), cljs.core.str(cljs.core.name.call(null, obj))].join(""))
    }else {
      if("\ufdd0'else") {
        return cljs.core.list.call(null, cljs.core.truth_((new cljs.core.Keyword("\ufdd0'readably")).call(null, opts)) ? goog.string.quote(obj) : obj)
      }else {
        return null
      }
    }
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.RedNode.prototype.cljs$core$IPrintable$ = true;
cljs.core.RedNode.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__8403 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__8403, "{", ", ", "}", opts, coll)
};
cljs.core.Vector.prototype.cljs$core$IPrintable$ = true;
cljs.core.Vector.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#{", " ", "}", opts, coll)
};
cljs.core.PersistentVector.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.List.prototype.cljs$core$IPrintable$ = true;
cljs.core.List.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.IPrintable["array"] = true;
cljs.core._pr_seq["array"] = function(a, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#<Array [", ", ", "]>", opts, a)
};
cljs.core.IPrintable["function"] = true;
cljs.core._pr_seq["function"] = function(this$) {
  return cljs.core.list.call(null, "#<", [cljs.core.str(this$)].join(""), ">")
};
cljs.core.EmptyList.prototype.cljs$core$IPrintable$ = true;
cljs.core.EmptyList.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.list.call(null, "()")
};
cljs.core.BlackNode.prototype.cljs$core$IPrintable$ = true;
cljs.core.BlackNode.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
Date.prototype.cljs$core$IPrintable$ = true;
Date.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(d, _) {
  var normalize__8405 = function(n, len) {
    var ns__8404 = [cljs.core.str(n)].join("");
    while(true) {
      if(cljs.core.count.call(null, ns__8404) < len) {
        var G__8407 = [cljs.core.str("0"), cljs.core.str(ns__8404)].join("");
        ns__8404 = G__8407;
        continue
      }else {
        return ns__8404
      }
      break
    }
  };
  return cljs.core.list.call(null, [cljs.core.str('#inst "'), cljs.core.str(d.getUTCFullYear()), cljs.core.str("-"), cljs.core.str(normalize__8405.call(null, d.getUTCMonth() + 1, 2)), cljs.core.str("-"), cljs.core.str(normalize__8405.call(null, d.getUTCDate(), 2)), cljs.core.str("T"), cljs.core.str(normalize__8405.call(null, d.getUTCHours(), 2)), cljs.core.str(":"), cljs.core.str(normalize__8405.call(null, d.getUTCMinutes(), 2)), cljs.core.str(":"), cljs.core.str(normalize__8405.call(null, d.getUTCSeconds(), 
  2)), cljs.core.str("."), cljs.core.str(normalize__8405.call(null, d.getUTCMilliseconds(), 3)), cljs.core.str("-"), cljs.core.str('00:00"')].join(""))
};
cljs.core.Cons.prototype.cljs$core$IPrintable$ = true;
cljs.core.Cons.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Range.prototype.cljs$core$IPrintable$ = true;
cljs.core.Range.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.ObjMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.ObjMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__8406 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__8406, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentVector.prototype.cljs$core$IComparable$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IComparable$_compare$arity$2 = function(x, y) {
  return cljs.core.compare_indexed.call(null, x, y)
};
cljs.core.Atom = function(state, meta, validator, watches) {
  this.state = state;
  this.meta = meta;
  this.validator = validator;
  this.watches = watches;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2690809856
};
cljs.core.Atom.cljs$lang$type = true;
cljs.core.Atom.cljs$lang$ctorPrSeq = function(this__960__auto__) {
  return cljs.core.list.call(null, "cljs.core/Atom")
};
cljs.core.Atom.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__8408 = this;
  return goog.getUid(this$)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_notify_watches$arity$3 = function(this$, oldval, newval) {
  var this__8409 = this;
  var G__8410__8411 = cljs.core.seq.call(null, this__8409.watches);
  if(G__8410__8411) {
    var G__8413__8415 = cljs.core.first.call(null, G__8410__8411);
    var vec__8414__8416 = G__8413__8415;
    var key__8417 = cljs.core.nth.call(null, vec__8414__8416, 0, null);
    var f__8418 = cljs.core.nth.call(null, vec__8414__8416, 1, null);
    var G__8410__8419 = G__8410__8411;
    var G__8413__8420 = G__8413__8415;
    var G__8410__8421 = G__8410__8419;
    while(true) {
      var vec__8422__8423 = G__8413__8420;
      var key__8424 = cljs.core.nth.call(null, vec__8422__8423, 0, null);
      var f__8425 = cljs.core.nth.call(null, vec__8422__8423, 1, null);
      var G__8410__8426 = G__8410__8421;
      f__8425.call(null, key__8424, this$, oldval, newval);
      var temp__3974__auto____8427 = cljs.core.next.call(null, G__8410__8426);
      if(temp__3974__auto____8427) {
        var G__8410__8428 = temp__3974__auto____8427;
        var G__8435 = cljs.core.first.call(null, G__8410__8428);
        var G__8436 = G__8410__8428;
        G__8413__8420 = G__8435;
        G__8410__8421 = G__8436;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_add_watch$arity$3 = function(this$, key, f) {
  var this__8429 = this;
  return this$.watches = cljs.core.assoc.call(null, this__8429.watches, key, f)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_remove_watch$arity$2 = function(this$, key) {
  var this__8430 = this;
  return this$.watches = cljs.core.dissoc.call(null, this__8430.watches, key)
};
cljs.core.Atom.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(a, opts) {
  var this__8431 = this;
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["#<Atom: "], true), cljs.core._pr_seq.call(null, this__8431.state, opts), ">")
};
cljs.core.Atom.prototype.cljs$core$IMeta$_meta$arity$1 = function(_) {
  var this__8432 = this;
  return this__8432.meta
};
cljs.core.Atom.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__8433 = this;
  return this__8433.state
};
cljs.core.Atom.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var this__8434 = this;
  return o === other
};
cljs.core.Atom;
cljs.core.atom = function() {
  var atom = null;
  var atom__1 = function(x) {
    return new cljs.core.Atom(x, null, null, null)
  };
  var atom__2 = function() {
    var G__8448__delegate = function(x, p__8437) {
      var map__8443__8444 = p__8437;
      var map__8443__8445 = cljs.core.seq_QMARK_.call(null, map__8443__8444) ? cljs.core.apply.call(null, cljs.core.hash_map, map__8443__8444) : map__8443__8444;
      var validator__8446 = cljs.core._lookup.call(null, map__8443__8445, "\ufdd0'validator", null);
      var meta__8447 = cljs.core._lookup.call(null, map__8443__8445, "\ufdd0'meta", null);
      return new cljs.core.Atom(x, meta__8447, validator__8446, null)
    };
    var G__8448 = function(x, var_args) {
      var p__8437 = null;
      if(goog.isDef(var_args)) {
        p__8437 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__8448__delegate.call(this, x, p__8437)
    };
    G__8448.cljs$lang$maxFixedArity = 1;
    G__8448.cljs$lang$applyTo = function(arglist__8449) {
      var x = cljs.core.first(arglist__8449);
      var p__8437 = cljs.core.rest(arglist__8449);
      return G__8448__delegate(x, p__8437)
    };
    G__8448.cljs$lang$arity$variadic = G__8448__delegate;
    return G__8448
  }();
  atom = function(x, var_args) {
    var p__8437 = var_args;
    switch(arguments.length) {
      case 1:
        return atom__1.call(this, x);
      default:
        return atom__2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  atom.cljs$lang$maxFixedArity = 1;
  atom.cljs$lang$applyTo = atom__2.cljs$lang$applyTo;
  atom.cljs$lang$arity$1 = atom__1;
  atom.cljs$lang$arity$variadic = atom__2.cljs$lang$arity$variadic;
  return atom
}();
cljs.core.reset_BANG_ = function reset_BANG_(a, new_value) {
  var temp__3974__auto____8453 = a.validator;
  if(cljs.core.truth_(temp__3974__auto____8453)) {
    var validate__8454 = temp__3974__auto____8453;
    if(cljs.core.truth_(validate__8454.call(null, new_value))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str("Validator rejected reference state"), cljs.core.str("\n"), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'validate", "\ufdd1'new-value"), cljs.core.hash_map("\ufdd0'line", 6440))))].join(""));
    }
  }else {
  }
  var old_value__8455 = a.state;
  a.state = new_value;
  cljs.core._notify_watches.call(null, a, old_value__8455, new_value);
  return new_value
};
cljs.core.swap_BANG_ = function() {
  var swap_BANG_ = null;
  var swap_BANG___2 = function(a, f) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state))
  };
  var swap_BANG___3 = function(a, f, x) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x))
  };
  var swap_BANG___4 = function(a, f, x, y) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y))
  };
  var swap_BANG___5 = function(a, f, x, y, z) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y, z))
  };
  var swap_BANG___6 = function() {
    var G__8456__delegate = function(a, f, x, y, z, more) {
      return cljs.core.reset_BANG_.call(null, a, cljs.core.apply.call(null, f, a.state, x, y, z, more))
    };
    var G__8456 = function(a, f, x, y, z, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__8456__delegate.call(this, a, f, x, y, z, more)
    };
    G__8456.cljs$lang$maxFixedArity = 5;
    G__8456.cljs$lang$applyTo = function(arglist__8457) {
      var a = cljs.core.first(arglist__8457);
      var f = cljs.core.first(cljs.core.next(arglist__8457));
      var x = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8457)));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8457))));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8457)))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8457)))));
      return G__8456__delegate(a, f, x, y, z, more)
    };
    G__8456.cljs$lang$arity$variadic = G__8456__delegate;
    return G__8456
  }();
  swap_BANG_ = function(a, f, x, y, z, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return swap_BANG___2.call(this, a, f);
      case 3:
        return swap_BANG___3.call(this, a, f, x);
      case 4:
        return swap_BANG___4.call(this, a, f, x, y);
      case 5:
        return swap_BANG___5.call(this, a, f, x, y, z);
      default:
        return swap_BANG___6.cljs$lang$arity$variadic(a, f, x, y, z, cljs.core.array_seq(arguments, 5))
    }
    throw"Invalid arity: " + arguments.length;
  };
  swap_BANG_.cljs$lang$maxFixedArity = 5;
  swap_BANG_.cljs$lang$applyTo = swap_BANG___6.cljs$lang$applyTo;
  swap_BANG_.cljs$lang$arity$2 = swap_BANG___2;
  swap_BANG_.cljs$lang$arity$3 = swap_BANG___3;
  swap_BANG_.cljs$lang$arity$4 = swap_BANG___4;
  swap_BANG_.cljs$lang$arity$5 = swap_BANG___5;
  swap_BANG_.cljs$lang$arity$variadic = swap_BANG___6.cljs$lang$arity$variadic;
  return swap_BANG_
}();
cljs.core.compare_and_set_BANG_ = function compare_and_set_BANG_(a, oldval, newval) {
  if(cljs.core._EQ_.call(null, a.state, oldval)) {
    cljs.core.reset_BANG_.call(null, a, newval);
    return true
  }else {
    return false
  }
};
cljs.core.deref = function deref(o) {
  return cljs.core._deref.call(null, o)
};
cljs.core.set_validator_BANG_ = function set_validator_BANG_(iref, val) {
  return iref.validator = val
};
cljs.core.get_validator = function get_validator(iref) {
  return iref.validator
};
cljs.core.alter_meta_BANG_ = function() {
  var alter_meta_BANG___delegate = function(iref, f, args) {
    return iref.meta = cljs.core.apply.call(null, f, iref.meta, args)
  };
  var alter_meta_BANG_ = function(iref, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return alter_meta_BANG___delegate.call(this, iref, f, args)
  };
  alter_meta_BANG_.cljs$lang$maxFixedArity = 2;
  alter_meta_BANG_.cljs$lang$applyTo = function(arglist__8458) {
    var iref = cljs.core.first(arglist__8458);
    var f = cljs.core.first(cljs.core.next(arglist__8458));
    var args = cljs.core.rest(cljs.core.next(arglist__8458));
    return alter_meta_BANG___delegate(iref, f, args)
  };
  alter_meta_BANG_.cljs$lang$arity$variadic = alter_meta_BANG___delegate;
  return alter_meta_BANG_
}();
cljs.core.reset_meta_BANG_ = function reset_meta_BANG_(iref, m) {
  return iref.meta = m
};
cljs.core.add_watch = function add_watch(iref, key, f) {
  return cljs.core._add_watch.call(null, iref, key, f)
};
cljs.core.remove_watch = function remove_watch(iref, key) {
  return cljs.core._remove_watch.call(null, iref, key)
};
cljs.core.gensym_counter = null;
cljs.core.gensym = function() {
  var gensym = null;
  var gensym__0 = function() {
    return gensym.call(null, "G__")
  };
  var gensym__1 = function(prefix_string) {
    if(cljs.core.gensym_counter == null) {
      cljs.core.gensym_counter = cljs.core.atom.call(null, 0)
    }else {
    }
    return cljs.core.symbol.call(null, [cljs.core.str(prefix_string), cljs.core.str(cljs.core.swap_BANG_.call(null, cljs.core.gensym_counter, cljs.core.inc))].join(""))
  };
  gensym = function(prefix_string) {
    switch(arguments.length) {
      case 0:
        return gensym__0.call(this);
      case 1:
        return gensym__1.call(this, prefix_string)
    }
    throw"Invalid arity: " + arguments.length;
  };
  gensym.cljs$lang$arity$0 = gensym__0;
  gensym.cljs$lang$arity$1 = gensym__1;
  return gensym
}();
cljs.core.fixture1 = 1;
cljs.core.fixture2 = 2;
cljs.core.Delay = function(state, f) {
  this.state = state;
  this.f = f;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 1073774592
};
cljs.core.Delay.cljs$lang$type = true;
cljs.core.Delay.cljs$lang$ctorPrSeq = function(this__960__auto__) {
  return cljs.core.list.call(null, "cljs.core/Delay")
};
cljs.core.Delay.prototype.cljs$core$IPending$_realized_QMARK_$arity$1 = function(d) {
  var this__8459 = this;
  return(new cljs.core.Keyword("\ufdd0'done")).call(null, cljs.core.deref.call(null, this__8459.state))
};
cljs.core.Delay.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__8460 = this;
  return(new cljs.core.Keyword("\ufdd0'value")).call(null, cljs.core.swap_BANG_.call(null, this__8460.state, function(p__8461) {
    var map__8462__8463 = p__8461;
    var map__8462__8464 = cljs.core.seq_QMARK_.call(null, map__8462__8463) ? cljs.core.apply.call(null, cljs.core.hash_map, map__8462__8463) : map__8462__8463;
    var curr_state__8465 = map__8462__8464;
    var done__8466 = cljs.core._lookup.call(null, map__8462__8464, "\ufdd0'done", null);
    if(cljs.core.truth_(done__8466)) {
      return curr_state__8465
    }else {
      return cljs.core.ObjMap.fromObject(["\ufdd0'done", "\ufdd0'value"], {"\ufdd0'done":true, "\ufdd0'value":this__8460.f.call(null)})
    }
  }))
};
cljs.core.Delay;
cljs.core.delay_QMARK_ = function delay_QMARK_(x) {
  return cljs.core.instance_QMARK_.call(null, cljs.core.Delay, x)
};
cljs.core.force = function force(x) {
  if(cljs.core.delay_QMARK_.call(null, x)) {
    return cljs.core.deref.call(null, x)
  }else {
    return x
  }
};
cljs.core.realized_QMARK_ = function realized_QMARK_(d) {
  return cljs.core._realized_QMARK_.call(null, d)
};
cljs.core.js__GT_clj = function() {
  var js__GT_clj__delegate = function(x, options) {
    var map__8487__8488 = options;
    var map__8487__8489 = cljs.core.seq_QMARK_.call(null, map__8487__8488) ? cljs.core.apply.call(null, cljs.core.hash_map, map__8487__8488) : map__8487__8488;
    var keywordize_keys__8490 = cljs.core._lookup.call(null, map__8487__8489, "\ufdd0'keywordize-keys", null);
    var keyfn__8491 = cljs.core.truth_(keywordize_keys__8490) ? cljs.core.keyword : cljs.core.str;
    var f__8506 = function thisfn(x) {
      if(cljs.core.seq_QMARK_.call(null, x)) {
        return cljs.core.doall.call(null, cljs.core.map.call(null, thisfn, x))
      }else {
        if(cljs.core.coll_QMARK_.call(null, x)) {
          return cljs.core.into.call(null, cljs.core.empty.call(null, x), cljs.core.map.call(null, thisfn, x))
        }else {
          if(cljs.core.truth_(goog.isArray(x))) {
            return cljs.core.vec.call(null, cljs.core.map.call(null, thisfn, x))
          }else {
            if(cljs.core.type.call(null, x) === Object) {
              return cljs.core.into.call(null, cljs.core.ObjMap.EMPTY, function() {
                var iter__1113__auto____8505 = function iter__8499(s__8500) {
                  return new cljs.core.LazySeq(null, false, function() {
                    var s__8500__8503 = s__8500;
                    while(true) {
                      if(cljs.core.seq.call(null, s__8500__8503)) {
                        var k__8504 = cljs.core.first.call(null, s__8500__8503);
                        return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([keyfn__8491.call(null, k__8504), thisfn.call(null, x[k__8504])], true), iter__8499.call(null, cljs.core.rest.call(null, s__8500__8503)))
                      }else {
                        return null
                      }
                      break
                    }
                  }, null)
                };
                return iter__1113__auto____8505.call(null, cljs.core.js_keys.call(null, x))
              }())
            }else {
              if("\ufdd0'else") {
                return x
              }else {
                return null
              }
            }
          }
        }
      }
    };
    return f__8506.call(null, x)
  };
  var js__GT_clj = function(x, var_args) {
    var options = null;
    if(goog.isDef(var_args)) {
      options = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return js__GT_clj__delegate.call(this, x, options)
  };
  js__GT_clj.cljs$lang$maxFixedArity = 1;
  js__GT_clj.cljs$lang$applyTo = function(arglist__8507) {
    var x = cljs.core.first(arglist__8507);
    var options = cljs.core.rest(arglist__8507);
    return js__GT_clj__delegate(x, options)
  };
  js__GT_clj.cljs$lang$arity$variadic = js__GT_clj__delegate;
  return js__GT_clj
}();
cljs.core.memoize = function memoize(f) {
  var mem__8512 = cljs.core.atom.call(null, cljs.core.ObjMap.EMPTY);
  return function() {
    var G__8516__delegate = function(args) {
      var temp__3971__auto____8513 = cljs.core._lookup.call(null, cljs.core.deref.call(null, mem__8512), args, null);
      if(cljs.core.truth_(temp__3971__auto____8513)) {
        var v__8514 = temp__3971__auto____8513;
        return v__8514
      }else {
        var ret__8515 = cljs.core.apply.call(null, f, args);
        cljs.core.swap_BANG_.call(null, mem__8512, cljs.core.assoc, args, ret__8515);
        return ret__8515
      }
    };
    var G__8516 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__8516__delegate.call(this, args)
    };
    G__8516.cljs$lang$maxFixedArity = 0;
    G__8516.cljs$lang$applyTo = function(arglist__8517) {
      var args = cljs.core.seq(arglist__8517);
      return G__8516__delegate(args)
    };
    G__8516.cljs$lang$arity$variadic = G__8516__delegate;
    return G__8516
  }()
};
cljs.core.trampoline = function() {
  var trampoline = null;
  var trampoline__1 = function(f) {
    while(true) {
      var ret__8519 = f.call(null);
      if(cljs.core.fn_QMARK_.call(null, ret__8519)) {
        var G__8520 = ret__8519;
        f = G__8520;
        continue
      }else {
        return ret__8519
      }
      break
    }
  };
  var trampoline__2 = function() {
    var G__8521__delegate = function(f, args) {
      return trampoline.call(null, function() {
        return cljs.core.apply.call(null, f, args)
      })
    };
    var G__8521 = function(f, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__8521__delegate.call(this, f, args)
    };
    G__8521.cljs$lang$maxFixedArity = 1;
    G__8521.cljs$lang$applyTo = function(arglist__8522) {
      var f = cljs.core.first(arglist__8522);
      var args = cljs.core.rest(arglist__8522);
      return G__8521__delegate(f, args)
    };
    G__8521.cljs$lang$arity$variadic = G__8521__delegate;
    return G__8521
  }();
  trampoline = function(f, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 1:
        return trampoline__1.call(this, f);
      default:
        return trampoline__2.cljs$lang$arity$variadic(f, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  trampoline.cljs$lang$maxFixedArity = 1;
  trampoline.cljs$lang$applyTo = trampoline__2.cljs$lang$applyTo;
  trampoline.cljs$lang$arity$1 = trampoline__1;
  trampoline.cljs$lang$arity$variadic = trampoline__2.cljs$lang$arity$variadic;
  return trampoline
}();
cljs.core.rand = function() {
  var rand = null;
  var rand__0 = function() {
    return rand.call(null, 1)
  };
  var rand__1 = function(n) {
    return Math.random.call(null) * n
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__0.call(this);
      case 1:
        return rand__1.call(this, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  rand.cljs$lang$arity$0 = rand__0;
  rand.cljs$lang$arity$1 = rand__1;
  return rand
}();
cljs.core.rand_int = function rand_int(n) {
  return Math.floor.call(null, Math.random.call(null) * n)
};
cljs.core.rand_nth = function rand_nth(coll) {
  return cljs.core.nth.call(null, coll, cljs.core.rand_int.call(null, cljs.core.count.call(null, coll)))
};
cljs.core.group_by = function group_by(f, coll) {
  return cljs.core.reduce.call(null, function(ret, x) {
    var k__8524 = f.call(null, x);
    return cljs.core.assoc.call(null, ret, k__8524, cljs.core.conj.call(null, cljs.core._lookup.call(null, ret, k__8524, cljs.core.PersistentVector.EMPTY), x))
  }, cljs.core.ObjMap.EMPTY, coll)
};
cljs.core.make_hierarchy = function make_hierarchy() {
  return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'descendants", "\ufdd0'ancestors"], {"\ufdd0'parents":cljs.core.ObjMap.EMPTY, "\ufdd0'descendants":cljs.core.ObjMap.EMPTY, "\ufdd0'ancestors":cljs.core.ObjMap.EMPTY})
};
cljs.core.global_hierarchy = cljs.core.atom.call(null, cljs.core.make_hierarchy.call(null));
cljs.core.isa_QMARK_ = function() {
  var isa_QMARK_ = null;
  var isa_QMARK___2 = function(child, parent) {
    return isa_QMARK_.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), child, parent)
  };
  var isa_QMARK___3 = function(h, child, parent) {
    var or__3824__auto____8533 = cljs.core._EQ_.call(null, child, parent);
    if(or__3824__auto____8533) {
      return or__3824__auto____8533
    }else {
      var or__3824__auto____8534 = cljs.core.contains_QMARK_.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h).call(null, child), parent);
      if(or__3824__auto____8534) {
        return or__3824__auto____8534
      }else {
        var and__3822__auto____8535 = cljs.core.vector_QMARK_.call(null, parent);
        if(and__3822__auto____8535) {
          var and__3822__auto____8536 = cljs.core.vector_QMARK_.call(null, child);
          if(and__3822__auto____8536) {
            var and__3822__auto____8537 = cljs.core.count.call(null, parent) === cljs.core.count.call(null, child);
            if(and__3822__auto____8537) {
              var ret__8538 = true;
              var i__8539 = 0;
              while(true) {
                if(function() {
                  var or__3824__auto____8540 = cljs.core.not.call(null, ret__8538);
                  if(or__3824__auto____8540) {
                    return or__3824__auto____8540
                  }else {
                    return i__8539 === cljs.core.count.call(null, parent)
                  }
                }()) {
                  return ret__8538
                }else {
                  var G__8541 = isa_QMARK_.call(null, h, child.call(null, i__8539), parent.call(null, i__8539));
                  var G__8542 = i__8539 + 1;
                  ret__8538 = G__8541;
                  i__8539 = G__8542;
                  continue
                }
                break
              }
            }else {
              return and__3822__auto____8537
            }
          }else {
            return and__3822__auto____8536
          }
        }else {
          return and__3822__auto____8535
        }
      }
    }
  };
  isa_QMARK_ = function(h, child, parent) {
    switch(arguments.length) {
      case 2:
        return isa_QMARK___2.call(this, h, child);
      case 3:
        return isa_QMARK___3.call(this, h, child, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  isa_QMARK_.cljs$lang$arity$2 = isa_QMARK___2;
  isa_QMARK_.cljs$lang$arity$3 = isa_QMARK___3;
  return isa_QMARK_
}();
cljs.core.parents = function() {
  var parents = null;
  var parents__1 = function(tag) {
    return parents.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var parents__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core._lookup.call(null, (new cljs.core.Keyword("\ufdd0'parents")).call(null, h), tag, null))
  };
  parents = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return parents__1.call(this, h);
      case 2:
        return parents__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  parents.cljs$lang$arity$1 = parents__1;
  parents.cljs$lang$arity$2 = parents__2;
  return parents
}();
cljs.core.ancestors = function() {
  var ancestors = null;
  var ancestors__1 = function(tag) {
    return ancestors.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var ancestors__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core._lookup.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h), tag, null))
  };
  ancestors = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return ancestors__1.call(this, h);
      case 2:
        return ancestors__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  ancestors.cljs$lang$arity$1 = ancestors__1;
  ancestors.cljs$lang$arity$2 = ancestors__2;
  return ancestors
}();
cljs.core.descendants = function() {
  var descendants = null;
  var descendants__1 = function(tag) {
    return descendants.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var descendants__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core._lookup.call(null, (new cljs.core.Keyword("\ufdd0'descendants")).call(null, h), tag, null))
  };
  descendants = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return descendants__1.call(this, h);
      case 2:
        return descendants__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  descendants.cljs$lang$arity$1 = descendants__1;
  descendants.cljs$lang$arity$2 = descendants__2;
  return descendants
}();
cljs.core.derive = function() {
  var derive = null;
  var derive__2 = function(tag, parent) {
    if(cljs.core.truth_(cljs.core.namespace.call(null, parent))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'namespace", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 6724))))].join(""));
    }
    cljs.core.swap_BANG_.call(null, cljs.core.global_hierarchy, derive, tag, parent);
    return null
  };
  var derive__3 = function(h, tag, parent) {
    if(cljs.core.not_EQ_.call(null, tag, parent)) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'not=", "\ufdd1'tag", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 6728))))].join(""));
    }
    var tp__8551 = (new cljs.core.Keyword("\ufdd0'parents")).call(null, h);
    var td__8552 = (new cljs.core.Keyword("\ufdd0'descendants")).call(null, h);
    var ta__8553 = (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h);
    var tf__8554 = function(m, source, sources, target, targets) {
      return cljs.core.reduce.call(null, function(ret, k) {
        return cljs.core.assoc.call(null, ret, k, cljs.core.reduce.call(null, cljs.core.conj, cljs.core._lookup.call(null, targets, k, cljs.core.PersistentHashSet.EMPTY), cljs.core.cons.call(null, target, targets.call(null, target))))
      }, m, cljs.core.cons.call(null, source, sources.call(null, source)))
    };
    var or__3824__auto____8555 = cljs.core.contains_QMARK_.call(null, tp__8551.call(null, tag), parent) ? null : function() {
      if(cljs.core.contains_QMARK_.call(null, ta__8553.call(null, tag), parent)) {
        throw new Error([cljs.core.str(tag), cljs.core.str("already has"), cljs.core.str(parent), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      if(cljs.core.contains_QMARK_.call(null, ta__8553.call(null, parent), tag)) {
        throw new Error([cljs.core.str("Cyclic derivation:"), cljs.core.str(parent), cljs.core.str("has"), cljs.core.str(tag), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'ancestors", "\ufdd0'descendants"], {"\ufdd0'parents":cljs.core.assoc.call(null, (new cljs.core.Keyword("\ufdd0'parents")).call(null, h), tag, cljs.core.conj.call(null, cljs.core._lookup.call(null, tp__8551, tag, cljs.core.PersistentHashSet.EMPTY), parent)), "\ufdd0'ancestors":tf__8554.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h), tag, td__8552, parent, ta__8553), "\ufdd0'descendants":tf__8554.call(null, (new cljs.core.Keyword("\ufdd0'descendants")).call(null, 
      h), parent, ta__8553, tag, td__8552)})
    }();
    if(cljs.core.truth_(or__3824__auto____8555)) {
      return or__3824__auto____8555
    }else {
      return h
    }
  };
  derive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return derive__2.call(this, h, tag);
      case 3:
        return derive__3.call(this, h, tag, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  derive.cljs$lang$arity$2 = derive__2;
  derive.cljs$lang$arity$3 = derive__3;
  return derive
}();
cljs.core.underive = function() {
  var underive = null;
  var underive__2 = function(tag, parent) {
    cljs.core.swap_BANG_.call(null, cljs.core.global_hierarchy, underive, tag, parent);
    return null
  };
  var underive__3 = function(h, tag, parent) {
    var parentMap__8560 = (new cljs.core.Keyword("\ufdd0'parents")).call(null, h);
    var childsParents__8561 = cljs.core.truth_(parentMap__8560.call(null, tag)) ? cljs.core.disj.call(null, parentMap__8560.call(null, tag), parent) : cljs.core.PersistentHashSet.EMPTY;
    var newParents__8562 = cljs.core.truth_(cljs.core.not_empty.call(null, childsParents__8561)) ? cljs.core.assoc.call(null, parentMap__8560, tag, childsParents__8561) : cljs.core.dissoc.call(null, parentMap__8560, tag);
    var deriv_seq__8563 = cljs.core.flatten.call(null, cljs.core.map.call(null, function(p1__8543_SHARP_) {
      return cljs.core.cons.call(null, cljs.core.first.call(null, p1__8543_SHARP_), cljs.core.interpose.call(null, cljs.core.first.call(null, p1__8543_SHARP_), cljs.core.second.call(null, p1__8543_SHARP_)))
    }, cljs.core.seq.call(null, newParents__8562)));
    if(cljs.core.contains_QMARK_.call(null, parentMap__8560.call(null, tag), parent)) {
      return cljs.core.reduce.call(null, function(p1__8544_SHARP_, p2__8545_SHARP_) {
        return cljs.core.apply.call(null, cljs.core.derive, p1__8544_SHARP_, p2__8545_SHARP_)
      }, cljs.core.make_hierarchy.call(null), cljs.core.partition.call(null, 2, deriv_seq__8563))
    }else {
      return h
    }
  };
  underive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return underive__2.call(this, h, tag);
      case 3:
        return underive__3.call(this, h, tag, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  underive.cljs$lang$arity$2 = underive__2;
  underive.cljs$lang$arity$3 = underive__3;
  return underive
}();
cljs.core.reset_cache = function reset_cache(method_cache, method_table, cached_hierarchy, hierarchy) {
  cljs.core.swap_BANG_.call(null, method_cache, function(_) {
    return cljs.core.deref.call(null, method_table)
  });
  return cljs.core.swap_BANG_.call(null, cached_hierarchy, function(_) {
    return cljs.core.deref.call(null, hierarchy)
  })
};
cljs.core.prefers_STAR_ = function prefers_STAR_(x, y, prefer_table) {
  var xprefs__8571 = cljs.core.deref.call(null, prefer_table).call(null, x);
  var or__3824__auto____8573 = cljs.core.truth_(function() {
    var and__3822__auto____8572 = xprefs__8571;
    if(cljs.core.truth_(and__3822__auto____8572)) {
      return xprefs__8571.call(null, y)
    }else {
      return and__3822__auto____8572
    }
  }()) ? true : null;
  if(cljs.core.truth_(or__3824__auto____8573)) {
    return or__3824__auto____8573
  }else {
    var or__3824__auto____8575 = function() {
      var ps__8574 = cljs.core.parents.call(null, y);
      while(true) {
        if(cljs.core.count.call(null, ps__8574) > 0) {
          if(cljs.core.truth_(prefers_STAR_.call(null, x, cljs.core.first.call(null, ps__8574), prefer_table))) {
          }else {
          }
          var G__8578 = cljs.core.rest.call(null, ps__8574);
          ps__8574 = G__8578;
          continue
        }else {
          return null
        }
        break
      }
    }();
    if(cljs.core.truth_(or__3824__auto____8575)) {
      return or__3824__auto____8575
    }else {
      var or__3824__auto____8577 = function() {
        var ps__8576 = cljs.core.parents.call(null, x);
        while(true) {
          if(cljs.core.count.call(null, ps__8576) > 0) {
            if(cljs.core.truth_(prefers_STAR_.call(null, cljs.core.first.call(null, ps__8576), y, prefer_table))) {
            }else {
            }
            var G__8579 = cljs.core.rest.call(null, ps__8576);
            ps__8576 = G__8579;
            continue
          }else {
            return null
          }
          break
        }
      }();
      if(cljs.core.truth_(or__3824__auto____8577)) {
        return or__3824__auto____8577
      }else {
        return false
      }
    }
  }
};
cljs.core.dominates = function dominates(x, y, prefer_table) {
  var or__3824__auto____8581 = cljs.core.prefers_STAR_.call(null, x, y, prefer_table);
  if(cljs.core.truth_(or__3824__auto____8581)) {
    return or__3824__auto____8581
  }else {
    return cljs.core.isa_QMARK_.call(null, x, y)
  }
};
cljs.core.find_and_cache_best_method = function find_and_cache_best_method(name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  var best_entry__8599 = cljs.core.reduce.call(null, function(be, p__8591) {
    var vec__8592__8593 = p__8591;
    var k__8594 = cljs.core.nth.call(null, vec__8592__8593, 0, null);
    var ___8595 = cljs.core.nth.call(null, vec__8592__8593, 1, null);
    var e__8596 = vec__8592__8593;
    if(cljs.core.isa_QMARK_.call(null, dispatch_val, k__8594)) {
      var be2__8598 = cljs.core.truth_(function() {
        var or__3824__auto____8597 = be == null;
        if(or__3824__auto____8597) {
          return or__3824__auto____8597
        }else {
          return cljs.core.dominates.call(null, k__8594, cljs.core.first.call(null, be), prefer_table)
        }
      }()) ? e__8596 : be;
      if(cljs.core.truth_(cljs.core.dominates.call(null, cljs.core.first.call(null, be2__8598), k__8594, prefer_table))) {
      }else {
        throw new Error([cljs.core.str("Multiple methods in multimethod '"), cljs.core.str(name), cljs.core.str("' match dispatch value: "), cljs.core.str(dispatch_val), cljs.core.str(" -> "), cljs.core.str(k__8594), cljs.core.str(" and "), cljs.core.str(cljs.core.first.call(null, be2__8598)), cljs.core.str(", and neither is preferred")].join(""));
      }
      return be2__8598
    }else {
      return be
    }
  }, null, cljs.core.deref.call(null, method_table));
  if(cljs.core.truth_(best_entry__8599)) {
    if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, cached_hierarchy), cljs.core.deref.call(null, hierarchy))) {
      cljs.core.swap_BANG_.call(null, method_cache, cljs.core.assoc, dispatch_val, cljs.core.second.call(null, best_entry__8599));
      return cljs.core.second.call(null, best_entry__8599)
    }else {
      cljs.core.reset_cache.call(null, method_cache, method_table, cached_hierarchy, hierarchy);
      return find_and_cache_best_method.call(null, name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy)
    }
  }else {
    return null
  }
};
cljs.core.IMultiFn = {};
cljs.core._reset = function _reset(mf) {
  if(function() {
    var and__3822__auto____8604 = mf;
    if(and__3822__auto____8604) {
      return mf.cljs$core$IMultiFn$_reset$arity$1
    }else {
      return and__3822__auto____8604
    }
  }()) {
    return mf.cljs$core$IMultiFn$_reset$arity$1(mf)
  }else {
    var x__1014__auto____8605 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____8606 = cljs.core._reset[goog.typeOf(x__1014__auto____8605)];
      if(or__3824__auto____8606) {
        return or__3824__auto____8606
      }else {
        var or__3824__auto____8607 = cljs.core._reset["_"];
        if(or__3824__auto____8607) {
          return or__3824__auto____8607
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-reset", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._add_method = function _add_method(mf, dispatch_val, method) {
  if(function() {
    var and__3822__auto____8612 = mf;
    if(and__3822__auto____8612) {
      return mf.cljs$core$IMultiFn$_add_method$arity$3
    }else {
      return and__3822__auto____8612
    }
  }()) {
    return mf.cljs$core$IMultiFn$_add_method$arity$3(mf, dispatch_val, method)
  }else {
    var x__1014__auto____8613 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____8614 = cljs.core._add_method[goog.typeOf(x__1014__auto____8613)];
      if(or__3824__auto____8614) {
        return or__3824__auto____8614
      }else {
        var or__3824__auto____8615 = cljs.core._add_method["_"];
        if(or__3824__auto____8615) {
          return or__3824__auto____8615
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-add-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, method)
  }
};
cljs.core._remove_method = function _remove_method(mf, dispatch_val) {
  if(function() {
    var and__3822__auto____8620 = mf;
    if(and__3822__auto____8620) {
      return mf.cljs$core$IMultiFn$_remove_method$arity$2
    }else {
      return and__3822__auto____8620
    }
  }()) {
    return mf.cljs$core$IMultiFn$_remove_method$arity$2(mf, dispatch_val)
  }else {
    var x__1014__auto____8621 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____8622 = cljs.core._remove_method[goog.typeOf(x__1014__auto____8621)];
      if(or__3824__auto____8622) {
        return or__3824__auto____8622
      }else {
        var or__3824__auto____8623 = cljs.core._remove_method["_"];
        if(or__3824__auto____8623) {
          return or__3824__auto____8623
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-remove-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._prefer_method = function _prefer_method(mf, dispatch_val, dispatch_val_y) {
  if(function() {
    var and__3822__auto____8628 = mf;
    if(and__3822__auto____8628) {
      return mf.cljs$core$IMultiFn$_prefer_method$arity$3
    }else {
      return and__3822__auto____8628
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefer_method$arity$3(mf, dispatch_val, dispatch_val_y)
  }else {
    var x__1014__auto____8629 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____8630 = cljs.core._prefer_method[goog.typeOf(x__1014__auto____8629)];
      if(or__3824__auto____8630) {
        return or__3824__auto____8630
      }else {
        var or__3824__auto____8631 = cljs.core._prefer_method["_"];
        if(or__3824__auto____8631) {
          return or__3824__auto____8631
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefer-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, dispatch_val_y)
  }
};
cljs.core._get_method = function _get_method(mf, dispatch_val) {
  if(function() {
    var and__3822__auto____8636 = mf;
    if(and__3822__auto____8636) {
      return mf.cljs$core$IMultiFn$_get_method$arity$2
    }else {
      return and__3822__auto____8636
    }
  }()) {
    return mf.cljs$core$IMultiFn$_get_method$arity$2(mf, dispatch_val)
  }else {
    var x__1014__auto____8637 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____8638 = cljs.core._get_method[goog.typeOf(x__1014__auto____8637)];
      if(or__3824__auto____8638) {
        return or__3824__auto____8638
      }else {
        var or__3824__auto____8639 = cljs.core._get_method["_"];
        if(or__3824__auto____8639) {
          return or__3824__auto____8639
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-get-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._methods = function _methods(mf) {
  if(function() {
    var and__3822__auto____8644 = mf;
    if(and__3822__auto____8644) {
      return mf.cljs$core$IMultiFn$_methods$arity$1
    }else {
      return and__3822__auto____8644
    }
  }()) {
    return mf.cljs$core$IMultiFn$_methods$arity$1(mf)
  }else {
    var x__1014__auto____8645 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____8646 = cljs.core._methods[goog.typeOf(x__1014__auto____8645)];
      if(or__3824__auto____8646) {
        return or__3824__auto____8646
      }else {
        var or__3824__auto____8647 = cljs.core._methods["_"];
        if(or__3824__auto____8647) {
          return or__3824__auto____8647
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-methods", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._prefers = function _prefers(mf) {
  if(function() {
    var and__3822__auto____8652 = mf;
    if(and__3822__auto____8652) {
      return mf.cljs$core$IMultiFn$_prefers$arity$1
    }else {
      return and__3822__auto____8652
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefers$arity$1(mf)
  }else {
    var x__1014__auto____8653 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____8654 = cljs.core._prefers[goog.typeOf(x__1014__auto____8653)];
      if(or__3824__auto____8654) {
        return or__3824__auto____8654
      }else {
        var or__3824__auto____8655 = cljs.core._prefers["_"];
        if(or__3824__auto____8655) {
          return or__3824__auto____8655
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefers", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._dispatch = function _dispatch(mf, args) {
  if(function() {
    var and__3822__auto____8660 = mf;
    if(and__3822__auto____8660) {
      return mf.cljs$core$IMultiFn$_dispatch$arity$2
    }else {
      return and__3822__auto____8660
    }
  }()) {
    return mf.cljs$core$IMultiFn$_dispatch$arity$2(mf, args)
  }else {
    var x__1014__auto____8661 = mf == null ? null : mf;
    return function() {
      var or__3824__auto____8662 = cljs.core._dispatch[goog.typeOf(x__1014__auto____8661)];
      if(or__3824__auto____8662) {
        return or__3824__auto____8662
      }else {
        var or__3824__auto____8663 = cljs.core._dispatch["_"];
        if(or__3824__auto____8663) {
          return or__3824__auto____8663
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-dispatch", mf);
        }
      }
    }().call(null, mf, args)
  }
};
cljs.core.do_dispatch = function do_dispatch(mf, dispatch_fn, args) {
  var dispatch_val__8666 = cljs.core.apply.call(null, dispatch_fn, args);
  var target_fn__8667 = cljs.core._get_method.call(null, mf, dispatch_val__8666);
  if(cljs.core.truth_(target_fn__8667)) {
  }else {
    throw new Error([cljs.core.str("No method in multimethod '"), cljs.core.str(cljs.core.name), cljs.core.str("' for dispatch value: "), cljs.core.str(dispatch_val__8666)].join(""));
  }
  return cljs.core.apply.call(null, target_fn__8667, args)
};
cljs.core.MultiFn = function(name, dispatch_fn, default_dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  this.name = name;
  this.dispatch_fn = dispatch_fn;
  this.default_dispatch_val = default_dispatch_val;
  this.hierarchy = hierarchy;
  this.method_table = method_table;
  this.prefer_table = prefer_table;
  this.method_cache = method_cache;
  this.cached_hierarchy = cached_hierarchy;
  this.cljs$lang$protocol_mask$partition0$ = 4194304;
  this.cljs$lang$protocol_mask$partition1$ = 64
};
cljs.core.MultiFn.cljs$lang$type = true;
cljs.core.MultiFn.cljs$lang$ctorPrSeq = function(this__960__auto__) {
  return cljs.core.list.call(null, "cljs.core/MultiFn")
};
cljs.core.MultiFn.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__8668 = this;
  return goog.getUid(this$)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_reset$arity$1 = function(mf) {
  var this__8669 = this;
  cljs.core.swap_BANG_.call(null, this__8669.method_table, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__8669.method_cache, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__8669.prefer_table, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__8669.cached_hierarchy, function(mf) {
    return null
  });
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_add_method$arity$3 = function(mf, dispatch_val, method) {
  var this__8670 = this;
  cljs.core.swap_BANG_.call(null, this__8670.method_table, cljs.core.assoc, dispatch_val, method);
  cljs.core.reset_cache.call(null, this__8670.method_cache, this__8670.method_table, this__8670.cached_hierarchy, this__8670.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_remove_method$arity$2 = function(mf, dispatch_val) {
  var this__8671 = this;
  cljs.core.swap_BANG_.call(null, this__8671.method_table, cljs.core.dissoc, dispatch_val);
  cljs.core.reset_cache.call(null, this__8671.method_cache, this__8671.method_table, this__8671.cached_hierarchy, this__8671.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_get_method$arity$2 = function(mf, dispatch_val) {
  var this__8672 = this;
  if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, this__8672.cached_hierarchy), cljs.core.deref.call(null, this__8672.hierarchy))) {
  }else {
    cljs.core.reset_cache.call(null, this__8672.method_cache, this__8672.method_table, this__8672.cached_hierarchy, this__8672.hierarchy)
  }
  var temp__3971__auto____8673 = cljs.core.deref.call(null, this__8672.method_cache).call(null, dispatch_val);
  if(cljs.core.truth_(temp__3971__auto____8673)) {
    var target_fn__8674 = temp__3971__auto____8673;
    return target_fn__8674
  }else {
    var temp__3971__auto____8675 = cljs.core.find_and_cache_best_method.call(null, this__8672.name, dispatch_val, this__8672.hierarchy, this__8672.method_table, this__8672.prefer_table, this__8672.method_cache, this__8672.cached_hierarchy);
    if(cljs.core.truth_(temp__3971__auto____8675)) {
      var target_fn__8676 = temp__3971__auto____8675;
      return target_fn__8676
    }else {
      return cljs.core.deref.call(null, this__8672.method_table).call(null, this__8672.default_dispatch_val)
    }
  }
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefer_method$arity$3 = function(mf, dispatch_val_x, dispatch_val_y) {
  var this__8677 = this;
  if(cljs.core.truth_(cljs.core.prefers_STAR_.call(null, dispatch_val_x, dispatch_val_y, this__8677.prefer_table))) {
    throw new Error([cljs.core.str("Preference conflict in multimethod '"), cljs.core.str(this__8677.name), cljs.core.str("': "), cljs.core.str(dispatch_val_y), cljs.core.str(" is already preferred to "), cljs.core.str(dispatch_val_x)].join(""));
  }else {
  }
  cljs.core.swap_BANG_.call(null, this__8677.prefer_table, function(old) {
    return cljs.core.assoc.call(null, old, dispatch_val_x, cljs.core.conj.call(null, cljs.core._lookup.call(null, old, dispatch_val_x, cljs.core.PersistentHashSet.EMPTY), dispatch_val_y))
  });
  return cljs.core.reset_cache.call(null, this__8677.method_cache, this__8677.method_table, this__8677.cached_hierarchy, this__8677.hierarchy)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_methods$arity$1 = function(mf) {
  var this__8678 = this;
  return cljs.core.deref.call(null, this__8678.method_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefers$arity$1 = function(mf) {
  var this__8679 = this;
  return cljs.core.deref.call(null, this__8679.prefer_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_dispatch$arity$2 = function(mf, args) {
  var this__8680 = this;
  return cljs.core.do_dispatch.call(null, mf, this__8680.dispatch_fn, args)
};
cljs.core.MultiFn;
cljs.core.MultiFn.prototype.call = function() {
  var G__8682__delegate = function(_, args) {
    var self__8681 = this;
    return cljs.core._dispatch.call(null, self__8681, args)
  };
  var G__8682 = function(_, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return G__8682__delegate.call(this, _, args)
  };
  G__8682.cljs$lang$maxFixedArity = 1;
  G__8682.cljs$lang$applyTo = function(arglist__8683) {
    var _ = cljs.core.first(arglist__8683);
    var args = cljs.core.rest(arglist__8683);
    return G__8682__delegate(_, args)
  };
  G__8682.cljs$lang$arity$variadic = G__8682__delegate;
  return G__8682
}();
cljs.core.MultiFn.prototype.apply = function(_, args) {
  var self__8684 = this;
  return cljs.core._dispatch.call(null, self__8684, args)
};
cljs.core.remove_all_methods = function remove_all_methods(multifn) {
  return cljs.core._reset.call(null, multifn)
};
cljs.core.remove_method = function remove_method(multifn, dispatch_val) {
  return cljs.core._remove_method.call(null, multifn, dispatch_val)
};
cljs.core.prefer_method = function prefer_method(multifn, dispatch_val_x, dispatch_val_y) {
  return cljs.core._prefer_method.call(null, multifn, dispatch_val_x, dispatch_val_y)
};
cljs.core.methods$ = function methods$(multifn) {
  return cljs.core._methods.call(null, multifn)
};
cljs.core.get_method = function get_method(multifn, dispatch_val) {
  return cljs.core._get_method.call(null, multifn, dispatch_val)
};
cljs.core.prefers = function prefers(multifn) {
  return cljs.core._prefers.call(null, multifn)
};
cljs.core.UUID = function(uuid) {
  this.uuid = uuid;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 543162368
};
cljs.core.UUID.cljs$lang$type = true;
cljs.core.UUID.cljs$lang$ctorPrSeq = function(this__960__auto__) {
  return cljs.core.list.call(null, "cljs.core/UUID")
};
cljs.core.UUID.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__8685 = this;
  return goog.string.hashCode(cljs.core.pr_str.call(null, this$))
};
cljs.core.UUID.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(_8687, _) {
  var this__8686 = this;
  return cljs.core.list.call(null, [cljs.core.str('#uuid "'), cljs.core.str(this__8686.uuid), cljs.core.str('"')].join(""))
};
cljs.core.UUID.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(_, other) {
  var this__8688 = this;
  var and__3822__auto____8689 = cljs.core.instance_QMARK_.call(null, cljs.core.UUID, other);
  if(and__3822__auto____8689) {
    return this__8688.uuid === other.uuid
  }else {
    return and__3822__auto____8689
  }
};
cljs.core.UUID.prototype.toString = function() {
  var this__8690 = this;
  var this__8691 = this;
  return cljs.core.pr_str.call(null, this__8691)
};
cljs.core.UUID;
goog.provide("sherbondy.core");
goog.require("cljs.core");
console.log("hi");
window.onload = function() {
  return window.prettyPrint()
};
