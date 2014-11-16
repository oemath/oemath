// constants
var	DEFAULT_INPUT_HEIGHT = 50;

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
            return '<input type="text" class="oemath-input-image" style="top:' + $1 + 'px; left:' + $2 + 'px; width:' + $3 + 'px" value="'+$4+'">';
        }
        else {
            return '<input type="text" class="oemath-input-image" style="top:' + $1 + 'px; left:' + $2 + 'px" value="' + $4 + '">';
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
    /////////////////////
    var my_circles = [];
    
    // '<oemath-svg-500-500>'
    prob = prob.replace(/<\s*oemath-svg-([^-\s]+)-([^-\s>]+)/g, function(m, $1, $2) {
        return '<svg width=' +eval($1)+ ' height=' +eval($2);
    });
    
    // 'def_circle C#=(200,200,100)' +: define a circle named C#, cx=200, cy=200, radius=100
    prob = prob.replace(/def_circle\s+([^=\s]+)\s*=\s*\(\s*([^,\s]+)\s*,\s*([^,\s]+)\s*,\s*([^,\s]+)\s*\)/g, function(m, $1, $2, $3, $4) {
        my_circles[$1] = { x:eval($2), y:eval($3), r:eval($4) };
        return "";
    });
/*    prob = prob.replace(/<\s*circle(.+)(class=\"[^\"]+\")*?(.+\/>)/g, function(m, $1, $2, $3) {
        if ($2) {
            return '<circle' +$1+ $2 + $3;
        }
        else {
            return '<circle' +$1+ ' class="oemath-circle"' + $3;
        }
    });*/
    
    // '<circle C#(36*9) r=25 class="oemath-circle"/>' + : a circle centered at the circle of C# at angle of 36*9 degree
    prob = prob.replace(/<\s*circle\s+([^\s\)]+)\s*\(([^\),]+)\)/g, function(m, $1, $2) {
        var cr = my_circles[$1];
        var c = p2c(cr.x, cr.y, cr.r, $2);
        return '<circle cx=' +c.x+ ' cy=' +c.y;
    });
    
    // '<circle C#() class="oemath-circle"/>' + : a circle C#
    prob = prob.replace(/<\s*circle\s+([^\s\)]+)\s*\(\s*\)/g, function(m, $1) {
        var cr = my_circles[$1];
        return '<circle cx=' +cr.x+ ' cy=' +cr.y +' r=' +cr.r;
    });
    
    // '<circle P(200,200,100,36*7) r=25 class="oemath-circle"/>' +: a circle at angle of 36*7 degree of a circle of(cx=200, cy=200, radius=100)
    prob = prob.replace(/<\s*circle\s+P\(\s*([^,\s]+)\s*,\s*([^,\s]+)\s*,\s*([^,\s]+)\s*,\s*([^,\s]+)\s*\)/g, function(m, $1, $2, $3, $4) {
        var c = p2c($1,$2,$3,$4);
        return '<circle cx=' +c.x+ ' cy=' +c.y+ ' ';
    });
    
    // '<oemath-line (<cx>,<cy>) C#2(330) class="oemath-svg"/>' +
    prob = prob.replace(/<\s*oemath-line\s+(\S+)\s+(\S+)/g, function(m, $1, $2) {
        var p1 = $1.indexOf('(');
        var p2 = $1.indexOf(')');
        if (p1 == 0) { //(x,y)
            var xy = $1.substring(p1+1, p2).split(',');
            var x1 = xy[0].trim();
            var y1 = xy[1].trim();
        }
        else { //C(theta)
            var cr = my_circles[$1.substr(0, p1).trim()];
            var p = p2c(cr.x, cr.y, cr.r, $1.substring(p1+1, p2).trim());
            var x1 = p.x;
            var y1 = p.y;
        }
        
        p1 = $2.indexOf('(');
        p2 = $2.indexOf(')');
        if (p1 == 0) { //(x,y)
            var xy = $2.substring(p1+1, p2).split(',');
            var x2 = xy[0].trim();
            var y2 = xy[1].trim();
        }
        else { //C(theta)
            var cr = my_circles[$2.substr(0, p1).trim()];
            var p = p2c(cr.x, cr.y, cr.r, $2.substring(p1+1, p2).trim());
            var x2 = p.x;
            var y2 = p.y;
        }
        
//        return '<line x1='+x1+ ' y1='+y1+ ' x2='+x2+ ' y2='+y2;
//        return '<line x1='+(x1)+ ' y1='+(y1)+ ' x2='+(x2)+ ' y2='+(y2);
        return '<line x1='+eval(x1)+ ' y1='+eval(y1)+ ' x2='+eval(x2)+ ' y2='+eval(y2);
    });
	
    // <polygon points="C#1(theta) C#1(theta2) 160,210"
    // <polygon points="200,10 250,190 160,210"
    prob = prob.replace(/<\s*polygon\s+points="([^"]+)"/g, function(m, $1) {
        // '<polygon points="' +$1+ '"';
            //'<polygon points="' +'20,20 30,30 20,30'+ '"';
        var ret = '<polygon points="' +
            $1.replace(/C#([^\(]+)\(([^\)]+)\)/g, function(n, $1, $2) {
                var cr = my_circles['C#'+$1.trim()];
                var p = p2c(cr.x, cr.y, cr.r, $2.trim());
                return p.x +',' + p.y;
            }) +
            '"';
        return ret;
    });


    // oemath-image-input tags
    var input_numbers = -1;
    // x and y provided: <oemath-image-input-X-Y[-W]([H])>
    // polar coordination: <oemath-image-input-(cx,cy,r,theta)-R[-W]([H])>
    //  if W provided, x = C(theta).x-W/2 otherwise x = C(theta).x-R;  y = C(theta).y-R
    prob = prob.replace(/\<oemath-image-input-(\(?[^-\(\)]+\)?)-(\d+)-*(\d*)\(([^\)]*)\)\>/g, function (m, $1, $2, $3, $4) {
        var x = $1;
        var y = $2;
        ++input_numbers;
        var lp = $1.indexOf('(')
        if (lp >= 0) {
            var rp = $1.indexOf(')', lp);
            var cr = $1.substring(lp+1,rp).split(',');
            var c = p2c(cr[0], cr[1], cr[2], cr[3]);
            x = c.x - ($3 ? ($3/2) : $2);
            y = c.y - $2;
        }
        
        var new_input =
            '<input type="text" id="oemath-input-field-' +prob_index+ '-' +input_numbers+ '" ' +
            'oemath-hint="' +$4+ '" ' +
            'class="oemath-input-image" style="left:' + x + 'px; top:' + y + 'px; ' +
                ($3 ? 'width:' + $3 + 'px" ' : '" ') +
            'placeholder="?">';
            
        return new_input;
    });
    
    // oemath-inline-input tags
    prob = prob.replace(/\<oemath-inline-input-*(\d*)\(([^\)]*)\)\>/g, function (m, $1, $2) {
        ++input_numbers;
        if ($1) {
            return '<input type="text" id="oemath-input-field-' +prob_index+ '-' +input_numbers+ '" oemath-hint="' +$2+'" class="oemath-inline-input" style="width:' + $1 + 'px" placeholder="?">';
        }
        else {
            return '<input type="text" id="oemath-input-field-' +prob_index+ '-' +input_numbers+ '" oemath-hint="' +$2+'" class="oemath-inline-input" placeholder="?">';
        }
    });


    // <oemath-input(<hint>) [(x,y)|C#0(theta)] [width=<width>] class="oemath-inline-input"/>
    // <oemath-input(0) (10,10) width=100 class="oemath-inline-input"/>
    // <oemath-input(0) (10,10) class="oemath-inline-input"/>
    // <oemath-input(0) C#0(10) width=100 class="oemath-inline-input"/>
    prob = prob.replace(/\<\s*oemath-input\(([^\)])+\)\s+(\S+)\s+(width=\S+)*/g, function (m, $1, $2, $3) {
        ++input_numbers;
	
        var w;
        if ($3) {
            try { w = eval($3.split('=')[1]); } catch(e) { w = 50; }
        }
        var start = $2.indexOf('(');
        var end = $2.indexOf(')');
        if (start == 0) {
            var xy = $2.substring(start+1, end).split(',');
            var x = eval(xy[0]);
            var y = eval(xy[1]);
        }
        else {
            var cr = my_circles[$2.substr(0, start)];
            var p = p2c(cr.x, cr.y, cr.r, $2.substring(start+1, end));
            $("#test1").text($2.substr(0, start));
            var x = p.x - ($3 ? w : DEFAULT_INPUT_HEIGHT) / 2;
            var y = p.y - DEFAULT_INPUT_HEIGHT/2;
        }
        return '<input type="text" id="oemath-input-field-' +prob_index+ '-' +input_numbers+ 
               '" oemath-hint="' +$1+ '"' +
               ' style="left:' +x+ 'px; top:' +y+ ($3 ? 'px; width:' +w : '') + 'px"' +
               ' class="oemath-input-image" placeholder="?"';
    });
    
    return [prob, input_numbers + 1];
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
