(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else{if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else{if(typeof global!=="undefined"){g=global}else{if(typeof self!=="undefined"){g=self}else{g=this}}}g.toMarkdown=f()}}})(function(){var define,module,exports;return(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a){return a(o,!0)}if(i){return i(o,!0)}var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++){s(r[o])}return s})({1:[function(require,module,exports){var toMarkdown;var converters;var mdConverters=require("./lib/md-converters");var gfmConverters=require("./lib/gfm-converters");var HtmlParser=require("./lib/html-parser");var collapse=require("collapse-whitespace");var blocks=["address","article","aside","audio","blockquote","body","canvas","center","dd","dir","div","dl","dt","fieldset","figcaption","figure","footer","form","frameset","h1","h2","h3","h4","h5","h6","header","hgroup","hr","html","isindex","li","main","menu","nav","noframes","noscript","ol","output","p","pre","section","table","tbody","td","tfoot","th","thead","tr","ul"];function isBlock(node){return blocks.indexOf(node.nodeName.toLowerCase())!==-1}var voids=["area","base","br","col","command","embed","hr","img","input","keygen","link","meta","param","source","track","wbr"];function isVoid(node){return voids.indexOf(node.nodeName.toLowerCase())!==-1}function htmlToDom(string){var tree=new HtmlParser().parseFromString(string,"text/html");collapse(tree.documentElement,isBlock);return tree}function bfsOrder(node){var inqueue=[node];var outqueue=[];var elem;var children;var i;while(inqueue.length>0){elem=inqueue.shift();outqueue.push(elem);children=elem.childNodes;for(i=0;i<children.length;i++){if(children[i].nodeType===1){inqueue.push(children[i])}}}outqueue.shift();return outqueue}function getContent(node){var text="";for(var i=0;i<node.childNodes.length;i++){if(node.childNodes[i].nodeType===1){text+=node.childNodes[i]._replacement}else{if(node.childNodes[i].nodeType===3){text+=node.childNodes[i].data}else{continue}}}return text}function outer(node,content){return node.cloneNode(false).outerHTML.replace("><",">"+content+"<")}function canConvert(node,filter){if(typeof filter==="string"){return filter===node.nodeName.toLowerCase()}if(Array.isArray(filter)){return filter.indexOf(node.nodeName.toLowerCase())!==-1}else{if(typeof filter==="function"){return filter.call(toMarkdown,node)}else{throw new TypeError("`filter` needs to be a string, array, or function")}}}function isFlankedByWhitespace(side,node){var sibling;var regExp;var isFlanked;if(side==="left"){sibling=node.previousSibling;regExp=/ $/}else{sibling=node.nextSibling;regExp=/^ /}if(sibling){if(sibling.nodeType===3){isFlanked=regExp.test(sibling.nodeValue)}else{if(sibling.nodeType===1&&!isBlock(sibling)){isFlanked=regExp.test(sibling.textContent)}}}return isFlanked}function flankingWhitespace(node){var leading="";var trailing="";if(!isBlock(node)){var hasLeading=/^[ \r\n\t]/.test(node.innerHTML);var hasTrailing=/[ \r\n\t]$/.test(node.innerHTML);if(hasLeading&&!isFlankedByWhitespace("left",node)){leading=" "}if(hasTrailing&&!isFlankedByWhitespace("right",node)){trailing=" "}}return{leading:leading,trailing:trailing}}function process(node){var replacement;var content=getContent(node);if(!isVoid(node)&&!/A|TH|TD/.test(node.nodeName)&&/^\s*$/i.test(content)){node._replacement="";return}for(var i=0;i<converters.length;i++){var converter=converters[i];if(canConvert(node,converter.filter)){if(typeof converter.replacement!=="function"){throw new TypeError("`replacement` needs to be a function that returns a string")}var whitespace=flankingWhitespace(node);if(whitespace.leading||whitespace.trailing){content=content.trim()}replacement=whitespace.leading+converter.replacement.call(toMarkdown,content,node)+whitespace.trailing;break}}node._replacement=replacement}toMarkdown=function(input,options){options=options||{};if(typeof input!=="string"){throw new TypeError(input+" is not a string")}input=input.replace(/(>[\r\n\s]*)(\d+)\.(&nbsp;| )/g,"$1$2\\.$3");var clone=htmlToDom(input).body;var nodes=bfsOrder(clone);var output;converters=mdConverters.slice(0);if(options.gfm){converters=gfmConverters.concat(converters)}if(options.converters){converters=options.converters.concat(converters)}for(var i=nodes.length-1;i>=0;i--){process(nodes[i])}output=getContent(clone);return output.replace(/^[\t\r\n]+|[\t\r\n\s]+$/g,"").replace(/\n\s+\n/g,"\n\n").replace(/\n{3,}/g,"\n\n")};toMarkdown.isBlock=isBlock;toMarkdown.isVoid=isVoid;toMarkdown.outer=outer;module.exports=toMarkdown},{"./lib/gfm-converters":2,"./lib/html-parser":3,"./lib/md-converters":4,"collapse-whitespace":7}],2:[function(require,module,exports){function cell(content,node){var index=Array.prototype.indexOf.call(node.parentNode.childNodes,node);
        var prefix=" ";if(index===0){prefix="| "}return prefix+content+" |"}var highlightRegEx=/highlight highlight-(\S+)/;module.exports=[{filter:"br",replacement:function(){return"\n"}},{filter:["del","s","strike"],replacement:function(content){return"~~"+content+"~~"}},{filter:function(node){return node.type==="checkbox"&&node.parentNode.nodeName==="LI"},replacement:function(content,node){return(node.checked?"[x]":"[ ]")+" "}},{filter:["th","td"],replacement:function(content,node){return cell(content,node)}},{filter:"tr",replacement:function(content,node){var borderCells="";var alignMap={left:":--",right:"--:",center:":-:"};if(node.parentNode.nodeName==="THEAD"){for(var i=0;i<node.childNodes.length;i++){var align=node.childNodes[i].attributes.align;var border="---";if(align){border=alignMap[align.value]||border}borderCells+=cell(border,node.childNodes[i])}}return"\n"+content+(borderCells?"\n"+borderCells:"")}},{filter:"table",replacement:function(content){return"\n\n"+content+"\n\n"}},{filter:["thead","tbody","tfoot"],replacement:function(content){return content}},{filter:function(node){return node.nodeName==="PRE"&&node.firstChild&&node.firstChild.nodeName==="CODE"},replacement:function(content,node){return"\n\n```\n"+node.firstChild.textContent+"\n```\n\n"}},{filter:function(node){return node.nodeName==="PRE"&&node.parentNode.nodeName==="DIV"&&highlightRegEx.test(node.parentNode.className)},replacement:function(content,node){var language=node.parentNode.className.match(highlightRegEx)[1];return"\n\n```"+language+"\n"+node.textContent+"\n```\n\n"}},{filter:function(node){return node.nodeName==="DIV"&&highlightRegEx.test(node.className)},replacement:function(content){return"\n\n"+content+"\n\n"}}]},{}],3:[function(require,module,exports){var _window=(typeof window!=="undefined"?window:this);function canParseHtmlNatively(){var Parser=_window.DOMParser;var canParse=false;try{if(new Parser().parseFromString("","text/html")){canParse=true}}catch(e){}return canParse}function createHtmlParser(){var Parser=function(){};if(typeof document==="undefined"){var jsdom=require("jsdom");Parser.prototype.parseFromString=function(string){return jsdom.jsdom(string,{features:{FetchExternalResources:[],ProcessExternalResources:false}})}}else{if(!shouldUseActiveX()){Parser.prototype.parseFromString=function(string){var doc=document.implementation.createHTMLDocument("");doc.open();doc.write(string);doc.close();return doc}}else{Parser.prototype.parseFromString=function(string){var doc=new window.ActiveXObject("htmlfile");doc.designMode="on";doc.open();doc.write(string);doc.close();return doc}}}return Parser}function shouldUseActiveX(){var useActiveX=false;try{document.implementation.createHTMLDocument("").open()}catch(e){if(window.ActiveXObject){useActiveX=true}}return useActiveX}module.exports=canParseHtmlNatively()?_window.DOMParser:createHtmlParser()},{"jsdom":6}],4:[function(require,module,exports){module.exports=[{filter:"p",replacement:function(content){return"\n\n"+content+"\n\n"}},{filter:"br",replacement:function(){return"  \n"}},{filter:["h1","h2","h3","h4","h5","h6"],replacement:function(content,node){var hLevel=node.nodeName.charAt(1);var hPrefix="";for(var i=0;i<hLevel;i++){hPrefix+="#"}return"\n\n"+hPrefix+" "+content+"\n\n"}},{filter:"hr",replacement:function(){return"\n\n* * *\n\n"}},{filter:["em","i"],replacement:function(content){return"_"+content+"_"}},{filter:["strong","b"],replacement:function(content){return"**"+content+"**"}},{filter:function(node){var hasSiblings=node.previousSibling||node.nextSibling;var isCodeBlock=node.parentNode.nodeName==="PRE"&&!hasSiblings;return node.nodeName==="CODE"&&!isCodeBlock},replacement:function(content){return"`"+content+"`"}},{filter:function(node){return node.nodeName==="A"&&node.getAttribute("href")},replacement:function(content,node){var titlePart=node.title?' "'+node.title+'"':"";return"["+content+"]("+node.getAttribute("href")+titlePart+")"}},{filter:"img",replacement:function(content,node){var alt=node.alt||"";var src=node.getAttribute("src")||"";var title=node.title||"";var titlePart=title?' "'+title+'"':"";return src?"!["+alt+"]"+"("+src+titlePart+")":""}},{filter:function(node){return node.nodeName==="PRE"&&node.firstChild.nodeName==="CODE"},replacement:function(content,node){return"\n\n    "+node.firstChild.textContent.replace(/\n/g,"\n    ")+"\n\n"}},{filter:"blockquote",replacement:function(content){content=content.trim();content=content.replace(/\n{3,}/g,"\n\n");content=content.replace(/^/gm,"> ");return"\n\n"+content+"\n\n"}},{filter:"li",replacement:function(content,node){content=content.replace(/^\s+/,"").replace(/\n/gm,"\n    ");var prefix="*   ";var parent=node.parentNode;var index=Array.prototype.indexOf.call(parent.children,node)+1;prefix=/ol/i.test(parent.nodeName)?index+".  ":"*   ";return prefix+content}},{filter:["ul","ol"],replacement:function(content,node){var strings=[];for(var i=0;i<node.childNodes.length;i++){strings.push(node.childNodes[i]._replacement)
        }if(/li/i.test(node.parentNode.nodeName)){return"\n"+strings.join("\n")}return"\n\n"+strings.join("\n")+"\n\n"}},{filter:function(node){return this.isBlock(node)},replacement:function(content,node){return"\n\n"+content+"\n\n"}},{filter:function(){return true},replacement:function(content,node){return content}}]},{}],5:[function(require,module,exports){module.exports=["address","article","aside","audio","blockquote","canvas","dd","div","dl","fieldset","figcaption","figure","footer","form","h1","h2","h3","h4","h5","h6","header","hgroup","hr","main","nav","noscript","ol","output","p","pre","section","table","tfoot","ul","video"]},{}],6:[function(require,module,exports){},{}],7:[function(require,module,exports){var voidElements=require("void-elements");Object.keys(voidElements).forEach(function(name){voidElements[name.toUpperCase()]=1});var blockElements={};require("block-elements").forEach(function(name){blockElements[name.toUpperCase()]=1});function isBlockElem(node){return !!(node&&blockElements[node.nodeName])}function isVoid(node){return !!(node&&voidElements[node.nodeName])}function collapseWhitespace(elem,isBlock){if(!elem.firstChild||elem.nodeName==="PRE"){return}if(typeof isBlock!=="function"){isBlock=isBlockElem}var prevText=null;var prevVoid=false;var prev=null;var node=next(prev,elem);while(node!==elem){if(node.nodeType===3){var text=node.data.replace(/[ \r\n\t]+/g," ");if((!prevText||/ $/.test(prevText.data))&&!prevVoid&&text[0]===" "){text=text.substr(1)}if(!text){node=remove(node);continue}node.data=text;prevText=node}else{if(node.nodeType===1){if(isBlock(node)||node.nodeName==="BR"){if(prevText){prevText.data=prevText.data.replace(/ $/,"")}prevText=null;prevVoid=false}else{if(isVoid(node)){prevText=null;prevVoid=true}}}else{node=remove(node);continue}}var nextNode=next(prev,node);prev=node;node=nextNode}if(prevText){prevText.data=prevText.data.replace(/ $/,"");if(!prevText.data){remove(prevText)}}}function remove(node){var next=node.nextSibling||node.parentNode;node.parentNode.removeChild(node);return next}function next(prev,current){if(prev&&prev.parentNode===current||current.nodeName==="PRE"){return current.nextSibling||current.parentNode}return current.firstChild||current.nextSibling||current.parentNode}module.exports=collapseWhitespace},{"block-elements":5,"void-elements":8}],8:[function(require,module,exports){module.exports={"area":true,"base":true,"br":true,"col":true,"embed":true,"hr":true,"img":true,"input":true,"keygen":true,"link":true,"menuitem":true,"meta":true,"param":true,"source":true,"track":true,"wbr":true}},{}]},{},[1])(1)});(function(){var pandoc=[{filter:"h1",replacement:function(content,node){var underline=Array(content.length+1).join("=");return"\n\n"+content+"\n"+underline+"\n\n"}},{filter:"h2",replacement:function(content,node){var underline=Array(content.length+1).join("-");return"\n\n"+content+"\n"+underline+"\n\n"}},{filter:"sup",replacement:function(content){return"^"+content+"^"}},{filter:"sub",replacement:function(content){return"~"+content+"~"}},{filter:"hr",replacement:function(){return"\n\n* * * * *\n\n"}},{filter:["em","i","cite","var"],replacement:function(content){return"*"+content+"*"}},{filter:function(node){var hasSiblings=node.previousSibling||node.nextSibling;var isCodeBlock=node.parentNode.nodeName==="PRE"&&!hasSiblings;var isCodeElem=node.nodeName==="CODE"||node.nodeName==="KBD"||node.nodeName==="SAMP"||node.nodeName==="TT";return isCodeElem&&!isCodeBlock},replacement:function(content){return"`"+content+"`"}},{filter:function(node){return node.nodeName==="A"&&node.getAttribute("href")},replacement:function(content,node){var url=node.getAttribute("href");var titlePart=node.title?' "'+node.title+'"':"";if(content===url){return"<"+url+">"}else{if(url===("mailto:"+content)){return"<"+content+">"}else{return"["+content+"]("+url+titlePart+")"}}}},{filter:"li",replacement:function(content,node){content=content.replace(/^\s+/,"").replace(/\n/gm,"\n    ");var prefix="-   ";var parent=node.parentNode;if(/ol/i.test(parent.nodeName)){var index=Array.prototype.indexOf.call(parent.children,node)+1;prefix=index+". ";while(prefix.length<4){prefix+=" "}}return prefix+content}}];var escape=function(str){return str.replace(/[\u2018\u2019\u00b4]/g,"'").replace(/[\u201c\u201d\u2033]/g,'"').replace(/[\u2212\u2022\u00b7\u25aa]/g,"-").replace(/[\u2013\u2015]/g,"--").replace(/\u2014/g,"---").replace(/\u2026/g,"...").replace(/[ ]+\n/g,"\n").replace(/\s*\\\n/g,"\\\n").replace(/\s*\\\n\s*\\\n/g,"\n\n").replace(/\s*\\\n\n/g,"\n\n").replace(/\n-\n/g,"\n").replace(/\n\n\s*\\\n/g,"\n\n").replace(/\n\n\n*/g,"\n\n").replace(/[ ]+$/gm,"").replace(/^\s+|[\s\\]+$/g,"")};var convert=function(str){return escape(toMarkdown(str,{converters:pandoc,gfm:true}))};var insert=function insertAtCursor(myField,myValue){if(document.selection){myField.focus();sel=document.selection.createRange();sel.text=myValue;sel.select()}else{if(myField.selectionStart||myField.selectionStart=="0"){var startPos=myField.selectionStart;
    var endPos=myField.selectionEnd;var beforeValue=myField.value.substring(0,startPos);var afterValue=myField.value.substring(endPos,myField.value.length);myField.value=beforeValue+myValue+afterValue;myField.selectionStart=startPos+myValue.length;myField.selectionEnd=startPos+myValue.length;myField.focus()}else{myField.value+=myValue;myField.focus()}}};document.addEventListener("DOMContentLoaded",function(){var pastebin=document.querySelector("#pastebin");var output=document.querySelector("#text");document.addEventListener("keydown",function(event){if($("#pastebin-switch").attr("class")=="switch-on" && output == document.activeElement){if(event.ctrlKey||event.metaKey){if(String.fromCharCode(event.which).toLowerCase()==="v"){pastebin.innerHTML="";pastebin.focus()}}}});pastebin.addEventListener("paste",function(){if($("#pastebin-switch").attr("class")=="switch-on"){setTimeout(function(){var html=pastebin.innerHTML;var markdown=convert(html);insert(output,markdown);output.focus()},200)}})})})();var honeySwitch={};honeySwitch.themeColor="rgb(100, 189, 99)";honeySwitch.init=function(){var s="<span class='slider'></span>";$("[class^=switch]").append(s);$("[class^=switch]").click(function(){if($(this).hasClass("switch-disabled")){return}if($(this).hasClass("switch-on")){$(this).removeClass("switch-on").addClass("switch-off");$(".switch-off").css({"border-color":"#dfdfdf","box-shadow":"rgb(223, 223, 223) 0px 0px 0px 0px inset","background-color":"rgb(255, 255, 255)"})}else{$(this).removeClass("switch-off").addClass("switch-on");if(honeySwitch.themeColor){var c=honeySwitch.themeColor;$(this).css({"border-color":c,"box-shadow":c+" 0px 0px 0px 16px inset","background-color":c})}if($(this).attr("themeColor")){var c2=$(this).attr("themeColor");$(this).css({"border-color":c2,"box-shadow":c2+" 0px 0px 0px 16px inset","background-color":c2})}}});window.switchEvent=function(ele,on,off){$(ele).click(function(){if($(this).hasClass("switch-disabled")){return}if($(this).hasClass("switch-on")){if(typeof on=="function"){on()}}else{if(typeof off=="function"){off()}}})};if(this.themeColor){var c=this.themeColor;$(".switch-on").css({"border-color":c,"box-shadow":c+" 0px 0px 0px 16px inset","background-color":c});$(".switch-off").css({"border-color":"#dfdfdf","box-shadow":"rgb(223, 223, 223) 0px 0px 0px 0px inset","background-color":"rgb(255, 255, 255)"})}if($("[themeColor]").length>0){$("[themeColor]").each(function(){var c=$(this).attr("themeColor")||honeySwitch.themeColor;if($(this).hasClass("switch-on")){$(this).css({"border-color":c,"box-shadow":c+" 0px 0px 0px 16px inset","background-color":c})}else{$(".switch-off").css({"border-color":"#dfdfdf","box-shadow":"rgb(223, 223, 223) 0px 0px 0px 0px inset","background-color":"rgb(255, 255, 255)"})}})}};honeySwitch.showOn=function(ele){$(ele).removeClass("switch-off").addClass("switch-on");if(honeySwitch.themeColor){var c=honeySwitch.themeColor;$(ele).css({"border-color":c,"box-shadow":c+" 0px 0px 0px 16px inset","background-color":c})}if($(ele).attr("themeColor")){var c2=$(ele).attr("themeColor");$(ele).css({"border-color":c2,"box-shadow":c2+" 0px 0px 0px 16px inset","background-color":c2})}};honeySwitch.showOff=function(ele){$(ele).removeClass("switch-on").addClass("switch-off");$(".switch-off").css({"border-color":"#dfdfdf","box-shadow":"rgb(223, 223, 223) 0px 0px 0px 0px inset","background-color":"rgb(255, 255, 255)"})};$(function(){honeySwitch.init()});
