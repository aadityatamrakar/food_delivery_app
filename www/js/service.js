angular.module('underscore', []).factory('_', ['$window', function($window) {
  return $window._; // assumes underscore has already been loaded on the page
}]);

angular.module('tromboy.api', ['underscore'])
  .factory('WebApi', function($http, $q, $rootScope) {
    $http.defaults.headers.post["Content-Type"] = "application/x-www-form-urlencoded";
    var register_data = {name:'', email:'', mobile:'', pin:'', address:'', city:''};
    // var api_url = 'http://tromboy.local/api';
    // var logo_path = 'http://foodadmin.local/images/restaurant/logo/';
    var api_url = 'https://tromboy.com/api';
    var logo_path = 'https://admin.tromboy.com/images/restaurant/logo/';
    var cities = [];
    var restaurants = [];
    var restaurant = [];
    var cart = [];
    var order = [];
    var type;
    var wallet = {bal: 0, transactions: []};
    return {
      logo_path: function (){
        return logo_path;
      },
      login: function (mobile, pin){
        var login_data = {mobile: mobile, pin: pin};
        return $http.post(api_url+'/login', login_data);
      },
      request_otp: function (user){
        var register_data = {name:user.name, email:user.email, mobile:user.mobile, pin:user.pin, address:user.address+', '+user.address2, city:user.city};
        return $http.post(api_url+'/otp/request', register_data);
      },
      register: function (user){
        register_data['name'] = user.name;
        register_data['email'] = user.email;
        register_data['mobile'] = user.mobile;
        register_data['pin'] = user.pin;
        register_data['address'] = user.address+', '+user.address2;
        register_data['city'] = user.city;
        register_data['otp'] = user.otp;
        return $http.post(api_url+'/register', register_data);
      },
      updateProfile: function (user){
        var data = {name: user.name, email: user.email, mobile: user.mobile, address: user.address, city: user.city};
        return $http.post(api_url+'/profile/update', data);
      },
      changePIN: function(user){
        var data = {pin: user.pin, new_pin: user.new_pin, mobile: user.mobile};
        return $http.post(api_url+'/pin_update', data);
      },
      get_city: function(){
        var deferred = $q.defer();
        if(cities.length != 0){
          deferred.resolve(cities);
        }else{
          $http.get(api_url+'/get_city', {cache: true})
            .then(function (res){
              if(res.status == 200){
                cities = res.data;
                deferred.resolve(cities);
              }else{
                deferred.reject('error');
              }
            });
        }
        return deferred.promise;
      },
      get_area: function(city_id){
        var index, deferred = $q.defer();
        if(cities.length != 0)
        {
          angular.forEach(cities, function (v, i){
            if(v.id == city_id) {
              index = i;
            }
          });
          if(cities[index].areas != null){
            deferred.resolve(cities[index].areas);
          }else{
            $http.get(api_url+'/get_area/'+city_id, {cache: true})
              .then(function (res){
                if(res.status == 200){
                  deferred.resolve(res.data);
                }else{
                  deferred.reject('error');
                }
              });
          }
        }else{
          deferred.reject('error');
        }
        return deferred.promise;
      },
      fetch_restaurant: function (area_id, type){
        return $http.get(api_url+'/restaurant/'+area_id+'/'+type, {cache: true});
      },
      clear_restaurants: function (){
        restaurants = [];
      },
      store_restaurant: function (rs){
        // angular.forEach(rs, function (v, i){
        //   restaurants.push(v);
        // });
        restaurants = rs;
      },
      get_restaurant: function (id){
        var deferred = $q.defer();
        if(id == null && restaurant.hasOwnProperty('id')){
          deferred.resolve(restaurant);
        }else{
          angular.forEach(restaurants, function (v, i){
            if(v.id == id) {
              $http.get(api_url+'/restaurant/'+id+'/get_menu', {cache: true})
                .then(function (res){
                  if(res.status == 200)
                  {
                    angular.forEach(res.data, function (x, y){ angular.forEach(x.products, function (l, m){ l.quantity = 0; }); });
                    restaurants[i]['menu'] = v.menu = res.data;
                    restaurant = restaurants[i];
                    deferred.resolve(v);
                  }
                });
            }
          });
        }
        return deferred.promise;
      },
      get_category: function (index){
        for(var i=0; i<restaurant.menu.length; i++){
          if(restaurant.menu[i].id == index) return restaurant.menu[i];
        }
      },
      cart_add: function (product){
        if(cart.length > 0){
          for(var i =0;i<cart.length;i++){
            if(cart[i].id == product.id) {
              cart[i].quantity = product.quantity;
              return true;
            } else if(i == (cart.length-1)) {
              cart.push(product);
              return true;
            }
          }
        } else cart.push(product);
      },
      get_quantity: function (id){
        var deferred = $q.defer();
        if(cart.length > 0)
          for(var i =0;i<cart.length;i++){
            if(cart[i].id == id) deferred.resolve({quantity: cart[i].quantity, edit: true});
            else if(i == (cart.length-1)) deferred.resolve({quantity:1, edit: false});
          }else deferred.resolve({quantity: 1, edit: false});
        return deferred.promise;
      },
      get_cart: function (){
        return cart;
      },
      remove_from_cart: function (p){
        angular.forEach(cart, function (v, i){
          if(v.id == p.id) {
            cart.splice(i, 1);
            return true;
          }
        })
      },
      clear_cart: function (){
        cart = [];
      },
      order_type: function (t){
        if(t != null) { type = t; }
        return type;
      },
      get_cuisines: function (){
        var cuisines = [], flag = false;
        for(var i=0;i<restaurants.length;i++)
        {
          for(var j=0; j<restaurants[i].cuisines.length; j++){
            for(var n=0, flag=true; n<cuisines.length; n++)
            {
              if(cuisines[n].title == restaurants[i].cuisines[j]) {
                flag = false;
                break;
              }
            }
            if(flag) cuisines.push({title: restaurants[i].cuisines[j],check: false})
          }
          if(i == (restaurants.length-1))
            return cuisines;
        }
      },
      check_coupon: function (t, gtotal, uid){
        return $http.post(api_url+'/check_coupon', {code: t, gtotal: gtotal, m: $rootScope.user.mobile});
      },
      place_order: function (cart, coupon, restaurant, type, address, payment_id, payment_amount, wallet_amount){
        var data = {cart: cart, coupon: null, restaurant_id: restaurant.id, mobile: $rootScope.user.mobile, type: type, address: address, payment_id: payment_id, payment_amount: payment_amount, wallet_amount: wallet_amount};
        if(coupon.applied == true) data.coupon = coupon.code;
        return $http.post(api_url+'/place_order', data);
      },
      order: function (o){
        if(o != null) order = o;
        return order;
      },
      wallet_summary: function (){
        var deferred = $q.defer();

        var data = {'mobile': $rootScope.user.mobile};
        $http.post(api_url+'/wallet/summary', data).then(function (res){
          if(res.status == 200)
          {
            this.wallet = res.data;
            deferred.resolve(this.wallet);
          }else{
            return res;
          }
        });

        return deferred.promise;
      },
      wallet_balance: function (){
        var data = {'mobile': $rootScope.user.mobile};
        return $http.post(api_url+'/wallet/balance', data);
      },
      order_status: function (o){
        var deferred = $q.defer();
        $http.get(api_url+'/order_status/'+o.id)
          .then(function (res){
            deferred.resolve(res.data.status);
          });
        return deferred.promise;
      },
      all_orders: function (){
        var data = {mobile: $rootScope.user.mobile};
        return $http.post(api_url+'/orders/all', data);
      },
      req_regen_pin: function (mobile){
        var data = {'mobile': mobile};
        return $http.post(api_url+'/regen/pin', data);
      },

    }
  });
