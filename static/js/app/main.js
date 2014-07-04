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

    // 1: city, 2: town, 3: road
    $scope.selected_items = {};

    $scope.cities = [];
    $scope.towns = [];
    $scope.roads = [];

    init = function(){

        var roads = [ '台北市 北安路',  '台北市 港東街',  '台北市 永吉路',  '台北市 松河街',  '台北市 東明街',
        '台北市 東新街',  '台北市 東南街',  '台北市 昆陽街',  '台北市 新民街',  '台北市 成福路', ];

        geocoder = new google.maps.Geocoder();
        var myLatlng = new google.maps.LatLng(25.040096, 121.512029);
        var mapOptions = {
            zoom: 10,
            center: myLatlng,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        }

        map = new google.maps.Map(document.getElementById("map_canvas"), mapOptions);

        $scope.cities = ["基隆市", "臺北市", "新北市", "桃園縣", "新竹市", "新竹縣", "苗栗縣", "臺中市", "彰化縣", "南投縣",
                  "雲林縣", "嘉義市", "嘉義縣", "臺南市", "高雄市", "屏東縣", "台東縣", "花蓮縣", "宜蘭縣", "澎湖縣",
                  "金門縣", "連江縣"];

        setMapCenter("台北市");

        for (var i = 0; i < roads.length; i++){
            codeAddress(roads[i]);
        }

        Parse.initialize("rcvzOkxw7EiC5MDoZIZso4gMhU6F01Tf24fGCIIw", "xxo4tGdLuaJnSk2lU3jJpJVqrHGEEBDSAgoLl9qv");
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


    init();

    $scope.getTowns = function(city){
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
              alert("User signed up and logged in through Facebook!");
            } else {
              alert("User logged in through Facebook!");
            }
          },
          error: function(user, error) {
            alert("User cancelled the Facebook login or did not fully authorize.");
          }
        });
    }
}
