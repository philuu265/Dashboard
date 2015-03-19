var app = angular.module('app', []);
app.service('CodeforcesService',function($http){

	this.getUserInfo = function(users){
		var url =  'http://codeforces.com/api/user.info?jsonp=JSON_CALLBACK&handles=' + users.join(";");
		var map = [];
		for(var i = 0; i < users.length; i++){
			map[users[i].handle] = users[i].name;
		}
		var promise = $http.jsonp(url)
		.success(function(data){
			userList = data.result;
			for(var i = 0; i <  userList.length; ++i){
				if(!userList[i].rating){
					userList[i].rating = 0;
					userList[i].rank = "user-black";
					userList[i].name = map[userList[i].handle];
				}
			}
			return userList;
		});
		return promise;
	},

	dateConverter = function(UNIX_timestamp, type){
		var a = new Date(UNIX_timestamp*1000);
		var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
		var year = a.getFullYear();
		var month = months[a.getMonth()];
		var date = a.getDate();
		var hour = a.getHours();
		var min = a.getMinutes();
		if(date < 10) date = '0' + date;
		if(hour < 10) hour = '0' + hour;
		if(min < 10) min = '0' + min;
		var time = month + '/' + date + '/' + year + ' ' + hour + ':' + min;
		if(type == 0) return time;
		var second = a.getSeconds();
		if(second < 10) second = '0' + second;
		month = a.getMonth();
		return date + '-' + month + '-' + year + ' ' + hour + ':' + min + ':' + second;
	},

	timeConverter = function(seconds){
		var hours = Math.floor(seconds/3600);
		var minutes = (seconds % 3600)/60;
		if(minutes < 10) minutes = '0' + minutes;
		return hours + ':' + minutes;
	},



	this.getContests = function(){
		var url = 'http://codeforces.com/api/contest.list?jsonp=JSON_CALLBACK&gym=false';
		res = [];
		$http.jsonp(url)
		.success(function(data){
			contestList = data.result;
			for(var i = 0; i < contestList.length; ++i){
				if(contestList[i].phase == 'BEFORE'){
					var startTime = dateConverter(contestList[i].startTimeSeconds,0);
					var contest = new Contest(contestList[i].id, contestList[i].name, startTime, timeConverter(contestList[i].durationSeconds));
					res.push(contest);
				}
			}
		});
		return res;
	},

	this.getUserStatus = function(username){
		var url = 'http://codeforces.com/api/user.status?jsonp=JSON_CALLBACK&handle=' + username 
		+ '&from=1&count=25';
		var promise = $http.jsonp(url)
		.success(function(data){
			listSubmission = data.result;
			for(var i = 0; i <  listSubmission.length; ++i){
				listSubmission[i].user = username;
				listSubmission[i].time = dateConverter(listSubmission[i].creationTimeSeconds,1);
				var timeConsumedMillis = listSubmission[i].timeConsumedMillis;
				if(timeConsumedMillis >= 1000){
					listSubmission[i].timeConsumedMillis = Math.floor(timeConsumedMillis/10)/100;
				}
			}
			return listSubmission;
		});
		return promise;
	};

});


function  User(handle, name, rank) {
	this.handle = handle;
	this.name = name;
	this.rank = rank;
}
User.prototype.toString = function(){
	return this.handle;
}

function Problem(contestId, index, name){
	this.contestId = contestId;
	this.index = index;
	this.name = name;
}

function Submission(id, contestId, creationTimeSeconds, relativeTimeSeconds, problem, verdict){
	this.id = id;
	this.contestId = contestId;
	this.creationTimeSeconds = creationTimeSeconds;
	this.relativeTimeSeconds = relativeTimeSeconds;
	this.problem = problem;
	this.verdict = verdict;
}

function Contest(contestId, name, startTime, duration){
	this.contestId = contestId;
	this.name = name;
	this.startTime = startTime;
	this.duration = duration;
}

app.controller('scoreBoardController',function($scope,$http,$interval,CodeforcesService){
	var usersList = [];
	usersList.add = function (handle, name) {
		var user = new User(handle, name);
		usersList.push(user);
		return user;
	}
	/*
	usersList.add("eiu130068danvu", "Vũ Ngọc Đàn", "1331210068");
	usersList.add("eiu139036dungtran", "Trần Thị Kim Dung", "1331209036");
	usersList.add("eiu130008thuydung", "Vũ Thị Thùy Dung", "1331200008");
	usersList.add("eiu139037hanhnguyen", "Nguyễn Thị Hồng Hạnh", "1331209037");
	usersList.add("eiu130009hoangdinh", "Đinh Tiên Hoàng", "1331210009");
	usersList.add("eiu130013thinhbui", "Bùi Đắc Thịnh", "1331210013");
	usersList.add("eiu130023thuongtruong", "Trương Nguyễn Hoài Thương", "1331200023")
	usersList.add("eiu130028tu.huynh", "Huỳnh Phan Thanh Tú", "1331200028");
	usersList.add("eiu119034tuanngo", "Ngô Anh Tuấn", "1131219034");
	*/
	usersList.add("ape", "Luu Nhat Phi");
	usersList.add("tourer", "Luu Nhat Phi");
	usersList.add("luunhatphi", "Luu Nhat Phi");
	usersList.add("khoahoc1024", "Nguyen Manh Phuc");
	usersList.add("nguyenmanhphuc", "Nguyen Manh Phuc");
	usersList.add("T.C.D", "Tran Cong Duy");
	usersList.add("trancongduy", "Tran Cong Duy");

	function init(){
		$scope.index = 0;
		CodeforcesService.getUserStatus(usersList[$scope.index].handle).then(function(response){
			$scope.listSubmission = response.data.result;
		});
		CodeforcesService.getUserInfo(usersList).then(function(response){
			$scope.users = response.data.result;
		}),
		$scope.contests = CodeforcesService.getContests();
		stop = $interval(function() {
			$scope.index = ($scope.index + 1) % usersList.length;
			CodeforcesService.getUserStatus(usersList[$scope.index].handle).then(function(response){
				// update dashboard
				var res = response.data.result;
				var map = [];
				for(var i = 0; i < res.length; i++){
					map[res[i].id] = true;
				}
				for(var i = 0; i < $scope.listSubmission.length; i++){
					if(!map[$scope.listSubmission[i].id]){
						res.push($scope.listSubmission[i]);
					}
				}
				res.sort(function(a,b){
					return a.creationTimeSeconds < b.creationTimeSeconds ? 1 : -1;
				});
				$scope.listSubmission = res.slice(0, 25);
			});
		}, 1000);
	}
	init(),
	$scope.showSubmition = function(user){
		$scope.user = user;
		$scope.loadComplete = false;
		$scope.usersDetail = "";
		var url = 'http://codeforces.com/api/user.status?jsonp=JSON_CALLBACK&handle=' + user + '&from=1&count=5';
		$http.jsonp(url)
		.success(function(data){
			$scope.loadComplete = true;
			$scope.usersDetail = data.result;
		})
		.error(function () {
			console.log("error")
		});
	}
});