quiz_token = "";
quiz_score = 0;
theRightAnswer = "";
questionNumber = 0;

$(document).ready(function(){

	if ( ! $("body").hasClass("game") ) {
		return;
	}

	toastBootstrapCorrect = bootstrap.Toast.getOrCreateInstance( document.getElementById('liveToastCorrect') );
	toastBootstrapIncorrect = bootstrap.Toast.getOrCreateInstance( document.getElementById('liveToastIncorrect') );

	const popoverTriggerList = document.querySelectorAll('[data-bs-toggle="popover"]')
	const popoverList = [...popoverTriggerList].map(popoverTriggerEl => new bootstrap.Popover(popoverTriggerEl))
	document.addEventListener("shown.bs.popover",()=>{
		$("#doRestart").on("click",function(){
			quiz_token = "";
			quiz_score = 0;
			save();
		});
	});
	
	reset();

	getQuizToken();


	$("#option_a, #option_b, #option_c, #option_d").on("click",function(){
		if ( theRightAnswer !== "" ) {
			if ( $(this).html() === theRightAnswer ) {
				toastBootstrapCorrect.show();
				quiz_score++;
				updatePoints();
			} else {
				$("#right-answer").html( theRightAnswer );
				toastBootstrapIncorrect.show();
			}
			reset();

			setTimeout(getQuestion,5000);
		}
	});

});

function updatePoints() {
	$("#pts").html( quiz_score + " point" + (quiz_score !== 1 ? "s" : "") );
	save();
}

function reset() {
	$("#question_placeholder").show();
	$("#question").hide().html("");
	$("#option_a_placeholder").show();
	$("#option_a").hide().html("");
	$("#option_b_placeholder").show();
	$("#option_b").hide().html("");
	$("#option_c_placeholder").show();
	$("#option_c").hide().html("");
	$("#option_d_placeholder").show();
	$("#option_d").hide().html("");
	$("#qNum_placeholder").show();
	$("#qNum").hide();
}

function getQuizToken() {

	if ( window.localStorage.quizme ) {
		quiz_token = JSON.parse(window.localStorage.quizme).token;
		quiz_score = JSON.parse(window.localStorage.quizme).score;
		if ( quiz_token ) {
			updatePoints();
			getQuestion();
			return;
		}
	}
	$.ajax({
		url:"https://opentdb.com/api_token.php?command=request",
		success:function(data){
			if ( data.response_code === 0 ) {
				quiz_token = data.token;
				quiz_score = 0;
				save();
				setTimeout(getQuestion,5000);
			} else {
				error(data.response_code);
			}
		}
	});
	
}

function getQuestion() {

	$.ajax({
		url:"https://opentdb.com/api.php?amount=1&token="+quiz_token,
		success: function(data) {
			if ( data.response_code === 0 ) {
				question = data.results[0];
				if ( question.type === "multiple" || question.type === "boolean" ) {

					toastBootstrapCorrect.hide();
					toastBootstrapIncorrect.hide();

					$("#qNum_placeholder").hide();
					$("#qNum").show();
					questionNumber++;
					$("#qNumber").html(questionNumber);

					theQuestion = question.question;
					theRightAnswer = question.correct_answer;
					options = question.incorrect_answers;
					options.push(theRightAnswer);
					options = options
						.map(value => ({ value, sort: Math.random() }))
						.sort((a, b) => a.sort - b.sort)
						.map(({ value }) => value);

					$("#question_placeholder").hide();
					$("#question").show().html( theQuestion );

					difficulty = $("<SPAN></SPAN>").addClass("badge").addClass("bg-category").html( question.category.split(":").pop() + ": " + question.difficulty );
					categories = $("<DIV></DIV>").addClass("categories").addClass("mb-2");
					categories.append(difficulty);
					$("#question").prepend( categories );

					$("#option_a_placeholder").hide();
					$("#option_a").show().html( options[0] );
					$("#option_b_placeholder").hide();
					$("#option_b").show().html( options[1] );

					if ( question.type === "multiple" ) {
						$("#option_c_placeholder").hide();
						$("#option_c").show().html( options[2] );
						$("#option_d_placeholder").hide();
						$("#option_d").show().html( options[3] );

					} else if ( question.type === "boolean" ) {
						$("#option_c_placeholder").hide();
						$("#option_d_placeholder").hide();
					}

				} else {
					error(data.response_code);
				}
			} else {
				error(data.response_code);
			}
		},
		error: function(data) {
			if ( data.responseJSON && data.responseJSON.response_code ) {
				error(data.responseJSON.response_code);
			} else {
				alert("Something has gone very wrong. Please reload...");
			}
		}
	});
}

function error(code) {

	if ( code === 3 ) {
		// token not found
		quiz_token = null;
		quiz_score = 0;
		save();
		getQuizToken();
		return;
	} else if ( code === 5 ) {
		setTimeout(getQuizToken,5000);
		return;
	}

	$(".placeholder-glow").removeClass("placeholder-glow");
	
	$("#question_placeholder").show();
	$("question").hide();
	$("#option_a_placeholder").show();
	$("option_a").hide();
	$("#option_b_placeholder").show();
	$("option_b").hide();
	$("#option_c_placeholder").show();
	$("option_c").hide();
	$("#option_d_placeholder").show();
	$("option_d").hide();

	alert("Dang, something went wrong. Sorry...");
	console.log(code);
	
}

function save() {
	window.localStorage.quizme = JSON.stringify({ token: quiz_token, score: quiz_score });
}