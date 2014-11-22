// constants
var	DEFAULT_INPUT_RADIUS = 25;
var DEFAULT_INLINE_INPUT_WIDTH = 30;
var SVG_MARGIN = 2;

// http://stackoverflow.com/questions/502366/structs-in-javascript
/*
var o = {
  'a': 3, 'b': 4,
  'doStuff': function() {
    alert(this.a + this.b);
  }
};
o.doStuff(); // displays: 7
*/

/*
var Item = makeStruct("id speaker country");
var row = new Item(1, 'john', 'au');
alert(row.speaker); // displays: john
*/

function makeStruct(names) {
    var names = names.split(' ');
    var count = names.length;
    function constructor() {
        for (var i = 0; i < count; i++) {
            this[names[i]] = arguments[i];
        }
    }
    return constructor;
}

/*
function Item(id, speaker, country) {
    this.id = id;
    this.speaker = spkr;
    this.country = country;
}
var myItems = [
    new Item(1, 'john', 'au'),
    new Item(2, 'mary', 'us')
];*/


function rand(n) {
    return ((Math.random() * 100000000) % n) >> 0;
}

function shuffle(arr) {
    arr.sort(function() {
      return .5 - Math.random();
    });
}

// attach the .equals method to Array's prototype to call it on any array
Array.prototype.equals = function (array) {
    // if the other array is a falsy value, return
    if (!array)
        return false;

    // compare lengths - can save a lot of time 
    if (this.length != array.length)
        return false;

    for (var i = 0, l=this.length; i < l; i++) {
        // Check if we have nested arrays
        if (this[i] instanceof Array && array[i] instanceof Array) {
            // recurse into the nested arrays
            if (!this[i].equals(array[i]))
                return false;       
        }           
        else if (this[i] != array[i]) { 
            // Warning - two different object instances will never be equal: {x:20} != {x:20}
            return false;   
        }           
    }       
    return true;
}


Array.prototype.same = function (array) {
    if (!array) return false;
    return this.sort().equals(array.sort());
}


function replace_oemath_image_tags(desc) {
	desc = desc.replace(/\<oemath-image-(\d+)\>/g, '<div class="oemath-problem-image" style="width:$1px">');
	desc = desc.replace(/\<oemath-image-(\d+)-(\d+)\>/g, '<div class="oemath-problem-image" style="width:$1px; height:$2px">');
	desc = desc.replace(/\<\/oemath-image\>/g, '<\/div>');
    return desc;
}

function replace_input_tags_in_answer(answer) {
    answer = replace_oemath_image_tags(answer);
    answer = answer.replace(/\<oemath-input-(\d+)-(\d+)-*(\d*)\(([^\)]*)\)\>/g, function (m, $1, $2, $3, $4) {
        if ($3) {
            return '<input type="text" class="oemath-svg-input" style="top:' + $1 + 'px; left:' + $2 + 'px; width:' + $3 + 'px" value="'+$4+'">';
        }
        else {
            return '<input type="text" class="oemath-svg-input" style="top:' + $1 + 'px; left:' + $2 + 'px" value="' + $4 + '">';
        }
    });

    return answer;
}

// polar coordination to cart coordination
function p2c(centerX, centerY, radius, angleInDegrees) {
    centerX=eval(centerX); centerY=eval(centerY); radius=eval(radius); angleInDegrees=eval(angleInDegrees);
  var angleInRadians = (360-angleInDegrees) * Math.PI / 180.0;

  return {
    x: centerX + (radius * Math.cos(angleInRadians)),
    y: centerY + (radius * Math.sin(angleInRadians))
  };
}


function parse_position(my_circles, str) {
    var start = str.indexOf('(');
    var end = str.indexOf(')');
    if (start == 0) {
        var xy = str.substring(start+1, end).split(',');
        if (xy.length == 2) {
            return { x: eval(xy[0]), y: eval(xy[1]), p: false };
        }
        else { // (cx,cy,radius,theta)
            var c = p2c(xy[0], xy[1], xy[2], xy[3]);
            return { x: c.x, y : c.y, p : true };
        }
    }
    else if (start > 0) {
        var cr = my_circles[str.substr(0, start)];
        var c = p2c(cr.x, cr.y, cr.r, str.substring(start+1, end));
        return { x: c.x, y : c.y, p : true };
    }
    else {
        var cr = my_circles[str];
        return { x: cr.x, y: cr.y, p: true };
    }
}


function parse_prop(str, filter, ch) {
    ch = typeof ch !== 'undefined' ? ch : '=';
    var prop = {};
    prop['fill'] = 'white';
    prop['stroke'] = 'black';
    prop['stroke-width'] = '1';
    if (str) {
        var p = str.split(',');
        for (var i=0; i<p.length; i++) {
            var kv = p[i].split('=');
            if (kv.length <= 1) {
                kv = p[i].split(':');
            }
            
            if (!filter || filter(kv[0], kv[1])) {
                prop[kv[0]] = kv[1];                
            }
        }
    }

    var prop_str = ' ';
    $.each(prop, function(k, v) {
        prop_str += k + ch+ '"' + v +'" ';
    });
    
    return prop_str;
}

function get_prop(str, key, def_value) {
    var val = def_value;
    if (str) {
        str = str.trim();
        var vals = str.split('=');
        if (vals.length==2 && vals[0].trim() == key) {
            try { val = eval(vals[1]); } catch(e) { }
        }
    }
    return val;
}


function vertical(fml, hint, prob_index, input_numbers) {
    var hints = hint.split(',');
    var hint_index = 0;

    var gx=16;
    var gy=20;
    var lh = 10;
    var height = 0;
    var width = 0;
    for (var i=0; i<fml.length; i++) {
        var s = fml[i];
        height += ((s[0] == '-' || s[0] == '|') ? lh : gy);
        var w = s.length;
        width = Math.max(width, s.length);    
    }
    width *= gx;
    
    var y=0;
    var svg = '<svg width='+(4+width)+' height='+(4+height)+' class="oemath-svg-vertical"><g transform="translate(2,2)">';
    var vertical_inputs = '<foreignObject x=0 y=0 width='+width+' height='+height+'>';
    for (var i=0; i<fml.length; i++) {
        var s = fml[i];
        var w = s.length;
        if (s[0] == '-') {
            y += 2;
            var x1 = width - w*gx - gx/4;
            svg += '<line x1='+x1+' y1='+y+' x2='+width+' y2='+y+' />';
            y += (lh-2);
        }
        else if (s[0] == '|') {
            y += 2;
            var x1 = width - (w-1)*gx - gx/4;
            svg += '<line x1='+x1+' y1='+y+' x2='+width+' y2='+y+' />';
            svg += '<path d="M '+x1+','+y+' a '+gx/2+' '+(gy*5/4)+' 0 0 1 '+(-gx/2)+','+(gy*6/5)+'" />';
            y += (lh-2);
        }
        else {
            var x = width - gx/2;
            for (var j=s.length-1; j>=0; j--) {
                var c = s[j];
                if (0 <= c && c <= 9) {
                    svg += '<text x='+x+' y='+y+'>'+s.charAt(j)+'</text>';
                }
                else {
                    ++input_numbers;
                    vertical_inputs += '<input type="text" id="oemath-input-field-' +prob_index+ '-' +input_numbers+'" style="left:'+(x-gx/2)+'px;top:'+(y-2)+'px" hint="'+hints[hint_index++]+'" placeholder="'+c+'"/>';
                }
                x -= gx;
            }
            y += gy;
        }
    }
    vertical_inputs += '</foreignObject>';
    svg += vertical_inputs+'</g></svg>';

    return { desc: svg, inputs: input_numbers };
}

function replace_vertical(prob, prob_index, input_numbers) {
    var inputs = input_numbers;
    prob = prob.replace(/\s*<\s*oemath-vertical\s+\(([^\)]+)\)\s+\(([^\)]+)\)\s*>/g, function(m, $1, $2) {
        var desc_inputs = vertical(eval($1), $2, prob_index, input_numbers);
//    $("#test2").text(desc_inputs);
        inputs = desc_inputs.inputs;
        return desc_inputs.desc;
    });
    return { desc: prob, inputs: inputs };
}


function replace_oemath_tags(prob, prob_index) {
	// oemath-image tags
	prob = replace_oemath_image_tags(prob);

    // oemath-canvas tags
    var idx = -1;
    prob = prob.replace(/<oemath-canvas-(\d+)-(\d+)\s*\/\s*>/g, function(m, $1, $2) {
    	++idx;
    	return '<div class="oemath-problem-canvas" id="oemath-problem-canvas-id-'+prob_index+'-'+idx+'" style="width:'+$1+'px; height:'+$2+'px;"></div>';
    });
    prob = prob.replace(/<oemath-script>/g, '<script type="text/javascript">');
    prob = prob.replace(/<\/oemath-script>/g, '<\/script>');
    
    prob = prob.replace(/<oemath-canvas>/g, 'new jsGraphics(document.getElementById("oemath-problem-canvas-id-'+prob_index+'-0"));');
    prob = prob.replace(/<oemath-canvas-(.+)>/g, 'new jsGraphics(document.getElementById("oemath-problem-canvas-id-'+prob_index+'-$1"));');
    prob = prob.replace(/<oemath-color>/g, 'new jsColor');
    prob = prob.replace(/<oemath-pen>/g, 'new jsPen');
    prob = prob.replace(/<oemath-point>/g, 'new jsPoint');
    
    ///////////////////////
    // oemath-svg tags
    ///////////////////////
    var my_circles = [];
    var circle_inputs = '';
    var svg_width = 0;
    var svg_height = 0;
    var translateX = SVG_MARGIN;
    var translateY = SVG_MARGIN;
    
    // '<oemath-svg-500-500>'
    prob = prob.replace(/<\s*oemath-svg\(([^\)]+)\)\s*>/g, function (m, $1) {
        var prop = parse_prop($1, function(k,v) {
            if (k == 'width' || k == 'w') {
                svg_width = eval(v);
            }
            else if (k == 'height' || k == 'h') {
                svg_height = eval(v);
            }
            else if (k == 'tx' || k == 'translateX' ) {
                translateX = eval(v);
            }
            else if (k == 'ty' || k == 'translateY' ) {
                translateY = eval(v);
            }
            return false;
        });

        return '<svg width=' +(svg_width + 2*translateX)+ ' height='+ (svg_height + 2*translateY) + ' class="oemath-svg-svg">' +
                '<g transform="translate('+translateX+','+translateY+')">';
    });

    // 'def_circle C#=(200,200,100)' +: define a circle named C#, cx=200, cy=200, radius=100
    prob = prob.replace(/def_circle\s+([^=\s]+)\s*=\s*\(\s*([^,\s\)]+)\s*,\s*([^,\s\)]+)\s*,\s*([^,\s\)]+)\s*\)/g, function(m, $1, $2, $3, $4) {
        my_circles[$1] = { x:eval($2), y:eval($3), r:eval($4) };
        return "";
    });

    // <svg-polygon[(nofill)] (x,y)|C#0(theta)[ (x,y)|C#0(theta)]+/>
    prob = prob.replace(/<\s*svg-polygon\(?([^\)\s]+)?\)?\s+([^>]+)>/g, function(m, $1, $2) {
        var pts = $2.trim().split(' ');
        var ret = '<polygon points="';
        for (var i=0; i < pts.length; i++) {
            var xy = parse_position(my_circles, pts[i].trim());
            ret += (xy.x + ',' + xy.y + ' ');
        }

        ret += '" class="oemath-svg" ' + parse_prop($1) + '/>';

        return ret;
    });


    // <svg-line(props) (x,y)|C#0(theta) (x,y)|C#0(theta)/>
    prob = prob.replace(/<\s*svg-line\(?([^\)\s]+)?\)?\s+(\S+)\s+([^>]+)>/g, function(m, $1, $2, $3) {
        var p1 = parse_position(my_circles, $2);
        var p2 = parse_position(my_circles, $3.trim());
        var ret = '<line x1='+p1.x+' y1='+p1.y+ ' x2='+p2.x+' y2='+p2.y+' class="oemath-svg"' + parse_prop($1) +'/>';
        return ret;
    });

    // <svg-rect(props) (x,y)|C#0(theta) (x,y)|C#0(theta)/>
    prob = prob.replace(/<\s*svg-rect\(?([^\)\s]+)?\)?\s+(\S+)\s+([^>]+)>/g, function(m, $1, $2, $3) {
        var p1 = parse_position(my_circles, $2);
        var p2 = parse_position(my_circles, $3.trim());
        var ret = '<rect x='+p1.x+' y='+p1.y+ ' width='+(p2.x-p1.x)+' height='+(p2.y-p1.y)+' class="oemath-svg" ' + parse_prop($1) +'/>';
        return ret;
    });

    // <svg-circle[(props)] C#(theta) r=<radius>> or
    // <svg-circle[(props)] C#>
    prob = prob.replace(/<\s*svg-circle\(?([^\)\s]+)?\)?\s+([^\s>]+)([^>]*)>/g, function (m, $1, $2, $3) {
        
        var prop = parse_prop($1, function(k, v) {
            if (k == 'hint') {
                circle_inputs += '<svg-input(hint='+v+') '+$2+'>';
                return false;
            }
            return true; // continue processing
        });
        
        if ($2.indexOf('(') >= 0) { // C#0(theta) r=<radius>
            var xy = parse_position(my_circles, $2);
            var radius = get_prop($3, 'r', DEFAULT_INPUT_RADIUS);
            return '<circle cx='+xy.x+' cy='+xy.y+' r='+radius + prop+'/>';
        }
        else { // C#: to show this circle
            var cr = my_circles[$2.trim()];
            return '<circle cx='+cr.x+' cy='+cr.y+' r='+cr.r + prop+'/>';
        }
    });

    // inject circle inputs
    var has_foreign = false;
    prob = prob.replace(/(<\s*oemath-foreignObject\s*>)/g, function(m, $1) {
        has_foreign = true;
        return $1 + circle_inputs;
    });
    if (!has_foreign) {
        prob = prob.replace(/(<\s*\/\s*oemath-svg\s*>)/g, function(m, $1) {
            return '<oemath-foreignObject>' + circle_inputs + '</oemath-foreignObject>' + $1;
        });
    }
    
    // oemath-image-input tags
    var input_numbers = -1;

    // <inline-input(props) [width=<width>]/>
    prob = prob.replace(/\<inline-input\(([^\)]+)\)([^>]*)>/g, function (m, $1, $2) {
        ++input_numbers;

        var width = get_prop($2, 'width', DEFAULT_INLINE_INPUT_WIDTH);

        return '<input type="text" id="oemath-input-field-' +prob_index+ '-' +input_numbers+ '" class="oemath-inline-input" style="width:' + width + 'px" placeholder="?"' + parse_prop($1) + '>';
    });


    // <svg-input(props) [(x,y)|C#0(theta)] [width=<width>]/>
    // <svg-input(0) (10,10) width=100/>
    // <svg-input(0) (10,10)/>
    // <svg-input(0) C#0(10) width=100/>
    prob = prob.replace(/<\s*svg-input\(([^\)]+)\)\s+([^\s>]+)([^>]*)>/g, function (m, $1, $2, $3) {
        ++input_numbers;

        var width = get_prop($3, 'width', DEFAULT_INPUT_RADIUS * 2);
        var xyp = parse_position(my_circles, $2);
        if (xyp.p) { // It's a polar coordination, find the left top corner
            xyp.x -= width/2;
            xyp.y -= DEFAULT_INPUT_RADIUS;
        }
        return '<input type="text" id="oemath-input-field-' +prob_index+ '-' +input_numbers+ '"' +
               parse_prop($1) +
               ' style="left:' +xyp.x+ 'px; top:' +xyp.y + 'px; width:' +width+ 'px"' +
               ' class="oemath-svg-input" placeholder="?"/>';
    });

    prob = prob.replace(/<\s*oemath-foreignObject\s*>/g, '<foreignObject x=0 y=0 width='+svg_width+' height='+svg_height+'>');
    prob = prob.replace(/<\s*\/\s*oemath-foreignObject\s*>/g, '<\/foreignObject>');
    prob = prob.replace(/<\s*\/\s*oemath-svg\s*>/g, '</g><\/svg>');
    
    
    var desc_inputs = replace_vertical(prob, prob_index, input_numbers);
    
    return { desc: desc_inputs.desc, inputs: desc_inputs.inputs+1 };
}


//////////////// ajax ///////////////////
function ajax_load_problem_from_pid(grade, index, func) {
    $.ajax({
        type: "post",
        url: "/api/problem",
        dataType: "json",
        data: { grade: grade, index: index },
        success: function (data, textStatus, jqXHR) {
            func(data, index);
        },
        failure: function (jqXHR, textStatus, errorThrown) {
            $("#test1").text("failure:" + textStatus);
        },
        error: function (jqXHR, textStatus, errorThrown) {
            $("#test1").text("error:" + textStatus);
        },
    });
}


function ajax_load_problems(baseUrl, metadata, func) {
    // retrieve all problem ids for the grade&category
    $.ajax({
        type: "get",
        url: baseUrl + "?grade=" + metadata.grade + "&category=" + metadata.category,
        dataType: "json",
        success: function (data, textStatus, jqXHR) {
            metadata.count = data.count;

            // retrieve first problem for the grade&pid
            ajax_load_problem_from_pid(metadata.grade, 0, func);

        },
        failure: function (jqXHR, textStatus, errorThrown) {
            $("#test1").text("failure:" + textStatus);
        },
        error: function (jqXHR, textStatus, errorThrown) {
            $("#test1").text("error:" + textStatus);
        },
    });

    return ret;
}


function showLoginDialog() {
    $("#register-dialog").hide();
    $("#login-dialog").show();
    $("#login-register-dialog").dialog("open");
}

function showRegisterDialog() {
    $("#register-dialog").show();
    $("#login-dialog").hide();
    $("#login-register-dialog").dialog("open");
}

function logout() {
	logoutUser();
}

function validateEmail(email) {
    //        var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    var re = /^[^\s@]+@[^@\.\s]+(\.[^@\.\s]+)+$/;
    return email.match(re);
}

function validateLogin() {
    var error_msg = [];
    var username = $("#login-username").val().trim();

    if (!validateEmail(username) || !username.match(/^([a-zA-Z0-9_])+$/)) {
        error_msg.push("Invalid username");
    }

    return error_msg;
}

function loginUser() {
    $("#login-info").text("Signing in...");
    
    var username = $("#login-username").val().trim().toLowerCase();
    if (username.length == 0) {
        $("#login-info").text("Please enter username or email");
        return;
    }
    var password = $("#login-password").val();
    if (password.length == 0) {
        $("#login-info").text("Please enter password");
        return;
    }

    $.ajax({
        type: "post",
//      url: "/api/user/login",
        url: "https:/localhost:8443/api/user/login",
        xhrFields: { withCredentials: true },
        crossDomain: true,
        headers: { 'Origin' : 'http://localhost:8080' },
        data: { username: username, password: password },
        dataType: "json",
        success: function (data, textStatus, jqXHR) {
            var result = data.result;
            var success = result.split(':');
            if (success.length == 2 && success[0] == "Success") {
                $("#login-register-dialog input").val("");
                $("#login-register-dialog").dialog("close");
                showLogoutDiv(success[1]);
            }
            else {
                $("#login-info").text(result);
            }
        },
        error: function (jqXHR, textStatus, errorThrown) {
            $("#login-info").text("error:" + jqXHR+";"+textStatus+";"+errorThrown);
        },
    });
}

function logoutUser() {
	$.ajax({
		type: 'post',
		url: '/api/user/logout',
		success: function() {
			showLoginDiv();
		},
		error: function(jqXHR, textStatus, errorThrown) {
			$("#test1").html("error:"+errorThrown);
		}
	});
}

function validateRegister() {
    var error_msg = [];
    var username = $("#register-username").val().trim();

    if (username.length < 6 || username.length > 18) {
        error_msg.push("User name length must be at least 6 and no more than 18");
    }
    else if (!username.match(/^([a-zA-Z0-9_])+$/)) {
        error_msg.push("User name can only contain numbers, alphabets and underscores");
    }

    var email = $("#register-email").val().trim();
    if (!validateEmail(email)) {
        error_msg.push("Invalid email address");
    }

    var password = $("#register-password").val();
    if (password.length < 6 || password.length > 18) {
        error_msg.push("Password length must be at least 6 and no more than 18");
    }
    var password_confirm = $("#register-password-confirm").val();
    if (password != password_confirm) {
        error_msg.push("Password do not match!");
    }

    return error_msg;
}

function registerUser() {
    var error_msg = validateRegister();
    if (error_msg.length > 0) {
        $("#register-info").html(error_msg);
        return;
    }

    var username = $("#register-username").val().trim();
    var email = $("#register-email").val().trim();
    var password = $("#register-password").val().trim();
    $.ajax({
        type: "post",
//        url: "/api/user/register",
        url: "https://localhost:8443/api/user/register",
        data: { username: username, email: email, password: password },
        xhrFields: { withCredentials: true },
        dataType: "json",
        success: function (data, textStatus, jqXHR) {
            var result = data.result;
            if (result != "Success") {
                $("#register-info").text(result);
            }
            else {
                $("#login-register-dialog input").val("");
                $("#login-register-dialog").dialog("close");
            }
        },
        failure: function (jqXHR, textStatus, errorThrown) {
            $("#register-info").text("failure:" + textStatus);
        },
        error: function (jqXHR, textStatus, errorThrown) {
            $("#register-info").text("error:" + textStatus);
        },
    });
}


function showLogoutDiv(username) {
	$('#oemath-head-logged-in').remove();
	$('#oemath-head-not-logged-in').remove();
	
	var logout_div = 
	    '<div id="oemath-head-logged-in">' +
	    	'<span>Welcome </span><span id="oemath-head-username">'+username+'</span>' +
	    	'<button id="logout-btn" type="button" class="btn btn-default">Sign out</button>' +
	    '</div>';
	$('#login-register').append(logout_div);
	$("#logout-btn").click(logout);
}


function showLoginDiv() {
	$('#oemath-head-logged-in').remove();
	$('#oemath-head-not-logged-in').remove();
	
	var login_div = 
		'<div id="oemath-head-not-logged-in">' +
			'<button id="login-btn" type="button" class="btn btn-default">Sign in</button>' +
			'<button id="register-btn" type="button" class="btn btn-default">Sign up</button>' +
		'</div>';
	$('#login-register').append(login_div);
	$("#register-btn").click(showRegisterDialog);
	$("#login-btn").click(showLoginDialog);
}


function checkLoginStatus() {
	$("#login-register-dialog").dialog({ autoOpen: false, modal: true });

	$.ajax({
		type: 'get',
		url: '/api/user/status',
//		async: false,
		dataType: 'text',
		success: function(username, textStatus, jqXHR) {
			if (username.length == 0) {
				showLoginDiv();
//				$("#test1").html("Login");
			}
			else {
				showLogoutDiv(username);
				$("#test1").html("Logout");
			}
		},
		failure: function(data, textStatus, jqXHR) {
			$("#test1").html(""+data+","+textStatus+","+jqXHR);
		},
		error: function(data, textStatus, jqXHR) {
			$("#test1").html(""+data+","+textStatus+","+jqXHR);
		}
	});
}
