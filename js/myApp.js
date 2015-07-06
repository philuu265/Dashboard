var app = angular.module('app', ['angular-loading-bar']);

app.filter('convert', function() {
	return function(input) {
		if(input && input >= 1000){
			return Math.floor(input/10)/100 + ' s';
		}
		return input + ' ms';
	};
});

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
					var contest = new Contest(contestList[i].id, contestList[i].name, contestList[i].startTimeSeconds, timeConverter(contestList[i].durationSeconds));
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
				listSubmission[i].user = listSubmission[i].author.members[0].handle;
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
	
	usersList.add("eiu130028tu.huynh", "Huỳnh Phan Thanh Tú", "1331200028");
	usersList.add("hanhnguyen", "unknown", "unknown");
	usersList.add("hoaithuong", "unknown", "unknown");
	usersList.add("solita", "unknown", "unknown");
	usersList.add("Ratulf", "unknown", "unknown");
	//usersList.add("ape", "Luu Nhat Phi");
	//usersList.add("tourer", "Luu Nhat Phi");
	usersList.add("luunhatphi", "Luu Nhat Phi");
	//usersList.add("khoahoc1024", "Nguyen Manh Phuc");
	usersList.add("nguyenmanhphuc", "Nguyen Manh Phuc");
	usersList.add("redbell014", "Nguyen Hong Khanh");
	usersList.add("T.C.D", "Tran Cong Duy");
	usersList.add("trancongduy", "Tran Cong Duy");

	function init(){
		$scope.index = 0;
		CodeforcesService.getUserStatus(usersList[$scope.index].handle).then(function(response){
			$scope.listSubmission = response.data.result;
		});
		CodeforcesService.getUserInfo(usersList).then(function(response){
			$scope.users = response.data.result;
			//console.log($scope.users);
			$scope.rankByUsers = [];
			for (var i = 0; i < userList.length; i++) {
				$scope.rankByUsers[$scope.users[i].handle] = $scope.users[i];
			};
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
		}, 3000);
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
