//****************************************************************************************
//* Description　: 浪子Javascript - 自定义JS函数(Loafer Javascript).
//* Author　　　 : Cabo'liu    CaboLiu@163.com
//* Version　　　: 1.0.1
//* History　　　: 2008.11.20  Created  v1.0.0
//* 　　　　 　　: 2009.03.25  Modified v1.0.1 增加Ajax函数.
//****************************************************************************************
function Hashtable(){
    this._hash = new Object();
    this.add = function(key,value){
        if(typeof(key)!="undefined"){
            if( this.contains(key) == false ){
                this._hash[key] = typeof(value) == "undefined" ? null : value;
                return true;
            } 
            else {
                return false;
            }
        }
        else {
            return false;
        }
    }
    this.remove = function(key){ delete this._hash[key]; }
    this.count = function(){ var i=0; for(var k in this._hash){ i++; } return i; }
    this.items = function(key){ return this._hash[key]; }
    this.contains = function(key){ return typeof(this._hash[key])!="undefined"; }
    this.clear = function(){ for(var k in this._hash){ delete this._hash[k]; } }
}

function Ajax(){
    this.setXMLHttpRequest = function(){
		var http_request = null;
        if(window.XMLHttpRequest){
			http_request = new XMLHttpRequest();
			if(http_request.overrideMimeType) http_request.overrideMimeType("text/xml");
		}
		else if(window.ActiveXObject){
			try{
				http_request = new ActiveXObject("Msxml2.XMLHTTP");
			}
			catch(e){
				try{
					http_request = new ActiveXObject("Microsoft.XMLHTTP");
				}
				catch(e){
					alert(e);
					//Brower antique.
				}
			}
		}
		else{
			alert(e);
			//Brower undefined .
		}
		return http_request;
    };
	this.handleStateChange = function(http_request,callback){
		if(http_request.readyState == 4){
			if(http_request.status == 200 || http_request.status == 0){
				if(typeof(callback) == "function"){ 
					callback(http_request.responseText);
				}
				else{
					alert(http_request.responseText);
				}
			}
		}
	};
	this.send = function(type, url, sync,sendStr,callback){
		var oThis = this;
		var http_request = this.setXMLHttpRequest();
		if(http_request != null){
			http_request.onreadystatechange = function() { oThis.handleStateChange(http_request,callback); };
			http_request.open(type, url, sync);
			http_request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
			http_request.send(sendStr);
		}
	};
	this.post = function(url,sendStr,callback) { this.send("POST", url, true, sendStr,callback); };
	this.get = function(url,callback) { this.send("GET", url, true, null, callback); };
}

function ltrim(s){ 
	return s.replace(/(^\s*)/g, "");
 } 

function rtrim(s){ 
	return s.replace(/(\s*$)/g, "");
} 

function trim(s){ 
  return rtrim(ltrim(s)); 
}

function get$(ele){
    if(typeof(ele) == "string"){
        return document.getElementById(ele);
    }
}
function all$(ele){
    if(typeof(ele) == "string"){
        return document.all(ele);
	}
}

function openWindow(url,name,width,height){
    var features,left,top;
	var sw = window.screen.width;
	var sh = window.screen.height;

	if(isNaN(width) || width == ""){
		width = 800;
	}
	if(isNaN(height) || height == ""){
		height = 600;
	}

	left = (sw-width)/2;
	top = (sh-height)/2;

	features = "width=" + width + "px,height=" + height + "px,";
	features +="left=" + left + "px,top=" + top + "px,";
	features += "toolbar=no,scrollbars=yes,status=yes,directories=no,menubar=no,resizable=yes,scrollable=no";
	var winObj = window.open('about:blank',name,features);
	if(winObj != null){
		winObj.location.href = url;
	}
	else{
		window.location.href = url;
	}
	return winObj;
}

function openDialog(url,arguments ,width,height,fProperty){
    var features,left,top;
	var sw = window.screen.width;
	var sh = window.screen.height;

	if(isNaN(width) || width == ""){
		width = 800;
	}
	if(isNaN(height) || height == ""){
		height = 600;
	}

	left = (sw-width)/2;
	top = (sh-height)/2;

	features = "dialogWidth=" + width + "px;dialogHeight=" + height + "px;";
	features +="dialogLeft=" + left + "px;dialogTop=" + top + "px;";
	features += (fProperty != null && fProperty != "") ? fProperty : "edge= Raised; center= no; help= no; resizable= no; status= no;"
	
	var dialogReturn = window.showModalDialog(url, arguments,features);
	return dialogReturn;
}