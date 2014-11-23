var practice;

var pid_index = 0;

// all parsed problems
var problems_parsed = [];

// statistics of this practice
var problems_number_correct = 0;
var problems_number_wrong = 0;
var problems_number_skipped = 0;

var panel_heading_color = [
    'oemath-panel-review-heading-correct', 'oemath-panel-review-heading-wrong', 'oemath-panel-review-heading-skipped'];

function review_problem(idx) {
    var prob = problems_parsed[idx];

    prob.hint_level = 0;
    var title = prob.desc.replace(/<br>/g, ' ').replace(/<[^>]+>/g, "").substr(0, 60) + "...";
    var problem_str =
        '<div class="panel panel-default">' +
            '<div class="panel-heading ' + panel_heading_color[prob.result] + '">' +
                '<h4 class="panel-title">' +
                    '<a data-toggle="collapse" data-parent="#accordion" href="#collapse' + idx + '">' + title + '</a>' +
                '</h4>' +
            '</div>' +
            '<div id="collapse' + idx + '" class="panel-collapse collapse">' +
                '<div class="panel-body">' +
                    '<div id="oemath-review-problem-' +idx+ '" oemath-hint-show="off">' + prob.desc + '</div>' +
                '</div>';

    if (prob.type == PROB_TYPE_CHOICE) {
        for (var i = 0; i < prob.answer_desc.length; i++) {
            problem_str += '<input value="' + i + '" name="oemath-choice-group" disabled type="radio"><span>' + prob.answer_desc[i] + '</span><br>';
        }
    }

    if (prob.type != PROB_TYPE_MULTIPLE_ANSWER && prob.type != PROB_TYPE_SINGLE_ANSWER) {
	    problem_str += "<p>";
	    if (prob.entered.length > 0) {
	        problem_str += "Your answer: " + prob.entered;
	    }
	    problem_str += '</p>';
    }

    if (prob.type != PROB_TYPE_MULTIPLE_ANSWER && prob.type != PROB_TYPE_SINGLE_ANSWER) {
	    problem_str +=
	        '<button id="oemath-review-showanswer-' + idx + '" data-trigger="focus" type="button" class="btn btn-success oemath-problem-button oemath-dynamic-popover" ' +
	            'data-toggle="popover" data-placement="top">Show correct answer</button>';
    }
    else {
	    problem_str +=
	        '<button id="oemath-review-showanswer-' + idx + '" type="button" class="btn btn-success oemath-problem-button" onclick="clickShowAnswer(id,' +idx+ ')">Show correct answer</button>';
    }
    
    if (prob.hints.length > 0) {
        problem_str +=
            '<button id="oemath-review-show-hint-' + idx + '" class="btn btn-success oemath-problem-button" onclick="clickShowHintInReview(this,' + idx + ')">I need some hint</button>';
    }

    problem_str +=
            '</div>' +
        '</div>';
    
/*    if (idx == 2) {
    	var ee = prob.entered.length+":";
    	for (var i=0; i < prob.entered.length; i++) {
    		ee += prob.entered[i]+"; ";
    	}
    	$("#test1").text(ee);
    }*/
    
    $("#accordion").append(problem_str);
    var answer_show = '';
    if (prob.type == PROB_TYPE_NORMAL) {
        answer_show = "The correct answer is:<br><b>" + prob.answer;
    }
    else if (prob.type == PROB_TYPE_CHOICE) {
        answer_show = "The correct answer is:<br><b>" + prob.answer_desc[prob.answer];
    }
    else if (prob.type == PROB_TYPE_MULTIPLE_ANSWER || prob.type == PROB_TYPE_SINGLE_ANSWER) {
    	for (var i=0; i < prob.entered.length; i++) {
    		$('#oemath-input-field-' +idx+ '-' +i).val(prob.entered[i]);
    	}
    }
//    $("#test1").text(prob.type + ":" + prob.answer_desc + "; " + answer_show);

    if (prob.type != PROB_TYPE_MULTIPLE_ANSWER && prob.type != PROB_TYPE_SINGLE_ANSWER) {
	    $("#oemath-review-showanswer-" + idx).attr('data-content', answer_show + "</b>");
	    $(".oemath-dynamic-popover").popover({ html: true });
    }
}


function clickShowAnswer(id, idx) {
	var prob = problems_parsed[idx];
	var parent_container = $('#oemath-review-problem-'+idx);
	if (parent_container.attr('oemath-hint-show') == 'off' ) {
//		$('#test1').text('show '+idx+' : '+prob.inputs);
		for (var i=0; i<prob.inputs; i++) {
			var this_input = $('#oemath-input-field-' +idx+ '-' +i);
			this_input.val(this_input.attr('hint')).css('color', 'green');
		}
		parent_container.attr('oemath-hint-show', 'on');
		$('#oemath-review-showanswer-'+idx).text('Show my answer');
	}
	else {
//		$('#test1').text('hide '+idx+' : '+prob.inputs);
		for (var i=0; i<prob.inputs; i++) {
			$('#oemath-input-field-' +idx+ '-' +i).val(prob.entered[i]).css('color', 'blue');
		}
		parent_container.attr('oemath-hint-show', 'off');
		$('#oemath-review-showanswer-'+idx).text('Show correct answer');
	}
}

function clickShowHintInReview(btn, idx) {
    //[0]: currently we only handle first hint
    var problem = problems_parsed[idx];
    problem.hint_level = show_hint($("#" + btn.id), problem.hints[0], problem.hint_level);
}

var choice_selected = -1;
function handleClick(radioButton) {
    choice_selected = radioButton.value;
}

function show_problem(data, prob_index) {
    var prob = data;

/*    var testStr = prob.problem+"<br>"+prob.answer;
    if (prob.hint) {
    	for (var i=0; i<prob.hint.length; i++) {
    		testStr += ("<br>"+prob.hint[i].hid+" : "+prob.hint[i].desc);
    	}
    }
    $("#test1").text(testStr);*/
    // result 0=correct, 1=wrong or 2=skipped
    var problem = makeStruct("desc type answer answer_desc hints hint_level result entered inputs");
    var prob_desc = replace_oemath_tags(prob.problem, prob_index);
    problem.desc = prob_desc.desc;
    problem.inputs = prob_desc.inputs; // number of input (edit box) in the problem.  For problem with type=2.
    problem.answer = problem.answer_desc = prob.answer.split('$$');
    problem.hints = [];
//var testStr = problem.desc;
//$("#test1").text(testStr);
/*var testStr = "DESC:<br>"+problem.desc+"<br><br>ANSWER:<br>"+problem.answer[0];
if (prob.hint) {
	for (var i=0; i<prob.hint.length; i++) {
		testStr += ("<br>"+prob.hint[i].hid+" : "+prob.hint[i].desc);
	}
}
$("#test1").text(testStr);*/

    $("#oemath-problem-hint").prop("disabled", !prob.hint);
    if (prob.hint) {
        for (var i = 0; i < prob.hint.length; i++) {
            problem.hints.push(prob.hint[i].desc.trim().split('$$'));
        }
    }
    problem.type = prob.type;

    $("#oemath-problem-field").html(problem.desc);
    // sync user inputer across all vertical inputs with same placeholder
    $(".oemath-svg-vertical input").on("input", function () {
        var v = $(this).val();
        var ch = v.charAt(v.length-1); // limit one digit in the input
        var ph = $(this).attr('placeholder');
        if ('A' <= ph && ph <= 'Z') {
            $('.oemath-svg-vertical input[placeholder="'+ph+'"]').val(ch);
        }
        else {
            $(this).val(ch);
        }
    });


    $("#oemath-problem-status").html('');

    $("#oemath-answer-normal").hide();
    var cg = $("#oemath-answer-choicegroup");
    cg.hide();
    $(".oemath-hint").remove();
    $("#oemath-answer-normal-field").val('');

    if (problem.type == PROB_TYPE_NORMAL) {
        $("#oemath-answer-normal").show();
    }
    else if (problem.type == PROB_TYPE_CHOICE) {
        $("#oemath-answer-choicegroup *").remove();

        var correct_choice = problem.answer_desc[0];
        shuffle(problem.answer_desc);
        for (var i = 0; i < problem.answer_desc.length; i++) {
            if (problem.answer_desc[i] == correct_choice) {
                // overwrite the answer with choice index
                problem.answer = i;
                break;
            }
        }

        choice_selected = -1;
        for (var i = 0; i < problem.answer_desc.length; i++) {
            cg.append('<input value="' + i + '" name="oemath-choice-group" onclick="handleClick(this)" type="radio"><span id="oemath-choice-' + i + '">' +
                       problem.answer_desc[i] + '</span><br>');
        }

        cg.show();
    }
    else if (problem.type == PROB_TYPE_MULTIPLE_ANSWER || problem.type == PROB_TYPE_SINGLE_ANSWER) {
        // <ans> $$ <show_ans> ==> save in [problem.answer, problem.answer_desc]
//FIXME        problem.answer_desc = replace_input_tags_in_answer(problem.answer[1]);
        //$("#test1").text(problem.answer_desc);
        problem.answer = problem.answer[0];
    }

    problem.hint_level = 0;
    problem.result = '';
    problem.entered = '';
    problems_parsed.push(problem);
}


function load_next_problem(recycle) {
    $("#oemath-problem-hint").prop("disabled", false).text("I need some hint");

    if (pid_index == practice.count - 1) return 0;

    if (++pid_index >= practice.count) {
        pid_index = 0;
    }
    ajax_load_problem_from_pid(practice.grade, pid_index, show_problem);
    return 1;
}


// show dialog asking if review is wanted
function practice_finished() {
    $("#oemath-review-category-correct-prompt").html("Correct : " + problems_number_correct);
    $("#oemath-review-category-correct").prop("disabled", problems_number_correct == 0);

    $("#oemath-review-category-wrong-prompt").html("Wrong   : " + problems_number_wrong);
    $("#oemath-review-category-wrong").prop("disabled", problems_number_wrong == 0).prop("checked", problems_number_wrong != 0);

    $("#oemath-review-category-skipped-prompt").html("Skipped : " + problems_number_skipped);
    $("#oemath-review-category-skipped").prop("disabled", problems_number_skipped == 0).prop("checked", problems_number_skipped != 0);

    $("#oemath-review-btn-review").prop("disabled", problems_number_wrong + problems_number_skipped == 0);

    $("#oemath-review-modal").modal({ backdrop: 'static', keyboard: false });
}


// 0 - correct
// 1 - wrong
// 2 - answer not provided or incomplete
function check_answer() {
    var problem = problems_parsed[pid_index];

    if (problem.type == PROB_TYPE_NORMAL) {
        var answer_entered = $("#oemath-answer-normal-field").val().trim();
        problem.entered = answer_entered;
        if (answer_entered.length == 0) return ANSWER_INCOMPLETE;
        return eval('('+answer_entered +')==('+ problem.answer+')') ? ANSWER_CORRECT : ANSWER_WRONG;
    }
    else if (problem.type == PROB_TYPE_CHOICE) {
        if (choice_selected == -1) return ANSWER_INCOMPLETE;
        problem.entered = problem.answer_desc[choice_selected];
        return choice_selected == problem.answer ? ANSWER_CORRECT : ANSWER_WRONG;
    }
    else if (problem.type == PROB_TYPE_MULTIPLE_ANSWER) {
        var answer_descript = '';
        problem.entered = [];
        var need_more_input = false;
        for (var i = 0; i < problem.inputs; i++) {
            var input_number = $("#oemath-input-field-" +pid_index+ '-' +i).val().trim();
            problem.entered.push(input_number);
            if (input_number.length == 0) {
            	need_more_input = true;
            }
            answer_descript += 'var i' + (i+1) + '=' + input_number + "; ";
        }
        
        if (need_more_input) {
        	return ANSWER_INCOMPLETE;
        }
        answer_descript += problem.answer;

        try {
            return eval(answer_descript) ? ANSWER_CORRECT : ANSWER_WRONG;
        }
        catch (e) {
            return ANSWER_WRONG;
        }
    }
    else if (problem.type == PROB_TYPE_SINGLE_ANSWER) {
        problem.entered = [];
        var answer = ANSWER_CORRECT;
        var expected_answer = eval(problem.answer); // problem.answer e.g [4,5,9,4,1,0]
        for (var i = 0; i < problem.inputs; i++) {
            var input_number = $("#oemath-input-field-" +pid_index+ '-' +i).val().trim();
            problem.entered.push(input_number);
            if (input_number.length == 0) {
                answer = ANSWER_INCOMPLETE;
            }
            else if (input_number != expected_answer[i]) { // input_number length is either 0 or 1
                answer = ANSWER_WRONG;
            }
        }
        
        return answer;
    }
}


function clickBtn(btn_id) {
    if (btn_id == "oemath-problem-submit") {
        var check_result = check_answer();

        if (check_result == ANSWER_CORRECT) {
            $("#oemath-problem-status").html("Correct!").css({ "color": "green", "font-weight": "" });

            problems_parsed[pid_index].result = 0;
            problems_number_correct++;

            setTimeout(function () {
                if (load_next_problem() == 0) {
                    // last problem
                    practice_finished();
                }
            }, 500);
        }
        else if (check_result == ANSWER_WRONG) {
            $("#oemath-problem-status").html("Wrong answer.  Please correct and submit or skip it...").css({ "color": "red", "font-weight": "bold" });
        }
        else if (check_result == ANSWER_INCOMPLETE) {
            $("#oemath-problem-status").html("Please enter answer and submit...").css({ "color": "red", "font-weight": "" });
        }
    }
    else if (btn_id == "oemath-problem-skip") {
        if (check_answer() == ANSWER_CORRECT) {
            problems_parsed[pid_index].result = 0;
            problems_number_correct++;
        }
        else {
            problems_parsed[pid_index].result = 2;
            problems_number_skipped++;
        }

        if (load_next_problem() == 0) {
            // last problem
            practice_finished();
        }
    }
    else if (btn_id == "oemath-problem-hint") {
        var problem = problems_parsed[pid_index];
        problem.hint_level = show_hint($('#' + btn_id), problem.hints[0], problem.hint_level);
    }
}


function show_hint(btn, hints, level) {
    var new_hint =
        '<div class="oemath-hint" style="display:none"><hr></hr><p>' +
        hints[level] +
        '</p></div>';

    $(new_hint).insertBefore(btn);

    btn.prev().slideDown(150, function () {
        if (level == 0) {
            btn.text("I need more hint");
        }

        if (level + 1 == hints.length) {
            btn.prop("disabled", true).text("I need more time to think it over");
        }
    });

    return level + 1;
}


function clickCheckbox(checkboxId) {
    var check_any =
        $("#oemath-review-category-correct").prop("checked") ||
        $("#oemath-review-category-wrong").prop("checked") ||
        $("#oemath-review-category-skipped").prop("checked");

    $("#oemath-review-btn-review").prop('disabled', !check_any);
}


function clickReview(reviewBtnId) {
    $("#bc-practice").html("Review");

    var checked_correct = $("#oemath-review-category-correct").prop("checked");
    var checked_wrong = $("#oemath-review-category-wrong").prop("checked");
    var checked_skipped = $("#oemath-review-category-skipped").prop("checked");

    //callback has 3 arguments: (element, index, array) {
    for (var i = 0; i < problems_parsed.length; i++) {
        var result = problems_parsed[i].result;
        if ((checked_correct && result == 0) || (checked_wrong && result == 1) || (checked_skipped && result == 2)) {
            review_problem(i);
        }
    }

    $("#oemath-practice-container").hide();
    $("#oemath-review-container").show();
}


function clickFinish(finishBtnId) {
    window.location.href = $("#bc-root").attr("href");
}



$(function () {
    var full_url = window.location.href;
    var parts = full_url.split('?');
    
    checkLoginStatus();
    
    practice = makeStruct("grade category count");

    if (parts.length == 2) {
        parts = parts[1].split('&');
        for (var i = 0; i < parts.length; i++) {
            var param = parts[i].split('=');
            if (param.length == 2) {
                if (param[0] == 'grade') {
                    practice.grade = param[1];
                    $("#bc-root").html("Grade " + practice.grade);
                    $("#bc-root").attr("href", "/math?" + practice.grade);
                }
                else if (param[0] == 'category') {
                    practice.category = param[1];
                }
            }
        }
    }

    practice = ajax_load_problems("/api/practice", practice, show_problem);
});
