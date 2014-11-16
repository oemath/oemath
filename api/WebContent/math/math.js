
var grade = 0;

function clickBtn(id) {
    var ret = id.split('-');
    if (ret.length == 3) {
//            $("#test1").html(ret[0]+'?grade='+ret[1]+'&category='+ret[2]);
        window.location.href = ret[0]+'?grade='+ret[1]+'&category='+ret[2];
    }
}


$(function() {

    var full_url = window.location.href;
    var parts = full_url.split("?");
    
    checkLoginStatus();
    
    if (parts.length == 2) {
        grade = parts[1];
        $("#bc-root").html("Grade " + grade);
    }
    
    $.ajax({
        type: "get",
        url: "/api/category?grade="+grade,
        dataType: "json",
        success: function(data, textStatus, jqXHR) {
            $("#test1").html(data.categories[0].title);
            $.each(data.categories, function(i, d) {
                $("#category-container").append(
                    '<div class="panel panel-success">' +
                       '<div class="panel-heading oemath-panel-heading" id="category-' + d.cid + '">' +
                            '<h3 class="panel-title oemath-panel-title"><b>' + d.title + '</b></h3>' +
                            '<div class="oemath-btn-group">' +
                                '<button class="oemath-btn" id="practice-'+grade+'-'+d.cid+'" onclick="clickBtn(id)">Practice</button>' +
                                '<button class="oemath-btn" id="exam-'+grade+'-'+d.cid+'" onclick="clickBtn(id)">Exam</button>' +
                            '</div>' +
                       '</div>' +
                       '<div class="panel-body">' +
                          d.description.replace(/\\\//g, "/") +
                       '</div>' +
                    '</div>');
                });
            },
        failure: function(jqXHR, textStatus, errorThrown) {
            $("#test1").text("failure:"+textStatus);
            },
    });
});
