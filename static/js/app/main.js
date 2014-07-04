function MainCtrl($rootScope, $scope, $http, $q) {
    var getCurrentLang, getQueryParam;

    getQueryParam = function(name) {
      var currentQueryParams;
      currentQueryParams = new URI().query(true);
      return currentQueryParams[name];
    };

    window.getQueryParam = getQueryParam;

    getCurrentLang = function() {
      var lang;
      lang = getQueryParam("lang");
      if (lang) {
        return lang.replace("-", "_");
      } else {
        var lang_browser = getCurrentLangByBrowserSettings();
        console.log('browser lang:', lang_browser);
        switch(lang_browser){
            case 'zh':
            case 'zh_TW':
                return 'zh_TW';
                break;
            default:
                return 'en';
        }
      }
    };

    getCurrentLangByBrowserSettings = function(){
        var lang = window.navigator.userLanguage || window.navigator.language;
        return lang;
    }

    window.getCurrentLang = getCurrentLang;


    getCurrentYear = function(){
        return new Date().getFullYear();
    }

    $rootScope.lang = getCurrentLang();

    $rootScope.current_year = getCurrentYear();

    $rootScope._ = function(key){
        var lang = getCurrentLang();

        if (LANGPACK && LANGPACK[lang] && LANGPACK[lang][key]){
            return LANGPACK[lang][key];
        }else{
            return key;
        }
    };


    var geocoder;
    var map;
    var cities;

    $scope.good_roads = null;
    $scope.bad_roads = null;

    // 1: city, 2: town, 3: road
    $scope.selected_items = {};

    $scope.cities = [];
    $scope.towns = [];
    $scope.roads = [];

    $scope.init = function(){

        $scope.cities = ["基隆市", "臺北市", "新北市", "桃園縣", "新竹市", "新竹縣", "苗栗縣", "臺中市", "彰化縣", "南投縣",
                  "雲林縣", "嘉義市", "嘉義縣", "臺南市", "高雄市", "屏東縣", "台東縣", "花蓮縣", "宜蘭縣", "澎湖縣",
                  "金門縣", "連江縣"];

        Parse.initialize("x3m8QUKprKNmrMJCFRNRH2nwSsqXPyDcARcFpSL1", "WTGqTPtCubmHZcpLoI2YjmbjlOhXpH4YtHNADFqc");

        $scope.getHotRoads(1);
        $scope.getHotRoads(-1);
    }

    drawMap = function(road_objs){

        var roads = []

        for (r in road_objs){
            roads.push(road_objs[r].city + " " +road_objs[r].road);
        }

        geocoder = new google.maps.Geocoder();
        var myLatlng = new google.maps.LatLng(25.040096, 121.512029);
        var mapOptions = {
            zoom: 10,
            center: myLatlng,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        }

        map = new google.maps.Map(document.getElementById("map_canvas"), mapOptions);

        setMapCenter("台北市");

        for (var i = 0; i < roads.length; i++){
            codeAddress(roads[i]);
        }

    }

    setMapCenter = function(address){
        geocoder.geocode( { 'address': address}, function(results, status) {
            if (status == google.maps.GeocoderStatus.OK) {
                map.setCenter(results[0].geometry.location);
            } else {
                alert('Geocode was not successful for the following reason: ' + status);
            }
        });
    }

    codeAddress = function(address) {
        geocoder.geocode( { 'address': address}, function(results, status) {
            if (status == google.maps.GeocoderStatus.OK) {
                var marker = new google.maps.Marker({
                    map: map,
                    position: results[0].geometry.location
                });
            } else {
                alert('Geocode was not successful for the following reason: ' + status);
            }
        });
    }

    getTowns = function(city) {

        var request = $http({
            method: "get",
            url: "data/" + city + ".json",
            params: {
                action: "get"
            }
        });

        return( request.then( handleSuccess, handleError ) );
    }

   function handleError( response ) {
        if (
            ! angular.isObject( response.data ) ||
            ! response.data.message
            ) {

            return( $q.reject( "An unknown error occurred." ) );

        }

        return( $q.reject( response.data.message ) );
    }

    function handleSuccess( response ) {
        return( response.data );
    }

    $scope.getTowns = function(city){
        $scope.getHotRoads(1, city);
        $scope.getHotRoads(-1, city);

        $scope.selected_items = {};
        $scope.selected_items[1] = city;
        $scope.roads = [];
        getTowns(city).then(function(towns){
            $scope.towns = towns;
        });
    }

    $scope.getRoads = function(town){
        $scope.selected_items[2] = town;
        var roads = $scope.towns[town];
        $scope.roads = roads;
    }

    $scope.selectRoad = function(road){
        $scope.selected_items[3] = road;
    }

    $scope.login = function(){
        Parse.FacebookUtils.logIn(null, {
          success: function(user) {
            if (!user.existed()) {
              alert("已經使用 Facebook 帳號註冊並登入成功!");
              //alert("User signed up and logged in through Facebook!");
            } else {
              alert("已經透過 Facebook 登入成功!");
              //alert("User logged in through Facebook!");
            }

            $scope.$apply(function() {
                $scope.user_current();
            });
          },
          error: function(user, error) {
            alert("User cancelled the Facebook login or did not fully authorize.");
          }
        });
    }


    $scope.logout = function(){
        Parse.User.logOut();
    }

    var VoteScore = Parse.Object.extend("VoteScore");
    var voteScore = new VoteScore();

    $scope.getHotRoads = function(point, city){
        var query = new Parse.Query(VoteScore);

        if(city){
            query.equalTo('city', city);
        }

        query.find({
          success: function(results) {
              console.log('results', results);
              $scope.$apply(function() {
                  var hot_roads = [];
                  for (item in results){
                      console.log('item', item);
                      if(results[item] && results[item].attributes){
                          hot_roads.push({city: results[item].attributes.city,
                                          town: results[item].attributes.town,
                                          road: results[item].attributes.road,
                                          total: parseInt(results[item].attributes.total),
                                          good: parseInt(results[item].attributes.good),
                                          bad: parseInt(results[item].attributes.bad),
                                          });
                      }
                  }
                  if(point >= 0){
                      $scope.good_roads = hot_roads;
                  }else{
                      drawMap(hot_roads);
                      $scope.bad_roads = hot_roads;
                  }
              });
          },

          error: function(error) {
            console.log('error', error);
          }
        });
    }

    $scope.vote = function(city, town, road, point){

        voteScore.set("city", city);
        voteScore.set("town", town);
        voteScore.set("road", road);


        if (point >= 0){
            voteScore.increment("good");
            voteScore.increment("total");
        }else{
            voteScore.increment("bad");
            voteScore.increment("total", -1);
        }

        voteScore.save(null, {
          success: function(voteScore) {
            console.log('New object created with objectId: ' + voteScore.id);
          },
          error: function(voteScore, error) {
            console.log('Failed to create new object, with error code: ' + error.message);
          }
        });

    }

    $scope.user_current = function(){
        return Parse.User.current();
    }

    $scope.init();
}
