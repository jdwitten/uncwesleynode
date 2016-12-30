$(document).ready(function(){

	$("#submit").on("click", function(){
		var tryPass = $("#password").val();
		var passData = JSON.stringify({password: tryPass})
		$.ajax({
			url: "/login",
			datatype: 'application/json',
			headers:{
				"Content-Type":"application/json"
			},
			data: passData,
			success: function(data){
				var success = data.success;
				if(success==true){
					window.location.replace("/public/login.html");
				}
				else{
					$("#error").val("Invalid Password! Please try again");
				}

			},
			type: 'POST'
		});

	})

})